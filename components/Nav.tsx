"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { MapPin, Menu, X, ChevronDown } from "lucide-react";
import { cities } from "@/lib/cities";
import { cn } from "@/lib/utils";
import Search from "@/components/Search";

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const currentCity = cities.find((c) => c.slug === params.city) || cities[0];

  const dateFilters = [
    { label: "Tonight", href: `/${currentCity.slug}` },
    { label: "Tomorrow", href: `/${currentCity.slug}/tomorrow` },
    { label: "This Weekend", href: `/${currentCity.slug}/this-weekend` },
    { label: "This Week", href: `/${currentCity.slug}/this-week` },
    { label: "Next Week", href: `/${currentCity.slug}/next-week` },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${currentCity.slug}`} className="flex items-center gap-2">
            <span className="font-serif text-xl text-accent tracking-tight">
              Fifth Set
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* City selector */}
            <div className="relative">
              <button
                onClick={() => setCityOpen(!cityOpen)}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {currentCity.name}
                <ChevronDown className={cn("w-3 h-3 transition-transform", cityOpen && "rotate-180")} />
              </button>
              {cityOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setCityOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[180px]">
                    {cities.map((city) => (
                      <Link
                        key={city.slug}
                        href={`/${city.slug}`}
                        onClick={() => setCityOpen(false)}
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors",
                          city.slug === currentCity.slug
                            ? "text-accent bg-surface-hover"
                            : "text-text-muted hover:text-text hover:bg-surface-hover"
                        )}
                      >
                        {city.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date filters */}
            <div className="flex items-center gap-1">
              {dateFilters.map((filter) => (
                <Link
                  key={filter.label}
                  href={filter.href}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    pathname === filter.href
                      ? "bg-accent text-bg font-medium"
                      : "text-text-muted hover:text-text hover:bg-surface-hover"
                  )}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            <Search />

            {/* Map link */}
            <Link
              href={`/${currentCity.slug}/map`}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Map
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-muted hover:text-text"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-4">
            {/* City selector */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-text-muted">City</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/${city.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full transition-colors",
                      city.slug === currentCity.slug
                        ? "bg-accent text-bg"
                        : "bg-surface text-text-muted"
                    )}
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Date filters */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-text-muted">When</p>
              <div className="flex flex-wrap gap-2">
                {dateFilters.map((filter) => (
                  <Link
                    key={filter.label}
                    href={filter.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full transition-colors",
                      pathname === filter.href
                        ? "bg-accent text-bg"
                        : "bg-surface text-text-muted"
                    )}
                  >
                    {filter.label}
                  </Link>
                ))}
              </div>
            </div>

            <Search />

            {/* Map link */}
            <Link
              href={`/${currentCity.slug}/map`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-text-muted hover:text-text py-2"
            >
              <MapPin className="w-4 h-4" />
              Map View
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
