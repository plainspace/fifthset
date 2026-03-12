import { createClient } from "@supabase/supabase-js";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

function buildAddress(addr: NominatimResult["address"]): string {
  if (!addr) return "";
  const parts: string[] = [];
  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`);
  } else if (addr.road) {
    parts.push(addr.road);
  }
  if (addr.city || addr.suburb) {
    parts.push(addr.city || addr.suburb || "");
  }
  if (addr.state) parts.push(addr.state);
  if (addr.postcode) parts.push(addr.postcode);
  return parts.filter(Boolean).join(", ");
}

async function queryNominatim(query: string): Promise<NominatimResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=us`;
  const response = await fetch(url, {
    headers: { "User-Agent": "FifthSet/1.0 (jazz venue geocoder)" },
  });
  if (!response.ok) return null;
  const results: NominatimResult[] = await response.json();
  return results.length > 0 ? results[0] : null;
}

// Strip embedded addresses from venue names like "Arturo's 106 W Houston St"
function cleanVenueName(name: string): string {
  // Remove trailing address-like patterns (number + street)
  return name
    .replace(/\s+\d+\s+(W|E|N|S|West|East|North|South)\s+.+$/i, "")
    .replace(/\s+\d+\s+(Broadway|Ave|St|Street|Avenue|Blvd|Road|Rd|Place|Pl|Dr|Drive|Way|Ln|Lane)\b.*/i, "")
    .replace(/\s*[-–,]\s*\d+.*$/, "")
    .trim();
}

async function geocodeVenue(
  name: string,
  region: string
): Promise<{ lat: number; lng: number; address: string; neighborhood: string } | null> {
  // Strategy 1: Full venue name + NYC
  let result = await queryNominatim(`${name}, New York City, NY`);

  // Strategy 2: If name has embedded address, try extracting it
  if (!result && /\d+\s+(W|E|N|S|West|East)\s+/i.test(name)) {
    const addrMatch = name.match(/(\d+\s+(?:W|E|N|S|West|East)\s+\S+(?:\s+\S+)?)/i);
    if (addrMatch) {
      await sleep(1100);
      result = await queryNominatim(`${addrMatch[1]}, New York, NY`);
    }
  }

  // Strategy 3: Clean name (strip address from name) + NYC
  if (!result) {
    const cleaned = cleanVenueName(name);
    if (cleaned !== name && cleaned.length > 2) {
      await sleep(1100);
      result = await queryNominatim(`${cleaned}, New York City, NY`);
    }
  }

  // Strategy 4: Try as a bar/restaurant/club
  if (!result) {
    const cleaned = cleanVenueName(name);
    await sleep(1100);
    result = await queryNominatim(`${cleaned} bar, Manhattan, New York`);
  }

  if (!result) return null;

  const addr = result.address;
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    address: buildAddress(addr),
    neighborhood: addr?.neighbourhood || addr?.suburb || region,
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Geocode all venues missing coordinates in Supabase
export async function geocodeNewVenues(supabaseUrl: string, serviceKey: string) {
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, slug, neighborhood, lat, lng")
    .is("lat", null)
    .order("name");

  if (error) throw error;
  if (!venues || venues.length === 0) {
    console.log("All venues already have coordinates.");
    return;
  }

  console.log(`Geocoding ${venues.length} venues...\n`);

  let success = 0;
  let failed = 0;

  for (const venue of venues) {
    const result = await geocodeVenue(venue.name, venue.neighborhood || "");

    if (result) {
      const { error: updateError } = await supabase
        .from("venues")
        .update({
          lat: result.lat,
          lng: result.lng,
          address: result.address,
          neighborhood: result.neighborhood,
        })
        .eq("id", venue.id);

      if (updateError) {
        console.error(`  FAIL: ${venue.name} - ${updateError.message}`);
        failed++;
      } else {
        console.log(`  OK: ${venue.name} → ${result.address} (${result.lat}, ${result.lng})`);
        success++;
      }
    } else {
      console.log(`  MISS: ${venue.name} - no results`);
      failed++;
    }

    // Nominatim rate limit: 1 request per second
    await sleep(1100);
  }

  console.log(`\nDone: ${success} geocoded, ${failed} failed/missed`);
}

// Run standalone: npm run geocode
if (require.main === module) {
  (async () => {
    const { config } = await import("dotenv");
    config();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase env vars");
    }

    await geocodeNewVenues(supabaseUrl, serviceKey);
  })().catch(console.error);
}
