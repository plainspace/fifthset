import { Suspense } from "react";
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

function getNextWeekDates(timezone: string): string[] {
  const day = getLocalDay(timezone);
  const nextMondayOffset = day === 0 ? 1 : 8 - day;

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(getLocalDate(timezone, nextMondayOffset + i));
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

  const title = `Jazz Next Week in ${city.name}`;
  const description = `Find live jazz shows next week in ${city.name}. Plan ahead with venue listings and showtimes.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Jazz in ${city.name}`)}&subtitle=Next%20Week`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}/next-week` },
  };
}

export const revalidate = 300;

export default async function NextWeekPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const weekDates = getNextWeekDates(city.timezone);
  const supabase = await createClient();
  const events = await getEvents(supabase, city.slug, weekDates);

  const dateRange = weekDates.length > 1
    ? `${formatDateFull(weekDates[0])} \u2013 ${formatDateFull(weekDates[weekDates.length - 1])}`
    : formatDateFull(weekDates[0]);

  return (
    <Suspense>
      <GroupedListingsView
        city={city}
        events={events}
        title="Next Week"
        dateRange={dateRange}
        showLabel="next week"
      />
    </Suspense>
  );
}
