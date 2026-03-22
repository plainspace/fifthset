import { isAllowedByRobots } from "./check-robots";

// =============================================================================
// Eventbrite Jazz Events Scraper (All Cities)
//
// Source: https://www.eventbrite.com/d/{state}--{city}/jazz/
//
// Strategy: Fetch the search results page and extract JSON-LD structured data.
// Each page contains up to 20 events in a JSON-LD ItemList with full event
// details including venue, address, geo coordinates, and dates.
//
// JSON-LD structure:
//   { itemListElement: [{ @type: "ListItem", item: {
//       @type: "Event",
//       name: "Artist / Event Name",
//       startDate: "YYYY-MM-DD",
//       endDate: "YYYY-MM-DD",
//       location: {
//         @type: "Place",
//         name: "Venue Name",
//         address: {
//           streetAddress, addressLocality, addressRegion, postalCode
//         },
//         geo: { latitude, longitude }
//       }
//   }}]}
//
// Pagination: ?page=N (20 events per page)
// Rate limiting: 1 second delay between page fetches
//
// Run with: npx tsx scraper/scrape-eventbrite.ts --city=nyc
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

// --- City configuration ---
// Maps our city slugs to Eventbrite URL paths

interface EventbriteCity {
  slug: string;
  ebPath: string; // e.g. "ny--new-york"
  maxPages: number;
}

const EVENTBRITE_CITIES: EventbriteCity[] = [
  { slug: "nyc", ebPath: "ny--new-york", maxPages: 5 },
  { slug: "nola", ebPath: "la--new-orleans", maxPages: 3 },
  { slug: "chicago", ebPath: "il--chicago", maxPages: 5 },
  { slug: "dc", ebPath: "dc--washington", maxPages: 5 },
  { slug: "philly", ebPath: "pa--philadelphia", maxPages: 3 },
  { slug: "la", ebPath: "ca--los-angeles", maxPages: 5 },
  { slug: "sf", ebPath: "ca--san-francisco", maxPages: 3 },
];

// --- Region mapping by city ---
// Maps addressLocality or venue name to a region within each city

const REGION_MAPS: Record<string, Record<string, string>> = {
  nyc: {
    "manhattan": "Manhattan",
    "new york": "Manhattan",
    "brooklyn": "Brooklyn",
    "queens": "Queens",
    "bronx": "Bronx",
    "the bronx": "Bronx",
    "staten island": "Staten Island",
    "jersey city": "Tri-State",
    "hoboken": "Tri-State",
    "yonkers": "Tri-State",
    "white plains": "Tri-State",
    "newark": "Tri-State",
  },
  nola: {
    "new orleans": "",
    "french quarter": "French Quarter",
    "marigny": "Marigny",
    "bywater": "Marigny",
    "treme": "Tremé",
    "central business district": "CBD",
    "uptown": "Uptown",
    "mid-city": "Mid-City",
  },
  chicago: {
    "chicago": "",
    "south side": "South Side",
    "west side": "West Side",
    "north side": "North Side",
    "loop": "The Loop",
  },
  dc: {
    "washington": "",
    "georgetown": "Georgetown",
    "dupont circle": "Georgetown",
    "adams morgan": "Adams Morgan",
    "columbia heights": "U Street",
    "shaw": "U Street",
    "capitol hill": "Capitol Hill",
    "arlington": "Virginia",
    "alexandria": "Virginia",
    "bethesda": "Maryland",
    "silver spring": "Maryland",
    "college park": "Maryland",
  },
  philly: {
    "philadelphia": "",
    "center city": "Center City",
    "old city": "Old City",
    "south philadelphia": "South Philly",
    "west philadelphia": "West Philly",
    "north philadelphia": "North Philly",
    "germantown": "Germantown",
    "university city": "University City",
  },
  la: {
    "los angeles": "",
    "hollywood": "Hollywood",
    "west hollywood": "Hollywood",
    "downtown los angeles": "Downtown",
    "dtla": "Downtown",
    "leimert park": "Leimert Park",
    "santa monica": "Santa Monica",
    "venice": "Santa Monica",
    "culver city": "Culver City",
    "pasadena": "Pasadena",
    "south pasadena": "Pasadena",
    "long beach": "Long Beach",
    "inglewood": "South LA",
    "compton": "South LA",
  },
  sf: {
    "san francisco": "",
    "fillmore": "Fillmore",
    "north beach": "North Beach",
    "soma": "SoMa",
    "south of market": "SoMa",
    "mission": "Mission",
    "oakland": "Oakland",
    "berkeley": "East Bay",
    "emeryville": "East Bay",
  },
};

