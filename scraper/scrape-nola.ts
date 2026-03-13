import * as cheerio from "cheerio";

// =============================================================================
// WWOZ Livewire Scraper for New Orleans
// Source: https://www.wwoz.org/livewire
//
// SELECTORS THAT MAY NEED ADJUSTMENT AFTER TESTING:
//
//   DATE_HEADING_SELECTOR  ... the element containing the date for a group of events
//   EVENT_ROW_SELECTOR     ... each individual event listing
//   VENUE_SELECTOR         ... venue name within an event row
//   ARTIST_SELECTOR        ... artist/band name within an event row
//   TIME_SELECTOR          ... showtime within an event row
//   GENRE_SELECTOR         ... genre tag (optional, not used for output)
//
// Run with: npx tsx scraper/scrape-nola.ts
// =============================================================================

// --- Selectors (tune these after inspecting the live page) ---

const DATE_HEADING_SELECTOR = ".livewire-date, h3.date-header, .views-group-header";
const EVENT_ROW_SELECTOR = ".livewire-listing, .views-row, .livewire_listing";
const VENUE_SELECTOR = ".livewire-venue, .venue-name, .views-field-venue";
const ARTIST_SELECTOR = ".livewire-artist, .artist-name, .views-field-artist";
const TIME_SELECTOR = ".livewire-time, .event-time, .views-field-time";

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
  const response = await fetch("https://www.wwoz.org/livewire", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch wwoz.org/livewire: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // Strategy 1: Events grouped under date headings
  // Each date heading is followed by a set of event rows
  let currentDate = "";

  // Try to find date-grouped structure first
  const dateHeadings = $(DATE_HEADING_SELECTOR);

  if (dateHeadings.length > 0) {
    dateHeadings.each((_, heading) => {
      const dateText = $(heading).text();
      // Also check for a datetime attribute
      const dateAttr = $(heading).attr("datetime") || $(heading).attr("data-date") || "";
      currentDate = dateAttr ? parseDateHeading(dateAttr) : parseDateHeading(dateText);

      if (!currentDate) return;

      // Get all event rows following this heading until the next heading
      const eventRows = $(heading).nextUntil(DATE_HEADING_SELECTOR, EVENT_ROW_SELECTOR);

      eventRows.each((_, row) => {
        const event = parseEventRow($, row, currentDate);
        if (event) events.push(event);
      });
    });
  }

  // Strategy 2: If no date headings found, try a flat list where each row has its own date
  if (events.length === 0) {
    $(EVENT_ROW_SELECTOR).each((_, row) => {
      // Look for a date within the row itself
      const dateEl = $(row).find(".date, .event-date, time");
      const dateText = dateEl.attr("datetime") || dateEl.text();
      const date = parseDateHeading(dateText);

      if (!date) return;

      const event = parseEventRow($, row, date);
      if (event) events.push(event);
    });
  }

  // Strategy 3: If still nothing, try parsing a table structure
  if (events.length === 0) {
    console.warn(
      "No events found with primary selectors. " +
      "The WWOZ livewire HTML structure may have changed. " +
      "Inspect the page and update selectors at the top of scrape-nola.ts."
    );
  }

  console.log(`Scraped ${events.length} events from wwoz.org/livewire`);
  return events;
}

function parseEventRow(
  $: cheerio.CheerioAPI,
  row: cheerio.Element,
  date: string
): ScrapedEvent | null {
  const $row = $(row);

  // Extract venue
  const venueEl = $row.find(VENUE_SELECTOR);
  const venueName = venueEl.text().replace(/\u00a0/g, " ").trim();
  const venueLink = venueEl.find("a").attr("href") || venueEl.closest("a").attr("href");
  const venueUrl = venueLink
    ? venueLink.startsWith("http") ? venueLink : `https://www.wwoz.org${venueLink}`
    : undefined;

  // Extract artist
  const artistEl = $row.find(ARTIST_SELECTOR);
  const artistName = artistEl.text().replace(/\u00a0/g, " ").trim();
  const artistLink = artistEl.find("a").attr("href") || artistEl.closest("a").attr("href");
  const artistUrl = artistLink
    ? artistLink.startsWith("http") ? artistLink : `https://www.wwoz.org${artistLink}`
    : undefined;

  // Extract time
  const timeEl = $row.find(TIME_SELECTOR);
  const timeText = timeEl.text().trim();

  if (!venueName || !artistName) return null;

  const { start, end } = parseTime(timeText);
  const region = lookupRegion(venueName);

  return {
    date,
    startTime: start,
    endTime: end,
    region,
    venueName,
    venueUrl,
    artistName,
    artistUrl,
  };
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
