import Image from 'next/image';
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

  if (venue.photo_url) {
    return (
      <Link
        href={`/${citySlug}/venues/${venue.slug}`}
        className={cn(
          'group relative rounded-lg overflow-hidden card-glow transition-all h-56',
          isFeatured && 'featured-border',
        )}
      >
        <Image
          src={venue.photo_url}
          alt={venue.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-serif text-base text-white truncate group-hover:text-accent transition-colors">
                {venue.name}
              </h3>
              {isFeatured && (
                <Star className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />
              )}
            </div>
            <StarButton type="venue" id={venue.id} initialStarred={starred} />
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {venue.neighborhood}
            </span>
            {eventCount !== undefined && (
              <span className="text-xs text-white/50">
                {eventCount} {eventCount === 1 ? 'show' : 'shows'}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

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
