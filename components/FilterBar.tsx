"use client";

import { cn } from "@/lib/utils";
import { City, TimeOfDay } from "@/lib/types";

interface FilterBarProps {
  city: City;
  activeRegion?: string;
  activeTime?: TimeOfDay;
  onRegionChange: (region?: string) => void;
  onTimeChange: (time?: TimeOfDay) => void;
}

const timeFilters: { label: string; value: TimeOfDay }[] = [
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
  { label: "Late Night", value: "late-night" },
];

export default function FilterBar({
  city,
  activeRegion,
  activeTime,
  onRegionChange,
  onTimeChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Region filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs uppercase tracking-wider text-text-muted shrink-0">
          Area
        </span>
        <button
          onClick={() => onRegionChange(undefined)}
          className={cn(
            "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
            !activeRegion
              ? "bg-accent text-bg font-medium"
              : "bg-surface text-text-muted hover:text-text"
          )}
        >
          All
        </button>
        {city.regions.map((region) => (
          <button
            key={region.slug}
            onClick={() =>
              onRegionChange(
                activeRegion === region.slug ? undefined : region.slug
              )
            }
            className={cn(
              "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
              activeRegion === region.slug
                ? "bg-accent text-bg font-medium"
                : "bg-surface text-text-muted hover:text-text"
            )}
          >
            {region.name}
          </button>
        ))}
      </div>

      {/* Time of day filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs uppercase tracking-wider text-text-muted shrink-0">
          Time
        </span>
        <button
          onClick={() => onTimeChange(undefined)}
          className={cn(
            "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
            !activeTime
              ? "bg-accent text-bg font-medium"
              : "bg-surface text-text-muted hover:text-text"
          )}
        >
          All
        </button>
        {timeFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() =>
              onTimeChange(
                activeTime === filter.value ? undefined : filter.value
              )
            }
            className={cn(
              "filter-pill px-3 py-1.5 text-sm rounded-full shrink-0 transition-colors",
              activeTime === filter.value
                ? "bg-accent text-bg font-medium"
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
