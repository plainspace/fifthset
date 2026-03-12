import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getVenues, getEvents } from "@/lib/supabase/queries";
import VenueCard from "@/components/VenueCard";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  const title = `Jazz Venues in ${city.name}`;
  const description = `Browse jazz venues in ${city.name}. Find clubs, bars, and performance spaces with upcoming show listings.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Jazz Venues`)}&subtitle=${encodeURIComponent(city.name)}&type=venue`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}/venues` },
  };
}

export const revalidate = 300;

export default async function VenuesPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const supabase = await createClient();
  const venues = await getVenues(supabase, city.slug);

  // Get a broad date range for event counts
  const dates: string[] = [];
  const d = new Date();
  for (let i = 0; i < 14; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  const allEvents = await getEvents(supabase, city.slug, dates);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-3xl text-text mb-2">
        Jazz Venues in{" "}
        <span className="text-accent">{city.name}</span>
      </h1>
      <p className="text-text-muted mb-8">
        {venues.length} {venues.length === 1 ? "venue" : "venues"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => {
          const eventCount = allEvents.filter((e) => e.venue_id === venue.id).length;
          return (
            <VenueCard
              key={venue.id}
              venue={venue}
              citySlug={city.slug}
              eventCount={eventCount}
            />
          );
        })}
      </div>
    </div>
  );
}
