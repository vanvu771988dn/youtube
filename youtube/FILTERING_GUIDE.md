# Advanced Filtering System - Complete Guide

## Overview

The VideoTrending app now features a comprehensive, expandable filtering system with support for:

- **Video-level filters**: View count, duration, upload date, trending status
- **Channel-level filters**: Subscriber count, video count, channel age, monetization
- **Localization filters**: Language and country/region selection
- **Category filters**: YouTube category filtering
- **Filter presets**: Quick-apply common filter combinations
- **Smart pagination**: Dynamic page sizes based on filter complexity

---

## Table of Contents

1. [Filter State Structure](#filter-state-structure)
2. [Using Filter Presets](#using-filter-presets)
3. [Creating Custom Filters](#creating-custom-filters)
4. [Utility Functions](#utility-functions)
5. [Examples](#examples)

---

## Filter State Structure

The `FilterState` interface has been expanded to support both video-level and channel-level filtering:

```typescript
interface FilterState {
  // Mode: 'video' or 'channel'
  mode: FilterMode;
  
  // Common filters
  platform: PlatformType;
  keywords: string;
  sortBy: 'trending' | 'views' | 'date' | 'subscribers';
  country: string;      // ISO 3166-1 alpha-2 (e.g., 'US', 'GB', 'ALL')
  language: string;     // BCP-47 (e.g., 'en', 'es', 'ALL')
  category?: string;    // YouTube category ID ('0' = all)
  
  // Video-specific filters
  videoFilters: {
    uploadDate: UploadDateOption;
    customDate: CustomDateRange;
    viewCount: Range;
    duration: number[];
    trending24h: boolean;
  };
  
  // Channel-specific filters
  channelFilters: {
    subscriberCount: Range;
    videoCount: Range;
    channelAge: ChannelAgeOption;
    monetizationEnabled: 'all' | 'yes' | 'no';
    monetizationAge: ChannelAgeOption;
    avgVideoLength: Range;
    createdDate?: CustomDateRange;
  };
}
```

---

## Using Filter Presets

### Available Presets

The system includes 9 built-in presets:

| Preset | Description | Key Filters |
|--------|-------------|-------------|
| `viral-videos` | Videos with 1M+ views in last 24h | Views: 1M+, Upload: 24h, Trending |
| `new-creators` | Emerging channels under 100K subs | Subs: 0-100K, Age: 1+ year |
| `deep-dives` | Long-form content (20+ minutes) | Duration: 20+ min, Views-focused |
| `trending-shorts` | Short-form viral content | Duration: < 1 min, Trending 24h |
| `high-engagement` | Popular recent videos | Views: 100K+, Upload: 7 days |
| `micro-influencers` | Mid-sized channels | Subs: 10K-100K, Active channels |
| `long-form-content` | Educational/documentary style | Duration: 20+ min, Recent |
| `educational-content` | Education category, 5-20 min | Category: Education, Optimal length |
| `gaming-highlights` | Gaming clips, trending | Category: Gaming, 5-20 min clips |
| `music-videos` | Music videos with high views | Category: Music, 2-10 min |

### How to Apply Presets

```typescript
import { useEnhancedFilters } from '@/youtube/hooks/useEnhancedFilters';

function MyComponent() {
  const { onApplyPreset, filters } = useEnhancedFilters(initialFilterState);
  
  // Apply preset immediately
  onApplyPreset('viral-videos', true);
  
  // Apply preset without immediate execution (for review)
  onApplyPreset('micro-influencers', false);
}
```

---

## Creating Custom Filters

### Batch Filter Changes

For applying multiple filters at once, use `batchFilterChanges`:

```typescript
import { useEnhancedFilters } from '@/youtube/hooks/useEnhancedFilters';

function MyComponent() {
  const { batchFilterChanges, applyFilters } = useEnhancedFilters();
  
  // Batch multiple changes
  batchFilterChanges({
    mode: 'video',
    platform: 'youtube',
    country: 'US',
    language: 'en',
    category: '27', // Education
    videoFilters: {
      uploadDate: '7d',
      viewCount: { min: 50_000, max: 50_000_000 },
      duration: [300, 1200], // 5-20 minutes
      trending24h: false,
    },
    channelFilters: {
      subscriberCount: { min: 10_000, max: 1_000_000 },
    },
  });
  
  // Apply all changes
  applyFilters();
}
```

### Single Filter Updates

```typescript
const { onFilterChange } = useEnhancedFilters();

// Update a single filter
onFilterChange('mode', 'channel');
onFilterChange('country', 'GB');

// Nested filter update
onFilterChange('videoFilters', {
  ...filters.videoFilters,
  uploadDate: '24h',
  trending24h: true,
});
```

---

## Utility Functions

### Category Utilities

```typescript
import {
  getCategoryName,
  getCategoryIcon,
  getCategoryColor,
} from '@/youtube/utils';

// Get human-readable category name
const categoryName = getCategoryName('27'); // "Education"

// Get emoji icon for category
const icon = getCategoryIcon('10'); // "🎵" (Music)

// Get Tailwind color class
const colorClass = getCategoryColor('20'); // "bg-indigo-600" (Gaming)
```

### Locale Utilities

```typescript
import {
  POPULAR_LANGUAGES,
  POPULAR_COUNTRIES,
  getLanguageLabel,
  getCountryLabel,
  formatLanguageDisplay,
  formatCountryDisplay,
} from '@/youtube/utils';

// Get language label
const langLabel = getLanguageLabel('es'); // "Spanish"

// Get country label
const countryLabel = getCountryLabel('US'); // "United States"

// Format for display with flag/native name
const langDisplay = formatLanguageDisplay('es'); // "Spanish (Español)"
const countryDisplay = formatCountryDisplay('JP'); // "🇯🇵 Japan"
```

### Filter Utilities

```typescript
import {
  DURATION_PRESETS,
  ENGAGEMENT_TIERS,
  CHANNEL_SIZE_TIERS,
  calculateEngagementRate,
  getEngagementTier,
  getChannelSizeTier,
  formatDuration,
  formatNumber,
  getRecommendedPageSize,
} from '@/youtube/utils';

// Calculate engagement rate
const engagementRate = calculateEngagementRate(video); // 3.45 (%)

// Get engagement tier
const tier = getEngagementTier(video); // 'viral' | 'high' | 'medium' | 'growing' | 'emerging'

// Get channel size tier
const sizeTier = getChannelSizeTier(150000); // 'mid' (100K-1M)

// Format duration
const formatted = formatDuration(3725); // "1h 2m"

// Format large numbers
const viewsFormatted = formatNumber(1234567); // "1.2M"

// Get recommended page size based on active filters
const activeFilterCount = 5;
const pageSize = getRecommendedPageSize(activeFilterCount); // 200
```

---

## Examples

### Example 1: Filter Viral Gaming Videos

```typescript
import { useEnhancedFilters } from '@/youtube/hooks/useEnhancedFilters';

function ViralGamingVideos() {
  const { batchFilterChanges, applyFilters } = useEnhancedFilters();
  
  const findViralGaming = () => {
    batchFilterChanges({
      mode: 'video',
      platform: 'youtube',
      category: '20', // Gaming
      country: 'US',
      sortBy: 'trending',
      videoFilters: {
        uploadDate: '24h',
        viewCount: { min: 500_000, max: 50_000_000 },
        duration: [300, 1200], // 5-20 minutes
        trending24h: true,
      },
    });
    applyFilters();
  };
  
  return (
    <button onClick={findViralGaming}>
      Find Viral Gaming Videos
    </button>
  );
}
```

### Example 2: Discover Micro-Influencers in Education

```typescript
function EducationalMicroInfluencers() {
  const { batchFilterChanges, applyFilters } = useEnhancedFilters();
  
  const findEducators = () => {
    batchFilterChanges({
      mode: 'channel',
      platform: 'youtube',
      category: '27', // Education
      sortBy: 'subscribers',
      channelFilters: {
        subscriberCount: { min: 10_000, max: 100_000 },
        channelAge: '1y', // At least 1 year old
        videoCount: { min: 20, max: 1_000_000 },
      },
    });
    applyFilters();
  };
  
  return (
    <button onClick={findEducators}>
      Find Educational Micro-Influencers
    </button>
  );
}
```

### Example 3: Multi-Language Music Discovery

```typescript
function MultiLanguageMusic() {
  const { batchFilterChanges, applyFilters } = useEnhancedFilters();
  
  const findMusicVideos = (languageCode: string) => {
    batchFilterChanges({
      mode: 'video',
      platform: 'youtube',
      category: '10', // Music
      language: languageCode,
      sortBy: 'views',
      videoFilters: {
        uploadDate: '7d',
        viewCount: { min: 100_000, max: 50_000_000 },
        duration: [120, 600], // 2-10 minutes
      },
    });
    applyFilters();
  };
  
  return (
    <div>
      <button onClick={() => findMusicVideos('es')}>
        Spanish Music 🇪🇸
      </button>
      <button onClick={() => findMusicVideos('ko')}>
        K-Pop 🇰🇷
      </button>
      <button onClick={() => findMusicVideos('ja')}>
        J-Pop 🇯🇵
      </button>
    </div>
  );
}
```

### Example 4: Using Engagement Metrics

```typescript
import {
  calculateEngagementRate,
  getEngagementTier,
  formatNumber,
} from '@/youtube/utils';

function VideoMetricsBadge({ video }: { video: Video }) {
  const engagementRate = calculateEngagementRate(video);
  const tier = getEngagementTier(video);
  
  return (
    <div className="metric-badges">
      <span className="views">
        {formatNumber(video.viewCount)} views
      </span>
      <span className="engagement">
        {engagementRate.toFixed(2)}% engagement
      </span>
      {tier && (
        <span className={`tier tier-${tier}`}>
          {tier}
        </span>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Use Smart Pagination

The system automatically adjusts page size based on active filters:

- **0-1 filters**: 50 results per page
- **2-3 filters**: 100 results per page
- **4-5 filters**: 150 results per page
- **6+ filters**: 200 results per page

This ensures better data coverage when multiple restrictive filters are applied.

### 2. Combine Filters Strategically

For best results:

- **Start broad, narrow down**: Begin with category/country, then add view count/duration
- **Use presets as templates**: Modify existing presets instead of building from scratch
- **Monitor console logs**: Check filter efficiency logs to understand result reduction

### 3. Leverage Filter Validation

The system includes automatic validation:

```typescript
const { validationErrors, isValid } = useEnhancedFilters();

// Check if filters are valid before applying
if (!isValid) {
  console.log('Validation errors:', validationErrors);
}
```

### 4. Persist User Preferences

Enable filter persistence for better UX:

```typescript
const filters = useEnhancedFilters(initialFilterState, {
  persistFilters: true,
  storageKey: 'my-video-filters',
});
```

---

## Performance Tips

1. **Debounce rapid changes**: The system automatically debounces filter changes (300ms default)
2. **Batch related changes**: Use `batchFilterChanges` instead of multiple `onFilterChange` calls
3. **Use presets**: Presets are optimized and tested filter combinations
4. **Monitor active filter count**: More filters = larger page sizes = more API calls

---

## Troubleshooting

### Small result sets with multiple filters

**Problem**: Applying multiple filters yields fewer results than expected

**Solution**: 
- Check console logs for filter reduction stats
- Widen filter ranges (e.g., increase max view count)
- Reduce number of active filters
- Use broader date ranges

### Filters not applying

**Problem**: Filter changes don't seem to take effect

**Solution**:
- Ensure you call `applyFilters()` after `batchFilterChanges`
- Check `hasPendingChanges` to see if changes are waiting
- Review `validationErrors` for validation issues

---

## API Reference

For complete API documentation, see:
- `youtube/hooks/useEnhancedFilters.ts` - Main filtering hook
- `youtube/utils/filterUtils.ts` - Filter calculation utilities
- `youtube/utils/localeUtils.ts` - Language/country utilities
- `youtube/utils/categoryUtils.ts` - Category utilities
- `youtube/lib/types.ts` - Type definitions
