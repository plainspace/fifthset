import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/types";

interface FeaturedVenuesProps {
  venues: Venue[];
  citySlug: string;
  variant?: "hero" | "footer";
}

const tierOrder = { marquee: 0, spotlight: 1 } as const;

export default function FeaturedVenues({
  venues,
  citySlug,
  variant = "hero",
}: FeaturedVenuesProps) {
  const featured = venues
    .filter(
      (v) => v.sponsor_tier === "marquee" || v.sponsor_tier === "spotlight"
    )
    .sort((a, b) => tierOrder[a.sponsor_tier as keyof typeof tierOrder] - tierOrder[b.sponsor_tier as keyof typeof tierOrder]);

  if (featured.length === 0) return null;

  if (variant === "footer") {
    return (
      <div className="bg-surface border border-accent/20 rounded-lg p-4 max-w-xs">
        <p className="font-mono text-xs uppercase tracking-widest text-accent/70 mb-3">
          Featured Venues
        </p>
        <div className="flex flex-col gap-2">
          {featured.map((venue) => (
            <Link
              key={venue.id}
              href={`/${citySlug}/venues/${venue.slug}`}
              className="flex items-center gap-2 group"
            >
              <Star className="w-3 h-3 text-accent fill-accent" aria-hidden="true" />
              <span className="text-sm text-text-muted group-hover:text-text transition-colors">
                {venue.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sm:text-right">
      <p className="font-mono text-xs uppercase tracking-widest text-accent/70 mb-2">
        Featured Venues
      </p>
      <div className="flex sm:justify-end gap-2 overflow-x-auto scrollbar-hide touch-pan-x">
        {featured.map((venue) => (
          <Link
            key={venue.id}
            href={`/${citySlug}/venues/${venue.slug}`}
            className={cn(
              "bg-surface border border-accent/20 rounded-lg px-3 py-2",
              "hover:border-accent/50 transition-all",
              "flex items-center gap-2 shrink-0"
            )}
          >
            <Star className="w-3 h-3 text-accent fill-accent shrink-0" aria-hidden="true" />
            <span className="text-sm text-text font-medium whitespace-nowrap">
              {venue.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
