# API Diagnostics Guide

## Problem Fixed

The app was returning fewer results than YouTube because:

1. **Multi-keyword search didn't support pagination** - It only fetched the initial batch
2. **Insufficient logging** - No visibility into API calls and filtering
3. **Complex multi-strategy search** - Tried to be too clever, failed to scale

## Solution Implemented

### 1. **Simplified Multi-Keyword Search**

**Before:**
```ts
// Made 5-10 API calls, got 20-50 results each
// NO pagination support
// Total: 100-500 videos max
```

**After:**
```ts
// Single combined search with pagination
// Full 50 results per call
// Supports 50 API pages
// Total: Up to 2,500 videos
```

### 2. **Comprehensive Logging**

Now you can see exactly what's happening:

```
[YouTube Service] searchVideos: Query="programming tutorial", Requested 50, Got 50, NextToken: yes
[Aggregator] === API Call 1 (pool: 0/150, pages left: 49) ===
[Aggregator] Fetched 50 videos from YouTube API (total so far: 50, token: available)
[Aggregator] View filter: 50 -> 42 (10000-50000000)
[Aggregator] Duration filter: 42 -> 35
[Aggregator] De-duplication: 35 -> 35 new videos (pool: 35)
[Aggregator] Pool size: 35/150, fetching next page (pages remaining: 49)
```

---

## How to Diagnose Issues

### Step 1: Open Browser Console

1. Open your app
2. Press F12 or right-click → Inspect
3. Go to **Console** tab
4. Apply filters and click "Apply Filters"

### Step 2: Check API Fetch Logs

Look for these key indicators:

#### ✅ **Good - API is returning data:**
```
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
```
- **Got 50** = YouTube returned full page
- **NextToken: yes** = More pages available

#### ⚠️ **Warning - Small results:**
```
[YouTube Service] searchVideos: Query="very specific query", Requested 50, Got 12, NextToken: no
```
- **Got 12** = YouTube only found 12 videos matching your query
- **NextToken: no** = No more pages available
- **Reason:** Query is too specific, or upload date filter is too restrictive

#### ❌ **Error - No results:**
```
[YouTube Service] No search results for query: "nonexistent"
```
- YouTube found nothing
- Try broader search terms

### Step 3: Check Filter Efficiency

Look for the filtering summary:

```
[Aggregator] === Fetch Summary ===
[Aggregator] API calls made: 25
[Aggregator] Total videos fetched from API: 1,250
[Aggregator] Videos after filtering: 487
[Aggregator] Target was: 150
[Aggregator] Efficiency: 39% pass rate
```

#### Interpreting Results:

| Pass Rate | Meaning | Action |
|-----------|---------|--------|
| 80-100% | ✅ Filters are reasonable | None needed |
| 50-79% | ⚠️ Filters eliminating half the results | Consider widening ranges |
| 20-49% | ⚠️ Filters are restrictive | Widen ranges or remove filters |
| < 20% | ❌ Filters too restrictive | Remove some filters |

**Example of too-restrictive filters:**
```
[Aggregator] View filter: 250 -> 12 (5000000-10000000)
[Aggregator] Efficiency: 4% pass rate
```
**Solution:** Widen view count range to `(1000000-50000000)`

### Step 4: Check Pagination

```
[Aggregator] Pool size: 35/150, fetching next page (pages remaining: 49)
```

#### ✅ **Good:**
- Pool growing steadily
- Pages remaining > 0
- Fetching continues

#### ❌ **Problem - Stopped too early:**
```
[Aggregator] Stopping: pool=22, limit=150, hasToken=yes, pagesRemaining=42
```
- **hasToken=yes** but stopped anyway
- This shouldn't happen - report if you see this

---

## Common Issues & Solutions

### Issue 1: "Still getting small results"

**Check console for:**
```
[YouTube Service] searchVideos: Query="...", Requested 50, Got 8, NextToken: no
```

**Diagnosis:** YouTube itself doesn't have many videos matching your criteria

