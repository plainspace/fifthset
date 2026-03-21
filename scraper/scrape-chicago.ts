import * as cheerio from "cheerio";
import { isAllowedByRobots } from "./check-robots";

// =============================================================================
// Jazz Institute of Chicago Scraper
// Source: https://www.jazzinchicago.org/events-1 (Squarespace)
//
// Strategy: Two-pass approach.
//
// Pass 1 (primary) - Squarespace JSON API:
//   GET /events-1?format=json
//   Returns { upcoming: [...], past: [...] } with event objects containing:
//     .title           = event/artist name
//     .startDate       = epoch ms (UTC)
//     .endDate         = epoch ms (UTC)
//     .location.addressTitle  = venue name
//     .location.addressLine1  = street address
//     .location.addressLine2  = "Chicago, IL, XXXXX"
//     .fullUrl         = "/events-1/slug"
//
// Pass 2 (fallback) - Calendar page HTML:
//   GET /calendar
//   Squarespace renders a YUI3 calendar widget server-side with event data
//   embedded in td.has-event cells:
//     .flyoutitem-title a                    = event title + link
//     .flyoutitem-datetime--12hr             = "6:30 PM - 8:35 PM"
//     .flyoutitem-location-addresstitle      = venue name
//     .flyoutitem-location-address1          = street address
//     .flyoutitem-location-address2          = "Chicago, IL, XXXXX"
//     .marker-daynum                         = day of month
//   Calendar header: .yui3-calendar-header-label = "March 2026"
//
// The JSON API is preferred because it includes exact timestamps, but the
// calendar HTML is useful as a fallback and may contain events from a
// different Squarespace collection.
//
// Note: The Jazz Institute only lists their own curated events (typically
// 1-5 per month), not a comprehensive Chicago jazz calendar.
//
// Run with: npx tsx scraper/scrape-chicago.ts
// =============================================================================

function normalizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");
}

// --- Region mapping for Chicago neighborhoods ---

const VENUE_REGION_MAP: Record<string, string> = {
  // The Loop / Downtown
  "the jazz showcase": "The Loop",
  "jazz showcase": "The Loop",
  "chicago cultural center": "The Loop",
  "symphony center": "The Loop",
  "auditorium theatre": "The Loop",
  "millennium park": "The Loop",
  "jay pritzker pavilion": "The Loop",
  "jazz institute of chicago": "The Loop",

  // South Side
  "south shore cultural center": "South Side",
  "the promontory": "South Side",
  "promontory": "South Side",
  "the silver room": "South Side",
  "silver room": "South Side",
  "cafe logan at logan center for the arts": "South Side",
  "logan center for the arts": "South Side",
  "the quarry": "South Side",
  "experimental station": "South Side",
  "university of chicago": "South Side",
  "hamilton park": "South Side",
  "the dock": "South Side",
  "a&t lounge": "South Side",

  // West Side
  "garfield park conservatory": "West Side",
  "morgan mfg": "West Side",
  "morgan manufacturing": "West Side",
  "the empty bottle": "West Side",
  "constellation": "West Side",
  "elastic arts": "West Side",

  // North Side
  "green mill": "North Side",
  "green mill cocktail lounge": "North Side",
  "the green mill": "North Side",
  "winter's jazz club": "North Side",
  "winter's": "North Side",
  "andy's jazz club": "North Side",
  "andy's": "North Side",
  "fitzgerald's": "North Side",
  "the hideout": "North Side",
  "the whistler": "North Side",
  "hungry brain": "North Side",
  "constellation chicago": "North Side",
  "jazz estate": "North Side",
  "the jazz estate": "North Side",
  "epiphany center for the arts": "North Side",
  "city winery chicago": "North Side",
  "city winery": "North Side",
  "martyrs'": "North Side",
  "schubas tavern": "North Side",
  "lincoln hall": "North Side",
  "the riviera theatre": "North Side",
  "ravinia festival": "North Side",
  "ravinia": "North Side",
};

