import * as cheerio from "cheerio";
import { isAllowedByRobots } from "./check-robots";

// =============================================================================
// WWOZ Livewire Scraper for New Orleans
// Source: https://www.wwoz.org/livewire
//
// Structure: Page is organized by VENUE, not by date.
//   .livewire-listing          = venue container
//   .panel-heading .panel-title a = venue name (href=/organizations/slug)
//   .panel-body .row           = individual event within that venue
//   .row .calendar-info p.truncate a = artist name (href=/events/id)
//   .row .calendar-info p:last  = "Friday, March 13 at 3:00pm"
//   .row .calendar-page .month + .day = date parts (Mar / 13)
//
// Run with: npx tsx scraper/scrape-nola.ts
// =============================================================================

function normalizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");
}

// --- Region mapping for NOLA neighborhoods ---

const VENUE_REGION_MAP: Record<string, string> = {
  // French Quarter
  "preservation hall": "French Quarter",
  "maison bourbon": "French Quarter",
  "fritzel's": "French Quarter",
  "palm court jazz cafe": "French Quarter",
  "irvin mayfield's jazz playhouse": "French Quarter",
  "jazz playhouse": "French Quarter",
  "the famous door": "French Quarter",
  "one eyed jacks": "French Quarter",
  "royal sonesta": "French Quarter",
  "the bourbon pub": "French Quarter",
  "pat o'brien's": "French Quarter",
  "tropical isle": "French Quarter",
  "house of blues": "French Quarter",

  // Marigny / Bywater
  "d.b.a.": "Marigny",
  "dba": "Marigny",
  "the spotted cat music club": "Marigny",
  "spotted cat": "Marigny",
  "the maison": "Marigny",
  "three muses": "Marigny",
  "blue nile": "Marigny",
  "siberia": "Marigny",
  "bacchanal wine": "Marigny",
  "bacchanal": "Marigny",
  "vaughan's lounge": "Marigny",
  "vaughan's": "Marigny",
  "the hi-ho lounge": "Marigny",
  "hi-ho lounge": "Marigny",
  "saturn bar": "Bywater",
  "bj's lounge": "Bywater",

  // Treme
  "candlelight lounge": "Tremé",
  "bullet's sports bar": "Tremé",
  "bullet's": "Tremé",
  "kermit's treme speakeasy": "Tremé",
  "kermit's mother-in-law lounge": "Tremé",
  "mother-in-law lounge": "Tremé",

  // CBD / Warehouse District
  "the orpheum theater": "CBD",
  "the orpheum": "CBD",
  "the civic theatre": "CBD",
  "the joy theater": "CBD",
  "fulton street": "CBD",
  "saenger theatre": "CBD",

  // Uptown
  "tipitina's": "Uptown",
  "maple leaf bar": "Uptown",
  "the columns hotel": "Uptown",
  "columns hotel": "Uptown",
  "dos jefes": "Uptown",
  "gasa gasa": "Uptown",
  "le bon temps roule": "Uptown",

  // Mid-City
  "chickie wah wah": "Mid-City",
  "rock 'n' bowl": "Mid-City",
  "mid-city lanes rock 'n' bowl": "Mid-City",
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

  // Range: "8:00 PM - 11:00 PM" or "8:00PM-11:00PM"
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

  // Single: "8:00 PM" or "8pm" or "8:00PM"
  const singleMatch = cleaned.match(/(\d{1,2}(?::\d{2})?)\s*(AM|PM)/);
  if (singleMatch) {
    return { start: to24h(singleMatch[1], singleMatch[2]) };
  }

  return { start: "00:00" };
}

// --- Date parsing ---

function parseDateHeading(text: string): string {
  // WWOZ typically shows dates like "Thursday, March 13, 2026" or "March 13, 2026"
  const cleaned = text.trim();

  // "Month Day, Year"
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

  // "YYYY-MM-DD" (already correct format, sometimes in data attributes)
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  return "";
}

function monthToNum(month: string): string | null {
  const map: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  return map[month.toLowerCase()] || null;
}

// --- Region lookup ---

function lookupRegion(venueName: string): string {
  const lower = venueName.toLowerCase().trim();

  // Direct match
  if (VENUE_REGION_MAP[lower]) return VENUE_REGION_MAP[lower];

  // Partial match (venue name contains a known key)
  for (const [key, region] of Object.entries(VENUE_REGION_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return region;
    }
  }

  return "";
}

// --- Main scraper ---

