import Link from 'next/link';
import FeaturedVenues from "@/components/FeaturedVenues";
import { cities } from "@/lib/cities";
import type { Venue } from "@/lib/types";

interface FooterProps {
  featuredVenues?: Venue[];
  citySlug?: string;
}

export default function Footer({ featuredVenues, citySlug }: FooterProps = {}) {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="space-y-6">
            <div>
              <Link href="/" className="font-serif text-lg text-accent hover:text-accent-hover transition-colors">Fifth Set</Link>
              <p className="text-text-muted text-sm mt-2 max-w-xs text-balance">
                Find live jazz tonight. Updated daily. No algorithms.
              </p>
            </div>
            {featuredVenues && featuredVenues.length > 0 && citySlug && (
              <FeaturedVenues venues={featuredVenues} citySlug={citySlug} variant="footer" />
            )}
          </div>
          <div className="flex gap-8 text-sm text-text-muted">
            <nav aria-label="Cities" className="space-y-2">
              <h3 className="text-text font-medium">Cities</h3>
              {cities.map((city) => (
                city.live ? (
                  <Link
                    key={city.slug}
                    href={`/${city.slug}`}
                    className="block hover:text-text transition-colors"
                  >
                    {city.name}
                  </Link>
                ) : (
                  <span
                    key={city.slug}
                    className="block text-text-muted/50"
                  >
                    {city.name}
                  </span>
                )
              ))}
            </nav>
            <nav aria-label="Fifth Set" className="space-y-2">
              <h3 className="text-text font-medium">Fifth Set</h3>
              <Link
                href="/for-venues"
                className="block hover:text-text transition-colors"
              >
                For Venues
              </Link>
              <Link
                href="/submit"
                className="block hover:text-text transition-colors"
              >
                Submit a Show
              </Link>
              <Link
                href="/about"
                className="block hover:text-text transition-colors"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Fifth Set. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
