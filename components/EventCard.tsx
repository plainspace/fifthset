import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Event } from "@/lib/types";
import { formatTime, isLiveNow, cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  citySlug: string;
}

export default function EventCard({ event, citySlug }: EventCardProps) {
  const live = isLiveNow(event);
  const isFeatured = event.venue.sponsor_tier === "marquee" || event.venue.sponsor_tier === "spotlight";
  const isBoosted = event.is_boosted;

  return (
    <div
      className={cn(
        "group relative bg-surface rounded-lg p-5 card-glow transition-all",
        (isFeatured || isBoosted) && "featured-border",
      )}
    >
      {/* Live badge */}
      {live && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
          <span className="text-xs font-medium text-live uppercase tracking-wider">
            Live Now
          </span>
        </div>
      )}

      {/* Featured badge */}
      {isFeatured && !live && (
        <div className="absolute top-4 right-4">
          <span className="text-xs font-medium text-accent/70 uppercase tracking-wider">
            Featured
          </span>
        </div>
      )}

      {/* Artist */}
      <h3 className="font-serif text-xl text-text group-hover:text-accent transition-colors pr-20">
        {event.artist.name}
      </h3>

      {/* Venue */}
      <Link
        href={`/${citySlug}/venues/${event.venue.slug}`}
        className="inline-block mt-1 text-sm text-text-muted hover:text-accent transition-colors"
      >
        {event.venue.name}
      </Link>

      {/* Address */}
      {event.venue.address && (
        <p className="mt-1 text-xs text-text-muted/60 truncate">
          {event.venue.address}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">
            {formatTime(event.start_time)}
            {event.end_time && ` to ${formatTime(event.end_time)}`}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {event.venue.neighborhood}
        </span>
      </div>
    </div>
  );
}
