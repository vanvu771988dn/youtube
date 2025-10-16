# Unified Filtering Guide

This is the single source of truth for filtering across platforms (YouTube, Dailymotion, Reddit). It supersedes ENHANCED-FILTERS-README.md, FILTERING_GUIDE.md, and FilterModeGuide.md.

## Overview

- Video-level filters: view count, duration, upload date, trending 24h
- Channel-level filters (YouTube): subscriber count, video count, channel age, monetization
- Localization: language and country
- Category: YouTube category filtering
- Presets, validation, manual apply, persistence, batching

## Filter State (simplified)

```ts path=null start=null
interface FilterState {
  mode: 'video' | 'channel';
  platform: 'all' | 'youtube' | 'dailymotion' | 'reddit';
  keywords: string;
  sortBy: 'trending' | 'views' | 'date' | 'subscribers';
  country?: string;  // ISO 3166-1 (e.g., 'US')
  language?: string; // BCP-47 (e.g., 'en')
  category?: string; // YouTube category ID ('0' = all)
  uploadDate: 'all'|'today'|'24h'|'7d'|'30d'|'3m'|'6m'|'1y'|'custom';
  customDate: { start: string|null; end: string|null };
  duration: number[]; // seconds brackets via UI presets
  trending24h: boolean;
  viewCount: { min: number; max: number };
  subscriberCount: { min: number; max: number };
  channelAge: 'all'|1|3|5; // years (mapped from UI)
  excludeGaming: boolean;
}
```

## Platform capabilities

- YouTube: full feature set
- Dailymotion: no subscriber or channel age filtering
- Reddit: no subscriber, channel age, or trending24h

The UI adapts automatically when switching platforms and resets incompatible fields.

## Using the hooks

```ts path=null start=null
import { useEnhancedFilters } from '@/youtube/hooks/useEnhancedFilters';
import { useVideos } from '@/shared/hooks/useVideos';

export function App() {
  const {
    filters, appliedFilters, validationErrors,
    onFilterChange, applyFilters, onClearFilters, onApplyPreset,
    batchFilterChanges, hasPendingChanges, isValid,
    getPlatformCapabilities, getFilterSummary, filterPresets,
  } = useEnhancedFilters(undefined, { persistFilters: true, validateOnChange: true, autoApply: false });

  const { videos, loading, error, hasMore, loadMore, refresh } = useVideos(appliedFilters);
  // Render EnhancedFilterBar + VideoGrid
}
```

## Presets

Built-in examples include viral-videos, new-creators, deep-dives, trending-shorts, etc. Apply via `onApplyPreset(presetKey, applyImmediately)`.

## Validation and apply flow

1) Draft changes via `onFilterChange` or `batchFilterChanges`
2) Real-time validation updates `validationErrors` and `isValid`
3) Click Apply to push a single, complete filter payload to the API

## Pagination and performance

- Page size scales with active filter count
- Unified hook manages platform-specific pagination: pageToken (YouTube), page (Dailymotion), after (Reddit)
- Responses cached; videos deduplicated client-side for display

## Troubleshooting

- Few results: broaden date ranges or ranges (views/subs), reduce active filters
- Filters not applying: ensure `applyFilters()` is called and `hasPendingChanges` is true
- Quota exceeded (403/429): wait, reduce page size, or run later

## API layer

Client calls a unified API layer that delegates to platform services (YouTube/Reddit/Dailymotion). All inclusion/exclusion should be computed server-side when available; client performs display-only transforms.

## Deprecated docs

- youtube/ENHANCED-FILTERS-README.md → replaced by this file
- youtube/FILTERING_GUIDE.md → replaced by this file
- youtube/FilterModeGuide.md → outdated; channel mode still supported
