import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, MapPin, Phone, Star, Clock } from 'lucide-react';
import { getCityBySlug } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { getVenueBySlug, getVenueEvents } from '@/lib/supabase/queries';
import { formatTime, getDateLabel, formatDateFull, cn } from '@/lib/utils';
import { venueSchema, breadcrumbSchema } from '@/lib/jsonld';
import JsonLd from '@/components/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = getCityBySlug(citySlug);
  const supabase = await createClient();
  const venue = city ? await getVenueBySlug(supabase, citySlug, slug) : null;
  if (!venue) return {};

  const title = `${venue.name} - Jazz in ${city!.name}`;
  const description = `Upcoming jazz shows at ${venue.name}${venue.address ? `, ${venue.address}` : ''}. See tonight's lineup and upcoming events.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        venue.photo_url
          ? { url: venue.photo_url.replace(/^http:\/\//i, 'https://'), width: 1200, height: 630 }
          : {
              url: `/api/og?title=${encodeURIComponent(venue.name)}&subtitle=${encodeURIComponent(venue.neighborhood || city!.name)}&type=venue`,
              width: 1200,
              height: 630,
            },
      ],
    },
    alternates: {
      canonical: `https://fifthset.live/${citySlug}/venues/${slug}`,
    },
  };
}

export const revalidate = 300;

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

  const isFeatured =
    venue.sponsor_tier === 'marquee' || venue.sponsor_tier === 'spotlight';

  const photoUrl = venue.photo_url?.replace(/^http:\/\//i, 'https://');

  const events = await getVenueEvents(supabase, venue.id);

  const eventsByDate = events.reduce<Record<string, typeof events>>(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {},
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={venueSchema(venue, citySlug, city.name)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: city.name, url: `/${citySlug}` },
          { name: 'Venues', url: `/${citySlug}/venues` },
          { name: venue.name, url: `/${citySlug}/venues/${venue.slug}` },
        ])}
      />
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-text transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li><Link href={`/${citySlug}`} className="hover:text-text transition-colors">{city.name}</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li><Link href={`/${citySlug}/venues`} className="hover:text-text transition-colors">Venues</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li aria-current="page" className="text-text truncate">{venue.name}</li>
        </ol>
      </nav>
      {/* Venue header */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden',
          photoUrl ? 'min-h-[280px] sm:min-h-[320px]' : 'bg-surface',
          isFeatured && 'featured-border',
        )}
      >
        {photoUrl ? (
          <>
            <Image
              src={photoUrl}
              alt={venue.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 z-10">
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl text-white">
                    {venue.name}
                  </h1>
                  {isFeatured && (
                    <Star className="w-5 h-5 text-accent fill-accent" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-white/70">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {venue.address}
                  </a>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      Website
                    </a>
                  )}
                  {venue.phone && (
                    <a
                      href={`tel:${venue.phone}`}
                      className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4" aria-hidden="true" />
                      {venue.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl text-text">{venue.name}</h1>
              {isFeatured && (
                <Star className="w-5 h-5 text-accent fill-accent" aria-hidden="true" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-text-muted">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text transition-colors"
              >
                {venue.address}
              </a>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Website
                </a>
              )}
              {venue.phone && (
                <a
                  href={`tel:${venue.phone}`}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  {venue.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming shows */}
      <div className="mt-8">
        <h2 className="font-serif text-xl text-text mb-6">Upcoming Shows</h2>

        {Object.keys(eventsByDate).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted">No upcoming shows listed</p>
            <p className="text-sm text-text-muted/60 mt-2">
              Check back later or{" "}
              <Link href={`/${citySlug}`} className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">
                browse tonight&apos;s shows
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(eventsByDate).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm tracking-wider text-text-muted mb-3">
                  {["Tonight", "Tomorrow"].includes(getDateLabel(date)) && (
                    <span className="uppercase">{getDateLabel(date)} / </span>
                  )}
                  {formatDateFull(date)}
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
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="font-mono">
                            {formatTime(event.start_time)}
                            {event.end_time &&
                              ` to ${formatTime(event.end_time)}`}
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