**Solutions:**
1. **Broaden search terms:**
   ```ts
   // ❌ Too specific
   keywords: "advanced machine learning transformers pytorch 2023"
   
   // ✅ Better
   keywords: "machine learning tutorial"
   ```

2. **Relax upload date:**
   ```ts
   // ❌ Too restrictive
   uploadDate: '24h'
   
   // ✅ Better
   uploadDate: '7d' or '30d'
   ```

3. **Widen view count range:**
   ```ts
   // ❌ Too narrow
   viewCount: { min: 1_000_000, max: 2_000_000 }
   
   // ✅ Better
   viewCount: { min: 100_000, max: 50_000_000 }
   ```

---

### Issue 2: "Filters eliminating too many videos"

**Check console for:**
```
[Aggregator] View filter: 250 -> 15 (10000000-50000000)
[Aggregator] Duration filter: 15 -> 3
[Aggregator] Efficiency: 1% pass rate
```

**Diagnosis:** Filters are cascading and eliminating 99% of results

**Solutions:**

1. **Remove one filter at a time** to identify the culprit:
   ```ts
   // Start with just keywords
   batchFilterChanges({
     keywords: 'tutorial',
     // Remove all other filters
   });
   
   // Add filters one by one
   ```

2. **Check which filter is most restrictive:**
   - Look for the biggest drop in console logs
   - That's your problematic filter

3. **Adjust the restrictive filter:**
   ```ts
   // If duration filter drops from 250 → 15
   // Then your duration selection is too narrow
   duration: [300, 1200, Infinity] // Add more brackets
   ```

---

### Issue 3: "API returning empty after first few pages"

**Check console for:**
```
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 0, NextToken: no
```

**Diagnosis:** YouTube ran out of results (reached end of available videos)

**This is normal** for:
- Very specific queries
- Restrictive upload dates (24h)
- Niche categories

**Solutions:**
- Use broader search terms
- Extend upload date range
- Accept that some queries have limited results

---

### Issue 4: "Getting API errors"

**Check console for:**
```
[YouTube Service] Error: YouTube API error: 403 Forbidden - Quota exceeded
```

**Common API Errors:**

| Error | Meaning | Solution |
|-------|---------|----------|
| 403 Quota exceeded | Hit daily API limit | Wait 24 hours or add more API keys |
| 400 Bad request | Invalid parameters | Check filter values are valid |
| 404 Not found | Invalid endpoint | Check YouTube API key is correct |
| 500 Server error | YouTube's problem | Retry later |

---

## Performance Tuning

### Current Settings (in `constants.ts`):

```ts
// Fetch sizes
DEFAULT_PAGE_SIZE = 50              // No filters
DURATION_FILTER_PAGE_SIZE = 100     // 1-2 filters
MULTI_FILTER_PAGE_SIZE = 150        // 3+ filters

// Max API pages
DEFAULT_SAFETY_PAGES = 10           // Max 500 videos
RESTRICTIVE_FILTER_SAFETY_PAGES = 30 // Max 1,500 videos
MULTI_FILTER_SAFETY_PAGES = 50      // Max 2,500 videos
```

### If You Need More Results:

Edit `youtube/lib/constants.ts`:

```ts
// Get even more results (slower, more API quota)
export const MULTI_FILTER_PAGE_SIZE = 200; // Was 150
export const MULTI_FILTER_SAFETY_PAGES = 75; // Was 50
// Max results: 200 × 75 = 15,000 videos (before filtering)
```

### If You Need Faster Loading:

```ts
// Faster but fewer results
export const MULTI_FILTER_PAGE_SIZE = 100; // Was 150
export const MULTI_FILTER_SAFETY_PAGES = 25; // Was 50
// Max results: 100 × 25 = 2,500 videos (before filtering)
```

---

## Example Console Output (Working Correctly)

Here's what you should see when everything is working:

