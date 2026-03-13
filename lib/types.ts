export type SponsorTier = "free" | "spotlight" | "marquee";

export type TimeOfDay = "afternoon" | "evening" | "late-night";

export type Borough = "manhattan" | "brooklyn" | "queens" | "bronx" | "staten-island";

export interface City {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  timezone: string;
  live: boolean;
  regions: Region[];
}

export interface Region {
  slug: string;
  name: string;
  city_slug: string;
}

export interface Venue {
  id: string;
  city_slug: string;
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  region: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  photo_url?: string;
  sponsor_tier: SponsorTier;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  website?: string;
  photo_url?: string;
}

export interface Event {
  id: string;
  venue_id: string;
  venue: Venue;
  artist_id: string;
  artist: Artist;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time?: string; // HH:mm
  description?: string;
  source_url?: string;
  is_boosted: boolean;
}

export interface FilterState {
  city: string;
  date: string; // "tonight" | "tomorrow" | "this-weekend" | YYYY-MM-DD
  region?: string;
  neighborhood?: string;
  timeOfDay?: TimeOfDay;
  query?: string;
}

export interface UserPreferences {
  home_city: string;
  default_region?: string;
  default_time_filter?: TimeOfDay;
}
