import { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Fifth Set is a modern jazz discovery platform. Find live jazz tonight in NYC and beyond.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="font-serif text-3xl sm:text-4xl text-text mb-8">
            About <span className="text-accent">Fifth Set</span>
          </h1>

          <div className="space-y-6 text-text-muted leading-relaxed">
            <p>
              Jazz is alive every night in New York City. But finding out where
              and when has always been harder than it should be.
            </p>

            <p>
              Fifth Set pulls together jazz listings from across the city into
              one clean, filterable, mappable view. No more scrolling through
              dense tables or checking five different websites. Just open the
              app, pick your neighborhood and time, and go hear some music.
            </p>

            <p>
              The name comes from the tradition of late-night jam sessions... the
              fifth set, after the regular show ends, when the real playing
              happens. That spirit of discovery is what we are building for.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">How it works</h2>

            <p>
              We pull listings daily from trusted sources, clean up the
              data, and present it all in a modern interface.
              Filter by borough, time of day, or just browse the map.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">For venues</h2>

            <p>
              If you run a jazz venue and want to make sure your listings are
              accurate, or if you are interested in featured placement, check out
              our{" "}
              <Link
                href="/for-venues"
                className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
              >
                venue partnerships
              </Link>{" "}
              page.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">Built by</h2>

            <p>
              Fifth Set is an independent project built with care for the NYC
              jazz community. Got feedback or a venue to add? Reach out at{" "}
              <a
                href="mailto:hello@fifthset.live"
                className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
              >
                hello@fifthset.live
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