interface ScrapedEvent {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24h)
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

  // Range: "6:30 PM - 8:35 PM" or "6:30PM-8:35PM"
  const rangeMatch = cleaned.match(
    /(\d{1,2}(?::\d{2})?)\s*(AM|PM)?\s*[-\u2013]\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/
  );
  if (rangeMatch) {
    const endPeriod = rangeMatch[4];
    const startPeriod = rangeMatch[2] || endPeriod;
    return {
      start: to24h(rangeMatch[1], startPeriod),
      end: to24h(rangeMatch[3], endPeriod),
    };
  }

  // Single: "6:30 PM" or "8pm"
  const singleMatch = cleaned.match(/(\d{1,2}(?::\d{2})?)\s*(AM|PM)/);
  if (singleMatch) {
    return { start: to24h(singleMatch[1], singleMatch[2]) };
  }

  return { start: "00:00" };
}

// --- Date parsing ---

function parseDateHeading(text: string): string {
  const cleaned = text.trim();

  // "Month Day, Year" or "Day Month Year"
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

  // "YYYY-MM-DD" (already correct format)
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

// --- Epoch to Chicago local date/time ---

function epochToChicago(epochMs: number): { date: string; time: string } {
  const d = new Date(epochMs);
  // Format in America/Chicago timezone
  const parts = d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Parse "MM/DD/YYYY, HH:MM"
  const match = parts.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})/);
  if (match) {
    return {
      date: `${match[3]}-${match[1]}-${match[2]}`,
      time: `${match[4]}:${match[5]}`,
    };
  }

  // Fallback to UTC
  const iso = d.toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
  };
}

// --- Squarespace JSON API types ---

interface SqspEvent {
  title: string;
  startDate?: number;
  endDate?: number;
  location?: {
    addressTitle?: string;
    addressLine1?: string;
    addressLine2?: string;
    addressCountry?: string;
  };
  fullUrl?: string;
  structuredContent?: {
    _type: string;
    startDate?: number;
    endDate?: number;
  };
}

interface SqspResponse {
  upcoming?: SqspEvent[];
  past?: SqspEvent[];
  collection?: {
    id: string;
    title: string;
  };
}

// --- Main scraper ---