export async function scrapeWWOZ(): Promise<ScrapedEvent[]> {
  const targetUrl = "https://www.wwoz.org/livewire";
  const ua = "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

  const allowed = await isAllowedByRobots(targetUrl, ua);
  if (!allowed) {
    console.warn(`Blocked by robots.txt: ${targetUrl}`);
    return [];
  }

  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch wwoz.org/livewire: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // WWOZ structure: .livewire-listing contains venue panels,
  // each panel has .panel-heading (venue) and .panel-body with .row (events)
  $(".livewire-listing .panel.panel-default").each((_, panel) => {
    const $panel = $(panel);

    // Venue from panel heading
    const venueLink = $panel.find(".panel-heading .panel-title a");
    const venueName = normalizeText(venueLink.text().replace(/\u00a0/g, " ").trim());
    const venueHref = venueLink.attr("href");
    const venueUrl = venueHref
      ? `https://www.wwoz.org${venueHref}`
      : undefined;

    if (!venueName) return;

    const region = lookupRegion(venueName);

    // Each .row in .panel-body is an event at this venue
    $panel.find(".panel-body .row").each((_, row) => {
      const $row = $(row);

      // Artist from the truncated link
      const artistLink = $row.find(".calendar-info p.truncate a");
      const artistName = normalizeText(artistLink.text().replace(/\u00a0/g, " ").replace(/&amp;/g, "&").trim());
      const artistHref = artistLink.attr("href");
      const artistUrl = artistHref
        ? `https://www.wwoz.org${artistHref}`
        : undefined;

      if (!artistName) return;

      // Date from .calendar-page month + day
      const monthText = $row.find(".calendar-page .month").text().trim();
      const dayText = $row.find(".calendar-page .day").text().trim();

      // Time from the info paragraph (e.g. "Friday, March 13 at 3:00pm")
      // It's the last <p> inside .calendar-info (not the .truncate one)
      const infoParagraphs = $row.find(".calendar-info p:not(.truncate)");
      const infoText = infoParagraphs.text().trim();

      // Build date: month abbreviation + day + infer year
      const date = buildDate(monthText, dayText, infoText);
      if (!date) return;

      // Extract time from info text: "Friday, March 13 at 3:00pm"
      const timeMatch = infoText.match(/at\s+(.+)$/i);
      const timeStr = timeMatch ? timeMatch[1] : "";
      const { start, end } = parseTime(timeStr);

      events.push({
        date,
        startTime: start,
        endTime: end,
        region,
        venueName,
        venueUrl,
        artistName,
        artistUrl,
      });
    });
  });

  if (events.length === 0) {
    console.warn(
      "No events found. The WWOZ livewire HTML structure may have changed. " +
      "Run: npx tsx scraper/inspect-wwoz.ts to debug."
    );
  }

  console.log(`Scraped ${events.length} events from wwoz.org/livewire`);
  return events;
}

function buildDate(monthAbbrev: string, day: string, infoText: string): string {
  if (!monthAbbrev || !day) return "";

  // Try to get full month name from info text (e.g. "Friday, March 13 at 3:00pm")
  const fullMonthMatch = infoText.match(
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\w+)\s+\d/i
  );

  let monthNum: string | null = null;

  if (fullMonthMatch) {
    monthNum = monthToNum(fullMonthMatch[1]);
  }

  // Fall back to abbreviation
  if (!monthNum) {
    const ABBREV_MAP: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04",
      may: "05", jun: "06", jul: "07", aug: "08",
      sep: "09", oct: "10", nov: "11", dec: "12",
    };
    monthNum = ABBREV_MAP[monthAbbrev.toLowerCase().slice(0, 3)] || null;
  }

  if (!monthNum) return "";

  // Infer year: use current year, or next year if month is in the past
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const m = parseInt(monthNum, 10);
  const year = m < currentMonth - 1 ? currentYear + 1 : currentYear;

  return `${year}-${monthNum}-${day.padStart(2, "0")}`;
}

// --- CLI runner ---

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const push = args.includes("--push");

  (async () => {
    const events = await scrapeWWOZ();

    console.log(`\nSample events:`);
    console.log(JSON.stringify(events.slice(0, 5), null, 2));

    if (push && !dryRun) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, "nola");

      const { config } = await import("dotenv");
      config();

      const { pushToSupabase, cleanupStaleEvents } = await import("./push-to-db");
      const stats = await pushToSupabase(normalized, "nola");
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
    } else if (args.includes("--dry-run")) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, "nola");
      console.log(`\nDry run complete. Use --push to write to Supabase.`);
      if (normalized.rejected.length > 0) {
        console.log(`Would reject ${normalized.rejected.length} events.`);
      }
    } else {
      console.log(`\nScrape only. Use --dry-run to normalize or --push to write to DB.`);
    }
  })().catch(console.error);
}
