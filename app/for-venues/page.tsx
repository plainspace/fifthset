import { Check, Zap, Crown } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "For Venues | Fifth Set",
  description:
    "Get your jazz venue in front of people actively looking for live music tonight. Free listing included.",
};

const tiers = [
  {
    name: "Listed",
    price: "Free",
    period: "",
    description:
      "Every venue gets a free listing. Show up in search, on the map, in city listings.",
    icon: Check,
    features: [
      "Venue page with address and schedule",
      "Appear in city listings and map",
      "Link to your website",
      "Included in search results",
    ],
    cta: "Get Listed",
    ctaHref: "mailto:venues@fifthset.live?subject=Free%20Listing",
    featured: false,
  },
  {
    name: "Spotlight",
    price: "$99",
    period: "/month",
    description:
      "Stand out from the crowd. Featured placement that puts you in front of jazz fans.",
    icon: Zap,
    features: [
      "Everything in Free",
      '"Featured" badge on your listing',
      "Priority placement in your borough",
      "Larger pin on the map with glow",
      "Venue dashboard with impressions and clicks",
    ],
    cta: "Get Started",
    ctaHref: "mailto:venues@fifthset.live?subject=Spotlight%20Tier",
    featured: true,
  },
  {
    name: "Marquee",
    price: "$349",
    period: "/month",
    description: "The full spotlight. Maximum visibility across Fifth Set.",
    icon: Crown,
    features: [
      "Everything in Spotlight",
      "Homepage featured rotation",
      "Enhanced venue page with photos and bio",
      'Priority in "Tonight" picks',
      "Newsletter sponsor slot",
      "Dedicated account support",
    ],
    cta: "Contact Us",
    ctaHref: "mailto:venues@fifthset.live?subject=Marquee%20Tier",
    featured: false,
  },
];

export default function ForVenuesPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl sm:text-4xl text-text text-balance">
              Your audience is already looking for you.
            </h1>
            <p className="mt-4 text-text-muted text-lg leading-relaxed">
              Thousands of jazz fans use Fifth Set to find live music tonight. Make
              sure they find your venue.
            </p>
          </div>

          {/* Tiers */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={cn(
                    "bg-surface rounded-lg p-6 flex flex-col",
                    tier.featured &&
                      "ring-1 ring-accent/20 relative"
                  )}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-bg text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        tier.featured ? "text-accent" : "text-text-muted"
                      )}
                    />
                    <h2 className="font-serif text-xl text-text">
                      {tier.name}
                    </h2>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-serif text-text">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-text-muted text-sm">
                        {tier.period}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-text-muted mb-6">
                    {tier.description}
                  </p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span className="text-text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={tier.ctaHref}
                    className={cn(
                      "block text-center py-3 rounded-lg font-medium transition-colors text-sm",
                      tier.featured
                        ? "bg-accent text-bg hover:bg-accent-hover"
                        : "bg-surface-hover text-text hover:bg-border"
                    )}
                  >
                    {tier.cta}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Bottom section */}
          <div className="mt-16 text-center">
            <h2 className="font-serif text-2xl text-text">
              Every venue starts free.
            </h2>
            <p className="mt-3 text-text-muted max-w-lg mx-auto">
              We list every jazz venue we can find... no payment required.
              Sponsorship tiers are about amplification, not gatekeeping. Your
              shows will always appear in our listings.
            </p>
            <div className="mt-8">
              <a
                href="mailto:venues@fifthset.live?subject=Get%20Listed"
                className="inline-block px-6 py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors"
              >
                Get Your Venue Listed
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 pt-16 border-t border-border">
            <h2 className="font-serif text-xl text-text mb-8 text-center">
              Common questions
            </h2>
            <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
              <div>
                <h3 className="text-text font-medium mb-2">
                  Do I need to pay to be listed?
                </h3>
                <p className="text-sm text-text-muted">
                  No. Every venue gets a free listing with your schedule, address,
                  and a link to your website. Paid tiers add visibility, not access.
                </p>
              </div>
              <div>
                <h3 className="text-text font-medium mb-2">
                  How do you get our schedule?
                </h3>
                <p className="text-sm text-text-muted">
                  We pull listings from public sources daily. You can also submit
                  your schedule directly and we&apos;ll keep it updated.
                </p>
              </div>
              <div>
                <h3 className="text-text font-medium mb-2">
                  Can I see how my listing performs?
                </h3>
                <p className="text-sm text-text-muted">
                  Spotlight and Marquee tiers include a venue dashboard with
                  impressions, clicks, and map views.
                </p>
              </div>
              <div>
                <h3 className="text-text font-medium mb-2">
                  Which cities do you cover?
                </h3>
                <p className="text-sm text-text-muted">
                  We&apos;re live in NYC and expanding to Chicago, New Orleans, LA,
                  and San Francisco. More cities coming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
