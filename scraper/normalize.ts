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
  rejected: { event: ScrapedEvent; reason: string }[];
}

// --- Text cleaning ---

function cleanText(text: string): string {
  return text
    .replace(/[\u00a0\u2000-\u200f\u2028-\u202f\u205f\u3000\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Canonical TBA names
const TBA_PATTERNS = /^(tba|tbd|to be announced|to be determined|artist tba|tba artist)$/i;

function normalizeArtistName(name: string): string {
  let cleaned = cleanText(name);

  if (TBA_PATTERNS.test(cleaned)) return "TBA";

  // Normalize common abbreviations
  cleaned = cleaned
    .replace(/\bw\//gi, "with ")
    .replace(/\bfeat\.?\s/gi, "featuring ")
    .replace(/\bf\/\s/gi, "featuring ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function normalizeVenueName(name: string): string {
  return cleanText(name);
}

// Slug that ignores leading "The" for matching purposes
function venueSlug(name: string): string {
  const normalized = normalizeVenueName(name);
  const forSlug = normalized
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\u02B9\u0060\u00B4]/g, "'") // normalize apostrophe variants to straight quote
    .replace(/^the\s+/i, "");
  return slugify(forSlug);
}

// --- Validation ---

function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function isValidTime(timeStr: string): boolean {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const [, h, m] = match.map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function validateEvent(
  event: ScrapedEvent
): { valid: true } | { valid: false; reason: string } {
  // Must have venue and artist
  if (!event.venueName || !cleanText(event.venueName)) {
    return { valid: false, reason: "Empty venue name" };
  }
  if (!event.artistName || !cleanText(event.artistName)) {
    return { valid: false, reason: "Empty artist name" };
  }

  // Valid date format
  if (!isValidDate(event.date)) {
    return { valid: false, reason: `Invalid date: ${event.date}` };
  }

  // Not too far in the past (allow 1 day grace for timezone)
  const eventDate = new Date(event.date + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  if (eventDate < yesterday) {
    return { valid: false, reason: `Past date: ${event.date}` };
  }

  // Not too far in the future (90 days)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  if (eventDate > maxDate) {
    return { valid: false, reason: `Too far out: ${event.date}` };
  }

  // Valid time
  if (!isValidTime(event.startTime)) {
    return { valid: false, reason: `Invalid start time: ${event.startTime}` };
  }
  if (event.endTime && !isValidTime(event.endTime)) {
    return { valid: false, reason: `Invalid end time: ${event.endTime}` };
  }

  return { valid: true };
}

// --- Main ---

export function normalizeScrapedData(
  scrapedEvents: ScrapedEvent[],
  citySlug: string = "nyc"
): NormalizedData {
  const venueMap = new Map<string, NormalizedVenue>();
  const artistMap = new Map<string, NormalizedArtist>();
  const events: NormalizedEvent[] = [];
  const rejected: { event: ScrapedEvent; reason: string }[] = [];

  for (const scraped of scrapedEvents) {
    // Validate
    const check = validateEvent(scraped);
    if (!check.valid) {
      rejected.push({ event: scraped, reason: check.reason });
      continue;
    }

    // Normalize names
    const venueName = normalizeVenueName(scraped.venueName);
    const artistName = normalizeArtistName(scraped.artistName);
    const vSlug = venueSlug(venueName);
    const aSlug = slugify(artistName);

    // Deduplicate venues by slug
    if (!venueMap.has(vSlug)) {
      venueMap.set(vSlug, {
        name: venueName,
        slug: vSlug,
        region: scraped.region,
        website: scraped.venueUrl,
        city_slug: citySlug,
      });
    }

    // Deduplicate artists by slug
    if (!artistMap.has(aSlug)) {
      artistMap.set(aSlug, {
        name: artistName,
        slug: aSlug,
        website: scraped.artistUrl,
      });
    }

    // Create event
    events.push({
      date: scraped.date,
      start_time: scraped.startTime,
      end_time: scraped.endTime,
      venue_slug: vSlug,
      artist_slug: aSlug,
    });
  }

  console.log(
    `Normalized: ${venueMap.size} venues, ${artistMap.size} artists, ${events.length} events`
  );
  if (rejected.length > 0) {
    console.log(`Rejected: ${rejected.length} events`);
    for (const r of rejected) {
      console.log(`  - ${r.reason}: ${r.event.artistName} @ ${r.event.venueName} (${r.event.date})`);
    }
  }

  return {
    venues: Array.from(venueMap.values()),
    artists: Array.from(artistMap.values()),
    events,
    rejected,
  };
}
