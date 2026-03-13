import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import { Event } from '@/lib/types';
import { formatTime, cn } from '@/lib/utils';
import { getCityBySlug } from '@/lib/cities';
import LiveBadge from '@/components/LiveBadge';

interface EventCardProps {
  event: Event;
  citySlug: string;
}

export default function EventCard({ event, citySlug }: EventCardProps) {
  const city = getCityBySlug(citySlug);
  const isFeatured =
    event.venue.sponsor_tier === 'marquee' ||
    event.venue.sponsor_tier === 'spotlight';
  const isBoosted = event.is_boosted;

  return (
    <div
      className={cn(
        'group relative bg-surface rounded-lg p-5 card-glow card-enter transition-all',
        (isFeatured || isBoosted) && 'featured-border',
      )}
    >
      <LiveBadge
        event={event}
        timezone={city?.timezone ?? 'America/New_York'}
        isFeatured={isFeatured}
      />

      {/* Artist */}
      <Link
        href={`/${citySlug}/artists/${event.artist.slug}`}
        className="font-serif text-xl text-text hover:text-accent transition-colors pr-20 block text-pretty"
      >
        {event.artist.name}
      </Link>

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
