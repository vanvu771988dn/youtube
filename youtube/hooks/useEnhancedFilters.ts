import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FilterState, PlatformType } from '../lib/types';
import { dequal } from 'dequal';
import {
  MAX_VIEWS,
  MAX_SUBSCRIBERS,
  MAX_VIDEO_COUNT,
  MAX_AVG_VIDEO_LENGTH,
  FILTER_STEP,
  DURATION_OPTIONS,
  FILTER_DEBOUNCE_MS,
} from '../lib/constants';

// Re-export constants for backward compatibility
export { MAX_VIEWS, MAX_SUBSCRIBERS, FILTER_STEP, DURATION_OPTIONS };

// --- INITIAL STATE & PRESETS ---

export const initialFilterState: FilterState = {
  mode: 'video',
  platform: 'youtube',
  keywords: '',
  sortBy: 'trending',
  country: 'ALL',
  language: 'ALL',
  category: '0',
  videoFilters: {
    uploadDate: 'all',
    customDate: { start: null, end: null },
    viewCount: { min: 0, max: MAX_VIEWS },
    duration: [],
    trending24h: false,
  },
  channelFilters: {
    subscriberCount: { min: 0, max: MAX_SUBSCRIBERS },
    videoCount: { min: 0, max: MAX_VIDEO_COUNT },
    channelAge: 'all',
    monetizationEnabled: 'all',
    monetizationAge: 'all',
    avgVideoLength: { min: 0, max: MAX_AVG_VIDEO_LENGTH },
  },
};

export const filterPresets: Record<string, Partial<FilterState>> = {
  "viral-videos": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'trending',
    videoFilters: {
      uploadDate: '24h',
      customDate: { start: null, end: null },
      viewCount: { min: 1_000_000, max: MAX_VIEWS },
      duration: [],
      trending24h: true,
    },
  },
  "new-creators": {
    mode: 'channel',
    platform: 'youtube',
    sortBy: 'subscribers',
    channelFilters: {
      subscriberCount: { min: 0, max: 100_000 },
      videoCount: { min: 0, max: MAX_VIDEO_COUNT },
      channelAge: '1y',
      monetizationEnabled: 'all',
      monetizationAge: 'all',
      avgVideoLength: { min: 0, max: MAX_AVG_VIDEO_LENGTH },
    },
  },
  "deep-dives": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'views',
    videoFilters: {
      uploadDate: 'all',
      customDate: { start: null, end: null },
      viewCount: { min: 0, max: MAX_VIEWS },
      duration: [1200, Infinity], // Videos longer than 20 minutes
      trending24h: false,
    },
  },
  "trending-shorts": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'trending',
    videoFilters: {
      uploadDate: '24h',
      customDate: { start: null, end: null },
      viewCount: { min: 0, max: MAX_VIEWS },
      duration: [0, 60], // Less than 1 minute
      trending24h: true,
    },
  },
  "high-engagement": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'trending',
    videoFilters: {
      uploadDate: '7d',
      customDate: { start: null, end: null },
      viewCount: { min: 100_000, max: MAX_VIEWS },
      duration: [],
      trending24h: false,
    },
  },
  "micro-influencers": {
    mode: 'channel',
    platform: 'youtube',
    sortBy: 'subscribers',
    channelFilters: {
      subscriberCount: { min: 10_000, max: 100_000 },
      videoCount: { min: 10, max: MAX_VIDEO_COUNT },
      channelAge: '6m',
      monetizationEnabled: 'all',
      monetizationAge: 'all',
      avgVideoLength: { min: 0, max: MAX_AVG_VIDEO_LENGTH },
    },
  },
  "long-form-content": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'views',
    videoFilters: {
      uploadDate: '30d',
      customDate: { start: null, end: null },
      viewCount: { min: 10_000, max: MAX_VIEWS },
      duration: [1200, Infinity], // 20+ minutes
      trending24h: false,
    },
  },
  "educational-content": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'views',
    category: '27', // Education category
    videoFilters: {
      uploadDate: '7d',
      customDate: { start: null, end: null },
      viewCount: { min: 10_000, max: MAX_VIEWS },
      duration: [300, 1200], // 5-20 minutes
      trending24h: false,
    },
  },
  "gaming-highlights": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'trending',
    category: '20', // Gaming category
    videoFilters: {
      uploadDate: '24h',
      customDate: { start: null, end: null },
      viewCount: { min: 50_000, max: MAX_VIEWS },
      duration: [300, 1200], // 5-20 minutes
      trending24h: true,
    },
  },
  "music-videos": {
    mode: 'video',
    platform: 'youtube',
    sortBy: 'views',
    category: '10', // Music category
    videoFilters: {
      uploadDate: '7d',
      customDate: { start: null, end: null },
      viewCount: { min: 100_000, max: MAX_VIEWS },
      duration: [120, 600], // 2-10 minutes
      trending24h: false,
    },
  },
};

