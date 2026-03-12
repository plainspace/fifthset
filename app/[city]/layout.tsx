import { notFound } from "next/navigation";
import { getCityBySlug, getCitySlugs } from "@/lib/cities";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return getCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityData = getCityBySlug(city);
  if (!cityData) return {};
  return {
    title: `Live Jazz in ${cityData.name} | Fifth Set`,
    description: `Find live jazz shows tonight in ${cityData.name}. Filter by neighborhood, time, and venue.`,
  };
}

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityData = getCityBySlug(city);
  if (!cityData) notFound();

  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
