import { useState, useCallback, useEffect } from 'react';
import { FilterState, Range, UploadDateOption } from '../lib/types';
import { dequal } from 'dequal';

export const MAX_VIEWS = 20000000;
export const MAX_SUBSCRIBERS = 10000000;

export const DURATION_OPTIONS = [
    { label: '< 1 min', value: 60 },
    { label: '1-5 min', value: 300 },
    { label: '5-20 min', value: 1200 },
    { label: '> 20 min', value: Infinity },
];

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

// --- URL (DE)SERIALIZATION ---

const serializeFiltersForURL = (filters: FilterState): string => {
    const params = new URLSearchParams();
    if (filters.platform !== initialFilterState.platform) params.set('platform', filters.platform);
    if (filters.uploadDate !== initialFilterState.uploadDate) params.set('uploadDate', filters.uploadDate);
    if (filters.sortBy !== initialFilterState.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.keywords) params.set('keywords', filters.keywords);
    if (filters.trending24h) params.set('trending24h', 'true'); // Corrected typo from trending2h
    if (filters.channelAge !== initialFilterState.channelAge) params.set('channelAge', String(filters.channelAge));
    if (filters.duration.length > 0) params.set('duration', filters.duration.join(','));
    if (filters.viewCount.min > 0 || filters.viewCount.max < MAX_VIEWS) params.set('views', `${filters.viewCount.min}-${filters.viewCount.max}`);
    if (filters.subscriberCount.min > 0 || filters.subscriberCount.max < MAX_SUBSCRIBERS) params.set('subs', `${filters.subscriberCount.min}-${filters.subscriberCount.max}`);
    if (filters.uploadDate === 'custom' && filters.customDate.start && filters.customDate.end) params.set('customDate', `${filters.customDate.start}_${filters.customDate.end}`);
    return params.toString();
};

/**
 * Safely parses a string into an integer, returning a fallback value if parsing fails.
 * @param str The string to parse.
 * @param fallback The number to return if str is not a valid number.
 * @returns The parsed number or the fallback.
 */
const safeParseInt = (str: string | undefined | null, fallback: number): number => {
    if (str === null || str === undefined) return fallback;
    const num = parseInt(str, 10);
    return isNaN(num) ? fallback : num;
};

/**
 * Safely parses a string into a number, handling "Infinity" and returning a fallback.
 * @param str The string to parse.
 * @param fallback The number to return on failure.
 * @returns The parsed number or the fallback.
 */
const safeParseNumber = (str: string | undefined | null, fallback: number): number => {
    if (str === null || str === undefined) return fallback;
    if (str.toLowerCase() === 'infinity') return Infinity;
    const num = parseFloat(str);
    return isNaN(num) ? fallback : num;
};


const deserializeFiltersFromURL = (params: URLSearchParams): Partial<FilterState> => {
    const state: Partial<FilterState> = {};
    if (params.has('platform')) state.platform = params.get('platform') as FilterState['platform'];
    if (params.has('uploadDate')) state.uploadDate = params.get('uploadDate') as UploadDateOption;
    if (params.has('sortBy')) state.sortBy = params.get('sortBy') as FilterState['sortBy'];
    if (params.has('keywords')) state.keywords = params.get('keywords') ?? '';
    if (params.has('trending24h')) state.trending24h = params.get('trending24h') === 'true';
    
    if (params.has('channelAge')) {
      const ageStr = params.get('channelAge');
      if (ageStr === 'all') {
        state.channelAge = 'all';
      } else {
        const ageNum = safeParseInt(ageStr, -1);
        if ([1, 3, 5].includes(ageNum)) {
          state.channelAge = ageNum as FilterState['channelAge'];
        }
      }
    }

    if (params.has('duration')) {
      state.duration = params.get('duration')?.split(',').map(d => safeParseNumber(d, -1)).filter(d => d !== -1) ?? [];
    }
    
    if (params.has('views')) {
        const parts = params.get('views')?.split('-');
        let min = safeParseInt(parts?.[0], 0);
        let max = safeParseInt(parts?.[1], MAX_VIEWS);
        // FIX: Validate that min is not greater than max.
        if (min > max) {
            [min, max] = [max, min]; // Swap them if they are in the wrong order
        }
        state.viewCount = { min, max };
    }

    if (params.has('subs')) {
        const parts = params.get('subs')?.split('-');
        let min = safeParseInt(parts?.[0], 0);
        let max = safeParseInt(parts?.[1], MAX_SUBSCRIBERS);
        // FIX: Validate that min is not greater than max.
        if (min > max) {
            [min, max] = [max, min]; // Swap them if they are in the wrong order
        }
        state.subscriberCount = { min, max };
    }

    if (params.has('customDate')) {
        const [start, end] = params.get('customDate')?.split('_') ?? [null, null];
        if (start && end && !isNaN(new Date(start).getTime()) && !isNaN(new Date(end).getTime())) {
            state.customDate = { start, end };
        }
    }
    return state;
};

// --- PRESETS ---

export const filterPresets = {
    'viral-shorts': {
        ...initialFilterState,
        duration: [60],
        viewCount: { min: 1000000, max: MAX_VIEWS },
        sortBy: 'views',
    },
    'new-creators': {
        ...initialFilterState,
        subscriberCount: { min: 0, max: 100000 },
        channelAge: 1,
        uploadDate: '30d',
    },
    'deep-dives': {
        ...initialFilterState,
        duration: [Infinity], // > 20 mins
        sortBy: 'date',
        platform: 'youtube',
    }
};

export const useFilters = () => {
    const [filters, setFilters] = useState<FilterState>(() => {
        if (typeof window === 'undefined') return initialFilterState;
        const params = new URLSearchParams(window.location.search);
        const fromURL = deserializeFiltersFromURL(params);
        return { ...initialFilterState, ...fromURL };
    });

    useEffect(() => {
        const newSearch = serializeFiltersForURL(filters);
        // Avoid pushing identical state to history
        if (newSearch !== window.location.search.substring(1)) {
            const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
            // FIX: The line below causes a SecurityError in sandboxed (blob:) environments.
            // It is being disabled to allow the application to run.
            // window.history.pushState({ path: newUrl }, '', newUrl);
        }
    }, [filters]);

    const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters(prev => {
            if (dequal(prev[key], value)) return prev;
            return { ...prev, [key]: value };
        });
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(initialFilterState);
    }, []);

    const applyPreset = useCallback((presetKey: keyof typeof filterPresets) => {
        setFilters(filterPresets[presetKey]);
    }, []);

    return { filters, updateFilter, clearFilters, applyPreset, setFilters };
};