function lookupRegion(citySlug: string, locality: string, venueName: string): string {
  const regionMap = REGION_MAPS[citySlug] || {};
  const lower = locality.toLowerCase().trim();

  // Direct match on locality
  if (regionMap[lower] !== undefined) return regionMap[lower];

  // Partial match on locality
  for (const [key, region] of Object.entries(regionMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return region;
    }
  }

  // Try venue name
  const lowerVenue = venueName.toLowerCase().trim();
  for (const [key, region] of Object.entries(regionMap)) {
    if (lowerVenue.includes(key)) {
      return region;
    }
  }

  return "";
}

// --- Types ---

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

interface JsonLdEvent {
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  url?: string;
  location?: {
    name?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
    };
    geo?: {
      latitude?: string | number;
      longitude?: string | number;
    };
  };
}

// --- Scraper ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeEventbritePage(
  url: string,
  ua: string
): Promise<JsonLdEvent[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": ua },
  });

  if (!response.ok) {
    console.warn(`Eventbrite returned ${response.status} for ${url}`);
    return [];
  }

  const html = await response.text();
  const events: JsonLdEvent[] = [];

  // Extract JSON-LD blocks
  const ldRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data.itemListElement && Array.isArray(data.itemListElement)) {
        for (const item of data.itemListElement) {
          const evt = item.item || item;
          if (evt["@type"] === "Event" && evt.name && evt.startDate) {
            events.push(evt as JsonLdEvent);
          }
        }
      }
    } catch {
      // Skip malformed JSON-LD
    }
  }

  return events;
}

export async function scrapeEventbrite(citySlug: string): Promise<ScrapedEvent[]> {
  const cityConfig = EVENTBRITE_CITIES.find((c) => c.slug === citySlug);
  if (!cityConfig) {
    console.warn(`No Eventbrite config for city: ${citySlug}`);
    return [];
  }

  const baseUrl = `https://www.eventbrite.com/d/${cityConfig.ebPath}/jazz/`;
  const ua = "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

  const allowed = await isAllowedByRobots(baseUrl, ua);
  if (!allowed) {
    console.warn(`Blocked by robots.txt: ${baseUrl}`);
    return [];
  }

  const events: ScrapedEvent[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= cityConfig.maxPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;

    const pageEvents = await scrapeEventbritePage(url, ua);
    if (pageEvents.length === 0) break; // No more pages

    for (const evt of pageEvents) {
      const artistName = normalizeText(evt.name || "").trim();
      if (!artistName) continue;

      const venueName = normalizeText(evt.location?.name || "").trim();
      if (!venueName) continue;

      const date = evt.startDate;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const locality = evt.location?.address?.addressLocality || "";
      const region = lookupRegion(citySlug, locality, venueName);

      const eventUrl = evt.url || undefined;

      // Dedupe
      const key = `${date}|${venueName}|${artistName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      events.push({
        date,
        startTime: "20:00", // Eventbrite JSON-LD only has date, not time
        region,
        venueName,
        artistName,
        artistUrl: eventUrl,
      });
    }

    // Rate limit between pages
    if (page < cityConfig.maxPages) {
      await sleep(1000);
    }
  }

  console.log(`Scraped ${events.length} Eventbrite events for ${citySlug}`);
  return events;
}

// All configured city slugs
export function getEventbriteCitySlugs(): string[] {
  return EVENTBRITE_CITIES.map((c) => c.slug);
}

// --- CLI runner ---

if (require.main === module) {
  const args = process.argv.slice(2);
  const cityArg = args.find((a) => a.startsWith("--city="));
  const citySlug = cityArg ? cityArg.split("=")[1] : "nyc";
  const push = args.includes("--push");

  (async () => {
    const events = await scrapeEventbrite(citySlug);

    console.log(`\nSample events:`);
    console.log(JSON.stringify(events.slice(0, 5), null, 2));

    if (push) {
      const { normalizeScrapedData } = await import("./normalize");
      const normalized = normalizeScrapedData(events, citySlug);

      const { config } = await import("dotenv");
      config();

      const { pushToSupabase } = await import("./push-to-db");
      const stats = await pushToSupabase(normalized, citySlug);

      console.log("\n--- Summary ---");
      console.log(`Events: ${stats.eventsInserted} inserted, ${stats.eventsSkipped} skipped`);
      console.log(`Venues: ${stats.venuesUpserted} upserted`);
      console.log(`Artists: ${stats.artistsUpserted} upserted`);
      console.log(`Rejected: ${normalized.rejected.length}`);
    } else {
      console.log(`\nScrape only. Use --push to write to DB.`);
    }
  })().catch(console.error);
}
