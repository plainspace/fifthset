import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull, getLocalDate, getLocalDay } from "@/lib/utils";
import GroupedListingsView from "@/components/GroupedListingsView";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

function getThisWeekDates(timezone: string): string[] {
  const day = getLocalDay(timezone);
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(getLocalDate(timezone, mondayOffset + i));
  }
  return dates;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  const title = `Jazz This Week in ${city.name}`;
  const description = `Find live jazz shows this week in ${city.name}. Monday through Sunday listings with venues and showtimes.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Jazz in ${city.name}`)}&subtitle=This%20Week`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}/this-week` },
  };
}

export const revalidate = 300;

export default async function ThisWeekPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const weekDates = getThisWeekDates(city.timezone);
  const supabase = await createClient();
  const events = await getEvents(supabase, city.slug, weekDates);

  const dateRange = weekDates.length > 1
    ? `${formatDateFull(weekDates[0])} \u2013 ${formatDateFull(weekDates[weekDates.length - 1])}`
    : formatDateFull(weekDates[0]);

  return (
    <GroupedListingsView
      city={city}
      events={events}
      title="This Week"
      dateRange={dateRange}
      showLabel="this week"
    />
  );
}
