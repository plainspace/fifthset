'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TimeOfDay } from '@/lib/types';

function parseParam(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(value.split(',').filter(Boolean));
}

function toParam(set: Set<string>): string | null {
  if (set.size === 0) return null;
  return Array.from(set).join(',');
}

export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRegions = parseParam(searchParams.get('area'));
  const activeTimes = parseParam(searchParams.get('time')) as Set<TimeOfDay>;

  const updateParams = useCallback(
    (regions: Set<string>, times: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString());
      const area = toParam(regions);
      const time = toParam(times);

      if (area) params.set('area', area);
      else params.delete('area');

      if (time) params.set('time', time);
      else params.delete('time');

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const toggleRegion = useCallback(
    (region: string) => {
      const next = new Set(activeRegions);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      updateParams(next, activeTimes);
    },
    [activeRegions, activeTimes, updateParams],
  );

  const toggleTime = useCallback(
    (time: TimeOfDay) => {
      const next = new Set(activeTimes);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      updateParams(activeRegions, next);
    },
    [activeRegions, activeTimes, updateParams],
  );

  const clearRegions = useCallback(() => {
    updateParams(new Set(), activeTimes);
  }, [activeTimes, updateParams]);

  const clearTimes = useCallback(() => {
    updateParams(activeRegions, new Set());
  }, [activeRegions, updateParams]);

  return {
    activeRegions,
    activeTimes,
    toggleRegion,
    toggleTime,
    clearRegions,
    clearTimes,
  };
}
