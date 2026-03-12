import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull } from "@/lib/utils";
import GroupedListingsView from "@/components/GroupedListingsView";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

function getNextWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (day === 0 ? 1 : 8 - day));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export default async function NextWeekPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const weekDates = getNextWeekDates();
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
