# Filter Usage Guide

Quick reference for applying multiple filters in your Video Trending application.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Enhanced Filters (Recommended)](#enhanced-filters-recommended)
- [Legacy Filters](#legacy-filters)
- [Common Filter Combinations](#common-filter-combinations)
- [Available Filter Options](#available-filter-options)

---

## Basic Usage

### Option 1: Enhanced Filters (Recommended)

Best for applying multiple filters at once:

```tsx
import { useEnhancedFilters } from './hooks/useEnhancedFilters';
import { useVideos } from './hooks/useVideos';

function MyComponent() {
  const {
    filters,
    appliedFilters,
    batchFilterChanges,
    applyFilters,
  } = useEnhancedFilters();

  const { videos, loading } = useVideos(appliedFilters);

  // Apply multiple filters at once
  const handleSearch = () => {
    batchFilterChanges({
      platform: 'youtube',
      keywords: 'programming tutorial',
      sortBy: 'views',
      language: 'en',
      videoFilters: {
        ...filters.videoFilters,
        uploadDate: '7d',
        duration: [300, 1200], // 1-5 min and 5-20 min
        viewCount: { min: 10_000, max: 50_000_000 },
      },
      channelFilters: {
        ...filters.channelFilters,
        subscriberCount: { min: 50_000, max: 2_000_000 },
      },
    });
    applyFilters();
  };

  return (
    <>
      <button onClick={handleSearch}>Apply Filters</button>
      {/* Display videos */}
    </>
  );
}
```

### Option 2: Legacy Filters

For individual filter changes:

```tsx
import { useFilters } from './hooks/useFilters';
import { useTrends } from './hooks/useTrends';

function MyComponent() {
  const {
    filters,
    appliedFilters,
    onFilterChange,
    onVideoFilterChange,
    onChannelFilterChange,
    applyFilters,
  } = useFilters();

  const { videos, loading } = useTrends(appliedFilters);

  const handleSearch = () => {
    // Apply filters one by one
    onFilterChange('platform', 'youtube');
    onFilterChange('keywords', 'programming tutorial');
    onFilterChange('sortBy', 'views');
    onFilterChange('language', 'en');
    onVideoFilterChange('uploadDate', '7d');
    onVideoFilterChange('duration', [300, 1200]);
    onVideoFilterChange('viewCount', { min: 10_000, max: 50_000_000 });
    onChannelFilterChange('subscriberCount', { min: 50_000, max: 2_000_000 });
    
    // Apply all changes
    applyFilters();
  };

  return (
    <>
      <button onClick={handleSearch}>Apply Filters</button>
      {/* Display videos */}
    </>
  );
}
```

---

## Enhanced Filters (Recommended)

### Advantages
- ✅ Batch multiple changes efficiently
- ✅ Built-in validation
- ✅ Auto-apply with debouncing (optional)
- ✅ Filter presets support
- ✅ Persistent filters (localStorage)

### Full Example with All Features

```tsx
import { useEnhancedFilters } from './hooks/useEnhancedFilters';
import { useVideos } from './hooks/useVideos';
import { DURATION_MEDIUM, DURATION_LONG } from './lib/constants';

function AdvancedFilterComponent() {
  const {
    filters,                  // Draft filters (not yet applied)
    appliedFilters,          // Currently active filters
    validationErrors,        // Array of validation errors
    isApplying,             // Loading state
    hasPendingChanges,      // True if filters changed but not applied
    isValid,                // True if no validation errors
    
    // Actions
    batchFilterChanges,     // Change multiple filters at once
    applyFilters,           // Apply draft filters
    onClearFilters,         // Reset to defaults
    onApplyPreset,          // Apply a preset configuration
    
    // Helpers
    getFilterSummary,       // Get active filter count
    getPlatformCapabilities, // Check what filters are supported
  } = useEnhancedFilters(undefined, {
    autoApply: false,        // Manual apply (recommended)
    validateOnChange: true,  // Validate as user types
    persistFilters: true,    // Remember in localStorage
    storageKey: 'my-filters'
  });

  const { videos, loading, hasMore, loadMore } = useVideos(appliedFilters);

  // Example: Apply viral video filters
  const searchViralVideos = () => {
    batchFilterChanges({
      platform: 'youtube',
      keywords: 'viral',
      sortBy: 'trending',
      language: 'en',
      country: 'US',
      category: '24', // Entertainment
      videoFilters: {
        uploadDate: '24h',
        customDate: { start: null, end: null },
        viewCount: { min: 1_000_000, max: 50_000_000 },
        duration: [60], // Short videos only
        trending24h: true,
      },
      channelFilters: {
        subscriberCount: { min: 100_000, max: 50_000_000 },
        videoCount: { min: 0, max: 1_000_000 },
        channelAge: 'all',
        monetizationEnabled: 'all',
        monetizationAge: 'all',
        avgVideoLength: { min: 0, max: 7_200 },
        createdDate: { start: null, end: null },
      },
    });
    applyFilters();
  };

  // Example: Apply educational content filters
  const searchEducationalContent = () => {
    batchFilterChanges({
      platform: 'youtube',
      keywords: 'tutorial guide learn',
      sortBy: 'views',
      language: 'en',
      country: 'US',
      category: '27', // Education
      videoFilters: {
        uploadDate: '30d',
        customDate: { start: null, end: null },
        viewCount: { min: 50_000, max: 50_000_000 },
        duration: [DURATION_MEDIUM, DURATION_LONG], // 1-20 min videos
        trending24h: false,
      },
      channelFilters: {
        subscriberCount: { min: 10_000, max: 50_000_000 },
        videoCount: { min: 50, max: 1_000_000 },
        channelAge: '1y', // At least 1 year old
        monetizationEnabled: 'all',
        monetizationAge: 'all',
        avgVideoLength: { min: 300, max: 1_200 }, // 5-20 min average
        createdDate: { start: null, end: null },
      },
    });
    applyFilters();
  };

  // Example: Use presets
  const applyViralPreset = () => {
    onApplyPreset('viral-videos', true); // true = apply immediately
  };

  return (
    <div>
      {/* Show validation errors */}
      {validationErrors.length > 0 && (
        <div className="errors">
          {validationErrors.map((error, i) => (
            <div key={i}>{error.field}: {error.message}</div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <button onClick={searchViralVideos}>Viral Videos</button>
      <button onClick={searchEducationalContent}>Educational</button>
      <button onClick={applyViralPreset}>Viral Preset</button>
      <button onClick={() => onClearFilters(true)}>Clear All</button>

      {/* Show pending indicator */}
      {hasPendingChanges && (
        <div className="pending">
          Unapplied changes - <button onClick={applyFilters}>Apply Now</button>
        </div>
      )}

      {/* Display results */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {videos.map(video => (
            <div key={video.id}>{video.title}</div>
          ))}
          {hasMore && <button onClick={loadMore}>Load More</button>}
        </div>
      )}
    </div>
  );
}
```

---

## Common Filter Combinations

### 1. Trending Shorts (< 1 min)

```ts
batchFilterChanges({
  platform: 'youtube',
  sortBy: 'trending',
  videoFilters: {
    ...filters.videoFilters,
    uploadDate: '24h',
    duration: [60], // < 1 min
    trending24h: true,
  },
});
applyFilters();
```

### 2. Long-form Educational Content

```ts
import { DURATION_LONG, DURATION_VERY_LONG } from './lib/constants';

batchFilterChanges({
  platform: 'youtube',
  keywords: 'deep dive analysis',
  sortBy: 'views',
  category: '27', // Education
  videoFilters: {
    ...filters.videoFilters,
    duration: [DURATION_LONG, DURATION_VERY_LONG], // 5-20+ min
    viewCount: { min: 100_000, max: 50_000_000 },
  },
  channelFilters: {
    ...filters.channelFilters,
    subscriberCount: { min: 50_000, max: 50_000_000 },
  },
});
applyFilters();
```

### 3. New Creator Discovery

```ts
batchFilterChanges({
  platform: 'youtube',
  sortBy: 'date',
  videoFilters: {
    ...filters.videoFilters,
    uploadDate: '7d',
    viewCount: { min: 1_000, max: 100_000 },
  },
  channelFilters: {
    ...filters.channelFilters,
    subscriberCount: { min: 100, max: 10_000 },
    channelAge: '1y', // Less than 1 year old
  },
});
applyFilters();
```

### 4. Viral Gaming Content

```ts
batchFilterChanges({
  platform: 'youtube',
  keywords: 'gameplay highlights',
  sortBy: 'trending',
  category: '20', // Gaming
  language: 'en',
  country: 'US',
  videoFilters: {
    ...filters.videoFilters,
    uploadDate: '24h',
    viewCount: { min: 500_000, max: 50_000_000 },
    duration: [300], // 1-5 min clips
    trending24h: true,
  },
});
applyFilters();
```

### 5. Music Videos by View Count

```ts
batchFilterChanges({
  platform: 'youtube',
  sortBy: 'views',
  category: '10', // Music
  videoFilters: {
    ...filters.videoFilters,
    uploadDate: '30d',
    viewCount: { min: 10_000_000, max: 50_000_000 },
  },
  channelFilters: {
    ...filters.channelFilters,
    subscriberCount: { min: 1_000_000, max: 50_000_000 },
  },
});
applyFilters();
```

---

## Available Filter Options

### Platform
```ts
'all' | 'youtube' | 'dailymotion' | 'reddit' | 'tiktok'
```

### Sort By
```ts
'trending' | 'views' | 'date' | 'subscribers'
```

### Upload Date
```ts
'all' | 'today' | '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom'
```

### Duration (in seconds)
```ts
import { DURATION_SHORT, DURATION_MEDIUM, DURATION_LONG, DURATION_VERY_LONG } from './lib/constants';

// Use constants or raw values
duration: [DURATION_SHORT]           // < 1 min (60)
duration: [DURATION_MEDIUM]          // 1-5 min (300)
duration: [DURATION_LONG]            // 5-20 min (1200)
duration: [DURATION_VERY_LONG]       // > 20 min (Infinity)

// Combine multiple
duration: [DURATION_MEDIUM, DURATION_LONG] // 1-20 min
```

### Channel Age
```ts
'all' | '6m' | '1y' | '2y' | '5y' | '10y'
```

### Language Codes
```ts
'ALL' | 'en' | 'vi' | 'ja' | 'ko' | 'hi' | 'es' | 'fr' | 'de' | 'ru' | 'id'
```

### Country Codes
```ts
'ALL' | 'US' | 'GB' | 'CA' | 'AU' | 'IN' | 'JP' | 'KR' | 'VN' | 'DE' | 'FR' | etc.
```

### YouTube Categories
```ts
'0'  // All Categories
'1'  // Film & Animation
'2'  // Autos & Vehicles
'10' // Music
'15' // Pets & Animals
'17' // Sports
'20' // Gaming
'22' // People & Blogs
'23' // Comedy
'24' // Entertainment
'25' // News & Politics
'26' // Howto & Style
'27' // Education
'28' // Science & Technology
```

### View Count Range
```ts
import { MAX_VIEWS } from './lib/constants';

viewCount: {
  min: 0,            // Minimum views
  max: MAX_VIEWS     // 50,000,000
}
```

### Subscriber Count Range
```ts
import { MAX_SUBSCRIBERS } from './lib/constants';

subscriberCount: {
  min: 0,                  // Minimum subscribers
  max: MAX_SUBSCRIBERS     // 50,000,000
}
```

---

## Tips & Best Practices

### 1. Use Constants
Always import constants instead of hardcoding values:

```ts
import { 
  DURATION_SHORT, 
  DURATION_MEDIUM,
  MAX_VIEWS,
  MAX_SUBSCRIBERS 
} from './lib/constants';
```

### 2. Validate Before Applying
Check `isValid` before applying filters:

```ts
if (isValid) {
  applyFilters();
} else {
  console.error('Validation errors:', validationErrors);
}
```

### 3. Use Batch Changes
More efficient than individual changes:

```ts
// ✅ Good - single batch
batchFilterChanges({ 
  platform: 'youtube',
  keywords: 'tutorial',
  sortBy: 'views'
});

// ❌ Inefficient - multiple updates
onFilterChange('platform', 'youtube');
onFilterChange('keywords', 'tutorial');
onFilterChange('sortBy', 'views');
```

### 4. Preserve Existing Filters
Use spread operator to preserve unchanged filters:

```ts
batchFilterChanges({
  ...filters, // Keep existing
  keywords: 'new search', // Only change this
  videoFilters: {
    ...filters.videoFilters, // Keep existing video filters
    duration: [300], // Only change duration
  },
});
```

### 5. Check Platform Capabilities
Some filters only work on certain platforms:

```ts
const capabilities = getPlatformCapabilities('youtube');

if (capabilities.supportsDurationFilter) {
  // Apply duration filter
}
```

---

## Debugging

### Check Applied Filters
```ts
console.log('Current filters:', appliedFilters);
console.log('Active filter count:', getFilterSummary().count);
```

### Monitor Changes
```ts
useEffect(() => {
  console.log('Filters changed:', appliedFilters);
}, [appliedFilters]);
```

### Validation Errors
```ts
if (validationErrors.length > 0) {
  validationErrors.forEach(error => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

---

## Resources

- **Constants Reference**: `youtube/lib/constants.ts`
- **Type Definitions**: `youtube/lib/types.ts`
- **Duration Utilities**: `youtube/utils/durationUtils.ts`
- **Refactoring Guide**: `CODE_REFACTORING_GUIDE.md`
