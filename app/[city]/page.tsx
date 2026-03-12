import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/supabase/queries";
import { formatDateFull } from "@/lib/utils";
import ListingsView from "@/components/ListingsView";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const today = new Date().toISOString().split("T")[0];
  const supabase = await createClient();
  const events = await getEvents(supabase, city.slug, [today]);

  return (
    <ListingsView
      city={city}
      events={events}
      heading="Live Jazz"
      subtitle={`Tonight \u00A0/\u00A0 ${formatDateFull(today)}`}
      showLabel="tonight"
    />
  );
}
