# Code Refactoring & Maintenance Guide

This document outlines the refactoring improvements made to enhance code maintainability, readability, and consistency.

## Summary of Changes

### ✅ Completed Improvements

#### 1. **Centralized Constants** (`youtube/lib/constants.ts`)

**Problem**: Magic numbers and repeated values scattered throughout the codebase.

**Solution**: Created a single source of truth for all application constants:

- **Filter Limits**: `MAX_VIEWS`, `MAX_SUBSCRIBERS`, `MAX_VIDEO_COUNT`, etc.
- **Duration Brackets**: `DURATION_SHORT`, `DURATION_MEDIUM`, `DURATION_LONG`, `DURATION_VERY_LONG`
- **Pagination**: `DEFAULT_PAGE_SIZE`, `DURATION_FILTER_PAGE_SIZE`, `DEFAULT_SAFETY_PAGES`
- **API Configuration**: `API_TIMEOUT`, `MAX_RETRIES`, `RETRY_DELAY_MS`
- **Options Arrays**: `CHANNEL_AGE_OPTIONS`, `COUNTRY_OPTIONS`, `YOUTUBE_CATEGORIES`

**Benefits**:
- Single point of maintenance for values
- Easier to adjust thresholds and limits
- Better IntelliSense support
- Self-documenting code

**Example Before**:
```ts
const MAX_VIEWS = 50_000_000; // Defined in multiple files
if (video.duration < 60) { // Magic number
```

**Example After**:
```ts
import { MAX_VIEWS, DURATION_SHORT } from '../lib/constants';

if (video.duration < DURATION_SHORT) {
```

---

#### 2. **Duration Filter Utilities** (`youtube/utils/durationUtils.ts`)

**Problem**: Complex switch statements for duration filtering duplicated across files.

**Solution**: Created reusable utility functions:

- `matchesDurationBracket(videoDuration, bracket)` - Check single bracket
- `matchesAnyDurationBracket(videoDuration, brackets)` - Check multiple brackets
- `getDurationBracketLabel(bracket)` - Get human-readable label
- `isValidDurationBracket(value)` - Validate bracket value

