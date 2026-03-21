import { isAllowedByRobots } from "./check-robots";

// =============================================================================
// CapitalBop D.C. Jazz Calendar Scraper
// Source: https://www.capitalbop.com/wp-json/capitalbop/v1/events
//
// CapitalBop is DC's primary jazz blog and calendar aggregator. Their calendar
// is JS-rendered (Vue app), but backed by a clean WordPress REST API.
//
// API endpoint:
//   GET /wp-json/capitalbop/v1/events?all=1&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
//
// Response shape:
//   {
//     events: [{
//       id: number,
//       event_id: number,
//       name: string,                    // artist/event name
//       start_date: "YYYY-MM-DD",
//       start_time: "HH:MM:SS",          // 24h format
//       start_time_display: string,       // e.g. "8pm"
//       venue: {
//         term_id: number,
//         name: string,
//         slug: string,
//       },
//       venue_detail: {
//         address: string | null,
//         geolocation: { address: string } | null,
//       },
//       neighborhoods: [{
//         name: string,                   // e.g. "Georgetown/Dupont Circle"
//         parent: number,                 // 0 = top-level (DC/MD/VA)
//       }],
//       ticket_link: { url: string } | null,
//       musicians_website: string | null,
//       cb_pick: boolean,
//       cb_show: boolean,
//     }],
//     max_pages: number
//   }
//
// Neighborhoods are hierarchical:
//   - Top-level: "District of Columbia", "Maryland", "Virginia"
//   - Mid-level: "Northwest", "Northeast", "Southwest", quadrants
//   - Leaf-level: "Georgetown/Dupont Circle", "U Street Corridor", "Shaw", etc.
//
// Run with: npx tsx scraper/scrape-dc.ts
// =============================================================================

function normalizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

// --- Region mapping for DC neighborhoods ---
// The API returns hierarchical neighborhoods. We map the most specific
// (leaf-level) neighborhood to a region. If no leaf matches, we fall back
// to the mid-level quadrant or the venue name.

const NEIGHBORHOOD_REGION_MAP: Record<string, string> = {
  // Northwest DC neighborhoods
  "u street corridor": "U Street",
  "shaw": "U Street",
  "columbia heights": "U Street",
  "adams morgan": "Adams Morgan",
  "mount pleasant": "Adams Morgan",
  "georgetown/dupont circle": "Georgetown",
  "georgetown": "Georgetown",
  "dupont circle": "Georgetown",
  "the palisades": "Georgetown",
  "upper northwest": "Upper NW",
  "berkley": "Upper NW",
  "takoma": "Takoma",
  "downtown": "Downtown",

  // Northeast DC
  "h street": "Capitol Hill",
  "noma": "Capitol Hill",

  // Capitol Hill / Southeast
  "capitol hill": "Capitol Hill",

  // Southwest DC
  "southwest": "Southwest",

  // Virginia suburbs
  "alexandria": "Virginia",
  "arlington": "Virginia",
  "chantilly": "Virginia",
  "fairfax": "Virginia",
  "falls church": "Virginia",
  "reston": "Virginia",
  "ballston": "Virginia",

  // Maryland suburbs
  "bethesda/chevy chase": "Maryland",
  "silver spring": "Maryland",
  "rockville/north bethesda": "Maryland",
  "montgomery county": "Maryland",
  "prince george's county": "Maryland",
  "greenbelt": "Maryland",
  "hyattsville": "Maryland",
  "college park": "Maryland",
};

