import { useState, useCallback } from 'react';
import { FilterState } from '../lib/types';
import { dequal } from 'dequal';
import {
  MAX_VIEWS,
  MAX_SUBSCRIBERS,
  MAX_VIDEO_COUNT,
  MAX_AVG_VIDEO_LENGTH,
  CHANNEL_AGE_OPTIONS,
  DURATION_OPTIONS,
  COUNTRY_OPTIONS,
} from '../lib/constants';

// Re-export for backward compatibility
export { MAX_VIEWS, MAX_SUBSCRIBERS, MAX_VIDEO_COUNT, CHANNEL_AGE_OPTIONS, DURATION_OPTIONS, COUNTRY_OPTIONS };

export const initialFilterState: FilterState = {
  // Common
  mode: 'video',
  platform: 'all',
  keywords: '',
  sortBy: 'trending',
  country: 'ALL',
  language: 'ALL',
  // Category for YouTube (0 means all)
  category: '0',

  // Video-specific
  videoFilters: {
    uploadDate: 'all',
    customDate: { start: null, end: null },
    viewCount: { min: 0, max: MAX_VIEWS },
    duration: [],
    trending24h: false,
  },

  // Channel-specific
  channelFilters: {
    subscriberCount: { min: 0, max: MAX_SUBSCRIBERS },
    videoCount: { min: 0, max: MAX_VIDEO_COUNT },
    channelAge: 'all',
    monetizationEnabled: 'all',
    monetizationAge: 'all',
    avgVideoLength: { min: 0, max: MAX_AVG_VIDEO_LENGTH },
    createdDate: { start: null, end: null },
  },
};

export const filterPresets: Record<string, Partial<FilterState>> = {
  'viral-videos': {
    mode: 'video',
    sortBy: 'trending',
    videoFilters: {
      duration: [60],
      trending24h: true,
      viewCount: { min: 1_000_000, max: MAX_VIEWS },
      uploadDate: 'all',
      customDate: { start: null, end: null },
    },
  },
  'deep-dives': {
    mode: 'video',
    sortBy: 'views',
    videoFilters: {
      duration: [1200],
      viewCount: { min: 0, max: MAX_VIEWS },
      uploadDate: 'all',
      customDate: { start: null, end: null },
      trending24h: false,
    },
  },
};

export const useFilters = (initialState: FilterState = initialFilterState) => {
  const [filters, setFilters] = useState<FilterState>(initialState);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialState);

  const onFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const onVideoFilterChange = useCallback(<K extends keyof FilterState['videoFilters']>(key: K, value: FilterState['videoFilters'][K]) => {
    setFilters(prev => ({ ...prev, videoFilters: { ...prev.videoFilters, [key]: value } }));
  }, []);

  const onChannelFilterChange = useCallback(<K extends keyof FilterState['channelFilters']>(key: K, value: FilterState['channelFilters'][K]) => {
    setFilters(prev => ({ ...prev, channelFilters: { ...prev.channelFilters, [key]: value } }));
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
        // keep current keywords intact
        keywords: prev.keywords,
        // apply preset top-level fields if provided
        mode: preset.mode ?? initialFilterState.mode,
        platform: preset.platform ?? initialFilterState.platform,
        sortBy: preset.sortBy ?? initialFilterState.sortBy,
        // deep-merge nested filters
        videoFilters: {
          ...initialFilterState.videoFilters,
          ...prev.videoFilters,
          ...(preset.videoFilters ?? {}),
        },
        channelFilters: {
          ...initialFilterState.channelFilters,
          ...prev.channelFilters,
          ...(preset.channelFilters ?? {}),
        },
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
