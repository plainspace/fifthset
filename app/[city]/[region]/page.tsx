import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRegionBySlug, getAllCityRegionParams } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull, getLocalDate } from "@/lib/utils";
import { eventSchema, breadcrumbSchema } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import ListingsView from "@/components/ListingsView";

export function generateStaticParams() {
  return getAllCityRegionParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; region: string }>;
}): Promise<Metadata> {
  const { city: citySlug, region: regionSlug } = await params;
  const result = getRegionBySlug(citySlug, regionSlug);
  if (!result) return {};

  const { city, region } = result;
  const title = `Live Jazz in ${region.name}, ${city.name} Tonight`;
  const description = `Find live jazz shows tonight in ${region.name}, ${city.name}. Browse venues, filter by time, and discover the best jazz in the neighborhood.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Jazz in ${region.name}`)}&subtitle=${encodeURIComponent(city.name)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}/${regionSlug}` },
  };
}

export const revalidate = 300;

export default async function RegionPage({
  params,
}: {
  params: Promise<{ city: string; region: string }>;
}) {
  const { city: citySlug, region: regionSlug } = await params;
  const result = getRegionBySlug(citySlug, regionSlug);
  if (!result) notFound();

  const { city, region } = result;
  const today = getLocalDate(city.timezone);
  const yesterday = getLocalDate(city.timezone, -1);
  const supabase = await createClient();

  const [todayEvents, yesterdayEvents] = await Promise.all([
    getEvents(supabase, city.slug, [today]),
    getEvents(supabase, city.slug, [yesterday]),
  ]);

  const lateNight = yesterdayEvents.filter((e) => {
    if (!e.end_time) return false;
    const [endH] = e.end_time.split(":").map(Number);
    const [startH] = e.start_time.split(":").map(Number);
    return endH < startH;
  });

  const allEvents = [...lateNight, ...todayEvents];
  const regionEvents = allEvents.filter((e) => e.venue.region === regionSlug);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: city.name, url: `/${city.slug}` },
          { name: region.name, url: `/${city.slug}/${region.slug}` },
        ])}
      />
      <JsonLd
        data={regionEvents
          .slice(0, 20)
          .map((e) => eventSchema(e, city.slug, e.date, city.timezone, city.name))}
      />

      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 text-sm text-text-muted"
      >
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-text transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-border">
            /
          </li>
          <li>
            <Link
              href={`/${city.slug}`}
              className="hover:text-text transition-colors"
            >
              {city.name}
            </Link>
          </li>
          <li aria-hidden="true" className="text-border">
            /
          </li>
          <li aria-current="page" className="text-text">
            {region.name}
          </li>
        </ol>
      </nav>

      <Suspense>
        <ListingsView
          city={city}
          events={regionEvents}
          heading={`Jazz in ${region.name}`}
          subtitle={`Tonight \u00A0/\u00A0 ${formatDateFull(today)}`}
          showLabel="tonight"
        />
      </Suspense>

      {regionEvents.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 text-center">
          <p className="text-text-muted">
            No shows in {region.name} tonight.
          </p>
          <p className="text-sm text-text-muted/60 mt-2">
            <Link
              href={`/${city.slug}`}
              className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              Browse all {city.name} shows
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
