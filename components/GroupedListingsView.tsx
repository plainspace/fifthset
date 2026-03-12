"use client";

import { useState, useMemo } from "react";
import { Music } from "lucide-react";
import { City, Event, TimeOfDay } from "@/lib/types";
import { getTimeOfDay, getDateLabel, formatDateFull } from "@/lib/utils";
import FilterBar from "@/components/FilterBar";
import EventCard from "@/components/EventCard";

interface GroupedListingsViewProps {
  city: City;
  events: Event[];
  title: string;
  dateRange: string;
  showLabel: string;
}

export default function GroupedListingsView({
  city,
  events,
  title,
  dateRange,
  showLabel,
}: GroupedListingsViewProps) {
  const [activeRegion, setActiveRegion] = useState<string | undefined>();
  const [activeTime, setActiveTime] = useState<TimeOfDay | undefined>();

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => !activeRegion || e.venue.region === activeRegion)
      .filter(
        (e) => !activeTime || getTimeOfDay(e.start_time) === activeTime
      );
  }, [events, activeRegion, activeTime]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Record<string, Event[]>>((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-text">
          {title} in{" "}
          <span className="text-accent">{city.name}</span>
        </h1>
        <p className="text-text-muted mt-2">
          <span className="font-mono text-sm">{dateRange}</span>
        </p>
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

      {Object.keys(eventsByDate).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">No shows found {showLabel}</p>
          <p className="text-text-muted/60 text-sm mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(eventsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateEvents]) => (
              <div key={date}>
                <h2 className="text-sm text-text-muted mb-4">
                  <span className="uppercase tracking-wider">
                    {getDateLabel(date)}
                  </span>
                  <span className="text-text-muted/60 mx-1.5">/</span>
                  <span className="font-mono">{formatDateFull(date)}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dateEvents
                    .sort((a, b) =>
                      a.start_time.localeCompare(b.start_time)
                    )
                    .map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        citySlug={city.slug}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
