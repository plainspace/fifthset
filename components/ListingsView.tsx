'use client';

import { useMemo } from 'react';
import { Music } from 'lucide-react';
import { City, Event } from '@/lib/types';
import { getTimeOfDay } from '@/lib/utils';
import { useFilterParams } from '@/lib/useFilterParams';
import FilterBar from '@/components/FilterBar';
import EventList from '@/components/EventList';
import FeaturedVenues from '@/components/FeaturedVenues';

interface ListingsViewProps {
  city: City;
  events: Event[];
  heading: string;
  subtitle: string;
  showLabel: string;
  hideCity?: boolean;
}

export default function ListingsView({
  city,
  events,
  heading,
  subtitle,
  showLabel,
  hideCity,
}: ListingsViewProps) {
  const {
    activeRegions,
    activeTimes,
    toggleRegion,
    toggleTime,
    clearRegions,
    clearTimes,
  } = useFilterParams();

  const featuredVenues = useMemo(() => {
    const seen = new Set<string>();
    return events
      .filter((e) => {
        if (e.venue.sponsor_tier === 'free') return false;
        if (seen.has(e.venue.id)) return false;
        seen.add(e.venue.id);
        return true;
      })
      .map((e) => e.venue);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => activeRegions.size === 0 || activeRegions.has(e.venue.region))
      .filter((e) => activeTimes.size === 0 || activeTimes.has(getTimeOfDay(e.start_time)))
      .sort((a, b) => {
        if (a.is_boosted !== b.is_boosted) return a.is_boosted ? -1 : 1;
        const aFeatured = a.venue.sponsor_tier !== 'free';
        const bFeatured = b.venue.sponsor_tier !== 'free';
        if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [events, activeRegions, activeTimes]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-text text-pretty">
            {heading}{!hideCity && <> in <span className="text-accent">{city.name}</span></>}
          </h1>
          <p className="text-text-muted mt-2">{subtitle}</p>
          <p className="text-xs font-mono text-text-muted/60 mt-1">Updated daily</p>
        </div>
        {featuredVenues.length > 0 && (
          <FeaturedVenues venues={featuredVenues} citySlug={city.slug} />
        )}
      </div>

      <div className="mb-8">
        <FilterBar
          city={city}
          activeRegions={activeRegions}
          activeTimes={activeTimes}
          onRegionToggle={toggleRegion}
          onTimeToggle={toggleTime}
          onClearRegions={clearRegions}
          onClearTimes={clearTimes}
        />
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
        <Music className="w-4 h-4" aria-hidden="true" />
        <span>
          {filteredEvents.length}{' '}
          {filteredEvents.length === 1 ? 'show' : 'shows'} {showLabel}
        </span>
      </div>

      <EventList events={filteredEvents} citySlug={city.slug} />
    </div>
  );
}
