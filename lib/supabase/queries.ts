import { SupabaseClient } from "@supabase/supabase-js";
import { City, Venue, Event } from "@/lib/types";

// Types matching Supabase row shapes
interface DbCity {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface DbRegion {
  id: string;
  city_id: string;
  slug: string;
  name: string;
}

interface DbVenue {
  id: string;
  city_id: string;
  region_id: string | null;
  name: string;
  slug: string;
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  phone: string | null;
  photo_url: string | null;
  sponsor_tier: string;
}

interface DbArtist {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  photo_url: string | null;
}

// Supabase query results with joined relations
interface EventRow {
  id: string;
  venue_id: string;
  artist_id: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  source_url: string | null;
  is_boosted: boolean;
  venues: DbVenue;
  artists: DbArtist | null;
}

interface VenueRow extends DbVenue {
  cities: { slug: string };
  regions: { slug: string; name: string } | null;
}

import { SponsorTier } from "@/lib/types";

function mapEventRow(e: EventRow, citySlug: string): Event {
  return {
    id: e.id,
    venue_id: e.venue_id,
    venue: {
      id: e.venues.id,
      city_slug: citySlug,
      name: e.venues.name,
      slug: e.venues.slug,
      address: e.venues.address || "",
      neighborhood: e.venues.neighborhood || "",
      region: "",
      lat: e.venues.lat || 0,
      lng: e.venues.lng || 0,
      website: e.venues.website || undefined,
      phone: e.venues.phone || undefined,
      photo_url: e.venues.photo_url || undefined,
      sponsor_tier: (e.venues.sponsor_tier || "free") as SponsorTier,
    },
    artist_id: e.artist_id || "",
    artist: e.artists
      ? {
          id: e.artists.id,
          name: e.artists.name,
          slug: e.artists.slug,
          website: e.artists.website || undefined,
          photo_url: e.artists.photo_url || undefined,
        }
      : { id: "", name: "TBA", slug: "tba" },
    date: e.date,
    start_time: e.start_time?.slice(0, 5) || "00:00",
    end_time: e.end_time?.slice(0, 5) || undefined,
    description: e.description || undefined,
    source_url: e.source_url || undefined,
    is_boosted: e.is_boosted || false,
  };
}

function mapVenueRow(v: VenueRow, citySlug: string): Venue {
  return {
    id: v.id,
    city_slug: citySlug,
    name: v.name,
    slug: v.slug,
    address: v.address || "",
    neighborhood: v.neighborhood || "",
    region: v.regions?.slug || "",
    lat: v.lat || 0,
    lng: v.lng || 0,
    website: v.website || undefined,
    phone: v.phone || undefined,
    photo_url: v.photo_url || undefined,
    sponsor_tier: (v.sponsor_tier || "free") as SponsorTier,
  };
}

// Fetch all cities with their regions
export async function getCities(supabase: SupabaseClient): Promise<City[]> {
  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select("*")
    .order("name");

  if (citiesError) throw citiesError;

  const { data: regions, error: regionsError } = await supabase
    .from("regions")
    .select("*");

  if (regionsError) throw regionsError;

  return (cities as DbCity[]).map((city) => ({
    id: city.id,
    slug: city.slug,
    name: city.name,
    lat: city.lat,
    lng: city.lng,
    timezone: city.timezone,
    regions: (regions as DbRegion[])
      .filter((r) => r.city_id === city.id)
      .map((r) => ({ slug: r.slug, name: r.name, city_slug: city.slug })),
  }));
}

// Fetch events for a city within a date range
export async function getEvents(
  supabase: SupabaseClient,
  citySlug: string,
  dates: string[]
): Promise<Event[]> {
  if (dates.length === 0) return [];

  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      venues!inner (
        *,
        cities!inner ( slug )
      ),
      artists ( * )
    `)
    .eq("venues.cities.slug", citySlug)
    .gte("date", minDate)
    .lte("date", maxDate)
    .order("date")
    .order("start_time");

  if (error) throw error;
  if (!data) return [];

  const rows = data as unknown as EventRow[];
  return rows
    .filter((e) => dates.includes(e.date))
    .map((e) => mapEventRow(e, citySlug));
}

// Fetch all venues for a city
export async function getVenues(
  supabase: SupabaseClient,
  citySlug: string
): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select(`
      *,
      cities!inner ( slug ),
      regions ( slug, name )
    `)
    .eq("cities.slug", citySlug)
    .order("sponsor_tier")
    .order("name");

  if (error) throw error;
  if (!data) return [];

  const rows = data as unknown as VenueRow[];
  return rows.map((v) => mapVenueRow(v, citySlug));
}

// Fetch a single venue by slug
export async function getVenueBySlug(
  supabase: SupabaseClient,
  citySlug: string,
  venueSlug: string
): Promise<Venue | null> {
  const { data, error } = await supabase
    .from("venues")
    .select(`
      *,
      cities!inner ( slug ),
      regions ( slug, name )
    `)
    .eq("cities.slug", citySlug)
    .eq("slug", venueSlug)
    .single();

  if (error || !data) return null;

  const row = data as unknown as VenueRow;
  return mapVenueRow(row, citySlug);
}

// Fetch events for a specific venue
export async function getVenueEvents(
  supabase: SupabaseClient,
  venueId: string
): Promise<Event[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      venues ( * ),
      artists ( * )
    `)
    .eq("venue_id", venueId)
    .gte("date", today)
    .order("date")
    .order("start_time")
    .limit(50);

  if (error) throw error;
  if (!data) return [];

  const rows = data as unknown as EventRow[];
  return rows.map((e) => mapEventRow(e, ""));
}

// User: toggle favorite venue
export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  venueId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .single();

  if (existing) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase
      .from("user_favorites")
      .insert({ user_id: userId, venue_id: venueId });
    return true;
  }
}

// User: get favorite venue IDs
export async function getFavorites(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("user_favorites")
    .select("venue_id")
    .eq("user_id", userId);

  return (data || []).map((f: { venue_id: string }) => f.venue_id);
}

// User: save preferences
export async function savePreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: {
    home_city_id?: string;
    default_region_id?: string;
    default_time_filter?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      ...prefs,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) throw error;
}
