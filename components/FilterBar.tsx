"use client";

import { cn } from "@/lib/utils";
import { City, TimeOfDay } from "@/lib/types";

interface FilterBarProps {
  city: City;
  activeRegions: Set<string>;
  activeTimes: Set<TimeOfDay>;
  onRegionToggle: (region: string) => void;
  onTimeToggle: (time: TimeOfDay) => void;
  onClearRegions?: () => void;
  onClearTimes?: () => void;
}

const timeFilters: { label: string; value: TimeOfDay }[] = [
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
  { label: "Late Night", value: "late-night" },
];

export default function FilterBar({
  city,
  activeRegions,
  activeTimes,
  onRegionToggle,
  onTimeToggle,
  onClearRegions,
  onClearTimes,
}: FilterBarProps) {
  const allRegions = activeRegions.size === 0;
  const allTimes = activeTimes.size === 0;

  return (
    <div className="space-y-3">
      {/* Region filters */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-xs uppercase tracking-wider text-text-muted shrink-0">
          Area
        </span>
        <button
          onClick={() => {
            if (!allRegions) {
              if (onClearRegions) onClearRegions();
              else activeRegions.forEach((r) => onRegionToggle(r));
            }
          }}
          aria-pressed={allRegions}
          className={cn(
            "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
            allRegions
              ? "bg-accent text-bg font-medium hover:brightness-110"
              : "bg-surface text-text-muted hover:text-text"
          )}
        >
          All
        </button>
        {city.regions.map((region) => (
          <button
            key={region.slug}
            onClick={() => onRegionToggle(region.slug)}
            aria-pressed={activeRegions.has(region.slug)}
            className={cn(
              "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
              activeRegions.has(region.slug)
                ? "bg-accent text-bg font-medium hover:brightness-110"
                : "bg-surface text-text-muted hover:text-text"
            )}
          >
            {region.name}
          </button>
        ))}
      </div>

      {/* Time of day filters */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-xs uppercase tracking-wider text-text-muted shrink-0">
          Time
        </span>
        <button
          onClick={() => {
            if (!allTimes) {
              if (onClearTimes) onClearTimes();
              else activeTimes.forEach((t) => onTimeToggle(t));
            }
          }}
          aria-pressed={allTimes}
          className={cn(
            "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
            allTimes
              ? "bg-accent text-bg font-medium hover:brightness-110"
              : "bg-surface text-text-muted hover:text-text"
          )}
        >
          All
        </button>
        {timeFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onTimeToggle(filter.value)}
            aria-pressed={activeTimes.has(filter.value)}
            className={cn(
              "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
              activeTimes.has(filter.value)
                ? "bg-accent text-bg font-medium hover:brightness-110"
                : "bg-surface text-text-muted hover:text-text"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
