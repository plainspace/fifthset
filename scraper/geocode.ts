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

interface GooglePlacesResult {
  places: {
    location: { latitude: number; longitude: number };
    formattedAddress: string;
    displayName: { text: string };
  }[];
}

interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
  source: "nominatim" | "google" | null;
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

async function queryGooglePlaces(
  venueName: string,
  cityName: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const query = `${venueName} ${cityName}`;

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.location,places.formattedAddress,places.displayName",
        },
        body: JSON.stringify({ textQuery: query }),
      }
    );
    if (!response.ok) return null;

    const data: GooglePlacesResult = await response.json();
    if (!data.places?.length) return null;

    const place = data.places[0];
    return {
      lat: place.location.latitude,
      lng: place.location.longitude,
      address: place.formattedAddress,
      neighborhood: "",
      source: "google",
    };
  } catch (err) {
    console.error(`  Google Places error: ${err}`);
    return null;
  }
}

// Strip embedded addresses from venue names like "Arturo's 106 W Houston St"
function cleanVenueName(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/\s+at\s+.+$/i, "")
    .replace(/\s+&\s+.+$/i, "")
    .replace(/\s+\d+\s+(W|E|N|S|West|East|North|South)\s+.+$/i, "")
    .replace(/\s+\d+\s+(Broadway|Ave|St|Street|Avenue|Blvd|Road|Rd|Place|Pl|Dr|Drive|Way|Ln|Lane)\b.*/i, "")
    .replace(/\s*[-–,]\s*\d+.*$/, "")
    .trim();
}

async function geocodeVenue(
  name: string,
  region: string,
  cityName: string = "New York City, NY"
): Promise<GeocodeResult | null> {
  // Strategy 1: Full venue name + city
  let result = await queryNominatim(`${name}, ${cityName}`);

  // Strategy 2: If name has embedded address, try extracting it
  if (!result && /\d+\s+(W|E|N|S|West|East)\s+/i.test(name)) {
    const addrMatch = name.match(/(\d+\s+(?:W|E|N|S|West|East)\s+\S+(?:\s+\S+)?)/i);
    if (addrMatch) {
      await sleep(1100);
      result = await queryNominatim(`${addrMatch[1]}, ${cityName}`);
    }
  }

  // Strategy 3: Clean name (strip address from name) + city
  if (!result) {
    const cleaned = cleanVenueName(name);
    if (cleaned !== name && cleaned.length > 2) {
      await sleep(1100);
      result = await queryNominatim(`${cleaned}, ${cityName}`);
    }
  }

  // Strategy 4: Try as a bar/restaurant/club
  if (!result) {
    const cleaned = cleanVenueName(name);
    await sleep(1100);
    // Extract the main city name for borough-level queries
    const mainCity = cityName.split(",")[0].trim();
    result = await queryNominatim(`${cleaned} bar, ${mainCity}`);
  }

  // Strategy 5: Try with borough/region
  if (!result) {
    const cleaned = cleanVenueName(name);
    const borough = region || "";
    if (borough) {
      await sleep(1100);
      const mainCity = cityName.split(",")[0].trim();
      result = await queryNominatim(`${cleaned}, ${borough}, ${mainCity}`);
    }
  }

  // Strategy 6: Try with "jazz" qualifier
  if (!result) {
    const cleaned = cleanVenueName(name);
    await sleep(1100);
    const mainCity = cityName.split(",")[0].trim();
    result = await queryNominatim(`${cleaned} jazz, ${mainCity}`);
  }

  // Strategy 7: First word + "jazz club"
  if (!result) {
    const firstName = cleanVenueName(name).split(/\s+/)[0];
    if (firstName.length > 3) {
      await sleep(1100);
      const mainCity = cityName.split(",")[0].trim();
      result = await queryNominatim(`${firstName} jazz club, ${mainCity}`);
    }
  }

  // Nominatim succeeded
  if (result) {
    const addr = result.address;
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: buildAddress(addr),
      neighborhood: addr?.neighbourhood || addr?.suburb || region,
      source: "nominatim",
    };
  }

  // Fallback: Google Places Text Search (only if API key is configured)
  const googleResult = await queryGooglePlaces(name, cityName);
  if (googleResult) {
    // Preserve the region as neighborhood since Google doesn't provide one
    googleResult.neighborhood = region || "";
    // Respect rate limiting... brief pause between providers
    await sleep(500);
    return googleResult;
  }

  return null;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Geocode all venues missing coordinates in Supabase
export async function geocodeNewVenues(supabaseUrl: string, serviceKey: string) {
  const supabase = createClient(supabaseUrl, serviceKey);

  // Skip venues that already have coordinates or were manually geocoded
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, slug, neighborhood, lat, lng, geocode_source, city:cities(name)")
    .is("lat", null)
    .or("geocode_source.is.null,geocode_source.neq.manual")
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
    // Resolve city name for geocoding queries
    const CITY_GEOCODE_NAMES: Record<string, string> = {
      "New York City": "New York City, NY",
      "Chicago": "Chicago, IL",
      "New Orleans": "New Orleans, LA",
      "Los Angeles": "Los Angeles, CA",
      "San Francisco": "San Francisco, CA",
    };
    const cityArr = venue.city as { name: string }[] | null;
    const cityData = cityArr?.[0] ?? null;
    const cityName = cityData?.name
      ? CITY_GEOCODE_NAMES[cityData.name] || `${cityData.name}`
      : "New York City, NY";

    const result = await geocodeVenue(venue.name, venue.neighborhood || "", cityName);

    if (result) {
      const { error: updateError } = await supabase
        .from("venues")
        .update({
          lat: result.lat,
          lng: result.lng,
          address: result.address,
          neighborhood: result.neighborhood,
          geocode_source: result.source,
        })
        .eq("id", venue.id);

      if (updateError) {
        console.error(`  FAIL: ${venue.name} - ${updateError.message}`);
        failed++;
      } else {
        console.log(`  OK: ${venue.name} → ${result.address} [${result.source}] (${result.lat}, ${result.lng})`);
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
