"use client";

import { useState, useMemo } from "react";
import { Music } from "lucide-react";
import { City, Event, TimeOfDay } from "@/lib/types";
import { getTimeOfDay } from "@/lib/utils";
import FilterBar from "@/components/FilterBar";
import EventList from "@/components/EventList";
import FeaturedVenues from "@/components/FeaturedVenues";

interface ListingsViewProps {
  city: City;
  events: Event[];
  heading: string;
  subtitle: string;
  showLabel: string;
}

export default function ListingsView({
  city,
  events,
  heading,
  subtitle,
  showLabel,
}: ListingsViewProps) {
  const [activeRegion, setActiveRegion] = useState<string | undefined>();
  const [activeTime, setActiveTime] = useState<TimeOfDay | undefined>();

  const featuredVenues = useMemo(() => {
    const seen = new Set<string>();
    return events
      .filter((e) => {
        if (e.venue.sponsor_tier === "free") return false;
        if (seen.has(e.venue.id)) return false;
        seen.add(e.venue.id);
        return true;
      })
      .map((e) => e.venue);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => !activeRegion || e.venue.region === activeRegion)
      .filter(
        (e) => !activeTime || getTimeOfDay(e.start_time) === activeTime
      )
      .sort((a, b) => {
        if (a.is_boosted !== b.is_boosted) return a.is_boosted ? -1 : 1;
        const aFeatured = a.venue.sponsor_tier !== "free";
        const bFeatured = b.venue.sponsor_tier !== "free";
        if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [events, activeRegion, activeTime]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-text">
            {heading} in{" "}
            <span className="text-accent">{city.name}</span>
          </h1>
          <p className="text-text-muted mt-2">{subtitle}</p>
        </div>
        {featuredVenues.length > 0 && (
          <FeaturedVenues venues={featuredVenues} citySlug={city.slug} />
        )}
      </div>

      <div className="mb-8">
        <FilterBar
          city={city}
          activeRegion={activeRegion}
          activeTime={activeTime}
          onRegionChange={setActiveRegion}
          onTimeChange={setActiveTime}
        />
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
        <Music className="w-4 h-4" />
        <span>
          {filteredEvents.length}{" "}
          {filteredEvents.length === 1 ? "show" : "shows"} {showLabel}
        </span>
      </div>

      <EventList events={filteredEvents} citySlug={city.slug} />
    </div>
  );
}
