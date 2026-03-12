import Link from "next/link";
import { MapPin, ExternalLink, Star } from "lucide-react";
import { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VenueCardProps {
  venue: Venue;
  citySlug: string;
  eventCount?: number;
}

export default function VenueCard({ venue, citySlug, eventCount }: VenueCardProps) {
  const isFeatured = venue.sponsor_tier === "marquee" || venue.sponsor_tier === "spotlight";

  return (
    <Link
      href={`/${citySlug}/venues/${venue.slug}`}
      className={cn(
        "group block bg-surface rounded-lg p-5 card-glow transition-all",
        isFeatured && "featured-border",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg text-text group-hover:text-accent transition-colors">
              {venue.name}
            </h3>
            {isFeatured && (
              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-text-muted">
            <MapPin className="w-3.5 h-3.5" />
            {venue.neighborhood}
          </div>
        </div>
        {venue.website && (
          <ExternalLink className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {eventCount !== undefined && (
        <p className="mt-3 text-sm text-text-muted">
          {eventCount} {eventCount === 1 ? "show" : "shows"} this week
        </p>
      )}

      <p className="mt-2 text-xs text-text-muted/70">{venue.address}</p>
    </Link>
  );
}
