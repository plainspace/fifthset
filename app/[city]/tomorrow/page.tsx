import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull, getLocalDate } from "@/lib/utils";
import ListingsView from "@/components/ListingsView";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

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
