import { slugify } from "../lib/utils";

interface ScrapedEvent {
  date: string;
  startTime: string;
  endTime?: string;
  region: string;
  venueName: string;
  venueUrl?: string;
  artistName: string;
  artistUrl?: string;
}

interface NormalizedVenue {
  name: string;
  slug: string;
  region: string;
  website?: string;
  city_slug: string;
}

interface NormalizedArtist {
  name: string;
  slug: string;
  website?: string;
}

interface NormalizedEvent {
  date: string;
  start_time: string;
  end_time?: string;
  venue_slug: string;
  artist_slug: string;
}

export interface NormalizedData {
  venues: NormalizedVenue[];
  artists: NormalizedArtist[];
  events: NormalizedEvent[];
}

export function normalizeScrapedData(
  scrapedEvents: ScrapedEvent[],
  citySlug: string = "nyc"
): NormalizedData {
  const venueMap = new Map<string, NormalizedVenue>();
  const artistMap = new Map<string, NormalizedArtist>();
  const events: NormalizedEvent[] = [];

  for (const scraped of scrapedEvents) {
    // Normalize venue
    const venueSlug = slugify(scraped.venueName);
    if (!venueMap.has(venueSlug)) {
      venueMap.set(venueSlug, {
        name: scraped.venueName,
        slug: venueSlug,
        region: scraped.region,
        website: scraped.venueUrl,
        city_slug: citySlug,
      });
    }

    // Normalize artist
    const artistSlug = slugify(scraped.artistName);
    if (!artistMap.has(artistSlug)) {
      artistMap.set(artistSlug, {
        name: scraped.artistName,
        slug: artistSlug,
        website: scraped.artistUrl,
      });
    }

    // Create event
    events.push({
      date: scraped.date,
      start_time: scraped.startTime,
      end_time: scraped.endTime,
      venue_slug: venueSlug,
      artist_slug: artistSlug,
    });
  }

  console.log(
    `Normalized: ${venueMap.size} venues, ${artistMap.size} artists, ${events.length} events`
  );

  return {
    venues: Array.from(venueMap.values()),
    artists: Array.from(artistMap.values()),
    events,
  };
}
