import Link from 'next/link';
import FeaturedVenues from "@/components/FeaturedVenues";
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
              <span className="font-serif text-lg text-accent">Fifth Set</span>
              <p className="text-text-muted text-sm mt-2 max-w-xs text-balance">
                Find live jazz tonight. Every city, every venue, every set.
              </p>
            </div>
            {featuredVenues && featuredVenues.length > 0 && citySlug && (
              <FeaturedVenues venues={featuredVenues} citySlug={citySlug} variant="footer" />
            )}
          </div>
          <div className="flex gap-8 text-sm text-text-muted">
            <div className="space-y-2">
              <p className="text-text font-medium">Cities</p>
              <Link
                href="/nyc"
                className="block hover:text-text transition-colors"
              >
                New York
              </Link>
              <Link
                href="/chicago"
                className="block hover:text-text transition-colors"
              >
                Chicago
              </Link>
              <Link
                href="/nola"
                className="block hover:text-text transition-colors"
              >
                New Orleans
              </Link>
              <Link
                href="/la"
                className="block hover:text-text transition-colors"
              >
                Los Angeles
              </Link>
              <Link
                href="/sf"
                className="block hover:text-text transition-colors"
              >
                San Francisco
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-text font-medium">Fifth Set</p>
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
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Fifth Set. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
