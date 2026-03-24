'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { MapPin, Menu, ChevronDown, Music, Star, Calendar } from 'lucide-react';
import { cities } from '@/lib/cities';
import { cn } from '@/lib/utils';
import Search from '@/components/Search';
import UserMenu from '@/components/UserMenu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const dateFiltersConfig = [
  { label: 'Tonight', short: 'Tonight', fullLabel: 'Tonight', href: '' },
  {
    label: 'Tomorrow',
    short: 'Tmrw',
    fullLabel: 'Tomorrow',
    href: '/tomorrow',
  },
  {
    label: 'Weekend',
    short: 'Wknd',
    fullLabel: 'This Weekend',
    href: '/this-weekend',
  },
  {
    label: 'This Wk',
    short: 'Week',
    fullLabel: 'This Week',
    href: '/this-week',
  },
  {
    label: 'Next Wk',
    short: 'Next',
    fullLabel: 'Next Week',
    href: '/next-week',
  },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const cityMenuRef = useRef<HTMLDivElement>(null);
  const cityTriggerRef = useRef<HTMLButtonElement>(null);
  const periodTriggerRef = useRef<HTMLButtonElement>(null);
  const params = useParams();
  const pathname = usePathname();
  const currentCity = cities.find((c) => c.slug === params.city) || cities[0];

  // Close period dropdown on outside click
  useEffect(() => {
    if (!periodOpen) return;
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [periodOpen]);

  const handleMenuKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      menuRef: React.RefObject<HTMLDivElement | null>,
      setOpen: (v: boolean) => void,
      triggerRef: React.RefObject<HTMLButtonElement | null>,
    ) => {
      const menu = menuRef.current;
      if (!menu) return;
      const items = menu.querySelectorAll<HTMLElement>("[role='menuitem']");
      if (items.length === 0) return;
      const currentIndex = Array.from(items).indexOf(
        document.activeElement as HTMLElement,
      );

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[next].focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prev].focus();
          break;
        }
        case 'Home': {
          e.preventDefault();
          items[0].focus();
          break;
        }
        case 'End': {
          e.preventDefault();
          items[items.length - 1].focus();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!cityOpen || !cityMenuRef.current) return;
    const items =
      cityMenuRef.current.querySelectorAll<HTMLElement>("[role='menuitem']");
    const active = Array.from(items).find((el) =>
      el.classList.contains('text-accent'),
    );
    (active || items[0])?.focus();
  }, [cityOpen]);

  useEffect(() => {
    if (!periodOpen || !periodRef.current) return;
    const menu = periodRef.current.querySelector<HTMLElement>("[role='menu']");
    if (!menu) return;
    const items = menu.querySelectorAll<HTMLElement>("[role='menuitem']");
    const active = Array.from(items).find((el) =>
      el.classList.contains('text-accent'),
    );
    (active || items[0])?.focus();
  }, [periodOpen]);

  const dateFilters = dateFiltersConfig.map((f) => ({
    ...f,
    href: f.href ? `/${currentCity.slug}${f.href}` : `/${currentCity.slug}`,
    fullLabel: f.fullLabel,
  }));

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-40 bg-bg/90 backdrop-blur-md border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + City selector */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <span className="font-serif text-xl text-accent tracking-tight">
                Fifth Set
              </span>
            </Link>

            {/* City selector (desktop) */}
            <div className="hidden md:block relative">
              <button
                ref={cityTriggerRef}
                onClick={() => setCityOpen(!cityOpen)}
                aria-expanded={cityOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span className="hidden lg:inline">{currentCity.name}</span>
                <span className="lg:hidden">
                  {currentCity.slug.toUpperCase()}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    cityOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
              {cityOpen && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setCityOpen(false)}
                  />
                  <div
                    ref={cityMenuRef}
                    role="menu"
                    onKeyDown={(e) =>
                      handleMenuKeyDown(
                        e,
                        cityMenuRef,
                        setCityOpen,
                        cityTriggerRef,
                      )
                    }
                    className="absolute top-full mt-2 left-0 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[180px]"
                  >
                    {cities.map((city) =>
                      city.live ? (
                        <Link
                          key={city.slug}
                          href={`/${city.slug}`}
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => setCityOpen(false)}
                          className={cn(
                            'block px-4 py-2 text-sm transition-colors',
                            city.slug === currentCity.slug
                              ? 'text-accent bg-surface-hover'
                              : 'text-text-muted hover:text-text hover:bg-surface-hover',
                          )}
                        >
                          {city.name}
                        </Link>
                      ) : (
                        <span
                          key={city.slug}
                          className="flex items-center justify-between px-4 py-2 text-sm text-text-muted/50 cursor-default"
                        >
                          {city.name}
                          <span className="text-[10px] uppercase tracking-wider bg-surface-hover rounded px-1.5 py-0.5">
                            Soon
                          </span>
                        </span>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2 lg:gap-5 ml-auto">
            {/* Date filters */}
            <div className="flex items-center gap-0.5 lg:gap-1">
              {dateFilters.map((filter) => (
                <Link
                  key={filter.label}
                  href={filter.href}
                  aria-label={filter.fullLabel}
                  aria-current={pathname === filter.href ? 'page' : undefined}
                  className={cn(
                    'px-2 lg:px-3 py-1.5 text-xs lg:text-sm rounded-full transition-colors whitespace-nowrap',
                    pathname === filter.href
                      ? 'bg-accent text-bg font-medium'
                      : 'text-text-muted hover:text-text hover:bg-surface-hover',
                  )}
                >
                  <span className="hidden lg:inline">{filter.label}</span>
                  <span className="lg:hidden">{filter.short}</span>
                </Link>
              ))}
            </div>

            <Search />

            {/* Venues link */}
            <Link
              href={`/${currentCity.slug}/venues`}
              title="Venues"
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors shrink-0',
                pathname === `/${currentCity.slug}/venues`
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text',
              )}
            >
              <Music className="w-4 h-4" aria-hidden="true" />
              <span className="hidden lg:inline">Venues</span>
            </Link>

            {/* Map link */}
            <Link
              href={`/${currentCity.slug}/map`}
              title="Map"
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors shrink-0',
                pathname === `/${currentCity.slug}/map`
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text',
              )}
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span className="hidden lg:inline">Map</span>
            </Link>

            {/* Saved link */}
            <Link
              href="/saved"
              title="Saved"
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors shrink-0',
                pathname === '/saved'
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text',
              )}
            >
              <Star className="w-4 h-4" aria-hidden="true" />
              <span className="hidden lg:inline">Saved</span>
            </Link>

            <UserMenu />
          </div>

          {/* Mobile controls: period dropdown + search + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Period dropdown */}
            <div ref={periodRef} className="relative">
              <button
                ref={periodTriggerRef}
                onClick={() => setPeriodOpen(!periodOpen)}
                aria-expanded={periodOpen}
                aria-haspopup="true"
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full transition-colors',
                  dateFilters.some(
                    (f) =>
                      f.href !== `/${currentCity.slug}` && pathname === f.href,
                  )
                    ? 'bg-accent text-bg font-medium'
                    : 'bg-surface text-text-muted',
                )}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {dateFilters.find((f) => pathname === f.href)?.fullLabel ||
                    'Tonight'}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    periodOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
              {periodOpen && (
                <div
                  role="menu"
                  onKeyDown={(e) =>
                    handleMenuKeyDown(
                      e,
                      periodRef,
                      setPeriodOpen,
                      periodTriggerRef,
                    )
                  }
                  className="absolute top-full mt-2 right-0 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-50"
                >
                  {dateFilters.map((filter) => (
                    <Link
                      key={filter.label}
                      href={filter.href}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setPeriodOpen(false)}
                      className={cn(
                        'block px-4 py-2 text-sm transition-colors',
                        pathname === filter.href
                          ? 'text-accent bg-surface-hover'
                          : 'text-text-muted hover:text-text hover:bg-surface-hover',
                      )}
                    >
                      {filter.fullLabel}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Search button (visible on mobile) */}
            <Search />

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="text-text-muted hover:text-text"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="md:hidden rounded-t-2xl bg-bg border-border max-h-[75vh]"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Drag handle */}
          <div className="flex justify-center pt-1 pb-2">
            <div className="w-10 h-1 rounded-full bg-text-muted/30" />
          </div>

          <div className="px-5 pb-8 overflow-y-auto">
            {/* Search */}
            <div className="mb-4">
              <Search />
            </div>

            <div className="h-px bg-border" />

            {/* When */}
            <div className="py-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-text-muted">
                When
              </p>
              <div className="flex flex-wrap gap-2">
                {dateFilters.map((filter) => (
                  <Link
                    key={filter.label}
                    href={filter.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-colors',
                      pathname === filter.href
                        ? 'bg-accent text-bg font-medium'
                        : 'bg-surface text-text-muted',
                    )}
                  >
                    {filter.fullLabel}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Browse */}
            <div className="py-4 space-y-1">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
                Browse
              </p>
              <Link
                href={`/${currentCity.slug}/venues`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors',
                  pathname === `/${currentCity.slug}/venues`
                    ? 'text-accent bg-surface'
                    : 'text-text-muted hover:text-text hover:bg-surface',
                )}
              >
                <Music className="w-4 h-4" aria-hidden="true" />
                Venues
              </Link>
              <Link
                href={`/${currentCity.slug}/map`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors',
                  pathname === `/${currentCity.slug}/map`
                    ? 'text-accent bg-surface'
                    : 'text-text-muted hover:text-text hover:bg-surface',
                )}
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                Map View
              </Link>
              <Link
                href="/saved"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors',
                  pathname === '/saved'
                    ? 'text-accent bg-surface'
                    : 'text-text-muted hover:text-text hover:bg-surface',
                )}
              >
                <Star className="w-4 h-4" aria-hidden="true" />
                Saved
              </Link>
            </div>

            <div className="h-px bg-border" />

            {/* City */}
            <div className="py-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-text-muted">
                City
              </p>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) =>
                  city.live ? (
                    <Link
                      key={city.slug}
                      href={`/${city.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        city.slug === currentCity.slug
                          ? 'bg-accent text-bg font-medium'
                          : 'bg-surface text-text-muted',
                      )}
                    >
                      {city.name}
                    </Link>
                  ) : (
                    <span
                      key={city.slug}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-surface text-text-muted/50 cursor-default"
                    >
                      {city.name}
                      <span className="text-[9px] uppercase tracking-wider">
                        Soon
                      </span>
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Account */}
            <div className="flex justify-end pt-4">
              <UserMenu />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