// Fallback: map venue names to regions for venues not covered by neighborhoods
const VENUE_REGION_MAP: Record<string, string> = {
  "blues alley": "Georgetown",
  "the hamilton": "Downtown",
  "kennedy center": "Georgetown",
  "the kennedy center": "Georgetown",
  "city winery": "Capitol Hill",
  "the anthem": "Southwest",
  "union stage": "Southwest",
  "pearl street warehouse": "Southwest",
  "jojo restaurant and bar": "U Street",
  "twins jazz": "U Street",
  "hr-57": "U Street",
  "bohemian caverns": "U Street",
  "the howard theatre": "U Street",
  "the lincoln theatre": "U Street",
  "takoma station": "Takoma",
  "lost generation brewing": "Capitol Hill",
  "the kreeger museum": "Upper NW",
  "kramerbooks & afterwords": "Georgetown",
  "mr. henry's": "Capitol Hill",
  "dacha beer garden": "U Street",
  "flash": "U Street",
  "songbyrd": "Adams Morgan",
  "the pie shop": "Capitol Hill",
  "capital turnaround": "Capitol Hill",
  "the music center at strathmore": "Maryland",
  "strathmore": "Maryland",
  "an die musik live": "Maryland",
  "the birchmere": "Virginia",
  "jammin java": "Virginia",
  "laPortas": "Virginia",
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

interface CapitalBopEvent {
  id: number;
  event_id: number;
  name: string;
  start_date: string;
  start_time: string;
  start_time_display: string;
  start_time_display_short: string;
  venue: {
    term_id: number;
    name: string;
    slug: string;
  } | null;
  venue_detail: {
    address: string | null;
    geolocation: { address: string } | null;
  } | null;
  neighborhoods: {
    name: string;
    parent: number;
    slug: string;
  }[];
  ticket_link: { url: string; title: string; target: string } | null;
  musicians_website: string | null;
  cb_pick: boolean;
  cb_show: boolean;
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

  // Range: "8:00 PM - 11:00 PM"
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

  // Single: "8:00 PM" or "8pm"
  const singleMatch = cleaned.match(/(\d{1,2}(?::\d{2})?)\s*(AM|PM)/);
  if (singleMatch) {
    return { start: to24h(singleMatch[1], singleMatch[2]) };
  }

  return { start: "00:00" };
}

// --- Date parsing ---

function parseDateHeading(text: string): string {
  const cleaned = text.trim();

  // "Month Day, Year" or "Weekday, Month Day, Year"
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

  // "YYYY-MM-DD" (ISO format, which the API uses)
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

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

function lookupRegion(venueName: string, neighborhoods: { name: string; parent: number }[]): string {
  // First: try to match on the most specific neighborhood (highest parent ID = deepest)
  const sorted = [...neighborhoods]
    .filter(n => n.parent > 0)
    .sort((a, b) => b.parent - a.parent);

  for (const hood of sorted) {
    const key = normalizeText(hood.name).toLowerCase().trim();
    if (NEIGHBORHOOD_REGION_MAP[key]) {
      return NEIGHBORHOOD_REGION_MAP[key];
    }
  }

  // Second: try venue name
  const lowerVenue = normalizeText(venueName).toLowerCase().trim();

  if (VENUE_REGION_MAP[lowerVenue]) return VENUE_REGION_MAP[lowerVenue];

  // Partial match on venue name
  for (const [key, region] of Object.entries(VENUE_REGION_MAP)) {
    if (lowerVenue.includes(key) || key.includes(lowerVenue)) {
      return region;
    }
  }

  // Third: check if it's in MD or VA (top-level neighborhoods)
  const topLevel = neighborhoods.find(n => n.parent === 0);
  if (topLevel) {
    const name = topLevel.name.toLowerCase();
    if (name === "maryland") return "Maryland";
    if (name === "virginia") return "Virginia";
  }

  return "";
}

// --- Main scraper ---

export async function scrapeDC(): Promise<ScrapedEvent[]> {
  const baseUrl = "https://www.capitalbop.com";
  const ua = "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

  const allowed = await isAllowedByRobots(
    `${baseUrl}/wp-json/capitalbop/v1/events`,
    ua
  );
  if (!allowed) {
    console.warn(`Blocked by robots.txt: ${baseUrl}`);
    return [];
  }

  // Fetch events for the next 14 days
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14);

  const startStr = today.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const apiUrl = `${baseUrl}/wp-json/capitalbop/v1/events?all=1&start_date=${startStr}&end_date=${endStr}`;

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent": ua,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CapitalBop events API: ${response.status}`);
  }

  const data = await response.json() as { events: CapitalBopEvent[]; max_pages: number };
  const events: ScrapedEvent[] = [];

  for (const evt of data.events) {
    const artistName = normalizeText(evt.name || "").trim();
    if (!artistName) continue;

    const venueName = normalizeText(evt.venue?.name || "").trim();
    if (!venueName) continue;

    // Date comes as "YYYY-MM-DD" from the API
    const date = evt.start_date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    // Time comes as "HH:MM:SS" from the API, extract HH:MM
    let startTime = "00:00";
    if (evt.start_time) {
      const timeParts = evt.start_time.split(":");
      startTime = `${timeParts[0].padStart(2, "0")}:${timeParts[1] || "00"}`;
    }

    const region = lookupRegion(venueName, evt.neighborhoods || []);

    // Build venue URL from ticket link or musician's website
    const venueUrl = evt.ticket_link?.url || undefined;
    const artistUrl = evt.musicians_website || undefined;

    events.push({
      date,
      startTime,
      region,
      venueName,
      venueUrl,
      artistName,
      artistUrl,
    });
  }

  if (events.length === 0) {
    console.warn(
      "No events found. The CapitalBop API may have changed. " +
      "Test: curl 'https://www.capitalbop.com/wp-json/capitalbop/v1/events?all=1&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD'"
    );
  }

  console.log(`Scraped ${events.length} events from capitalbop.com`);
  return events;
}

// --- CLI runner ---

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const push = args.includes("--push");

  (async () => {
    const events = await scrapeDC();

    console.log(`\nSample events:`);
    console.log(JSON.stringify(events.slice(0, 5), null, 2));

    if (push && !dryRun) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, "dc");

      const { config } = await import("dotenv");
      config();

      const { pushToSupabase, cleanupStaleEvents } = await import("./push-to-db");
      const stats = await pushToSupabase(normalized, "dc");
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
      const normalized = normalizeScrapedData(events, "dc");
      console.log(`\nDry run complete. Use --push to write to Supabase.`);
      if (normalized.rejected.length > 0) {
        console.log(`Would reject ${normalized.rejected.length} events.`);
      }
    } else {
      console.log(`\nScrape only. Use --dry-run to normalize or --push to write to DB.`);
    }
  })().catch(console.error);
}
