import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull, getLocalDate } from "@/lib/utils";
import { eventSchema, breadcrumbSchema } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import ListingsView from "@/components/ListingsView";

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

  const title = `Live Jazz in ${city.name} Tonight`;
  const description = `Find live jazz shows tonight in ${city.name}. Browse venues, filter by neighborhood and time, and discover the best jazz in the city.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Live Jazz in ${city.name}`)}&subtitle=Tonight`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}` },
  };
}

export const revalidate = 300;

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

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
  const events = [...lateNight, ...todayEvents];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: city.name, url: `/${city.slug}` },
        ])}
      />
      <JsonLd
        data={events.slice(0, 20).map((e) => eventSchema(e, city.slug, e.date, city.timezone, city.name))}
      />
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 text-sm text-text-muted">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-text transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li aria-current="page" className="text-text">{city.name}</li>
        </ol>
      </nav>
      <Suspense>
        <ListingsView
          city={city}
          events={events}
          heading="Live Jazz"
          subtitle={`Tonight \u00A0/\u00A0 ${formatDateFull(today)}`}
          showLabel="tonight"
        />
      </Suspense>
    </>
  );
}