export async function scrapeChicago(): Promise<ScrapedEvent[]> {
  const baseUrl = "https://www.jazzinchicago.org";
  const ua = "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

  const allowed = await isAllowedByRobots(baseUrl, ua);
  if (!allowed) {
    console.warn(`Blocked by robots.txt: ${baseUrl}`);
    return [];
  }

  const events: ScrapedEvent[] = [];
  const seen = new Set<string>(); // dedupe key: date+time+venue+artist

  // --- Pass 1: Squarespace JSON API ---
  try {
    const jsonUrl = `${baseUrl}/events-1?format=json`;
    const response = await fetch(jsonUrl, {
      headers: { "User-Agent": ua },
    });

    if (response.ok) {
      const data: SqspResponse = await response.json();
      const upcoming = data.upcoming || [];

      for (const item of upcoming) {
        const startMs = item.startDate || item.structuredContent?.startDate;
        const endMs = item.endDate || item.structuredContent?.endDate;

        if (!startMs) continue;

        const start = epochToChicago(startMs);
        const end = endMs ? epochToChicago(endMs) : undefined;

        const venueName = normalizeText(
          item.location?.addressTitle || "Jazz Institute of Chicago"
        ).replace(/\u00a0/g, " ").trim();

        const artistName = normalizeText(item.title || "")
          .replace(/\u00a0/g, " ")
          .trim();

        if (!artistName) continue;

        const region = lookupRegion(venueName);
        const eventUrl = item.fullUrl
          ? `${baseUrl}${item.fullUrl}`
          : undefined;

        const dedupeKey = `${start.date}|${start.time}|${venueName}|${artistName}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        events.push({
          date: start.date,
          startTime: start.time,
          endTime: end?.time,
          region,
          venueName,
          artistName,
          artistUrl: eventUrl,
        });
      }

      console.log(`Pass 1 (JSON API): found ${upcoming.length} upcoming events`);
    } else {
      console.warn(`JSON API returned ${response.status}, falling back to HTML`);
    }
  } catch (err) {
    console.warn(`JSON API failed: ${err}, falling back to HTML`);
  }

  // --- Pass 2: Calendar page HTML (picks up events rendered in the calendar widget) ---
  try {
    const calUrl = `${baseUrl}/calendar`;
    const calAllowed = await isAllowedByRobots(calUrl, ua);
    if (!calAllowed) {
      console.warn(`Blocked by robots.txt: ${calUrl}`);
      return events;
    }

    const response = await fetch(calUrl, {
      headers: { "User-Agent": ua },
    });

    if (!response.ok) {
      console.warn(`Calendar page returned ${response.status}`);
      return events;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get the month/year from the calendar header
    const monthYearText = $(".yui3-calendar-header-label").text().trim();
    // e.g. "March 2026"
    const monthYearMatch = monthYearText.match(/(\w+)\s+(\d{4})/);

    if (!monthYearMatch) {
      console.warn("Could not parse calendar month/year header");
      return events;
    }

    const calMonth = monthToNum(monthYearMatch[1]);
    const calYear = monthYearMatch[2];
    if (!calMonth) {
      console.warn(`Unknown month in calendar header: ${monthYearMatch[1]}`);
      return events;
    }

    // Each td.has-event contains one or more .flyoutitem entries
    // The has-event class is added inline, so check for .flyoutitem presence too
    $("td").each((_, td) => {
      const $td = $(td);
      const flyoutItems = $td.find(".flyoutitem");
      if (flyoutItems.length === 0) return;

      const dayNum = $td.find(".marker-daynum").text().trim();
      if (!dayNum) return;

      const date = `${calYear}-${calMonth}-${dayNum.padStart(2, "0")}`;

      flyoutItems.each((_, flyout) => {
        const $flyout = $(flyout);

        const titleEl = $flyout.find(".flyoutitem-title a");
        const artistName = normalizeText(titleEl.text().replace(/\u00a0/g, " ").trim());
        const eventHref = titleEl.attr("href");
        const eventUrl = eventHref ? `${baseUrl}${eventHref}` : undefined;

        if (!artistName) return;

        // Time from 12hr display
        const timeText = $flyout.find(".flyoutitem-datetime--12hr").text().trim();
        const { start, end } = parseTime(timeText);

        // Venue
        const venueName = normalizeText(
          $flyout.find(".flyoutitem-location-addresstitle").text().replace(/\u00a0/g, " ").trim()
        );

        if (!venueName) return;

        const region = lookupRegion(venueName);

        const dedupeKey = `${date}|${start}|${venueName}|${artistName}`;
        if (seen.has(dedupeKey)) {
          return; // Already captured in Pass 1
        }
        seen.add(dedupeKey);

        events.push({
          date,
          startTime: start,
          endTime: end,
          region,
          venueName,
          artistName,
          artistUrl: eventUrl,
        });
      });
    });

    const calOnlyCount = events.length - seen.size + seen.size; // total
    console.log(`Pass 2 (calendar HTML): ${events.length} total events after merge`);
  } catch (err) {
    console.warn(`Calendar HTML scrape failed: ${err}`);
  }

  if (events.length === 0) {
    console.warn(
      "No events found. The Jazz Institute of Chicago site structure may have changed. " +
      "Check https://www.jazzinchicago.org/calendar manually."
    );
  }

  console.log(`Scraped ${events.length} events from jazzinchicago.org`);
  return events;
}

// --- CLI runner ---

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const push = args.includes("--push");

  (async () => {
    const events = await scrapeChicago();

    console.log(`\nSample events:`);
    console.log(JSON.stringify(events.slice(0, 5), null, 2));

    if (push && !dryRun) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, "chicago");

      const { config } = await import("dotenv");
      config();

      const { pushToSupabase, cleanupStaleEvents } = await import("./push-to-db");
      const stats = await pushToSupabase(normalized, "chicago");
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
      const normalized = normalizeScrapedData(events, "chicago");
      console.log(`\nDry run complete. Use --push to write to Supabase.`);
      if (normalized.rejected.length > 0) {
        console.log(`Would reject ${normalized.rejected.length} events.`);
      }
    } else {
      console.log(`\nScrape only. Use --dry-run to normalize or --push to write to DB.`);
    }
  })().catch(console.error);
}
