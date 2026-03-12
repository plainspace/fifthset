import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getVenues, getEvents } from "@/lib/supabase/queries";
import VenueCard from "@/components/VenueCard";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

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
