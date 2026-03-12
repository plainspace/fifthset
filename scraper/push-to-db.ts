import { createClient } from "@supabase/supabase-js";
import { NormalizedData } from "./normalize";

export async function pushToSupabase(data: NormalizedData, citySlug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Get city ID
  const { data: city, error: cityError } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found in database`);
  }

  // Get regions for this city (for matching venue regions)
  const { data: regions } = await supabase
    .from("regions")
    .select("id, slug")
    .eq("city_id", city.id);

  const regionMap = new Map((regions || []).map((r) => [r.slug, r.id]));

  // Upsert venues
  console.log(`Upserting ${data.venues.length} venues...`);
  for (const venue of data.venues) {
    const { error } = await supabase.from("venues").upsert(
      {
        city_id: city.id,
        region_id: regionMap.get(venue.region) || null,
        name: venue.name,
        slug: venue.slug,
        website: venue.website || null,
        neighborhood: venue.region, // Use region as neighborhood for now
        sponsor_tier: "free",
      },
      { onConflict: "city_id,slug" }
    );
    if (error) console.error(`  Venue upsert failed (${venue.name}):`, error.message);
  }

  // Upsert artists
  console.log(`Upserting ${data.artists.length} artists...`);
  for (const artist of data.artists) {
    const { error } = await supabase.from("artists").upsert(
      {
        name: artist.name,
        slug: artist.slug,
        website: artist.website || null,
      },
      { onConflict: "slug" }
    );
    if (error) console.error(`  Artist upsert failed (${artist.name}):`, error.message);
  }

  // Fetch venue and artist IDs for event insertion
  const { data: dbVenues } = await supabase
    .from("venues")
    .select("id, slug")
    .eq("city_id", city.id);

  const venueIdMap = new Map((dbVenues || []).map((v) => [v.slug, v.id]));

  const { data: dbArtists } = await supabase
    .from("artists")
    .select("id, slug");

  const artistIdMap = new Map((dbArtists || []).map((a) => [a.slug, a.id]));

  // Insert events (skip duplicates based on venue + date + start_time + artist)
  console.log(`Inserting ${data.events.length} events...`);
  let inserted = 0;
  let skipped = 0;

  for (const event of data.events) {
    const venueId = venueIdMap.get(event.venue_slug);
    const artistId = artistIdMap.get(event.artist_slug);

    if (!venueId) {
      skipped++;
      continue;
    }

    // Check for existing event (same venue, date, time, artist)
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", venueId)
      .eq("date", event.date)
      .eq("start_time", event.start_time)
      .eq("artist_id", artistId || "")
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("events").insert({
      venue_id: venueId,
      artist_id: artistId || null,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time || null,
    });

    if (error) {
      console.error(`  Event insert failed:`, error.message);
      skipped++;
    } else {
      inserted++;
    }
  }

  console.log(`Done: ${inserted} events inserted, ${skipped} skipped`);
}
