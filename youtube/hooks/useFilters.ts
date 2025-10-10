import { useState, useCallback } from 'react';
import { FilterState } from '../lib/types';
import { dequal } from 'dequal';

export const MAX_VIEWS = 20_000_000;
export const MAX_SUBSCRIBERS = 10_000_000;
export const MAX_VIDEO_COUNT = 1_000_000;

export const CHANNEL_AGE_OPTIONS = [
  { label: 'All', value: 'all' as const },
  { label: '6+ months', value: '6m' as const },
  { label: '1+ years', value: '1y' as const },
  { label: '2+ years', value: '2y' as const },
  { label: '5+ years', value: '5y' as const },
  { label: '10+ years', value: '10y' as const },
];

export const DURATION_OPTIONS = [
  { label: '< 1 min', value: 60 },
  { label: '1-5 min', value: 300 },
  { label: '5-20 min', value: 1200 },
  { label: '> 20 min', value: Infinity },
];

export const COUNTRY_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'Korea' },
  { code: 'VN', label: 'Vietnam' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
];

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
    avgVideoLength: { min: 0, max: 7200 },
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
  'new-creators': {
    mode: 'channel',
    sortBy: 'subscribers',
    channelFilters: {
      subscriberCount: { min: 0, max: 100_000 },
      channelAge: '1y',
      videoCount: { min: 0, max: MAX_VIDEO_COUNT },
      monetizationEnabled: 'all',
      monetizationAge: 'all',
    },
  },
  'established-channels': {
    mode: 'channel',
    sortBy: 'subscribers',
    channelFilters: {
      subscriberCount: { min: 500_000, max: MAX_SUBSCRIBERS },
      channelAge: '5y',
      videoCount: { min: 0, max: MAX_VIDEO_COUNT },
      monetizationEnabled: 'all',
      monetizationAge: 'all',
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
