import * as cheerio from "cheerio";
import { isAllowedByRobots } from "./check-robots";

// =============================================================================
// Philadelphia Jazz Scraper (Multi-Source)
//
// Sources:
//   1. Chris' Jazz Cafe - https://www.chrisjazzcafe.com/calendar
//      Philadelphia's longest-running jazz club, 1421 Sansom St.
//      Uses Seat Engine for ticketing. The /calendar page embeds a
//      JSON-LD <script type="application/ld+json"> block containing a
//      Place object with an "Events" array. Each event has:
//        - name: artist/show name
//        - startDate: ISO 8601 UTC timestamp (e.g. "2026-03-21T23:30:00Z")
//        - url: link to the show page
//        - description: HTML with set times, pricing, etc.
//      Events are listed per-set (two entries for 7:30 & 9:30 shows).
//      All times are UTC and need conversion to ET (UTC-4 EDT / UTC-5 EST).
//
//   2. South Jazz Kitchen - https://www.southjazzkitchen.com/
//      600 N Broad St. Uses BentoBox CMS. The homepage has an <aside>
//      containing a <ul class="card-listing"> with <li class="card"> items.
//      Each card has an <a class="card__btn"> linking to /event/[slug]/.
//      The <h3 class="card__heading"> contains the artist name, dates,
//      and times in a pipe-delimited format like:
//        "CHARLENE HOLLOWAY | THURS MAR 26 | 6:30PM & 9:00PM | presented by..."
//        "SY SMITH | FRI, SAT & SUN MAR 20, 21 & 22 | SHOWTIMES VARY BY DAY"
//      Multi-day shows list multiple dates. Detail pages have a <strong>
//      with "Month DD, YYYY until Month DD, YYYY" and body text with
//      specific showtimes per day.
//
// Run with: npx tsx scraper/scrape-philly.ts
// =============================================================================

function normalizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");
}

// --- Region mapping for Philly neighborhoods ---

const VENUE_REGION_MAP: Record<string, string> = {
  // Center City
  "chris' jazz cafe": "Center City",
  "chris jazz cafe": "Center City",
  "chris' jazz café": "Center City",
  "time": "Center City",

  // South Broad / Avenue of the Arts
  "south jazz kitchen": "South Broad",
  "south restaurant & jazz club": "South Broad",
  "south restaurant": "South Broad",
  "south kitchen": "South Broad",
  "clef club of jazz": "South Broad",
  "clef club": "South Broad",
  "kimmel center": "South Broad",
  "kimmel cultural campus": "South Broad",
  "academy of music": "South Broad",
  "miller theater": "South Broad",

  // Old City
  "painted bride art center": "Old City",
  "the painted bride": "Old City",

  // University City
  "world cafe live": "University City",
  "world café live": "University City",
  "the rotunda": "University City",
  "international house": "University City",

  // Germantown
  "paris bistro & jazz cafe": "Germantown",
  "paris bistro": "Germantown",

  // Other
  "ardmore music hall": "Main Line",
  "city winery": "Center City",
};

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

// --- Time parsing ---

function to24h(time: string, period: string): string {
  let [hours, minutes] = time.includes(":")
    ? time.split(":").map(Number)
    : [Number(time), 0];

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  hours = hours % 24;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function parseTime(timeStr: string): { start: string; end?: string } {
  const cleaned = timeStr.trim().toUpperCase();

  // Range: "7:30PM - 9:30PM"
  const rangeMatch = cleaned.match(
    /(\d{1,2}(?::\d{2})?)\s*(AM|PM)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/
  );
  if (rangeMatch) {
    const endPeriod = rangeMatch[4];
    const startPeriod = rangeMatch[2] || endPeriod;
    return {
      start: to24h(rangeMatch[1], startPeriod),
      end: to24h(rangeMatch[3], endPeriod),
    };
  }

  // Single: "7:30PM"
  const singleMatch = cleaned.match(/(\d{1,2}(?::\d{2})?)\s*(AM|PM)/);
  if (singleMatch) {
    return { start: to24h(singleMatch[1], singleMatch[2]) };
  }

  return { start: "00:00" };
}

// --- Date parsing ---

function monthToNum(month: string): string | null {
  const map: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
  };
  return map[month.toLowerCase()] || null;
}

