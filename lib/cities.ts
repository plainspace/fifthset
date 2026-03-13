import { City } from "./types";

export const cities: City[] = [
  {
    id: "nyc",
    slug: "nyc",
    name: "New York City",
    lat: 40.7128,
    lng: -74.006,
    timezone: "America/New_York",
    live: true,
    regions: [
      { slug: "manhattan", name: "Manhattan", city_slug: "nyc" },
      { slug: "brooklyn", name: "Brooklyn", city_slug: "nyc" },
      { slug: "queens", name: "Queens", city_slug: "nyc" },
      { slug: "bronx", name: "Bronx", city_slug: "nyc" },
      { slug: "staten-island", name: "Staten Island", city_slug: "nyc" },
    ],
  },
  {
    id: "chicago",
    slug: "chicago",
    name: "Chicago",
    lat: 41.8781,
    lng: -87.6298,
    timezone: "America/Chicago",
    live: false,
    regions: [
      { slug: "south-side", name: "South Side", city_slug: "chicago" },
      { slug: "west-side", name: "West Side", city_slug: "chicago" },
      { slug: "north-side", name: "North Side", city_slug: "chicago" },
      { slug: "loop", name: "The Loop", city_slug: "chicago" },
    ],
  },
  {
    id: "nola",
    slug: "nola",
    name: "New Orleans",
    lat: 29.9511,
    lng: -90.0715,
    timezone: "America/Chicago",
    live: true,
    regions: [
      { slug: "french-quarter", name: "French Quarter", city_slug: "nola" },
      { slug: "marigny", name: "Marigny", city_slug: "nola" },
      { slug: "treme", name: "Tremé", city_slug: "nola" },
      { slug: "cbd", name: "CBD", city_slug: "nola" },
      { slug: "uptown", name: "Uptown", city_slug: "nola" },
    ],
  },
  {
    id: "la",
    slug: "la",
    name: "Los Angeles",
    lat: 34.0522,
    lng: -118.2437,
    timezone: "America/Los_Angeles",
    live: false,
    regions: [
      { slug: "hollywood", name: "Hollywood", city_slug: "la" },
      { slug: "downtown", name: "Downtown", city_slug: "la" },
      { slug: "leimert-park", name: "Leimert Park", city_slug: "la" },
      { slug: "santa-monica", name: "Santa Monica", city_slug: "la" },
      { slug: "south-la", name: "South LA", city_slug: "la" },
    ],
  },
  {
    id: "sf",
    slug: "sf",
    name: "San Francisco",
    lat: 37.7749,
    lng: -122.4194,
    timezone: "America/Los_Angeles",
    live: false,
    regions: [
      { slug: "fillmore", name: "Fillmore", city_slug: "sf" },
      { slug: "north-beach", name: "North Beach", city_slug: "sf" },
      { slug: "soma", name: "SoMa", city_slug: "sf" },
      { slug: "mission", name: "Mission", city_slug: "sf" },
    ],
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}

export function getCitySlugs(): string[] {
  return cities.map((c) => c.slug);
}
