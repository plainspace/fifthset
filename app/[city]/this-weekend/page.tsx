import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull } from "@/lib/utils";
import GroupedListingsView from "@/components/GroupedListingsView";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

function getWeekendDates(): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dDay = d.getDay();
    if (dDay === 5 || dDay === 6 || dDay === 0) {
      dates.push(d.toISOString().split("T")[0]);
    }
  }
  return dates;
}

export default async function WeekendPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const weekendDates = getWeekendDates();
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
