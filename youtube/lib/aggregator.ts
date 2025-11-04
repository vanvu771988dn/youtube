import { ApiFilterParams, Video } from './types';
import YouTubeService from '../services/youtube.service';
import { translateKeywordsForCountry, getCountryLanguage } from '../services/translation.service';
import { buildYouTubeQueryKey, getPublishedAfterDate, getYouTubeSortOrder, mapChannelAgeToYears } from './filterMapping';
import config from './config';
import { calculateVelocity } from '../utils/formatters';
import { DEFAULT_SAFETY_PAGES, RESTRICTIVE_FILTER_SAFETY_PAGES, MULTI_FILTER_SAFETY_PAGES, MAX_VIEWS, MAX_SUBSCRIBERS, MAX_VIDEO_COUNT } from './constants';
import { matchesAnyDurationBracket } from '../utils/durationUtils';

// Internal pagination state across calls, keyed by meaningful filter signature
// Stores a buffer of leftover items and de-duplication set
const ytPaginationState = new Map<string, { nextPageToken?: string; seenIds: Set<string>; buffer: Video[] }>();

export const fetchYouTubePage = async (
  filters: ApiFilterParams,
  youtubeService: YouTubeService
): Promise<{ data: Video[]; hasMore: boolean }> => {
  const key = buildYouTubeQueryKey(filters);
  
  console.log(`[Aggregator] ========== STARTING fetchYouTubePage ==========`);
  console.log(`[Aggregator] Page: ${filters.page}, Limit: ${filters.limit}`);
  console.log(`[Aggregator] State exists: ${ytPaginationState.has(key)}`);
  
  if (!ytPaginationState.has(key) || filters.page === 1) {
    console.log(`[Aggregator] ↻ RESETTING state (new query or page 1)`);
    ytPaginationState.set(key, { nextPageToken: undefined, seenIds: new Set<string>(), buffer: [] });
  } else {
    const existingState = ytPaginationState.get(key)!;
    console.log(`[Aggregator] ➡ CONTINUING from existing state:`);
    console.log(`[Aggregator]    - nextPageToken: ${existingState.nextPageToken ? '✓ EXISTS' : '✗ NONE'}`);
    console.log(`[Aggregator]    - buffer size: ${existingState.buffer.length}`);
    console.log(`[Aggregator]    - seen IDs: ${existingState.seenIds.size}`);
  }
  
  const state = ytPaginationState.get(key)!;

  // Start from buffered leftovers
  let pool: Video[] = state.buffer ? [...state.buffer] : [];
  state.buffer = [];
  
  console.log(`[Aggregator] Starting pool size: ${pool.length}`);

  // Define variables needed for filter calculations first
  const isChannelMode = filters.mode === 'channel';
  const hasKeywords = filters.keywords && filters.keywords.trim();
  const useDirectChannelSearch = isChannelMode && hasKeywords;
  
  // Check if we have restrictive channel filters that will eliminate many results
  const hasRestrictiveChannelFilters = 
    (filters.channelFilters as any).createdDate?.start || 
    (filters.channelFilters as any).createdDate?.end ||
    filters.channelFilters.videoCount.min > 0 ||
    filters.channelFilters.videoCount.max < MAX_VIDEO_COUNT;
  
  // Check if subscriber filter is restrictive
  const hasSubFilter = filters.channelFilters.subscriberCount.min > 0 || filters.channelFilters.subscriberCount.max < MAX_SUBSCRIBERS;

  // Count active restrictive filters to determine fetch strategy
  const activeFilterCount = [
    filters.videoFilters.duration && filters.videoFilters.duration.length > 0,
    filters.videoFilters.viewCount.min > 0 || filters.videoFilters.viewCount.max < MAX_VIEWS,
    filters.channelFilters.subscriberCount.min > 0 || filters.channelFilters.subscriberCount.max < MAX_SUBSCRIBERS,
    filters.videoFilters.uploadDate !== 'all',
    filters.channelFilters.channelAge !== 'all',
    filters.channelFilters.videoCount.min > 0 || filters.channelFilters.videoCount.max < MAX_VIDEO_COUNT,
    hasRestrictiveChannelFilters, // Channel creation date filters
    isChannelMode && hasKeywords && hasSubFilter, // Channel mode with both keywords and subscriber filters
  ].filter(Boolean).length;

  // Increase safety pages based on number of active filters
  let safetyPages = DEFAULT_SAFETY_PAGES;
  if (activeFilterCount >= 3) {
    safetyPages = MULTI_FILTER_SAFETY_PAGES; // 50 pages for 3+ filters
  } else if (activeFilterCount >= 1) {
    safetyPages = RESTRICTIVE_FILTER_SAFETY_PAGES; // 30 pages for 1-2 filters
  }

  console.log(`[Aggregator] Active filters: ${activeFilterCount}, Safety pages: ${safetyPages}`);
  console.log(`[Aggregator] Mode: ${filters.mode}`);
  
  // Higher multipliers for channel mode, even higher when filtering
  let channelMultiplier = 1;
  if (isChannelMode) {
    if (useDirectChannelSearch) {
      // Direct channel search: increase multiplier based on filter restrictiveness
      if (hasRestrictiveChannelFilters && hasSubFilter) {
        channelMultiplier = 15; // Very restrictive: both channel filters and subscriber filters
      } else if (hasRestrictiveChannelFilters || hasSubFilter) {
        channelMultiplier = 8; // Moderately restrictive
      } else {
        channelMultiplier = 4; // Basic channel search
      }
    } else {
      // Video-based channel aggregation: need even higher multipliers
      if (hasRestrictiveChannelFilters && hasSubFilter) {
        channelMultiplier = 25; // Very restrictive: need lots of videos to find matching channels
      } else if (hasRestrictiveChannelFilters || hasSubFilter) {
        channelMultiplier = 15; // Moderately restrictive
      } else {
        channelMultiplier = 10; // Basic channel mode
      }
    }
  }
  
  const effectiveLimit = filters.limit * channelMultiplier;
  
  console.log(`[Aggregator] Channel multiplier: ${channelMultiplier} (hasRestrictiveFilters: ${hasRestrictiveChannelFilters})`);
  console.log(`[Aggregator] Using direct channel search: ${useDirectChannelSearch}`);
  
  console.log(`[Aggregator] Target: ${filters.limit} ${isChannelMode ? 'channels' : 'videos'}, Effective fetch limit: ${effectiveLimit}`);
  console.log(`[Aggregator] Current pool: ${pool.length}`);
  
  let nextToken: string | undefined = state.nextPageToken;
  let apiCallCount = 0;
  let totalFetchedFromAPI = 0;

  while (pool.length < effectiveLimit && safetyPages > 0) {
    safetyPages--;
    apiCallCount++;
    let pageVideos: Video[] = [];
    let pageNextToken: string | undefined;
    
    console.log(`[Aggregator] === API Call ${apiCallCount} (pool: ${pool.length}/${filters.limit}, pages left: ${safetyPages}) ===`);

    // CHANNEL MODE WITH KEYWORDS: Search channels directly
    if (useDirectChannelSearch) {
      const order = getYouTubeSortOrder(filters.sortBy);
      const channelOrder = order === 'date' ? 'date' : order === 'viewCount' ? 'viewCount' : 'relevance';
      
      // Translate keywords to target country language if country filter is applied and not ALL
      let processedKeywords = filters.keywords;
      if (filters.country && filters.country !== 'ALL') {
        const targetLanguage = getCountryLanguage(filters.country);
        console.log(`[Aggregator] Country filter detected (${filters.country}), translating keywords to ${targetLanguage}...`);
        processedKeywords = await translateKeywordsForCountry(filters.keywords, filters.country);
      }
      
      const terms = processedKeywords.split(/[;,|]+/).map(t => t.trim()).filter(Boolean);
      
      // Apply OR/AND logic for channel search
      const isAndLogic = filters.keywordMatch === 'AND';
      const combinedQuery = terms.length > 1 
        ? (isAndLogic ? terms.join(' ') : terms.join(' OR '))
        : processedKeywords;
      
      console.log(`[Aggregator] Channel mode (${filters.keywordMatch}): searching channels with query "${combinedQuery}"`);
      
      const { channels, nextPageToken: token } = await youtubeService.searchChannels(
        combinedQuery,
        50,
        channelOrder,
        nextToken
      );
      
      pageVideos = channels; // Channels are returned in Video format
      pageNextToken = token;
      console.log(`[Aggregator] Channel search results: ${channels.length} channels, nextToken: ${token ? 'yes' : 'no'}`);
    }
    // VIDEO MODE OR CHANNEL MODE WITHOUT KEYWORDS: Search/fetch videos
    else if (filters.keywords && filters.keywords.trim()) {
      let publishedAfter: string | undefined;
      try {
        publishedAfter = getPublishedAfterDate(filters.videoFilters.uploadDate, filters.videoFilters.customDate);
        // Additional validation
        if (publishedAfter) {
          const testDate = new Date(publishedAfter);
          if (isNaN(testDate.getTime()) || !publishedAfter.endsWith('Z')) {
            console.warn('Invalid publishedAfter date, skipping:', publishedAfter);
            publishedAfter = undefined;
          }
        }
      } catch (error) {
        console.error('Error generating publishedAfter date:', error);
        publishedAfter = undefined;
      }
      
      const order = getYouTubeSortOrder(filters.sortBy);
      
      // Translate keywords to target country language if country filter is applied and not ALL
      let processedKeywords = filters.keywords;
      if (filters.country && filters.country !== 'ALL') {
        const targetLanguage = getCountryLanguage(filters.country);
        console.log(`[Aggregator] Country filter detected (${filters.country}), translating keywords to ${targetLanguage}...`);
        processedKeywords = await translateKeywordsForCountry(filters.keywords, filters.country);
      }
      
      const terms = processedKeywords.split(/[;,|]+/).map(t => t.trim()).filter(Boolean);

      if (terms.length > 1) {
        // Multi-keyword search: use OR or AND logic based on filter
        const isAndLogic = filters.keywordMatch === 'AND';
        const combinedQuery = isAndLogic ? terms.join(' ') : terms.join(' OR ');
        console.log(`[Aggregator] Multi-keyword ${filters.keywordMatch} search: "${combinedQuery}"`);
        
        const { videos, nextPageToken: token } = await youtubeService.searchVideos(
          combinedQuery,
          50, // Full page size
          order,
          publishedAfter,
          nextToken, // Enable pagination
          filters.language !== 'ALL' ? filters.language : undefined
        );
        
        pageVideos = videos;
        pageNextToken = token;
        console.log(`[Aggregator] Multi-keyword ${filters.keywordMatch} results: ${videos.length} videos, nextToken: ${token ? 'yes' : 'no'}`);
      } else {
        // Single keyword search
        const { videos, nextPageToken: token } = await youtubeService.searchVideos(
          processedKeywords,
          50,
          order,
          publishedAfter,
          nextToken,
          filters.language !== 'ALL' ? filters.language : undefined
        );
        pageVideos = videos;
        pageNextToken = token;
        console.log(`[Aggregator] Single keyword search: ${videos.length} videos, nextToken: ${token ? 'yes' : 'no'}`);
      }
    } else {
      // No keywords: fetch trending videos (works for both video and channel mode)
      console.log(`[Aggregator] ${isChannelMode ? 'Channel mode (no keywords)' : 'Video mode'}: fetching trending videos...`);
      const { videos, nextPageToken: token } = await youtubeService.getTrendingVideos(
        50,
        filters.country !== 'ALL' ? filters.country : config.youtube.defaultRegion,
        (filters as any).category || config.youtube.defaultCategoryId,
        nextToken
      );
      pageVideos = videos;
      pageNextToken = token;
      console.log(`[Aggregator] Trending videos: ${videos.length} videos, nextToken: ${token ? 'yes' : 'no'}`);
    }
    
    totalFetchedFromAPI += pageVideos.length;
    console.log(`[Aggregator] Fetched ${pageVideos.length} videos from YouTube API (total so far: ${totalFetchedFromAPI}, token: ${pageNextToken ? 'available' : 'none'}`);

    // Client-side filtering on video list
    let filteredVideos = pageVideos;

    if (filters.platform === 'youtube') {
      filteredVideos = filteredVideos.filter(v => v.platform === 'youtube');
    }

    // Exclude Gaming category if filter is enabled (category ID: 20)
    if (filters.excludeGaming) {
      const beforeGamingFilter = filteredVideos.length;
      filteredVideos = filteredVideos.filter(v => v.category !== '20');
      console.log(`[Aggregator] Gaming exclusion filter: ${beforeGamingFilter} -> ${filteredVideos.length}`);
    }

    // Apply view count filter (only if meaningfully changed from defaults)
    const vc = filters.videoFilters.viewCount;
    const hasViewFilter = vc.min > 0 || vc.max < MAX_VIEWS;
    if (hasViewFilter) {
      const beforeViewFilter = filteredVideos.length;
      filteredVideos = filteredVideos.filter(v => v.viewCount >= vc.min && v.viewCount <= vc.max);
      console.log(`[Aggregator] View filter: ${beforeViewFilter} -> ${filteredVideos.length} (${vc.min}-${vc.max})`);
    }

    // Apply subscriber count filter (only if meaningfully changed from defaults)
    const sc = filters.channelFilters.subscriberCount;
    const hasSubFilter = sc.min > 0 || sc.max < MAX_SUBSCRIBERS;
    if (hasSubFilter) {
      const beforeSubFilter = filteredVideos.length;
      filteredVideos = filteredVideos.filter(v => v.subscriberCount >= sc.min && v.subscriberCount <= sc.max);
      console.log(`[Aggregator] Subscriber filter: ${beforeSubFilter} -> ${filteredVideos.length} (${sc.min}-${sc.max})`);
    }

    if (filters.language && filters.language !== 'ALL') {
      filteredVideos = filteredVideos.filter(v => (v.language || '').toLowerCase().startsWith(filters.language.toLowerCase()));
    }

    // Apply country filter (client-side)
    if (filters.country && filters.country !== 'ALL') {
      const beforeCountryFilter = filteredVideos.length;
      filteredVideos = filteredVideos.filter(v => v.country === filters.country);
      console.log(`[Aggregator] Country filter: ${beforeCountryFilter} -> ${filteredVideos.length} (${filters.country})`);
    }

    const maxYears = mapChannelAgeToYears(filters.channelFilters.channelAge);
    if (maxYears !== null) {
      filteredVideos = filteredVideos.filter(v => typeof v.channelAge === 'number' && v.channelAge <= maxYears);
    }

    // Apply duration filter using centralized utility
    if (filters.videoFilters.duration.length > 0) {
      const beforeDurationFilter = filteredVideos.length;
      filteredVideos = filteredVideos.filter(video =>
        matchesAnyDurationBracket(video.duration, filters.videoFilters.duration)
      );
      console.log(`[Aggregator] Duration filter: ${beforeDurationFilter} -> ${filteredVideos.length}`);
    }

    // De-duplicate and add to pool
    const beforeDedup = filteredVideos.length;
    let addedCount = 0;
    for (const v of filteredVideos) {
      if (!state.seenIds.has(v.id)) {
        state.seenIds.add(v.id);
        pool.push(v);
        addedCount++;
      }
    }
    console.log(`[Aggregator] De-duplication: ${beforeDedup} -> ${addedCount} new ${isChannelMode ? 'channels' : 'videos'} added to pool (pool size: ${pool.length})`);

    // Check if we need to fetch more pages
    // For heavily filtered results, continue even if we have some results but not a full page
    const currentFilterEfficiency = totalFetchedFromAPI > 0 ? (pool.length / totalFetchedFromAPI) : 1;
    const isLowEfficiency = currentFilterEfficiency < 0.5 && totalFetchedFromAPI >= 50;
    const hasCountryFilterActive = filters.country && filters.country !== 'ALL';
    // Be more conservative with country filtering as it can dramatically reduce results
    const countryFilterThreshold = hasCountryFilterActive ? 0.1 : 0.5;
    const isVeryLowEfficiency = currentFilterEfficiency < countryFilterThreshold && totalFetchedFromAPI >= 25;
    const shouldContinue = (pool.length < effectiveLimit) || 
                          (isLowEfficiency && pool.length < filters.limit && pageNextToken) ||
                          (hasCountryFilterActive && isVeryLowEfficiency && pool.length < filters.limit && pageNextToken);
    
    if (shouldContinue && pageNextToken && safetyPages > 0) {
      nextToken = pageNextToken;
      console.log(`[Aggregator] ➡ Continue fetching: pool=${pool.length}/${effectiveLimit}, efficiency=${Math.round(currentFilterEfficiency * 100)}%, nextToken=${pageNextToken ? 'exists' : 'none'}, pages remaining: ${safetyPages}`);
      if (hasCountryFilterActive) {
        console.log(`[Aggregator]    - Country filter active (${filters.country}), using lower efficiency threshold`);
      }
    } else {
      // CRITICAL: Save the nextPageToken even if we're stopping
      state.nextPageToken = pageNextToken;
      console.log(`[Aggregator] ⏸ STOPPING fetch loop:`);
      console.log(`[Aggregator]    - Pool size: ${pool.length}/${effectiveLimit}`);
      console.log(`[Aggregator]    - Filter efficiency: ${Math.round(currentFilterEfficiency * 100)}%`);
      console.log(`[Aggregator]    - Country filter active: ${hasCountryFilterActive ? 'YES' : 'NO'}`);
      console.log(`[Aggregator]    - pageNextToken: ${pageNextToken ? '✓ EXISTS' : '✗ NONE'}`);
      console.log(`[Aggregator]    - Saved to state.nextPageToken: ${state.nextPageToken ? '✓ YES' : '✗ NO'}`);
      console.log(`[Aggregator]    - Pages remaining: ${safetyPages}`);
      console.log(`[Aggregator]    - Stop reason: ${!shouldContinue ? 'enough results' : !pageNextToken ? 'no more pages' : 'safety limit'}`);
      break;
    }
  }
  
  console.log(`[Aggregator] === Fetch Summary ===`);
  console.log(`[Aggregator] API calls made: ${apiCallCount}`);
  console.log(`[Aggregator] Total videos fetched from API: ${totalFetchedFromAPI}`);
  console.log(`[Aggregator] Videos in pool: ${pool.length}`);
  console.log(`[Aggregator] Target was: ${filters.limit} ${isChannelMode ? 'channels' : 'videos'}`);
  console.log(`[Aggregator] Efficiency: ${totalFetchedFromAPI > 0 ? Math.round((pool.length / totalFetchedFromAPI) * 100) : 0}% pass rate`);

  // Channel aggregation/filtering
  if (filters.mode === 'channel') {
    console.log(`[Aggregator] === Channel Aggregation/Filtering ===`);
    
    let aggregated: Video[];
    
    // If we used direct channel search, channels are already aggregated
    if (useDirectChannelSearch) {
      console.log(`[Aggregator] Channels fetched directly (${pool.length} channels), applying filters...`);
      aggregated = pool;
    } else {
      // Group videos by channel
      console.log(`[Aggregator] Grouping ${pool.length} videos by channel...`);
      
      const groups = new Map<string, Video[]>();
      for (const v of pool) {
        const k = v.channelId || v.creatorName;
        const arr = groups.get(k) || [];
        arr.push(v);
        groups.set(k, arr);
      }
      
      console.log(`[Aggregator] Found ${groups.size} unique channels`);

      aggregated = [];
      for (const [k, arr] of groups.entries()) {
        const totalDuration = arr.reduce((s, x) => s + (x.duration || 0), 0);
        const avgVideoLength = arr.length > 0 ? Math.round(totalDuration / arr.length) : 0;
        const lastUpdatedAt = arr.map(x => x.uploadDate).sort().slice(-1)[0];
        const representative = arr.reduce((best, x) => (x.viewCount > best.viewCount ? x : best), arr[0]);
        const channelViewCount = representative.channelViewCount || arr.reduce((s, x) => s + (x.viewCount || 0), 0);
        const videoCount = representative.videoCount;

        aggregated.push({
          ...representative,
          avgVideoLength,
          lastUpdatedAt,
          channelViewCount,
          videoCount,
        });
      }
    }
    
    console.log(`[Aggregator] Applying channel-specific filters to ${aggregated.length} channels...`);
    let filtered: Video[] = aggregated;

    // Filter by avg video length if provided
    const avgRange = filters.channelFilters.avgVideoLength;
    if (avgRange && (avgRange.min > 0 || avgRange.max < Infinity)) {
      const beforeAvgFilter = filtered.length;
      filtered = filtered.filter(v => (v.avgVideoLength || 0) >= avgRange.min && (v.avgVideoLength || 0) <= avgRange.max);
      console.log(`[Aggregator] Avg video length filter: ${beforeAvgFilter} -> ${filtered.length}`);
    }

    // Filter by channel created date range if provided
    const created = (filters.channelFilters as any).createdDate;
    if (created && (created.start || created.end)) {
      if (useDirectChannelSearch) {
        const beforeDateFilter = filtered.length;
        const start = created.start ? new Date(created.start) : null;
        const end = created.end ? new Date(created.end) : null;
        filtered = filtered.filter(v => {
          if (!v.channelCreatedAt) {
            console.log(`[Aggregator] Channel "${v.creatorName}" missing channelCreatedAt, excluding`);
            return false;
          }
          const d = new Date(v.channelCreatedAt);
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        });
        console.log(`[Aggregator] Channel created date filter (${created.start || 'any'} to ${created.end || 'any'}): ${beforeDateFilter} -> ${filtered.length}`);
      } else {
        console.warn('[Aggregator] Ignoring channel created date filter because channel mode has no keywords (API limitation).');
      }
    }
    
    // Filter by video count if provided
    const vcRange = filters.channelFilters.videoCount;
    if (vcRange && (vcRange.min > 0 || vcRange.max < MAX_VIDEO_COUNT)) {
      const beforeVCFilter = filtered.length;
      filtered = filtered.filter(v => {
        const count = v.videoCount || 0;
        return count >= vcRange.min && count <= vcRange.max;
      });
      console.log(`[Aggregator] Video count filter: ${beforeVCFilter} -> ${filtered.length}`);
    }

    console.log(`[Aggregator] Final channel count after filtering: ${filtered.length}`);
    pool = filtered;
  }

  // Sort after collecting
  pool.sort((a, b) => {
    switch (filters.sortBy) {
      case 'date':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'views':
        return b.viewCount - a.viewCount;
      case 'subscribers':
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      case 'trending':
      default:
        return calculateVelocity(b.viewCount, b.uploadDate) - calculateVelocity(a.viewCount, a.uploadDate);
    }
  });

  const pageData = pool.slice(0, filters.limit);
  // Save leftover items for next call
  const remainingBuffer = pool.slice(filters.limit);
  
  // CRITICAL: Explicitly preserve nextPageToken when updating state
  const currentState = ytPaginationState.get(key)!;
  ytPaginationState.set(key, {
    seenIds: currentState.seenIds,
    nextPageToken: currentState.nextPageToken,
    buffer: remainingBuffer,
  });

  // Calculate hasMore with multiple fallback conditions:
  // 1. We have leftover videos in buffer
  // 2. YouTube API provided a nextPageToken
  // 3. We hit our safety page limit (likely more available)
  // 4. We returned a FULL page of results (assume more available)
  // 5. Filter efficiency is low (lots filtered out, likely more available)
  const updatedState = ytPaginationState.get(key)!;
  const returnedFullPage = pageData.length >= filters.limit;
  const hitSafetyLimit = safetyPages === 0;
  
  // Calculate filter efficiency to detect heavy filtering
  const filterEfficiency = totalFetchedFromAPI > 0 ? (pool.length / totalFetchedFromAPI) : 1;
  const isHeavilyFiltered = filterEfficiency < 0.3 && totalFetchedFromAPI >= 50; // Less than 30% pass rate
  
  // Check if country filtering is applied (major filter that can drastically reduce results)
  const hasCountryFilter = filters.country && filters.country !== 'ALL';
  
  // More lenient hasMore calculation for filtered results
  const hasMore = remainingBuffer.length > 0 || 
                  !!updatedState.nextPageToken || 
                  hitSafetyLimit ||
                  (returnedFullPage && totalFetchedFromAPI > 0) ||
                  (isHeavilyFiltered && apiCallCount < 10) || // Allow more attempts when heavily filtered
                  (hasCountryFilter && updatedState.nextPageToken && pageData.length > 0); // Country filtering with available pages
  
  console.log(`[Aggregator] === hasMore Calculation ===`);
  console.log(`[Aggregator] 1. remainingBuffer: ${remainingBuffer.length} ${remainingBuffer.length > 0 ? '✓' : '✗'}`);
  console.log(`[Aggregator] 2. nextPageToken: ${updatedState.nextPageToken ? 'YES ✓' : 'NO ✗'}`);
  console.log(`[Aggregator] 3. hitSafetyLimit: ${hitSafetyLimit ? 'YES ✓' : 'NO ✗'} (safetyPages=${safetyPages})`);
  console.log(`[Aggregator] 4. returnedFullPage: ${returnedFullPage ? 'YES ✓' : 'NO ✗'} (returned=${pageData.length}, limit=${filters.limit}, fetched=${totalFetchedFromAPI})`);
  console.log(`[Aggregator] 5. isHeavilyFiltered: ${isHeavilyFiltered ? 'YES ✓' : 'NO ✗'} (efficiency=${Math.round(filterEfficiency * 100)}%, apiCalls=${apiCallCount})`);
  console.log(`[Aggregator] 6. countryFiltering: ${hasCountryFilter && updatedState.nextPageToken && pageData.length > 0 ? 'YES ✓' : 'NO ✗'} (hasCountryFilter=${hasCountryFilter}, hasToken=${!!updatedState.nextPageToken}, hasResults=${pageData.length > 0})`);
  console.log(`[Aggregator] >>> FINAL hasMore: ${hasMore ? 'TRUE ✓✓✓' : 'FALSE'}`);
  console.log(`[Aggregator] >>> Saved state for next call: nextPageToken=${updatedState.nextPageToken ? 'exists' : 'none'}, buffer=${updatedState.buffer.length}`);
  console.log(`[Aggregator] ========== ENDING fetchYouTubePage ==========`);
  
  return { data: pageData, hasMore };
};