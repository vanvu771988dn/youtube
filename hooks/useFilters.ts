// FIX: Replaced placeholder content with the useFilters custom hook and related constants.
import { useState, useCallback } from 'react';
import { FilterState } from '../lib/types';
import { dequal } from 'dequal';

// --- CONSTANTS ---

export const MAX_VIEWS = 20_000_000;
export const MAX_SUBSCRIBERS = 10_000_000;

export const DURATION_OPTIONS = [
  { label: '< 1 min', value: 60 },
  { label: '1-5 min', value: 300 },
  { label: '5-20 min', value: 1200 },
  { label: '> 20 min', value: Infinity },
];

// --- INITIAL STATE & PRESETS ---

export const initialFilterState: FilterState = {
  platform: 'all',
  uploadDate: 'all',
  customDate: { start: null, end: null },
  viewCount: { min: 0, max: MAX_VIEWS },
  subscriberCount: { min: 0, max: MAX_SUBSCRIBERS },
  keywords: '',
  channelAge: 'all',
  duration: [],
  trending24h: false,
  sortBy: 'trending',
};

export const filterPresets: Record<string, Partial<FilterState>> = {
  "viral-shorts": {
    platform: 'all',
    duration: [60],
    sortBy: 'trending',
    viewCount: { min: 1_000_000, max: MAX_VIEWS },
    trending24h: true,
  },
  "new-creators": {
    platform: 'youtube',
    subscriberCount: { min: 0, max: 100_000 },
    sortBy: 'trending',
    channelAge: 1,
  },
  "deep-dives": {
    platform: 'youtube',
    duration: [Infinity],
    sortBy: 'views',
  },
};

// --- THE HOOK ---

export const useFilters = (initialState: FilterState = initialFilterState) => {
  const [filters, setFilters] = useState<FilterState>(initialState);

  const onFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const onClearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const onApplyPreset = useCallback((presetKey: keyof typeof filterPresets) => {
    const preset = filterPresets[presetKey];
    if (preset) {
      // Retain keywords when applying a preset
      setFilters(prev => ({ ...initialFilterState, ...preset, keywords: prev.keywords }));
    }
  }, []);

  const isFiltered = !dequal(filters, initialFilterState);

  return {
    filters,
    onFilterChange,
    onClearFilters,
    onApplyPreset,
    isFiltered,
  };
};