// --- FILTER VALIDATION ---

interface FilterValidationError {
  field: keyof FilterState;
  message: string;
}

/**
 * Validates filter state and returns any validation errors
 */
const validateFilters = (filters: FilterState): FilterValidationError[] => {
  const errors: FilterValidationError[] = [];

  // Validate view count range
  if (filters.videoFilters.viewCount.min < 0) {
    errors.push({ field: 'videoFilters', message: 'Minimum view count cannot be negative' });
  }
  if (filters.videoFilters.viewCount.max < filters.videoFilters.viewCount.min) {
    errors.push({ field: 'videoFilters', message: 'Maximum view count must be greater than minimum' });
  }

  // Validate subscriber count range
  if (filters.channelFilters.subscriberCount.min < 0) {
    errors.push({ field: 'channelFilters', message: 'Minimum subscriber count cannot be negative' });
  }
  if (filters.channelFilters.subscriberCount.max < filters.channelFilters.subscriberCount.min) {
    errors.push({ field: 'channelFilters', message: 'Maximum subscriber count must be greater than minimum' });
  }

  // Validate video count range
  if (filters.channelFilters.videoCount.min < 0) {
    errors.push({ field: 'channelFilters', message: 'Minimum video count cannot be negative' });
  }
  if (filters.channelFilters.videoCount.max < filters.channelFilters.videoCount.min) {
    errors.push({ field: 'channelFilters', message: 'Maximum video count must be greater than minimum' });
  }

  // Validate custom date range
  if (filters.videoFilters.uploadDate === 'custom') {
    if (!filters.videoFilters.customDate.start && !filters.videoFilters.customDate.end) {
      errors.push({ field: 'videoFilters', message: 'Custom date range requires at least start or end date' });
    }
    if (filters.videoFilters.customDate.start && filters.videoFilters.customDate.end) {
      const startDate = new Date(filters.videoFilters.customDate.start);
      const endDate = new Date(filters.videoFilters.customDate.end);
      if (startDate > endDate) {
        errors.push({ field: 'videoFilters', message: 'Start date must be before end date' });
      }
    }
  }

  // Validate keywords length
  if (filters.keywords.length > 500) {
    errors.push({ field: 'keywords', message: 'Keywords cannot exceed 500 characters' });
  }

  return errors;
};

/**
 * Sanitizes and normalizes filter values
 */
const sanitizeFilters = (filters: FilterState): FilterState => {
  const sanitized = { ...filters };

  // Normalize keywords
  sanitized.keywords = filters.keywords.trim();

  // Ensure view count bounds
  sanitized.videoFilters = {
    ...sanitized.videoFilters,
    viewCount: {
      min: Math.max(0, Math.min(filters.videoFilters.viewCount.min, MAX_VIEWS)),
      max: Math.max(filters.videoFilters.viewCount.min, Math.min(filters.videoFilters.viewCount.max, MAX_VIEWS)),
    },
  };

  // Ensure subscriber count bounds
  sanitized.channelFilters = {
    ...sanitized.channelFilters,
    subscriberCount: {
      min: Math.max(0, Math.min(filters.channelFilters.subscriberCount.min, MAX_SUBSCRIBERS)),
      max: Math.max(filters.channelFilters.subscriberCount.min, Math.min(filters.channelFilters.subscriberCount.max, MAX_SUBSCRIBERS)),
    },
    videoCount: {
      min: Math.max(0, Math.min(filters.channelFilters.videoCount.min, MAX_VIDEO_COUNT)),
      max: Math.max(filters.channelFilters.videoCount.min, Math.min(filters.channelFilters.videoCount.max, MAX_VIDEO_COUNT)),
    },
    avgVideoLength: {
      min: Math.max(0, Math.min(filters.channelFilters.avgVideoLength.min, MAX_AVG_VIDEO_LENGTH)),
      max: Math.max(filters.channelFilters.avgVideoLength.min, Math.min(filters.channelFilters.avgVideoLength.max, MAX_AVG_VIDEO_LENGTH)),
    },
  };

  // Reset custom date if not using custom upload date
  if (filters.videoFilters.uploadDate !== 'custom') {
    sanitized.videoFilters.customDate = { start: null, end: null };
  }

  // Platform-specific filter adjustments
  if (filters.platform === 'dailymotion' || filters.platform === 'reddit') {
    // These platforms don't support subscriber count or channel age filtering
    if (filters.platform === 'dailymotion') {
      sanitized.channelFilters.subscriberCount = { min: 0, max: MAX_SUBSCRIBERS };
      sanitized.channelFilters.channelAge = 'all';
    }
    if (filters.platform === 'reddit') {
      sanitized.channelFilters.subscriberCount = { min: 0, max: MAX_SUBSCRIBERS };
      sanitized.channelFilters.channelAge = 'all';
      sanitized.videoFilters.trending24h = false; // Reddit doesn't support this
    }
  }

  return sanitized;
};

