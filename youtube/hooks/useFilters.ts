import { useState, useCallback } from 'react';
import { FilterState } from '../lib/types';
import { dequal } from 'dequal';

// --- CONSTANTS ---

export const MAX_VIEWS = 100_000_000; // Increased max for better range
export const MAX_SUBSCRIBERS = 50_000_000; // Increased max for better range
export const MAX_VIDEO_COUNT = 10000;

export const DURATION_OPTIONS = [
  { label: '< 1 min', value: 60 },
  { label: '1-5 min', value: 300 },
  { label: '5-20 min', value: 1200 },
  { label: '> 20 min', value: Infinity },
];

// List of countries for filtering
export const COUNTRIES = [
  { code: 'all', name: 'All Countries' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'PL', name: 'Poland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
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
  country: 'all',
  monetizationEnabled: 'all',
  videoCount: { min: 0, max: MAX_VIDEO_COUNT },
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
  "monetized-channels": {
    platform: 'youtube',
    monetizationEnabled: 'yes',
    subscriberCount: { min: 1_000, max: MAX_SUBSCRIBERS },
    videoCount: { min: 10, max: MAX_VIDEO_COUNT },
  },
};

// --- THE HOOK ---

export const useFilters = (initialState: FilterState = initialFilterState) => {
  // `filters` is the "draft" state that the UI controls are bound to.
  const [filters, setFilters] = useState<FilterState>(initialState);
  // `appliedFilters` is the state that is actually used for fetching data.
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialState);

  // Updates the draft state as the user interacts with filter controls.
  const onFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Commits the draft filters to the applied state, which will trigger a data fetch.
  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  // Resets the draft filters back to the initial state. The user must click "Apply" to see the change.
  const onClearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  // Updates the draft filters with a preset. The user must click "Apply" to see the change.
  const onApplyPreset = useCallback((presetKey: keyof typeof filterPresets) => {
    const preset = filterPresets[presetKey];
    if (preset) {
      // Retain keywords when applying a preset
      setFilters(prev => ({ ...initialFilterState, ...preset, keywords: prev.keywords }));
    }
  }, []);

  // Determines if any filters are active based on the APPLIED state.
  const isFiltered = !dequal(appliedFilters, initialFilterState);

  return {
    filters,
    appliedFilters,
    onFilterChange,
    onClearFilters,
    onApplyPreset,
    applyFilters,
    isFiltered,
  };
};