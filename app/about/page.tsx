import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About | Fifth Set",
  description:
    "Fifth Set is a modern jazz discovery platform. Find live jazz tonight in NYC, Chicago, New Orleans, LA, and San Francisco.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          {/* Hero */}
          <h1 className="font-serif text-3xl sm:text-4xl text-text leading-snug text-balance">
            Every city has a jazz scene. Most of them are invisible online.
          </h1>

          <div className="mt-12 space-y-6 text-text-muted leading-relaxed">
            <p>
              Great jazz is happening every night... in basements, behind unmarked
              doors, at venues that have been swinging since your grandparents were
              dating. But finding it? That means digging through websites that
              haven&apos;t been updated since 2005, scrolling through dense
              spreadsheets, or just knowing someone who knows.
            </p>

            <p>Fifth Set exists because jazz deserves better than that.</p>

            <p className="text-text">
              We pull together every live jazz listing we can find... every venue,
              every set, every night. Then we make it easy to search, filter, and
              explore. See what&apos;s happening tonight. Browse by neighborhood.
              Open the map and find something close. It takes ten seconds, not ten
              minutes.
            </p>

            <h2 className="font-serif text-2xl text-text pt-6">
              Free for fans. Always.
            </h2>

            <p>
              Fifth Set is free to use. No account required. No paywalls. If you
              want to save your favorite venues and get alerts, you can sign up...
              but the listings are always open.
            </p>

            <h2 className="font-serif text-2xl text-text pt-6">
              Built for venues too.
            </h2>

            <p>
              If you run a jazz venue, we want you on Fifth Set. Every venue gets a
              free listing. If you want more visibility... featured placement, a
              spotlight on the map, priority in search results... we offer{" "}
              <Link
                href="/for-venues"
                className="text-accent hover:text-accent-hover transition-colors underline underline-offset-4"
              >
                sponsorship tiers
              </Link>{" "}
              that help you reach the people who are actively looking for live jazz
              tonight.
            </p>

            <h2 className="font-serif text-2xl text-text pt-6">Where we are.</h2>

            <p>
              We launched in New York City and are expanding to Chicago, New
              Orleans, Los Angeles, and San Francisco. Every jazz city deserves a
              Fifth Set.
            </p>

            <div className="pt-8 border-t border-border mt-8">
              <p className="text-sm text-text-muted/60">
                Built with love for the music. If you have feedback, venue
                suggestions, or just want to say hi... we&apos;d love to hear from
                you.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
