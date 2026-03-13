"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFavoriteEvents, getFavoriteVenues } from "@/lib/supabase/queries";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import VenueCard from "@/components/VenueCard";
import type { Event, Venue } from "@/lib/types";

export default function SavedPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const [favEvents, favVenues] = await Promise.all([
        getFavoriteEvents(supabase, user.id),
        getFavoriteVenues(supabase, user.id),
      ]);

      setEvents(favEvents);
      setVenues(favVenues);
      setLoading(false);
    }

    load();
  }, [router]);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-bg pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl text-text mb-8">Saved</h1>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-surface rounded-lg" />
              <div className="h-32 bg-surface rounded-lg" />
            </div>
          ) : events.length === 0 && venues.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-8 h-8 text-text-muted/30 mx-auto mb-4" />
              <p className="text-text-muted">
                Nothing saved yet. Star shows and venues to find them here.
              </p>
            </div>
          ) : (
            <>
              {events.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-serif text-xl text-text-muted mb-4">
                    Starred Shows
                  </h2>
                  <div className="grid gap-4">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        citySlug={event.venue.city_slug}
                        starred
                      />
                    ))}
                  </div>
                </section>
              )}

              {venues.length > 0 && (
                <section>
                  <h2 className="font-serif text-xl text-text-muted mb-4">
                    Starred Venues
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {venues.map((venue) => (
                      <VenueCard
                        key={venue.id}
                        venue={venue}
                        citySlug={venue.city_slug}
                        starred
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
