import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FilterState, PlatformType } from '../lib/types';
import { dequal } from 'dequal';

// --- CONSTANTS ---

export const MAX_VIEWS = 50_000_000;
export const MAX_SUBSCRIBERS = 50_000_000;
export const FILTER_STEP = 1000; // 1K unit steps for sliders

export const DURATION_OPTIONS = [
  { label: '< 1 min', value: 60 },
  { label: '1-5 min', value: 300 },
  { label: '5-20 min', value: 1200 },
  { label: '> 20 min', value: Infinity },
];

// --- INITIAL STATE & PRESETS ---

export const initialFilterState: FilterState = {
  platform: 'youtube',
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
  "viral-videos": {
    platform: 'youtube',
    uploadDate: '24h',
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
    duration: [1200, Infinity], // Videos longer than 20 minutes
    sortBy: 'views',
  },
  "trending-shorts": {
    platform: 'youtube',
    duration: [60],
    uploadDate: '24h',
    sortBy: 'trending',
    trending24h: true,
  },
  "viral-dailymotion": {
    platform: 'dailymotion',
    uploadDate: '7d',
    sortBy: 'views',
    viewCount: { min: 100_000, max: MAX_VIEWS },
  },
  "reddit-hot": {
    platform: 'reddit',
    uploadDate: '24h',
    sortBy: 'trending',
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
  if (filters.viewCount.min < 0) {
    errors.push({ field: 'viewCount', message: 'Minimum view count cannot be negative' });
  }
  if (filters.viewCount.max < filters.viewCount.min) {
    errors.push({ field: 'viewCount', message: 'Maximum view count must be greater than minimum' });
  }

  // Validate subscriber count range
  if (filters.subscriberCount.min < 0) {
    errors.push({ field: 'subscriberCount', message: 'Minimum subscriber count cannot be negative' });
  }
  if (filters.subscriberCount.max < filters.subscriberCount.min) {
    errors.push({ field: 'subscriberCount', message: 'Maximum subscriber count must be greater than minimum' });
  }

  // Validate custom date range
  if (filters.uploadDate === 'custom') {
    if (!filters.customDate.start && !filters.customDate.end) {
      errors.push({ field: 'customDate', message: 'Custom date range requires at least start or end date' });
    }
    if (filters.customDate.start && filters.customDate.end) {
      const startDate = new Date(filters.customDate.start);
      const endDate = new Date(filters.customDate.end);
      if (startDate > endDate) {
        errors.push({ field: 'customDate', message: 'Start date must be before end date' });
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
  sanitized.viewCount = {
    min: Math.max(0, Math.min(filters.viewCount.min, MAX_VIEWS)),
    max: Math.max(filters.viewCount.min, Math.min(filters.viewCount.max, MAX_VIEWS)),
  };

  // Ensure subscriber count bounds
  sanitized.subscriberCount = {
    min: Math.max(0, Math.min(filters.subscriberCount.min, MAX_SUBSCRIBERS)),
    max: Math.max(filters.subscriberCount.min, Math.min(filters.subscriberCount.max, MAX_SUBSCRIBERS)),
  };

  // Reset custom date if not using custom upload date
  if (filters.uploadDate !== 'custom') {
    sanitized.customDate = { start: null, end: null };
  }

  // Platform-specific filter adjustments
  if (filters.platform === 'dailymotion' || filters.platform === 'reddit') {
    // These platforms don't support subscriber count or channel age filtering
    if (filters.platform === 'dailymotion') {
      sanitized.subscriberCount = { min: 0, max: MAX_SUBSCRIBERS };
      sanitized.channelAge = 'all';
    }
    if (filters.platform === 'reddit') {
      sanitized.subscriberCount = { min: 0, max: MAX_SUBSCRIBERS };
      sanitized.channelAge = 'all';
      sanitized.trending24h = false; // Reddit doesn't support this
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
  private readonly BATCH_DELAY = 300; // ms

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