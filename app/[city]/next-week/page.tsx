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
    <GroupedListingsView
      city={city}
      events={events}
      title="Next Week"
      dateRange={dateRange}
      showLabel="next week"
    />
  );
}
