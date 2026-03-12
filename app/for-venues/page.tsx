import { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "For Venues",
  description:
    "Feature your jazz venue on Fifth Set. Reach thousands of jazz fans looking for live music tonight.",
};

const tiers = [
  {
    name: "Listed",
    price: "Free",
    description: "Your venue appears in all listings and on the map.",
    features: [
      "Included in daily listings",
      "Searchable by name and neighborhood",
      "Visible on the map with shows",
      "Artist and show time display",
    ],
  },
  {
    name: "Spotlight",
    price: "$99/mo",
    description: "Stand out with priority placement and featured styling.",
    features: [
      "Everything in Listed",
      "Featured badge on event cards",
      "Priority sort in listings",
      "Gold border treatment",
      "Venue detail page with full info",
    ],
    highlight: true,
  },
  {
    name: "Marquee",
    price: "$349/mo",
    description: "Maximum visibility for premier venues.",
    features: [
      "Everything in Spotlight",
      "Top placement in all views",
      "Featured in weekly newsletter",
      "Custom venue photography",
      "Analytics dashboard",
      "Dedicated account support",
    ],
  },
];

export default function ForVenuesPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="font-serif text-3xl sm:text-4xl text-text mb-4">
              Feature Your <span className="text-accent">Venue</span>
            </h1>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              Thousands of jazz fans use Fifth Set to find live music. Make sure
              they find you.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 ${
                  tier.highlight
                    ? "bg-surface border-2 border-accent/40"
                    : "bg-surface border border-border"
                }`}
              >
                <h2 className="font-serif text-xl text-text">{tier.name}</h2>
                <p className="text-2xl font-mono text-accent mt-2">
                  {tier.price}
                </p>
                <p className="text-sm text-text-muted mt-3">
                  {tier.description}
                </p>

                <ul className="mt-6 space-y-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-text-muted"
                    >
                      <span className="text-accent mt-0.5">+</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-text-muted mb-4">
              Interested in sponsorship? Get in touch.
            </p>
            <a
              href="mailto:venues@fifthset.live"
              className="inline-block px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