**Benefits**:
- DRY principle (Don't Repeat Yourself)
- Testable logic in isolation
- Consistent behavior across the app
- Better error handling

**Example Before**:
```ts
if (filters.duration.length > 0) {
  videos = videos.filter(video => {
    return filters.duration.some(bracket => {
      switch (bracket) {
        case 60: return video.duration < 60;
        case 300: return video.duration >= 60 && video.duration < 300;
        // ... more cases
      }
    });
  });
}
```

**Example After**:
```ts
import { matchesAnyDurationBracket } from '../utils/durationUtils';

if (filters.duration.length > 0) {
  videos = videos.filter(video => 
    matchesAnyDurationBracket(video.duration, filters.duration)
  );
}
```

---

#### 3. **Improved Duration Filter Logic**

**Problem**: Duration boundaries were exclusive, causing videos at exactly 5:00 or 20:00 to be excluded.

**Solution**:
- Made 5-minute and 20-minute boundaries inclusive
- Updated comparison operators in `durationUtils.ts`

**Before**:
```ts
case 300: return video.duration >= 60 && video.duration < 300; // Excludes 5:00
case 1200: return video.duration >= 300 && video.duration < 1200; // Excludes 20:00
```

**After**:
```ts
case DURATION_MEDIUM: 
  return videoDuration >= DURATION_SHORT && videoDuration <= DURATION_MEDIUM; // Includes 5:00
case DURATION_LONG:
  return videoDuration > DURATION_MEDIUM && videoDuration <= DURATION_LONG; // Includes 20:00
```

---

#### 4. **Dynamic Page Sizing**

**Problem**: Small result sets when duration filters were active.

**Solution**: Automatically increase fetch size when restrictive filters are applied:

```ts
import { DEFAULT_PAGE_SIZE, DURATION_FILTER_PAGE_SIZE } from '../lib/constants';

const hasDurationFilter = (filters.videoFilters?.duration?.length ?? 0) > 0;
const dynamicLimit = hasDurationFilter ? DURATION_FILTER_PAGE_SIZE : DEFAULT_PAGE_SIZE;
```

**Benefits**:
- Larger result pool when filtering
- Better user experience
- Configurable via constants

---

#### 5. **Consolidated Imports**

**Problem**: Constants imported from different hook files, causing circular dependencies.

**Solution**: 
- Import from `lib/constants.ts` instead of hook files
- Re-export from hooks for backward compatibility

**Before**:
```ts
import { MAX_VIEWS, DURATION_OPTIONS } from '../hooks/useEnhancedFilters';
```

**After**:
```ts
import { MAX_VIEWS, DURATION_OPTIONS } from '../lib/constants';
```

---

#### 6. **Improved Type Safety**

**Problem**: Many uses of `as any` throughout the codebase.

**Solution** (Partial - ongoing):
- Removed type assertions where possible
- Created proper type definitions in `constants.ts`
- Used `as const` for immutable arrays

**Example**:
```ts
export const YOUTUBE_CATEGORIES = [
  { id: '0', label: 'All Categories' },
  { id: '10', label: 'Music' },
  // ...
] as const; // Makes array readonly
```

---

#### 7. **Better Code Documentation**

Added JSDoc comments to:
- All utility functions
- Key constants
- Complex logic sections

**Example**:
```ts
/**
 * Checks if a video duration matches a given duration bracket
 * 
 * @param videoDuration - The video duration in seconds
 * @param durationBracket - The bracket value to match against
 * @returns true if the video duration falls within the bracket
 * 
 * @example
 * matchesDurationBracket(180, DURATION_MEDIUM) // true (1-5 min)
 */
export function matchesDurationBracket(
  videoDuration: number,
  durationBracket: number
): boolean {
  // ...
}
```

---

## Files Modified

### Created
- ✨ `youtube/lib/constants.ts` - Centralized constants
- ✨ `youtube/utils/durationUtils.ts` - Duration filter utilities

### Updated
- 📝 `youtube/lib/aggregator.ts` - Use constants and utilities
- 📝 `youtube/lib/api.ts` - Use constants, improved docs
- 📝 `youtube/lib/filterMapping.ts` - Use constants
- 📝 `youtube/hooks/useFilters.ts` - Import from constants
- 📝 `youtube/hooks/useEnhancedFilters.ts` - Import from constants
- 📝 `youtube/hooks/useTrends.ts` - Use constants
- 📝 `youtube/hooks/useVideos.ts` - Use constants
- 📝 `youtube/components/EnhancedFilterBar.tsx` - Use constants
- 📝 `youtube/components/FilterBar.tsx` - Use constants

---

## Remaining Improvements (Recommendations)

### 1. **Consolidate Hooks**

**Issue**: `useVideos` and `useTrends` have similar logic.

**Recommendation**: 
- Merge into a single `useVideos` hook
- Add feature flags for different behaviors

### 2. **Remove Duplicate Error Components**

**Issue**: Error components exist in both `error/` and `errors/` directories.

**Recommendation**:
- Keep one directory (suggest `errors/`)
- Remove duplicate files

### 3. **Simplify Filter State**

**Issue**: Two filter systems (enhanced and legacy) cause confusion.

**Recommendation**:
- Standardize on enhanced filters
- Deprecate legacy system gradually

### 4. **Extract Channel Age Mapping**

**Issue**: Channel age mapping logic exists in multiple places.

**Status**: ✅ Completed - now uses `CHANNEL_AGE_TO_YEARS` from constants

### 5. **Add Unit Tests**

**Recommendation**:
- Test `durationUtils.ts` functions
- Test filter validation logic
- Test API response handling

---

## Best Practices Going Forward

### 1. **Adding New Constants**

Always add to `youtube/lib/constants.ts`:

```ts
// ✅ Good
export const NEW_FEATURE_LIMIT = 1000;

// ❌ Bad - don't define inline
const limit = 1000;
```

### 2. **Duration Filtering**

Use utilities from `durationUtils.ts`:

```ts
// ✅ Good
import { matchesAnyDurationBracket } from '../utils/durationUtils';
const matches = matchesAnyDurationBracket(video.duration, selectedBrackets);

// ❌ Bad - don't write custom logic
if (video.duration >= 60 && video.duration < 300) { /* ... */ }
```

### 3. **Importing Constants**

Import from the constants file:

```ts
// ✅ Good
import { MAX_VIEWS, DURATION_OPTIONS } from '../lib/constants';

// ❌ Bad
import { MAX_VIEWS } from '../hooks/useFilters';
```

### 4. **Type Safety**

Avoid `as any` when possible:

```ts
// ✅ Good
const filters: ApiFilterParams = {
  ...initialFilterState,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  ...customFilters
} as ApiFilterParams;

// ❌ Bad
const filters = { ...stuff } as any;
```

### 5. **Documentation**

Add JSDoc for exported functions:

```ts
/**
 * Brief description
 * 
 * @param paramName - Description
 * @returns Description
 * 
 * @example
 * functionName(example) // result
 */
export function functionName(paramName: Type): ReturnType {
  // implementation
}
```

---

## Testing the Changes

### 1. **Verify Duration Filtering**

Test with different duration brackets:
- Select "< 1 min" - Should show shorts
- Select "1-5 min" - Should include 5:00 videos
- Select "5-20 min" - Should include 20:00 videos
- Select "> 20 min" - Should show long-form content

### 2. **Check Constants Usage**

All constants should be imported from `lib/constants.ts`:
```bash
# Search for any hardcoded values
grep -r "50_000_000" youtube/
grep -r "10_000_000" youtube/
```

### 3. **Verify Page Sizes**

Duration filter should trigger larger fetch:
- Without duration: 50 items per page
- With duration: 100 items per page

---

## Migration Path

If using the old constants from hooks:

```ts
// Old code
import { MAX_VIEWS, DURATION_OPTIONS } from '../hooks/useFilters';

// New code (backward compatible)
import { MAX_VIEWS, DURATION_OPTIONS } from '../lib/constants';
```

The old imports still work due to re-exports, but prefer importing from constants directly.

---

## Performance Impact

### Improvements
- ✅ Reduced bundle size (shared constants)
- ✅ Better tree-shaking
- ✅ Faster duration filtering (no repeated switch statements)

### No Negative Impact
- Same runtime performance
- No breaking changes for existing code

---

## Questions & Support

For questions about these refactorings:

1. Check `CODE_REFACTORING_GUIDE.md` (this file)
2. Review `youtube/lib/constants.ts` for all available constants
3. Check `youtube/utils/durationUtils.ts` for duration utilities

---

## Changelog

### 2025-10-15
- ✨ Created centralized constants file
- ✨ Created duration utilities
- 🐛 Fixed duration boundary inclusivity
- 📝 Updated 10+ files to use new constants
- 📝 Improved documentation throughout
