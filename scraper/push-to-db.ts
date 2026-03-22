import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NormalizedData } from "./normalize";

export interface PushStats {
  venuesUpserted: number;
  artistsUpserted: number;
  eventsInserted: number;
  eventsSkipped: number;
  errors: string[];
}

export async function pushToSupabase(
  data: NormalizedData,
  citySlug: string,
  sourceUrl?: string
): Promise<PushStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const stats: PushStats = {
    venuesUpserted: 0,
    artistsUpserted: 0,
    eventsInserted: 0,
    eventsSkipped: 0,
    errors: [],
  };

  // Get city ID
  const { data: city, error: cityError } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found in database`);
  }

  // Get regions for this city
  const { data: regions } = await supabase
    .from("regions")
    .select("id, slug, name")
    .eq("city_id", city.id);

  // Map both slug and name to ID (region from scraper is now proper-case name)
  const regionIdBySlug = new Map((regions || []).map((r) => [r.slug, r.id]));
  const regionIdByName = new Map((regions || []).map((r) => [r.name, r.id]));

  // Upsert venues
  console.log(`Upserting ${data.venues.length} venues...`);
  for (const venue of data.venues) {
    const regionId =
      regionIdByName.get(venue.region) ||
      regionIdBySlug.get(venue.region) ||
      null;

    const { error } = await supabase.from("venues").upsert(
      {
        city_id: city.id,
        region_id: regionId,
        name: venue.name,
        slug: venue.slug,
        website: venue.website || null,
        neighborhood: venue.region,
        sponsor_tier: "free",
      },
      { onConflict: "city_id,slug" }
    );
    if (error) {
      stats.errors.push(`Venue upsert failed (${venue.name}): ${error.message}`);
      console.error(`  Venue upsert failed (${venue.name}):`, error.message);
    } else {
      stats.venuesUpserted++;
    }
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
    if (error) {
      stats.errors.push(`Artist upsert failed (${artist.name}): ${error.message}`);
      console.error(`  Artist upsert failed (${artist.name}):`, error.message);
    } else {
      stats.artistsUpserted++;
    }
  }

  // Fetch venue and artist IDs for event insertion
  const { data: dbVenues } = await supabase
    .from("venues")
    .select("id, slug")
    .eq("city_id", city.id);

  const venueIdMap = new Map((dbVenues || []).map((v) => [v.slug, v.id]));

  const artistSlugs = data.artists.map((a) => a.slug);
  const { data: dbArtists } = await supabase
    .from("artists")
    .select("id, slug")
    .in("slug", artistSlugs);

  const artistIdMap = new Map((dbArtists || []).map((a) => [a.slug, a.id]));

  // Insert events (skip duplicates)
  console.log(`Inserting ${data.events.length} events...`);

  for (const event of data.events) {
    const venueId = venueIdMap.get(event.venue_slug);
    const artistId = artistIdMap.get(event.artist_slug);

    if (!venueId) {
      stats.eventsSkipped++;
      continue;
    }

    const { error } = await supabase.from("events").upsert(
      {
        venue_id: venueId,
        artist_id: artistId || null,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time || null,
        source_url: sourceUrl || null,
      },
      { onConflict: "venue_id,artist_id,date,start_time" }
    );

    if (error) {
      stats.errors.push(`Event insert failed: ${error.message}`);
      console.error(`  Event insert failed:`, error.message);
      stats.eventsSkipped++;
    } else {
      stats.eventsInserted++;
    }
  }

  console.log(
    `Done: ${stats.eventsInserted} inserted, ${stats.eventsSkipped} skipped`
  );
  return stats;
}

// Cleanup: delete events older than 30 days
export async function cleanupStaleEvents(): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return 0;

  const supabase = createClient(supabaseUrl, serviceKey);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .delete()
    .lt("date", cutoffStr)
    .select("id");

  if (error) {
    console.error("Cleanup failed:", error.message);
    return 0;
  }

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`Cleaned up ${count} stale events (before ${cutoffStr})`);
  }
  return count;
}