function parseDateHeading(text: string): string {
  const cleaned = text.trim();

  // "Month Day, Year" or "Day Month, Year"
  const fullMatch = cleaned.match(
    /(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?(\w+)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (fullMatch) {
    const month = monthToNum(fullMatch[1]);
    if (month) {
      const day = fullMatch[2].padStart(2, "0");
      return `${fullMatch[3]}-${month}-${day}`;
    }
  }

  // "MM/DD/YYYY"
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const m = slashMatch[1].padStart(2, "0");
    const d = slashMatch[2].padStart(2, "0");
    let y = slashMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  // "YYYY-MM-DD"
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  return "";
}

// --- Region lookup ---

function lookupRegion(venueName: string): string {
  const lower = venueName.toLowerCase().trim();

  // Direct match
  if (VENUE_REGION_MAP[lower]) return VENUE_REGION_MAP[lower];

  // Partial match
  for (const [key, region] of Object.entries(VENUE_REGION_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return region;
    }
  }

  return "";
}

// =============================================================================
// Source 1: Chris' Jazz Cafe
// Parses JSON-LD structured data from the /calendar page.
// Each event has an ISO startDate in UTC. We convert to ET for the local time.
// =============================================================================

interface JsonLdEvent {
  name: string;
  startDate: string; // ISO 8601 UTC
  url: string;
  description?: string;
}

function utcToET(isoDate: string): { date: string; time: string } {
  // Parse UTC date string and convert to US Eastern
  const d = new Date(isoDate);

  // Use Intl to get the ET offset-adjusted date/time
  const etFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = etFormatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = get("hour");
  const minute = get("minute");

  // Intl sometimes returns "24" for midnight
  if (hour === "24") hour = "00";

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

async function scrapeChrisJazzCafe(): Promise<ScrapedEvent[]> {
  const targetUrl = "https://www.chrisjazzcafe.com/calendar";
  const ua = "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

  const allowed = await isAllowedByRobots(targetUrl, ua);
  if (!allowed) {
    console.warn(`Blocked by robots.txt: ${targetUrl}`);
    return [];
  }

  const response = await fetch(targetUrl, {
    headers: { "User-Agent": ua },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chrisjazzcafe.com/calendar: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // Extract JSON-LD from <script type="application/ld+json">
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      if (!data.Events || !Array.isArray(data.Events)) return;

      for (const evt of data.Events as JsonLdEvent[]) {
        if (!evt.name || !evt.startDate) continue;

        // Skip non-event entries
        const nameLower = evt.name.toLowerCase();
        if (nameLower.includes("closed for private")) continue;

        const { date, time } = utcToET(evt.startDate);
        const artistName = normalizeText(evt.name.trim());

        events.push({
          date,
          startTime: time,
          region: "Center City",
          venueName: "Chris' Jazz Cafe",
          venueUrl: "https://www.chrisjazzcafe.com",
          artistName,
          artistUrl: evt.url || undefined,
        });
      }
    } catch {
      // Skip malformed JSON-LD blocks
    }
  });

  console.log(`Scraped ${events.length} events from chrisjazzcafe.com`);
  return events;
}

// =============================================================================
// Source 2: South Jazz Kitchen
// Scrapes the homepage <aside> section which lists upcoming jazz club events
// as card elements. Each card heading has a pipe-delimited format:
//   "ARTIST | DAY(S) MONTH DD(, DD & DD) | TIME(S) | optional presenter"
// Multi-day shows are expanded into individual date entries.
// =============================================================================

function parseMonthDay(monthStr: string, dayStr: string): string {
  const month = monthToNum(monthStr);
  if (!month) return "";

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const m = parseInt(month, 10);
  const year = m < currentMonth - 1 ? currentYear + 1 : currentYear;

  return `${year}-${month}-${dayStr.padStart(2, "0")}`;
}

function parseSouthHeading(heading: string): {
  artistName: string;
  dates: string[];
  times: { start: string; end?: string }[];
} {
  // Split on pipes: "ARTIST | DATE(S) | TIME(S) | optional"
  const parts = heading.split("|").map((p) => p.trim());
  const artistName = normalizeText(parts[0] || "");

  const dates: string[] = [];
  const times: { start: string; end?: string }[] = [];

  if (parts.length < 2) return { artistName, dates, times };

  // Parse dates from second segment
  // Examples:
  //   "FRI, SAT & SUN MAR 20, 21 & 22"
  //   "THURS MAR 26"
  //   "THURS APRIL 2"
  const dateSegment = parts[1].toUpperCase();

  // Extract month name
  const monthMatch = dateSegment.match(
    /\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/i
  );

  if (monthMatch) {
    const monthName = monthMatch[1];
    // Get all day numbers after the month
    const afterMonth = dateSegment.slice(
      dateSegment.indexOf(monthName) + monthName.length
    );
    const dayNumbers = afterMonth.match(/\d+/g);

    if (dayNumbers) {
      for (const day of dayNumbers) {
        const date = parseMonthDay(monthName, day);
        if (date) dates.push(date);
      }
    }
  }

  // Parse times from third segment (if present)
  if (parts.length >= 3) {
    const timeSegment = parts[2].toUpperCase();

    if (timeSegment.includes("SHOWTIMES VARY")) {
      // Can't parse specific times; will use defaults
    } else {
      // "6:30PM & 9:00PM" or "6:30PM & 9PM"
      const timeMatches = timeSegment.match(
        /(\d{1,2}(?::\d{2})?)\s*(AM|PM)/g
      );
      if (timeMatches) {
        for (const tm of timeMatches) {
          const parsed = parseTime(tm);
          times.push(parsed);
        }
      }
    }
  }

  return { artistName, dates, times };
}

async function scrapeSouthJazzKitchen(): Promise<ScrapedEvent[]> {
  const targetUrl = "https://www.southjazzkitchen.com/";
  const ua = "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

  const allowed = await isAllowedByRobots(targetUrl, ua);
  if (!allowed) {
    console.warn(`Blocked by robots.txt: ${targetUrl}`);
    return [];
  }

  const response = await fetch(targetUrl, {
    headers: { "User-Agent": ua },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch southjazzkitchen.com: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // Events are in: aside > ul.card-listing > li.card > a.card__btn > h3.card__heading
  $("aside ul.card-listing li.card").each((_, card) => {
    const link = $(card).find("a.card__btn");
    const heading = link.find("h3.card__heading").text().trim();
    const href = link.attr("href");

    if (!heading) return;

    const eventUrl = href
      ? `https://www.southjazzkitchen.com${href}`
      : undefined;

    const { artistName, dates, times } = parseSouthHeading(heading);
    if (!artistName) return;

    // If we have specific dates, create events for each
    if (dates.length > 0) {
      for (const date of dates) {
        if (times.length > 0) {
          // Create an event for each showtime on each date
          for (const time of times) {
            events.push({
              date,
              startTime: time.start,
              endTime: time.end,
              region: "South Broad",
              venueName: "South Jazz Kitchen",
              venueUrl: "https://www.southjazzkitchen.com",
              artistName,
              artistUrl: eventUrl,
            });
          }
        } else {
          // No specific times parsed (showtimes vary)
          events.push({
            date,
            startTime: "19:00", // Default 7pm for shows without specific times
            region: "South Broad",
            venueName: "South Jazz Kitchen",
            venueUrl: "https://www.southjazzkitchen.com",
            artistName,
            artistUrl: eventUrl,
          });
        }
      }
    }
  });

  console.log(`Scraped ${events.length} events from southjazzkitchen.com`);
  return events;
}

// =============================================================================
// Combined scraper
// =============================================================================

export async function scrapePhilly(): Promise<ScrapedEvent[]> {
  const results = await Promise.allSettled([
    scrapeChrisJazzCafe(),
    scrapeSouthJazzKitchen(),
  ]);

  const events: ScrapedEvent[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      events.push(...result.value);
    } else {
      console.error("Scraper failed:", result.reason);
    }
  }

  console.log(`Total: ${events.length} events from Philadelphia`);
  return events;
}

// --- CLI runner ---

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const push = args.includes("--push");

  (async () => {
    const events = await scrapePhilly();

    console.log(`\nSample events:`);
    console.log(JSON.stringify(events.slice(0, 5), null, 2));

    if (push && !dryRun) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, "philly");

      const { config } = await import("dotenv");
      config();

      const { pushToSupabase, cleanupStaleEvents } = await import("./push-to-db");
      const stats = await pushToSupabase(normalized, "philly");
      const cleaned = await cleanupStaleEvents();

      const { geocodeNewVenues } = await import("./geocode");
      await geocodeNewVenues(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      console.log("\n--- Summary ---");
      console.log(`Events: ${stats.eventsInserted} inserted, ${stats.eventsSkipped} skipped`);
      console.log(`Venues: ${stats.venuesUpserted} upserted`);
      console.log(`Artists: ${stats.artistsUpserted} upserted`);
      console.log(`Rejected: ${normalized.rejected.length}`);
      console.log(`Cleaned up: ${cleaned} stale events`);
      if (stats.errors.length > 0) {
        console.log(`Errors: ${stats.errors.length}`);
      }
    } else if (dryRun) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, "philly");
      console.log(`\nDry run complete. Use --push to write to Supabase.`);
      if (normalized.rejected.length > 0) {
        console.log(`Would reject ${normalized.rejected.length} events.`);
      }
    } else {
      console.log(`\nScrape only. Use --dry-run to normalize or --push to write to DB.`);
    }
  })().catch(console.error);
}
