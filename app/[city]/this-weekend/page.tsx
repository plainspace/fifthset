import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull, getLocalDate, getLocalDay } from "@/lib/utils";
import GroupedListingsView from "@/components/GroupedListingsView";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

function getWeekendDates(timezone: string): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = getLocalDay(timezone, i);
    if (day === 5 || day === 6 || day === 0) {
      dates.push(getLocalDate(timezone, i));
    }
  }
  return dates;
}

export default async function WeekendPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const weekendDates = getWeekendDates(city.timezone);
  const supabase = await createClient();
  const events = await getEvents(supabase, city.slug, weekendDates);

  const dateRange = weekendDates.length > 0
    ? weekendDates.length > 1
      ? `${formatDateFull(weekendDates[0])} \u2013 ${formatDateFull(weekendDates[weekendDates.length - 1])}`
      : formatDateFull(weekendDates[0])
    : "";

  return (
    <GroupedListingsView
      city={city}
      events={events}
      title="This Weekend"
      dateRange={dateRange}
      showLabel="this weekend"
    />
  );
}
