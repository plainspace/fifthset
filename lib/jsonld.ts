import { Event, Venue } from "./types";

const SITE_URL = "https://fifthset.live";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fifth Set",
    url: SITE_URL,
    description:
      "Find live jazz tonight. Listings, maps, and venue guides for jazz in NYC and beyond.",
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fifth Set",
    url: SITE_URL,
    description: "Find live jazz tonight.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/nyc?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function eventSchema(event: Event, citySlug: string, date: string) {
  const startDateTime = `${date}T${event.start_time}:00`;
  const endDateTime = event.end_time
    ? `${date}T${event.end_time}:00`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${event.artist.name} at ${event.venue.name}`,
    startDate: startDateTime,
    ...(endDateTime && { endDate: endDateTime }),
    location: {
      "@type": "MusicVenue",
      name: event.venue.name,
      url: `${SITE_URL}/${citySlug}/venues/${event.venue.slug}`,
      ...(event.venue.address && {
        address: {
          "@type": "PostalAddress",
          streetAddress: event.venue.address,
        },
      }),
      ...(event.venue.lat &&
        event.venue.lng && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: event.venue.lat,
            longitude: event.venue.lng,
          },
        }),
    },
    performer: {
      "@type": "MusicGroup",
      name: event.artist.name,
      url: `${SITE_URL}/${citySlug}/artists/${event.artist.slug}`,
    },
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };
}

export function venueSchema(venue: Venue, citySlug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicVenue",
    name: venue.name,
    url: `${SITE_URL}/${citySlug}/venues/${venue.slug}`,
    ...(venue.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: venue.address,
      },
    }),
    ...(venue.lat &&
      venue.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: venue.lat,
          longitude: venue.lng,
        },
      }),
    ...(venue.website && { sameAs: [venue.website] }),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
