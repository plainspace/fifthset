import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { Venue } from '@/lib/types';
import { cn } from '@/lib/utils';
import StarButton from '@/components/StarButton';

interface VenueCardProps {
  venue: Venue;
  citySlug: string;
  eventCount?: number;
  starred?: boolean;
}

export default function VenueCard({
  venue,
  citySlug,
  eventCount,
  starred,
}: VenueCardProps) {
  const isFeatured =
    venue.sponsor_tier === 'marquee' || venue.sponsor_tier === 'spotlight';

  return (
    <Link
      href={`/${citySlug}/venues/${venue.slug}`}
      className={cn(
        'group flex flex-col bg-surface rounded-lg p-5 card-glow transition-all',
        isFeatured && 'featured-border',
      )}
    >
      <div className="grow">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg text-text group-hover:text-accent transition-colors">
            {venue.name}
          </h3>
          {isFeatured && (
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
          )}
        </div>
        {eventCount !== undefined && (
          <p className="mt-1 text-sm text-text-muted">
            {eventCount} {eventCount === 1 ? 'show' : 'shows'} this week
          </p>
        )}
      </div>
      <div className="flex items-end justify-between gap-4 mt-3">
        <div className="flex flex-col gap-1.5 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {venue.neighborhood}
          </span>
          {venue.address && (
            <p className="text-xs text-text-muted/70 text-balance">
              {venue.address}
            </p>
          )}
        </div>
        <StarButton type="venue" id={venue.id} initialStarred={starred} />
      </div>
    </Link>
  );
}
