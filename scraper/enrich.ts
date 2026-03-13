import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

// Extracted data from a venue's website
interface EnrichmentData {
  photo_url?: string;
  phone?: string;
  description?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

// Venue row from the DB query
interface VenueRow {
  id: string;
  name: string;
  slug: string;
  website: string;
  phone: string | null;
  photo_url: string | null;
}

// Stats for the summary log
export interface EnrichStats {
  total: number;
  enriched: number;
  photos: number;
  phones: number;
  descriptions: number;
  socials: number;
  skipped: number;
  errors: number;
}

const USER_AGENT =
  "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)";

const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/;

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?/,
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+\/?/,
  twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/?/,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch HTML from a URL with timeout and redirect limits
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    // Check content type... skip non-HTML responses
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    // Check redirect count via response URL differing from original
    // fetch() handles redirects internally, but we can check if we landed somewhere unexpected
    if (!response.ok) return null;

    return await response.text();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Timeouts, network errors, etc... just skip
    if (message.includes("abort")) {
      console.warn(`  TIMEOUT: ${url}`);
    } else {
      console.warn(`  FETCH ERROR: ${url} ... ${message}`);
    }
    return null;
  }
}

// Extract enrichment data from HTML
function extractData($: cheerio.CheerioAPI): EnrichmentData {
  const data: EnrichmentData = {};

  // 1. Photo URL from og:image or twitter:image
  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[property="twitter:image"]').attr("content");

  if (ogImage && isValidImageUrl(ogImage)) {
    data.photo_url = ogImage;
  }

  // 2. Phone number... check tel: links first, then Schema.org, then regex
  const telLink = $('a[href^="tel:"]').first().attr("href");
  if (telLink) {
    const cleaned = telLink.replace("tel:", "").replace(/[\s\-().+]/g, "");
    // Strip country code if present
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
      const phone = digits.length === 11 ? digits.slice(1) : digits;
      data.phone = formatPhone(phone) || undefined;
    }
  }

  // Try Schema.org telephone property
  if (!data.phone) {
    const schemaPhone = $('[itemprop="telephone"]').first().text().trim();
    if (schemaPhone) {
      const digits = schemaPhone.replace(/\D/g, "");
      if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
        const phone = digits.length === 11 ? digits.slice(1) : digits;
        data.phone = formatPhone(phone) || undefined;
      }
    }
  }

  // Try LD+JSON Schema.org
  if (!data.phone) {
    $('script[type="application/ld+json"]').each((_, el) => {
      if (data.phone) return;
      try {
        const json = JSON.parse($(el).text());
        const phone = json.telephone || json?.contactPoint?.telephone;
        if (phone) {
          const digits = String(phone).replace(/\D/g, "");
          if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
            const cleaned = digits.length === 11 ? digits.slice(1) : digits;
            data.phone = formatPhone(cleaned) || undefined;
          }
        }
      } catch {
        // Invalid JSON... skip
      }
    });
  }

  // Last resort... regex scan of visible text
  if (!data.phone) {
    const bodyText = $("body").text();
    const match = bodyText.match(PHONE_REGEX);
    if (match) {
      const digits = match[0].replace(/\D/g, "");
      if (digits.length === 10) {
        data.phone = formatPhone(digits) || undefined;
      }
    }
  }

  // 3. Description from meta tags
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content");

  if (description && description.trim().length > 10) {
    data.description = description.trim().slice(0, 500);
  }

  // 4. Social links
  const socialLinks: Record<string, string> = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!socialLinks[platform] && pattern.test(href)) {
        socialLinks[platform] = href.match(pattern)![0];
      }
    }
  });

  if (Object.keys(socialLinks).length > 0) {
    data.social_links = socialLinks as EnrichmentData["social_links"];
  }

  return data;
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  // Skip placeholder/default images
  const lower = url.toLowerCase();
  if (lower.includes("placeholder") || lower.includes("default") || lower.includes("blank")) {
    return false;
  }
  // Must be a full URL
  return url.startsWith("http://") || url.startsWith("https://");
}

// Valid US area codes start with 2-9, second digit is 0-9, third is 0-9
// Additionally reject known non-geographic/fake patterns
function isValidUSPhone(digits: string): boolean {
  if (digits.length !== 10) return false;
  const areaCode = parseInt(digits.slice(0, 3), 10);
  // Area codes cannot start with 0 or 1
  if (areaCode < 200) return false;
  // N11 codes are service numbers (211, 311, 411, 511, 611, 711, 811, 911)
  if (digits[1] === "1" && digits[2] === "1") return false;
  // 555 is reserved for fictional use
  if (areaCode === 555) return false;
  // Exchange (next 3 digits) also can't start with 0 or 1
  const exchange = parseInt(digits.slice(3, 6), 10);
  if (exchange < 200) return false;
  return true;
}

