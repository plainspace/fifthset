import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull, getLocalDate } from "@/lib/utils";
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

  const title = `Jazz Tomorrow in ${city.name}`;
  const description = `Find live jazz shows tomorrow in ${city.name}. Browse venues, times, and artists.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Jazz in ${city.name}`)}&subtitle=Tomorrow`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}/tomorrow` },
  };
}

export const revalidate = 300;

export default async function TomorrowPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const tomorrowStr = getLocalDate(city.timezone, 1);

  const supabase = await createClient();
  const events = await getEvents(supabase, city.slug, [tomorrowStr]);

  return (
    <ListingsView
      city={city}
      events={events}
      heading="Tomorrow"
      subtitle={`Tomorrow \u00A0/\u00A0 ${formatDateFull(tomorrowStr)}`}
      showLabel=""
    />
  );
}
