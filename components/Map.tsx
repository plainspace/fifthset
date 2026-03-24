"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Venue, Event } from "@/lib/types";
import { formatTime } from "@/lib/utils";

const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface MapViewProps {
  venues: Venue[];
  events: Event[];
  center: [number, number];
  zoom?: number;
  citySlug: string;
}

export default function MapView({
  venues,
  events,
  center,
  zoom = 12,
  citySlug,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_STYLE,
      center,
      zoom,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      const styles = getComputedStyle(document.documentElement);
      const accentColor = styles.getPropertyValue("--color-accent").trim() || "#d4a24e";
      const mutedColor = styles.getPropertyValue("--color-text-muted").trim() || "#8a7e6d";
      const textColor = styles.getPropertyValue("--color-text").trim() || "#f0e6d3";
      const surfaceColor = styles.getPropertyValue("--color-surface").trim() || "#242019";
      const borderColor = styles.getPropertyValue("--color-border").trim() || "#3a3530";

      venues.forEach((venue) => {
        if (!venue.lat || !venue.lng) return;

        const venueEvents = events.filter((e) => e.venue_id === venue.id);
        const hasShows = venueEvents.length > 0;
        const isFeatured =
          venue.sponsor_tier === "marquee" ||
          venue.sponsor_tier === "spotlight";

        const size = isFeatured ? 16 : 12;

        // Outer wrapper that MapLibre positions via transform
        const wrapper = document.createElement("div");
        wrapper.style.cssText = `width: ${size}px; height: ${size}px; cursor: pointer;`;

        // Inner dot that we scale on hover (doesn't interfere with MapLibre's transform)
        const dot = document.createElement("div");
        dot.style.cssText = `
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${hasShows ? accentColor : mutedColor};
          border: 2px solid ${isFeatured ? accentColor : "transparent"};
          box-shadow: ${hasShows ? `0 0 12px ${accentColor}66` : "none"};
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;

        wrapper.appendChild(dot);

        wrapper.setAttribute("role", "button");
        wrapper.setAttribute("tabindex", "0");
        wrapper.setAttribute("aria-label", `${venue.name}, ${venue.neighborhood}${hasShows ? `, ${venueEvents.length} shows` : ""}`);

        wrapper.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            wrapper.click();
          }
        });

        wrapper.addEventListener("mouseenter", () => {
          dot.style.transform = "scale(1.5)";
          dot.style.boxShadow = `0 0 20px ${accentColor}99`;
        });
        wrapper.addEventListener("mouseleave", () => {
          dot.style.transform = "scale(1)";
          dot.style.boxShadow = hasShows
            ? `0 0 12px ${accentColor}66`
            : "none";
        });

        // Popup content
        const showsHtml = venueEvents
          .map(
            (e) =>
              `<div style="margin-top: 6px; font-size: 12px;">
                <span style="color: ${textColor};">${e.artist.name}</span>
                <span style="color: ${mutedColor}; font-family: monospace; margin-left: 6px;">
                  ${formatTime(e.start_time)}
                </span>
              </div>`
          )
          .join("");

        const popup = new maplibregl.Popup({
          offset: 12,
          closeButton: false,
          maxWidth: "240px",
          className: "fifthset-popup",
        }).setHTML(
          `<div style="background: ${surfaceColor}; padding: 12px; border-radius: 8px; border: 1px solid ${borderColor};">
            <a href="/${citySlug}/venues/${venue.slug}"
               style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: ${accentColor}; text-decoration: none;">
              ${venue.name}
            </a>
            <div style="font-size: 12px; color: ${mutedColor}; margin-top: 2px;">
              ${venue.neighborhood}
            </div>
            ${
              venueEvents.length > 0
                ? `<div style="margin-top: 8px; border-top: 1px solid ${borderColor}; padding-top: 8px;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${mutedColor};">
                      Tonight
                    </div>
                    ${showsHtml}
                  </div>`
                : `<div style="font-size: 12px; color: ${mutedColor}; margin-top: 6px;">No shows tonight</div>`
            }
          </div>`
        );

        new maplibregl.Marker({ element: wrapper, anchor: "center" })
          .setLngLat([venue.lng, venue.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [venues, events, center, zoom, citySlug]);

  return (
    <>
      <style jsx global>{`
        .fifthset-popup .maplibregl-popup-content {
          background: transparent;
          padding: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          border-radius: 8px;
        }
        .fifthset-popup .maplibregl-popup-tip {
          border-top-color: var(--color-border, #3a3530);
        }
      `}</style>
      <div
        ref={mapContainer}
        role="application"
        aria-label="Interactive jazz venue map"
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />
    </>
  );
}
