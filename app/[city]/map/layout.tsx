import { Metadata } from "next";
import { getCityBySlug } from "@/lib/cities";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  const title = `Jazz Map - ${city.name}`;
  const description = `Interactive map of jazz venues and live shows in ${city.name}. Find clubs, see what's playing tonight, and plan your night out.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Jazz Map`)}&subtitle=${encodeURIComponent(city.name)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: { canonical: `https://fifthset.live/${citySlug}/map` },
  };
}

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