// --- FILTER BATCHING ---

interface FilterBatch {
  filters: FilterState;
  timestamp: number;
}

/**
 * Batches filter changes to prevent excessive API calls
 */
class FilterBatcher {
  private pendingBatch: FilterBatch | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = FILTER_DEBOUNCE_MS;

  constructor(private onApply: (filters: FilterState) => void) {}

  batch(filters: FilterState): void {
    this.pendingBatch = {
      filters,
      timestamp: Date.now(),
    };

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (this.pendingBatch) {
        this.onApply(this.pendingBatch.filters);
        this.pendingBatch = null;
      }
      this.timeoutId = null;
    }, this.BATCH_DELAY);
  }

  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.pendingBatch) {
      this.onApply(this.pendingBatch.filters);
      this.pendingBatch = null;
    }
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingBatch = null;
  }

  hasPendingBatch(): boolean {
    return this.pendingBatch !== null;
  }
}

// --- ENHANCED HOOK ---

interface UseEnhancedFiltersOptions {
  autoApply?: boolean; // If true, applies filters automatically with debouncing
  validateOnChange?: boolean; // If true, validates filters on every change
  persistFilters?: boolean; // If true, persists filters to localStorage
  storageKey?: string; // Key for localStorage persistence
}

export const useEnhancedFilters = (
  initialState: FilterState = initialFilterState,
  options: UseEnhancedFiltersOptions = {}
) => {
  const {
    autoApply = false,
    validateOnChange = true,
    persistFilters = false,
    storageKey = 'video-filters',
  } = options;

  // Load persisted filters if enabled
  const getInitialFilters = useCallback(() => {
    if (persistFilters && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with initial state to ensure all required fields exist
          return { ...initialState, ...parsed };
        }
      } catch (error) {
        console.warn('Failed to load persisted filters:', error);
      }
    }
    return initialState;
  }, [initialState, persistFilters, storageKey]);

  // State management
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(getInitialFilters);
  const [validationErrors, setValidationErrors] = useState<FilterValidationError[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Refs for batching
  const batcherRef = useRef<FilterBatcher | null>(null);

  // Initialize batcher
  useEffect(() => {
    const handleBatchedApply = (batchedFilters: FilterState) => {
      console.log('[Enhanced Filters] Applying batched filters:', batchedFilters);
      setIsApplying(true);
      
      const sanitized = sanitizeFilters(batchedFilters);
      const errors = validateFilters(sanitized);
      
      if (errors.length === 0) {
        setAppliedFilters(sanitized);
        setValidationErrors([]);
        
        // Persist filters if enabled
        if (persistFilters && typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(sanitized));
          } catch (error) {
            console.warn('Failed to persist filters:', error);
          }
        }
      } else {
        setValidationErrors(errors);
        console.warn('[Enhanced Filters] Validation errors:', errors);
      }
      
      setIsApplying(false);
    };

    batcherRef.current = new FilterBatcher(handleBatchedApply);

    return () => {
      if (batcherRef.current) {
        batcherRef.current.cancel();
      }
    };
  }, [persistFilters, storageKey]);

  // Filter change handler with enhanced validation and batching
  const onFilterChange = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
    options?: { skipValidation?: boolean; immediate?: boolean }
  ) => {
    const { skipValidation = false, immediate = false } = options || {};

    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      
      // Validate if enabled
      if (validateOnChange && !skipValidation) {
        const errors = validateFilters(updated);
        setValidationErrors(errors);
      }

      // Auto-apply with batching if enabled
      if (autoApply && batcherRef.current) {
        if (immediate) {
          batcherRef.current.flush();
        } else {
          batcherRef.current.batch(updated);
        }
      }

      return updated;
    });
  }, [validateOnChange, autoApply]);

  // Apply filters manually (wraps all conditions)
  const applyFilters = useCallback((customFilters?: FilterState) => {
    const filtersToApply = customFilters || filters;
    
    console.log('[Enhanced Filters] Manually applying filters:', filtersToApply);
    setIsApplying(true);

    // Sanitize and validate all filter conditions
    const sanitized = sanitizeFilters(filtersToApply);
    const errors = validateFilters(sanitized);

    if (errors.length === 0) {
      // Cancel any pending batched operations
      if (batcherRef.current) {
        batcherRef.current.cancel();
      }

      setAppliedFilters(sanitized);
      setValidationErrors([]);

      // Update draft filters if applying custom filters
      if (customFilters) {
        setFilters(sanitized);
      }

      // Persist filters if enabled
      if (persistFilters && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(sanitized));
        } catch (error) {
          console.warn('Failed to persist filters:', error);
        }
      }

      console.log('[Enhanced Filters] Successfully applied filters:', sanitized);
    } else {
      setValidationErrors(errors);
      console.error('[Enhanced Filters] Filter validation failed:', errors);
    }

    setIsApplying(false);
  }, [filters, persistFilters, storageKey]);

  // Reset filters
  const onClearFilters = useCallback((applyImmediately = false) => {
    console.log('[Enhanced Filters] Clearing filters');
    setFilters(initialFilterState);
    setValidationErrors([]);
    
    if (applyImmediately) {
      applyFilters(initialFilterState);
    }

    // Clear persisted filters if enabled
    if (persistFilters && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear persisted filters:', error);
      }
    }
  }, [applyFilters, initialFilterState, persistFilters, storageKey]);

  // Apply preset
  const onApplyPreset = useCallback((
    presetKey: keyof typeof filterPresets,
    applyImmediately = false
  ) => {
    const preset = filterPresets[presetKey];
    if (preset) {
      console.log('[Enhanced Filters] Applying preset:', presetKey, preset);
      const presetFilters = { ...initialFilterState, ...preset, keywords: filters.keywords };
      setFilters(presetFilters);
      setValidationErrors([]);
      
      if (applyImmediately) {
        applyFilters(presetFilters);
      }
    }
  }, [filters.keywords, applyFilters, initialFilterState]);

  // Batch multiple filter changes
  const batchFilterChanges = useCallback((changes: Partial<FilterState>) => {
    console.log('[Enhanced Filters] Batching filter changes:', changes);
    setFilters(prev => {
      const updated = { ...prev, ...changes };
      
      // Validate if enabled
      if (validateOnChange) {
        const errors = validateFilters(updated);
        setValidationErrors(errors);
      }
      
      return updated;
    });
  }, [validateOnChange]);

  // Computed values
  const isFiltered = useMemo(() => !dequal(appliedFilters, initialFilterState), [appliedFilters]);
  const hasPendingChanges = useMemo(() => !dequal(filters, appliedFilters), [filters, appliedFilters]);
  const hasBatchedChanges = useMemo(() => 
    batcherRef.current?.hasPendingBatch() || false, 
    [batcherRef.current]
  );
  const isValid = useMemo(() => validationErrors.length === 0, [validationErrors]);

  // Platform-specific helper functions
  const getPlatformCapabilities = useCallback((platform: PlatformType) => {
    return {
      supportsSubscriberFilter: platform === 'youtube' || platform === 'all',
      supportsChannelAge: platform === 'youtube' || platform === 'all',
      supportsTrending24h: platform === 'youtube' || platform === 'all',
      supportsDurationFilter: true,
      supportsViewCountFilter: true,
      supportsCustomDateRange: platform !== 'reddit',
    };
  }, []);

  const getFilterSummary = useCallback(() => {
    const activeFilters = Object.keys(appliedFilters).reduce((summary, key) => {
      const filterKey = key as keyof FilterState;
      if (!dequal(appliedFilters[filterKey], initialFilterState[filterKey])) {
        summary[filterKey] = appliedFilters[filterKey];
      }
      return summary;
    }, {} as Partial<FilterState>);

    return {
      activeFilters,
      count: Object.keys(activeFilters).length,
      isEmpty: Object.keys(activeFilters).length === 0,
    };
  }, [appliedFilters]);

  return {
    // State
    filters,
    appliedFilters,
    validationErrors,
    isApplying,
    
    // Actions
    onFilterChange,
    applyFilters,
    onClearFilters,
    onApplyPreset,
    batchFilterChanges,
    
    // Computed values
    isFiltered,
    hasPendingChanges,
    hasBatchedChanges,
    isValid,
    
    // Helper functions
    getPlatformCapabilities,
    getFilterSummary,
    
    // Constants
    filterPresets,
    initialFilterState,
  };
};