```
[useTrends] Active filters: 3, Fetch limit: 150
[Aggregator] Active filters: 3, Safety pages: 50
[Aggregator] Target: 150 videos, Current pool: 0

[Aggregator] === API Call 1 (pool: 0/150, pages left: 49) ===
[Aggregator] Single keyword search: "tutorial"
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[Aggregator] Fetched 50 videos from YouTube API (total so far: 50, token: available)
[Aggregator] View filter: 50 -> 45 (10000-50000000)
[Aggregator] Duration filter: 45 -> 38
[Aggregator] De-duplication: 38 -> 38 new videos (pool: 38)
[Aggregator] Pool size: 38/150, fetching next page (pages remaining: 49)

[Aggregator] === API Call 2 (pool: 38/150, pages left: 48) ===
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[Aggregator] Fetched 50 videos from YouTube API (total so far: 100, token: available)
[Aggregator] View filter: 50 -> 43 (10000-50000000)
[Aggregator] Duration filter: 43 -> 37
[Aggregator] De-duplication: 37 -> 35 new videos (pool: 73)
[Aggregator] Pool size: 73/150, fetching next page (pages remaining: 48)

[Aggregator] === API Call 3 (pool: 73/150, pages left: 47) ===
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[Aggregator] Fetched 50 videos from YouTube API (total so far: 150, token: available)
[Aggregator] View filter: 50 -> 44 (10000-50000000)
[Aggregator] Duration filter: 44 -> 38
[Aggregator] De-duplication: 38 -> 36 new videos (pool: 109)
[Aggregator] Pool size: 109/150, fetching next page (pages remaining: 47)

[Aggregator] === API Call 4 (pool: 109/150, pages left: 46) ===
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[Aggregator] Fetched 50 videos from YouTube API (total so far: 200, token: available)
[Aggregator] View filter: 50 -> 42 (10000-50000000)
[Aggregator] Duration filter: 42 -> 35
[Aggregator] De-duplication: 35 -> 33 new videos (pool: 142)
[Aggregator] Pool size: 142/150, fetching next page (pages remaining: 46)

[Aggregator] === API Call 5 (pool: 142/150, pages left: 45) ===
[YouTube Service] searchVideos: Query="tutorial", Requested 50, Got 50, NextToken: yes
[Aggregator] Fetched 50 videos from YouTube API (total so far: 250, token: available)
[Aggregator] View filter: 50 -> 41 (10000-50000000)
[Aggregator] Duration filter: 41 -> 32
[Aggregator] De-duplication: 32 -> 29 new videos (pool: 171)
[Aggregator] Stopping: pool=171, limit=150, hasToken=yes, pagesRemaining=45

[Aggregator] === Fetch Summary ===
[Aggregator] API calls made: 5
[Aggregator] Total videos fetched from API: 250
[Aggregator] Videos after filtering: 171
[Aggregator] Target was: 150
[Aggregator] Efficiency: 68% pass rate
```

**Interpretation:**
- ✅ Made 5 API calls
- ✅ Fetched 250 videos total
- ✅ 171 passed filters (68% pass rate)
- ✅ Exceeded target of 150
- ✅ Stopped when target reached

---

## Quick Debugging Checklist

When results are smaller than expected:

- [ ] Check YouTube Service logs - are full pages being returned?
- [ ] Check filter efficiency - what's the pass rate?
- [ ] Try removing filters one by one - which one causes the drop?
- [ ] Check for API errors in console
- [ ] Try broader search terms
- [ ] Extend upload date range
- [ ] Check if quota is exceeded

---

## Related Files

- `youtube/lib/aggregator.ts` - Main fetching logic with logging
- `youtube/services/youtube.service.ts` - YouTube API calls
- `youtube/lib/constants.ts` - Tuning parameters
- `MULTI_FILTER_IMPROVEMENTS.md` - Multi-filter behavior
- `CODE_REFACTORING_GUIDE.md` - Overall improvements

---

## Support

If you're still seeing issues after following this guide:

1. Copy the **entire console log output**
2. Note your filter settings
3. Report the issue with logs attached

The logs will show exactly where the bottleneck is!
