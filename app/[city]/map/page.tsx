"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCityBySlug } from "@/lib/cities";
import { createClient } from "@/lib/supabase/client";
import { getVenues, getEvents } from "@/lib/supabase/queries";
import { formatTime, formatDateFull, cn } from "@/lib/utils";
import { Venue, Event } from "@/lib/types";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
      Loading map...
    </div>
  ),
});

type DateScope = "tonight" | "tomorrow" | "this-weekend" | "this-week" | "next-week";

function getDatesForScope(scope: DateScope): string[] {
  const today = new Date();
  const dates: string[] = [];

  switch (scope) {
    case "tonight":
      dates.push(today.toISOString().split("T")[0]);
      break;
    case "tomorrow": {
      const tmrw = new Date(today);
      tmrw.setDate(today.getDate() + 1);
      dates.push(tmrw.toISOString().split("T")[0]);
      break;
    }
    case "this-weekend":
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0) {
          dates.push(d.toISOString().split("T")[0]);
        }
      }
      break;
    case "this-week": {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
      }
      break;
    }
    case "next-week": {
      const day2 = today.getDay();
      const nextMon = new Date(today);
      nextMon.setDate(today.getDate() + (day2 === 0 ? 1 : 8 - day2));
      for (let i = 0; i < 7; i++) {
        const d = new Date(nextMon);
        d.setDate(nextMon.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
      }
      break;
    }
  }
  return dates;
}

const scopeLabels: Record<DateScope, string> = {
  tonight: "Tonight",
  tomorrow: "Tomorrow",
  "this-weekend": "This Weekend",
  "this-week": "This Week",
  "next-week": "Next Week",
};

function VenueList({
  venues,
  events,
  citySlug,
  scopeLabel,
  loading,
}: {
  venues: Venue[];
  events: Event[];
  citySlug: string;
  scopeLabel: string;
  loading: boolean;
}) {
  const venuesWithShows = venues.filter((v) =>
    events.some((e) => e.venue_id === v.id)
  );
  const venuesWithoutShows = venues.filter(
    (v) => !events.some((e) => e.venue_id === v.id)
  );

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs uppercase tracking-wider text-text-muted mb-3">
        Venues with shows {scopeLabel}
      </p>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-surface-hover rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-hover rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {venuesWithShows.map((venue) => {
            const venueEvents = events.filter(
              (e) => e.venue_id === venue.id
            );
            return (
              <Link
                key={venue.id}
                href={`/${citySlug}/venues/${venue.slug}`}
                className="block bg-surface rounded-lg p-3 card-glow"
              >
                <h3 className="font-serif text-sm text-text">
                  {venue.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {venue.neighborhood}
                </p>
                <div className="mt-2 space-y-1">
                  {venueEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-text-muted truncate">
                        {e.artist.name}
                      </span>
                      <span className="text-text-muted font-mono ml-2 shrink-0">
                        {formatTime(e.start_time)}
                      </span>
                    </div>
                  ))}
                  {venueEvents.length > 3 && (
                    <p className="text-xs text-accent">
                      +{venueEvents.length - 3} more
                    </p>
                  )}
                </div>
              </Link>
            );
          })}

          {venuesWithoutShows.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-text-muted mt-6 mb-3">
                Other venues
              </p>
              {venuesWithoutShows.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/${citySlug}/venues/${venue.slug}`}
                  className="block bg-surface/50 rounded-lg p-3 card-glow"
                >
                  <h3 className="font-serif text-sm text-text-muted">
                    {venue.name}
                  </h3>
                  <p className="text-xs text-text-muted/60 mt-0.5">
                    {venue.neighborhood}
                  </p>
                </Link>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function MapPage() {
  const params = useParams();
  const city = getCityBySlug(params.city as string);
  const [scope, setScope] = useState<DateScope>("tonight");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");

  const supabase = useMemo(() => createClient(), []);
  const scopeDates = useMemo(() => getDatesForScope(scope), [scope]);

  // Fetch venues once on mount
  useEffect(() => {
    if (!city) return;

    setLoading(true);
    getVenues(supabase, city.slug)
      .then(setVenues)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [supabase, city]);

  // Fetch events when scope changes
  useEffect(() => {
    if (!city || scopeDates.length === 0) return;

    getEvents(supabase, city.slug, scopeDates)
      .then(setEvents)
      .catch(console.error);
  }, [supabase, city, scopeDates]);

  if (!city) return null;

  const scopeDateLabel = scopeDates.length === 1
    ? formatDateFull(scopeDates[0])
    : `${formatDateFull(scopeDates[0])} \u2013 ${formatDateFull(scopeDates[scopeDates.length - 1])}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Map header */}
      <div className="px-4 sm:px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl text-text">
              Jazz Map{" "}
              <span className="text-accent">{city.name}</span>
            </h1>
            <p className="text-xs text-text-muted font-mono mt-0.5">
              {scopeLabels[scope]} / {scopeDateLabel}
              <span className="ml-2 text-text-muted/60">
                {venues.length} venues, {events.length} shows
              </span>
            </p>
          </div>

          {/* Date scope pills */}
          <div className="hidden sm:flex items-center gap-1">
            {(Object.keys(scopeLabels) as DateScope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  scope === s
                    ? "bg-accent text-bg font-medium"
                    : "text-text-muted hover:text-text hover:bg-surface-hover"
                )}
              >
                {scopeLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile date scope */}
        <div className="sm:hidden flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          {(Object.keys(scopeLabels) as DateScope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full shrink-0 transition-colors",
                scope === s
                  ? "bg-accent text-bg font-medium"
                  : "bg-surface text-text-muted"
              )}
            >
              {scopeLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="lg:hidden flex border-b border-border">
        <button
          onClick={() => setView("map")}
          className={cn(
            "flex-1 py-2 text-sm text-center transition-colors",
            view === "map"
              ? "text-accent border-b-2 border-accent"
              : "text-text-muted"
          )}
        >
          Map
        </button>
        <button
          onClick={() => setView("list")}
          className={cn(
            "flex-1 py-2 text-sm text-center transition-colors",
            view === "list"
              ? "text-accent border-b-2 border-accent"
              : "text-text-muted"
          )}
        >
          List
        </button>
      </div>

      {/* Map + sidebar layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className={cn("flex-1", view === "list" && "hidden lg:block")}>
          <MapView
            venues={venues}
            events={events}
            center={[city.lng, city.lat]}
            zoom={12}
            citySlug={city.slug}
          />
        </div>

        {/* Mobile list view */}
        <div
          className={cn(
            "flex-1 overflow-y-auto bg-bg",
            view === "map" ? "hidden lg:hidden" : "lg:hidden"
          )}
        >
          <VenueList
            venues={venues}
            events={events}
            citySlug={city.slug}
            scopeLabel={scopeLabels[scope].toLowerCase()}
            loading={loading}
          />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-80 border-l border-border overflow-y-auto bg-bg">
          <VenueList
            venues={venues}
            events={events}
            citySlug={city.slug}
            scopeLabel={scopeLabels[scope].toLowerCase()}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
