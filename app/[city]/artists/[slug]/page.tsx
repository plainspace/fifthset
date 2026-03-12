import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getCityBySlug } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getArtistBySlug, getArtistEvents } from "@/lib/supabase/queries";
import { getDateLabel } from "@/lib/utils";
import { breadcrumbSchema } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import EventCard from "@/components/EventCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = getCityBySlug(citySlug);
  const supabase = await createClient();
  const artist = city ? await getArtistBySlug(supabase, slug) : null;
  if (!artist) return {};

  const title = `${artist.name} - Live Jazz in ${city!.name}`;
  const description = `See upcoming jazz shows by ${artist.name} in ${city!.name}. Find dates, venues, and showtimes.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(artist.name)}&subtitle=${encodeURIComponent(city!.name)}&type=artist`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: {
      canonical: `https://fifthset.live/${citySlug}/artists/${slug}`,
    },
  };
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city: citySlug, slug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const supabase = await createClient();
  const artist = await getArtistBySlug(supabase, slug);
  if (!artist) notFound();

  const events = await getArtistEvents(supabase, artist.id, citySlug);

  const eventsByDate = events.reduce<Record<string, typeof events>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: city.name, url: `/${citySlug}` },
          { name: artist.name, url: `/${citySlug}/artists/${artist.slug}` },
        ])}
      />
      <div className="bg-surface rounded-lg p-6 sm:p-8">
        <h1 className="font-serif text-3xl text-accent">{artist.name}</h1>
        {artist.website && (
          <div className="mt-3">
            <a
              href={artist.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </a>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-xl text-text mb-6">Upcoming Shows</h2>

        {Object.keys(eventsByDate).length === 0 ? (
          <p className="text-text-muted">No upcoming shows in {city.name}</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(eventsByDate).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm uppercase tracking-wider text-text-muted mb-3">
                  {getDateLabel(date)}
                </h3>
                <div className="space-y-3">
                  {dateEvents.map((event) => (
                    <EventCard key={event.id} event={event} citySlug={citySlug} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link
          href={`/${citySlug}`}
          className="text-sm text-text-muted hover:text-accent transition-colors"
        >
          &larr; Back to {city.name}
        </Link>
      </div>
    </div>
  );
}
