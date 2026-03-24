import { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Fifth Set curates live jazz listings across New York, Chicago, New Orleans, Philadelphia, DC, Los Angeles, and San Francisco. Updated daily.",
  alternates: {
    canonical: "https://fifthset.live/about",
  },
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
            <p className="text-pretty">
              Jazz is alive every night across the country. But finding out where
              and when has always been harder than it should be... checking five
              websites, scrolling through cluttered event calendars, or relying
              on word of mouth.
            </p>

            <p className="text-pretty">
              Fifth Set curates live jazz listings into one clean, filterable,
              mappable view. Pick your city, pick your neighborhood, and go hear
              some music.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">The name</h2>

            <p className="text-pretty">
              In jazz clubs, the first four sets are the gig. The fifth set is
              what happens after... when the house band finishes, the tourists
              leave, and the musicians who came to listen start picking up
              instruments. No setlist, no rehearsal, no safety net. Just players
              testing each other in real time. That spirit of discovery is what
              we&apos;re building for.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">How it works</h2>

            <p className="text-pretty">
              Every day, we curate show times, artists, and venue details for
              every city we cover. Listings are filterable by neighborhood and
              time, and every venue is plotted on an interactive map so you can
              find what&apos;s closest. No accounts required, no algorithms
              deciding what you see.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">Cities</h2>

            <p className="text-pretty">
              We currently cover{" "}
              <Link href="/nyc" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">New York</Link>,{" "}
              <Link href="/chicago" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">Chicago</Link>,{" "}
              <Link href="/dc" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">Washington DC</Link>,{" "}
              <Link href="/philly" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">Philadelphia</Link>,{" "}
              <Link href="/nola" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">New Orleans</Link>,{" "}
              <Link href="/la" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">Los Angeles</Link>, and{" "}
              <Link href="/sf" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">San Francisco</Link>.
              More cities are on the way.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">For venues</h2>

            <p className="text-pretty">
              If you run a jazz venue and want to make sure your listings are
              accurate, or if you&apos;re interested in featured placement, check
              out our{" "}
              <Link
                href="/for-venues"
                className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
              >
                venue partnerships
              </Link>{" "}
              page.
            </p>

            <h2 className="font-serif text-xl text-text pt-4">Get in touch</h2>

            <p className="text-pretty">
              Fifth Set is an independent project built with care for the jazz
              community. Got feedback, a venue to add, or a city
              you&apos;d like to see next? Reach out at{" "}
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
