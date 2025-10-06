import { useState, useCallback } from 'react';
import { FilterState, VideoFilters, ChannelFilters } from '../lib/types';
import { dequal } from 'dequal';

// --- CONSTANTS ---

export const MAX_VIEWS = 20_000_000;
export const MAX_SUBSCRIBERS = 10_000_000;
export const MAX_VIDEO_COUNT = 10_000;

export const DURATION_OPTIONS = [
  { label: '< 1 min', value: 60 },
  { label: '1-5 min', value: 300 },
  { label: '5-20 min', value: 1200 },
  { label: '> 20 min', value: Infinity },
];

export const CHANNEL_AGE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'Last 2 Years', value: '2y' },
  { label: 'Last 5 Years', value: '5y' },
  { label: 'Last 10 Years', value: '10y' },
];

// --- INITIAL STATE ---

const initialVideoFilters: VideoFilters = {
  uploadDate: 'all',
  customDate: { start: null, end: null },
  viewCount: { min: 0, max: MAX_VIEWS },
  duration: [],
  trending24h: false,
};

const initialChannelFilters: ChannelFilters = {
  subscriberCount: { min: 0, max: MAX_SUBSCRIBERS },
  videoCount: { min: 0, max: MAX_VIDEO_COUNT },
  channelAge: 'all',
  monetizationEnabled: 'all',
  monetizationAge: 'all',
};

export const initialFilterState: FilterState = {
  mode: 'video',
  platform: 'all',
  keywords: '',
  sortBy: 'trending',
  videoFilters: initialVideoFilters,
  channelFilters: initialChannelFilters,
};

// --- PRESETS ---

export const filterPresets: Record<string, Partial<FilterState>> = {
  "viral-videos": {
    mode: 'video',
    platform: 'all',
    sortBy: 'trending',
    videoFilters: {
      ...initialVideoFilters,
      duration: [60],
      viewCount: { min: 1_000_000, max: MAX_VIEWS },
      trending24h: true,
    },
  },
  "new-creators": {
    mode: 'channel',
    platform: 'youtube',
    sortBy: 'trending',
    channelFilters: {
      ...initialChannelFilters,
      subscriberCount: { min: 0, max: 100_000 },
      channelAge: '1y',
    },
  },
  "established-channels": {
    mode: 'channel',
    platform: 'youtube',
    sortBy: 'subscribers',
    channelFilters: {
      ...initialChannelFilters,
      subscriberCount: { min: 1_000_000, max: MAX_SUBSCRIBERS },
      channelAge: '5y',
      monetizationEnabled: 'yes',
    },
  },
  "deep-dives": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'views',
    videoFilters: {
      ...initialVideoFilters,
      duration: [Infinity],
    },
  },
};

// --- THE HOOK ---

export const useFilters = (initialState: FilterState = initialFilterState) => {
  const [filters, setFilters] = useState<FilterState>(initialState);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialState);

  // Update a top-level filter
  const onFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      
      // When switching modes, reset mode-specific filters
      if (key === 'mode') {
        return {
          ...updated,
          videoFilters: initialVideoFilters,
          channelFilters: initialChannelFilters,
        };
      }
      
      return updated;
    });
  }, []);

  // Update a video filter
  const onVideoFilterChange = useCallback(<K extends keyof VideoFilters>(key: K, value: VideoFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      videoFilters: {
        ...prev.videoFilters,
        [key]: value,
      },
    }));
  }, []);

  // Update a channel filter
  const onChannelFilterChange = useCallback(<K extends keyof ChannelFilters>(key: K, value: ChannelFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      channelFilters: {
        ...prev.channelFilters,
        [key]: value,
      },
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const onClearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const onApplyPreset = useCallback((presetKey: keyof typeof filterPresets) => {
    const preset = filterPresets[presetKey];
    if (preset) {
      setFilters(prev => ({ 
        ...initialFilterState, 
        ...preset, 
        keywords: prev.keywords,
      }));
    }
  }, []);

  const isFiltered = !dequal(appliedFilters, initialFilterState);

  return {
    filters,
    appliedFilters,
    onFilterChange,
    onVideoFilterChange,
    onChannelFilterChange,
    onClearFilters,
    onApplyPreset,
    applyFilters,
    isFiltered,
  };
};