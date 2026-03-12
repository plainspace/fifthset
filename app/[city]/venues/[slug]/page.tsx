import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MapPin, Phone, Star, Clock } from "lucide-react";
import { getCityBySlug } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getVenueBySlug, getVenueEvents } from "@/lib/supabase/queries";
import { formatTime, getDateLabel, cn } from "@/lib/utils";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city: citySlug, slug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const supabase = await createClient();
  const venue = await getVenueBySlug(supabase, citySlug, slug);
  if (!venue) notFound();

  const isFeatured = venue.sponsor_tier === "marquee" || venue.sponsor_tier === "spotlight";

  const events = await getVenueEvents(supabase, venue.id);

  const eventsByDate = events.reduce<Record<string, typeof events>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Venue header */}
      <div className={cn("bg-surface rounded-lg p-6 sm:p-8", isFeatured && "featured-border")}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl text-text">{venue.name}</h1>
              {isFeatured && <Star className="w-5 h-5 text-accent fill-accent" />}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>{venue.address}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </a>
          )}
          {venue.phone && (
            <a
              href={`tel:${venue.phone}`}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              <Phone className="w-4 h-4" />
              {venue.phone}
            </a>
          )}
        </div>
      </div>

      {/* Upcoming shows */}
      <div className="mt-8">
        <h2 className="font-serif text-xl text-text mb-6">Upcoming Shows</h2>

        {Object.keys(eventsByDate).length === 0 ? (
          <p className="text-text-muted">No upcoming shows listed</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(eventsByDate).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm uppercase tracking-wider text-text-muted mb-3">
                  {getDateLabel(date)}
                </h3>
                <div className="space-y-3">
                  {dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-surface rounded-lg p-4 card-glow flex items-center justify-between"
                    >
                      <div>
                        <p className="font-serif text-lg text-text">
                          {event.artist.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-text-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-mono">
                            {formatTime(event.start_time)}
                            {event.end_time && ` to ${formatTime(event.end_time)}`}
                          </span>
                        </div>
                      </div>
                      {event.is_boosted && (
                        <span className="text-xs text-accent uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link
          href={`/${citySlug}/venues`}
          className="text-sm text-text-muted hover:text-accent transition-colors"
        >
          &larr; All venues in {city.name}
        </Link>
      </div>
    </div>
  );
}
