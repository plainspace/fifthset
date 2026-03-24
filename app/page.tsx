import { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonld";
import { cities } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Fifth Set — Find Live Jazz Tonight",
  description:
    "Find live jazz tonight across New York, Chicago, New Orleans, Philadelphia, DC, Los Angeles, and San Francisco. Curated daily listings, venue maps, and neighborhood guides.",
  openGraph: {
    title: "Fifth Set — Find Live Jazz Tonight",
    description:
      "Updated daily. No algorithms. We do the digging. You hear the music.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Fifth Set — Find Live Jazz Tonight",
      },
    ],
  },
  alternates: { canonical: "https://fifthset.live" },
};

export const revalidate = 300;

async function getCityCounts() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const counts = await Promise.all(
    cities
      .filter((c) => c.live)
      .map(async (city) => {
        const { count } = await supabase
          .from("events")
          .select("*, venues!inner(cities!inner(slug))", {
            count: "exact",
            head: true,
          })
          .eq("venues.cities.slug", city.slug)
          .eq("date", today);

        return { slug: city.slug, count: count ?? 0 };
      })
  );

  return Object.fromEntries(counts.map((c) => [c.slug, c.count]));
}

export default async function HomePage() {
  const cityCounts = await getCityCounts();
  const totalShows = Object.values(cityCounts).reduce((a, b) => a + b, 0);
  const activeCities = Object.values(cityCounts).filter((c) => c > 0).length;
  const liveCities = cities.filter((c) => c.live);

  return (
    <>
      <Nav />
      <JsonLd
        data={breadcrumbSchema([{ name: "Home", url: "/" }])}
      />
      <main id="main-content" className="pt-16 min-h-screen">
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text text-balance">
              Find Live Jazz Tonight
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-text-muted text-pretty max-w-xl mx-auto">
              Updated daily. No algorithms.
            </p>
            <p className="mt-2 text-text-muted text-pretty max-w-xl mx-auto">
              We do the digging. You hear the music.
            </p>
            {totalShows > 0 && (
              <p className="mt-6 font-mono text-sm text-accent tracking-wide">
                {totalShows} show{totalShows !== 1 ? "s" : ""} tonight across{" "}
                {activeCities} cit{activeCities !== 1 ? "ies" : "y"}
              </p>
            )}
          </div>
        </section>

        {/* City Cards */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveCities.map((city) => {
                const count = cityCounts[city.slug] ?? 0;
                return (
                  <Link
                    key={city.slug}
                    href={`/${city.slug}`}
                    className="block bg-surface rounded-lg p-6 card-glow transition-colors hover:bg-surface-hover group"
                  >
                    <h2 className="font-serif text-xl text-accent group-hover:text-accent-hover transition-colors">
                      {city.name}
                    </h2>
                    <p className="mt-2 text-sm text-text-muted">
                      {city.regions.length} neighborhood{city.regions.length !== 1 ? "s" : ""}
                    </p>
                    {count > 0 ? (
                      <p className="mt-3 font-mono text-xs text-accent/80">
                        {count} show{count !== 1 ? "s" : ""} tonight
                      </p>
                    ) : (
                      <p className="mt-3 font-mono text-xs text-text-subtle">
                        No shows listed yet today
                      </p>
                    )}
                  </Link>
                );
              })}
              {["Detroit", "Boston"].map((name) => (
                <div
                  key={name}
                  className="block bg-surface/50 rounded-lg p-6 border border-border/50"
                >
                  <h2 className="font-serif text-xl text-text-muted">
                    {name}
                  </h2>
                  <p className="mt-3 font-mono text-xs text-text-subtle uppercase tracking-wider">
                    Coming soon
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="space-y-6 text-text-muted leading-relaxed">
              <h2 className="font-serif text-2xl sm:text-3xl text-text text-balance">
                The fifth set is where the real playing happens
              </h2>

              <p className="text-pretty">
                In jazz clubs, the first four sets are the gig. The fifth set is what
                happens after... when the house band finishes, the tourists leave, and
                the musicians who came to listen start picking up instruments. No setlist,
                no rehearsal, no safety net. Just players testing each other in real time.
              </p>

              <p className="text-pretty">
                That&apos;s the spirit behind this platform. We built Fifth Set because
                finding live jazz shouldn&apos;t require checking five websites, scrolling
                through cluttered event calendars, or relying on word of mouth. The music
                is out there every single night. You just need to know where.
              </p>

              <p className="text-pretty">
                We curate listings across {liveCities.length} cities, clean up the data,
                and present it all in one place. Filter by neighborhood, browse the map,
                or just see what&apos;s happening tonight. No accounts required, no
                algorithms deciding what you see.
              </p>

              <h2 className="font-serif text-2xl sm:text-3xl text-text text-balance pt-4">
                Jazz listings, updated daily
              </h2>

              <p className="text-pretty">
                Every day, we curate show times, artists, and venue details for each city
                we cover. Listings are filterable by neighborhood and time, and every
                venue is plotted on an interactive map so you can find what&apos;s closest.
                If you run a venue,{" "}
                <Link
                  href="/for-venues"
                  className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
                >
                  get in touch
                </Link>{" "}
                to make sure your listings are accurate.
              </p>
            </div>
          </div>
        </section>

        {/* City Links with Neighborhoods */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-text mb-8 text-balance">
              Explore jazz by city
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {liveCities.map((city) => (
                <div key={city.slug}>
                  <Link
                    href={`/${city.slug}`}
                    className="font-serif text-lg text-accent hover:text-accent-hover transition-colors"
                  >
                    {city.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                    {city.regions.map((region, i) => (
                      <span key={region.slug} className="text-sm text-text-muted">
                        {region.name}
                        {i < city.regions.length - 1 && (
                          <span className="text-border ml-2" aria-hidden="true">
                            /
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About link */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <Link
              href="/about"
              className="text-sm text-text-muted hover:text-text transition-colors underline underline-offset-2"
            >
              Learn more about Fifth Set
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
