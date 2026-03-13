import { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'For Venues',
  description:
    'Feature your jazz venue on Fifth Set. Reach thousands of jazz fans looking for live music tonight.',
};

const listed = [
  'Included in all listings and search results',
  'Visible on the map with show times',
  'Artist names and set times displayed',
  'Searchable by name and neighborhood',
];

const featured = [
  'Priority placement in all listings',
  'Gold badge on your venue and event cards',
  'Included in the weekly newsletter',
  'Enhanced profile with photos and details',
  'Custom venue description',
];

export default function ForVenuesPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-text text-balance">
            Your venue, in front of the{' '}
            <span className="text-accent">right audience</span>
          </h1>
          <p className="text-text-muted text-lg mt-6 max-w-xl mx-auto text-balance">
            Fifth Set is where jazz fans go to find their next show. Every
            night, thousands of listeners browse our listings looking for
            live music. Your venue should be there.
          </p>
        </section>

        {/* Stats */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-surface border border-border p-6">
              <p className="text-2xl sm:text-3xl font-mono text-accent">90+</p>
              <p className="text-sm text-text-muted mt-1">
                Venues across New York
              </p>
            </div>
            <div className="rounded-xl bg-surface border border-border p-6">
              <p className="text-2xl sm:text-3xl font-mono text-accent">
                Daily
              </p>
              <p className="text-sm text-text-muted mt-1">
                Listings updated every day
              </p>
            </div>
            <div className="rounded-xl bg-surface border border-border p-6">
              <p className="text-2xl sm:text-3xl font-mono text-accent">Free</p>
              <p className="text-sm text-text-muted mt-1">
                To be listed on Fifth Set
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <h2 className="font-serif text-2xl text-text text-center mb-10 text-balance">
            How it works
          </h2>
          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Every jazz venue in New York is listed on Fifth Set',
                body: "If you're hosting live jazz, you're already in our listings. We keep them accurate and up to date so fans always know what's happening tonight.",
              },
              {
                step: '02',
                title: 'Claim your venue to customize your profile',
                body: 'Add photos, write your own description, and make your venue page feel like yours. A claimed profile tells fans you care about the experience.',
              },
              {
                step: '03',
                title: 'Featured venues get priority placement',
                body: 'Stand out in listings, earn a gold badge, and get included in our weekly newsletter. Featured venues are the first thing fans see.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-5 items-start rounded-xl bg-surface border border-border p-6"
              >
                <span className="font-mono text-accent text-sm mt-0.5 shrink-0">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-serif text-lg text-text">{item.title}</h3>
                  <p className="text-sm text-text-muted mt-2 text-pretty">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing tiers */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Listed - Free */}
            <div className="rounded-xl bg-surface border border-border p-8">
              <h2 className="font-serif text-xl text-text">Listed</h2>
              <p className="text-2xl font-mono text-accent mt-2">Free</p>
              <p className="text-sm text-text-muted mt-3 text-pretty">
                You're probably already here. Every jazz venue in New York
                appears on Fifth Set automatically.
              </p>
              <ul className="mt-6 space-y-2.5">
                {listed.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-text-muted"
                  >
                    <span className="text-accent mt-0.5 shrink-0">+</span>
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Featured - $99/mo */}
            <div className="rounded-xl bg-surface border-2 border-accent/40 p-8 relative">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                  Recommended
                </span>
              </div>
              <h2 className="font-serif text-xl text-text">Featured</h2>
              <p className="text-2xl font-mono text-accent mt-2">$99/mo</p>
              <p className="text-sm text-text-muted mt-3 text-pretty">
                The upgrade. Priority placement, a gold badge, and your venue
                in front of our most engaged readers every week.
              </p>
              <ul className="mt-6 space-y-2.5">
                {featured.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-text-muted"
                  >
                    <span className="text-accent mt-0.5 shrink-0">+</span>
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <div className="rounded-xl bg-surface border border-border p-10">
            <h2 className="font-serif text-2xl text-text text-balance">
              Want to feature your venue?
            </h2>
            <p className="text-text-muted mt-3 max-w-md mx-auto text-balance">
              Drop us a line. We'll get back to you within a day or two.
            </p>
            <a
              href="mailto:venues@fifthset.live"
              className="inline-block mt-6 px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