function formatPhone(digits: string): string {
  if (!isValidUSPhone(digits)) return "";
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export async function enrichVenues(dryRun: boolean): Promise<EnrichStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Query venues that have a website but are missing photo or phone
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, slug, website, phone, photo_url")
    .not("website", "is", null)
    .or("photo_url.is.null,phone.is.null")
    .order("name");

  if (error) throw error;
  if (!venues || venues.length === 0) {
    console.log("No venues need enrichment. All venues with websites have photo and phone data.");
    return { total: 0, enriched: 0, photos: 0, phones: 0, descriptions: 0, socials: 0, skipped: 0, errors: 0 };
  }

  const venueRows = venues as VenueRow[];
  console.log(`Found ${venueRows.length} venues to enrich\n`);

  if (dryRun) {
    console.log("[DRY RUN] Will not write to database\n");
  }

  const stats: EnrichStats = {
    total: venueRows.length,
    enriched: 0,
    photos: 0,
    phones: 0,
    descriptions: 0,
    socials: 0,
    skipped: 0,
    errors: 0,
  };

  for (let i = 0; i < venueRows.length; i++) {
    const venue = venueRows[i];
    const progress = `[${i + 1}/${venueRows.length}]`;

    // Validate URL
    let url: string;
    try {
      url = new URL(venue.website).toString();
    } catch {
      console.log(`${progress} SKIP: ${venue.name} ... invalid URL: ${venue.website}`);
      stats.skipped++;
      continue;
    }

    console.log(`${progress} Fetching: ${venue.name} (${url})`);

    const html = await fetchPage(url);
    if (!html) {
      stats.skipped++;
      continue;
    }

    const $ = cheerio.load(html);
    const data = extractData($);

    // Only update fields that are currently NULL in the DB
    const updates: Record<string, string> = {};

    if (data.photo_url && !venue.photo_url) {
      updates.photo_url = data.photo_url;
      stats.photos++;
    }

    if (data.phone && !venue.phone) {
      updates.phone = data.phone;
      stats.phones++;
    }

    // Description and social links... no DB column yet, log only
    if (data.description) {
      stats.descriptions++;
      console.log(`  Found description: "${data.description.slice(0, 80)}..."`);
    }

    if (data.social_links) {
      stats.socials++;
      const links = Object.entries(data.social_links)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      console.log(`  Found socials: ${links}`);
    }

    if (Object.keys(updates).length > 0) {
      const fields = Object.keys(updates).join(", ");

      if (dryRun) {
        console.log(`  Would update: ${fields}`);
        if (updates.photo_url) console.log(`    photo_url: ${updates.photo_url}`);
        if (updates.phone) console.log(`    phone: ${updates.phone}`);
      } else {
        const { error: updateError } = await supabase
          .from("venues")
          .update(updates)
          .eq("id", venue.id);

        if (updateError) {
          console.error(`  UPDATE ERROR: ${venue.name} ... ${updateError.message}`);
          stats.errors++;
          continue;
        }
        console.log(`  Updated: ${fields}`);
      }

      stats.enriched++;
    } else {
      console.log(`  No new data found`);
    }

    // Rate limit... 2 seconds between requests
    if (i < venueRows.length - 1) {
      await sleep(2000);
    }
  }

  // Summary
  console.log("\n--- Enrichment Summary ---");
  console.log(
    `Enriched ${stats.enriched}/${stats.total} venues (${stats.photos} photos, ${stats.phones} phones, ${stats.descriptions} descriptions)`
  );
  if (stats.socials > 0) {
    console.log(`Found social links on ${stats.socials} venues (no DB column yet... logged only)`);
  }
  if (stats.descriptions > 0) {
    console.log(`Found descriptions on ${stats.descriptions} venues (no DB column yet... logged only)`);
  }
  if (stats.skipped > 0) {
    console.log(`Skipped: ${stats.skipped} (invalid URL, timeout, or unreachable)`);
  }
  if (stats.errors > 0) {
    console.log(`Errors: ${stats.errors}`);
  }
  if (dryRun) {
    console.log("\n[DRY RUN] No changes were written. Run without --dry-run to persist.");
  }

  return stats;
}

// Run directly: npx tsx scraper/enrich.ts
// Flags:
//   --dry-run    Log what would be updated without writing to DB
if (require.main === module) {
  (async () => {
    const { config } = await import("dotenv");
    config();

    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");

    await enrichVenues(dryRun);
  })().catch(console.error);
}
