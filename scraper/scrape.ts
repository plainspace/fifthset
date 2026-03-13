import * as cheerio from "cheerio";
import { slugify } from "../lib/utils";

// Area code to region mapping
const AREA_MAP: Record<string, string> = {
  MT: "Manhattan",
  BK: "Brooklyn",
  BX: "Bronx",
  QN: "Queens",
  SI: "Staten Island",
  NJ: "New Jersey",
  CT: "Connecticut",
  WC: "Westchester",
  LI: "Long Island",
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

function parseTime(timeStr: string): { start: string; end?: string } {
  // Handle formats like "7:00PM", "7:00PM - 11:00PM", "7 & 9:30PM"
  const cleaned = timeStr.trim().toUpperCase();

  // Try range format: "7:00PM - 11:00PM"
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

  // Try single time: "7:00PM"
  const singleMatch = cleaned.match(/(\d{1,2}(?::\d{2})?)\s*(AM|PM)/);
  if (singleMatch) {
    return { start: to24h(singleMatch[1], singleMatch[2]) };
  }

  // Try multiple sets: "7 & 9:30PM"
  const multiMatch = cleaned.match(
    /(\d{1,2}(?::\d{2})?)\s*&\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/
  );
  if (multiMatch) {
    // Return first set time
    return { start: to24h(multiMatch[1], multiMatch[3]) };
  }

  return { start: "00:00" };
}

function to24h(time: string, period: string): string {
  let [hours, minutes] = time.includes(":")
    ? time.split(":").map(Number)
    : [Number(time), 0];

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  // Clamp to valid 24h range
  hours = hours % 24;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function parseDate(dateStr: string): string {
  // Handle MM/DD/YY format
  const match = dateStr.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return "";

  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  let year = match[3];
  if (year.length === 2) year = `20${year}`;

  return `${year}-${month}-${day}`;
}

export async function scrapeJazzNYC(): Promise<ScrapedEvent[]> {
  const response = await fetch("https://jazz-nyc.com/", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch jazz-nyc.com: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // The site uses a table with rows for each event
  $("tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 5) return;

    const dateStr = $(cells[0]).text().trim();
    const timeStr = $(cells[1]).text().trim();
    const areaCode = $(cells[2]).text().trim();
    const venueCell = $(cells[3]);
    const artistCell = $(cells[4]);

    const date = parseDate(dateStr);
    if (!date) return;

    const { start, end } = parseTime(timeStr);
    const region = AREA_MAP[areaCode] || areaCode.toLowerCase();

    const venueName = venueCell.text().replace(/\u00a0/g, " ").trim();
    const venueLink = venueCell.find("a").attr("href");
    const artistName = artistCell.text().replace(/\u00a0/g, " ").trim();
    const artistLink = artistCell.find("a").attr("href");

    if (!venueName || !artistName) return;

    events.push({
      date,
      startTime: start,
      endTime: end,
      region,
      venueName,
      venueUrl: venueLink || undefined,
      artistName,
      artistUrl: artistLink || undefined,
    });
  });

  console.log(`Scraped ${events.length} events from jazz-nyc.com`);
  return events;
}

// Run directly with: npm run scrape
// Flags:
//   --dry-run    Scrape and normalize but don't push to DB
//   --push       Scrape, normalize, and push to Supabase
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const push = args.includes("--push");

  (async () => {
    const { normalizeScrapedData } = await import("./normalize");
    const events = await scrapeJazzNYC();
    const normalized = normalizeScrapedData(events, "nyc");

    console.log(`\nSample events:`);
    console.log(JSON.stringify(events.slice(0, 3), null, 2));

    if (push && !dryRun) {
      // Load .env for local runs
      const { config } = await import("dotenv");
      config();

      const { pushToSupabase } = await import("./push-to-db");
      await pushToSupabase(normalized, "nyc");

      // Geocode any new venues
      const { geocodeNewVenues } = await import("./geocode");
      await geocodeNewVenues(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    } else {
      console.log(`\nDry run complete. Use --push to write to Supabase.`);
    }
  })().catch(console.error);
}
