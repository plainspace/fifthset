import { Metadata } from 'next';
import {
  Star,
  Calendar,
  BarChart3,
  Eye,
  ArrowRight,
  Check,
  Megaphone,
} from 'lucide-react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { faqSchema } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'For Venues',
  description:
    'Claim a week as the Featured Venue on Fifth Set. Top placement, highlighted cards, and a banner across all city pages. From $99/week.',
  alternates: {
    canonical: 'https://fifthset.live/for-venues',
  },
};

const perks = [
  {
    icon: Star,
    title: 'Featured badge on every card',
    description:
      'All your event cards get a gold Featured badge for the entire week. Impossible to miss.',
  },
  {
    icon: ArrowRight,
    title: 'Top of listings placement',
    description:
      'Your shows appear first... above every other venue in your city. Prime real estate.',
  },
  {
    icon: Megaphone,
    title: 'Banner on your city page',
    description:
      'A dedicated banner at the top of your city\'s listings page. Every visitor sees it.',
  },
  {
    icon: Eye,
    title: '"Tonight at [Venue]" homepage callout',
    description:
      'When you have shows that night, your venue gets a prominent callout on the Fifth Set homepage.',
  },
  {
    icon: BarChart3,
    title: 'Analytics for the week',
    description:
      'See how many people viewed and clicked your listings. Know exactly what your week delivered.',
  },
  {
    icon: Calendar,
    title: 'Included in the weekly newsletter',
    description:
      'Your venue is highlighted in the email that goes out to every Fifth Set subscriber in your city.',
  },
];

const weeks = [
  { label: 'Mar 3', status: 'claimed', venue: 'Blue Note' },
  { label: 'Mar 10', status: 'claimed', venue: 'Village Vanguard' },
  { label: 'Mar 17', status: 'available', venue: null },
  { label: 'Mar 24', status: 'available', venue: null },
  { label: 'Mar 31', status: 'claimed', venue: 'Smalls' },
  { label: 'Apr 7', status: 'available', venue: null },
  { label: 'Apr 14', status: 'available', venue: null },
  { label: 'Apr 21', status: 'available', venue: null },
];

export default function ForVenuesPage() {
  return (
    <>
      <Nav />
      <JsonLd data={faqSchema([
        {
          question: "How much does it cost to be a Featured Venue on Fifth Set?",
          answer: "Featured Venue placement is $99 per week. No monthly subscription, no tiers, no contracts.",
        },
        {
          question: "What does a Featured Venue get?",
          answer: "Featured badge on every event card, top of listings placement, a banner on your city page, homepage callout, analytics for the week, and inclusion in the weekly newsletter.",
        },
        {
          question: "Is my venue already on Fifth Set?",
          answer: "If you host live jazz in one of our covered cities, your shows are likely already listed. We curate listings daily and keep them accurate and up to date.",
        },
        {
          question: "How do I claim a week?",
          answer: "Email venues@fifthset.live with your preferred week and city. One venue per city per week, first come first served.",
        },
      ])} />
      <main className="pt-16 min-h-screen">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
            Weekly Sponsorship
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-text text-balance">
            Claim a week. Own the{' '}
            <span className="text-accent">spotlight</span>.
          </h1>
          <p className="text-text-muted text-lg mt-6 max-w-xl mx-auto text-balance">
            Every week, one venue per city gets top billing on Fifth Set.
            Featured placement, a banner on every page, and your name in front
            of every jazz fan browsing tonight.
          </p>
          <a
            href="mailto:venues@fifthset.live?subject=Claim a Week"
            className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Claim Your Week
            <ArrowRight className="w-4 h-4" />
          </a>
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
                title: 'Your venue is already listed',
                body: 'If you host live jazz, your shows are already on Fifth Set... accurate and up to date, refreshed every morning.',
              },
              {
                step: '02',
                title: 'Claim a week to become the Featured Venue',
                body: 'Pick any available week. One venue per city, first come first served. No subscriptions, no commitments... just the weeks you want.',
              },
              {
                step: '03',
                title: 'Get top placement, a banner, and all the attention',
                body: 'For that entire week, your venue leads every listing, gets a Featured badge on every card, and a banner across all city pages. Plus analytics so you know it worked.',
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

        {/* What you get */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <h2 className="font-serif text-2xl text-text text-center mb-3 text-balance">
            What your week includes
          </h2>
          <p className="text-text-muted text-center mb-10 max-w-lg mx-auto text-balance">
            Seven days of premium visibility across the entire site.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-xl bg-surface border border-border p-6"
              >
                <perk.icon className="w-5 h-5 text-accent mb-3" />
                <h3 className="font-serif text-base text-text">
                  {perk.title}
                </h3>
                <p className="text-sm text-text-muted mt-2 text-pretty">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-xl bg-surface border-2 border-accent/40 p-8 sm:p-10 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
              Simple Pricing
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-text text-balance">
              $99 <span className="text-text-muted font-sans text-lg">/week</span>
            </h2>
            <p className="text-text-muted mt-4 max-w-md mx-auto text-balance">
              No monthly subscription. No tiers. No contracts. Just claim the
              weeks you want and pay for what you use.
            </p>

            <ul className="mt-8 space-y-3 text-left max-w-sm mx-auto">
              {[
                'One venue per city per week',
                'All premium placements included',
                'Analytics report at end of week',
                'Cancel or skip anytime',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-text-muted"
                >
                  <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="mailto:venues@fifthset.live?subject=Claim a Week"
              className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Claim Your Week
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Availability calendar */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <h2 className="font-serif text-2xl text-text text-center mb-3 text-balance">
            Availability
          </h2>
          <p className="text-text-muted text-center mb-8 max-w-lg mx-auto text-balance">
            New York City... upcoming weeks. Claim yours before someone else does.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weeks.map((week) => (
              <div
                key={week.label}
                className={`rounded-xl border p-4 text-center ${
                  week.status === 'claimed'
                    ? 'bg-surface border-border'
                    : 'bg-surface border-accent/30 border-2'
                }`}
              >
                <p className="font-mono text-sm text-text">{week.label}</p>
                {week.status === 'claimed' ? (
                  <>
                    <p className="text-xs text-text-muted mt-1.5">Claimed</p>
                    <p className="text-xs text-text-muted/60 mt-0.5">
                      {week.venue}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-accent font-medium mt-1.5">
                    Available
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-text-muted/60 mt-4">
            Placeholder... actual availability updates weekly.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <div className="rounded-xl bg-surface border border-border p-10">
            <h2 className="font-serif text-2xl text-text text-balance">
              Ready to be the venue everyone sees first?
            </h2>
            <p className="text-text-muted mt-3 max-w-md mx-auto text-balance">
              Drop us a line with your preferred week and city. We&apos;ll
              confirm availability and get you set up.
            </p>
            <a
              href="mailto:venues@fifthset.live?subject=Claim a Week"
              className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Claim Your Week
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
