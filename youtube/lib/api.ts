import axios, { AxiosError } from 'axios';
import { ApiFilterParams, ApiResponse, Video, ApiError, StatsResponse, PresetsResponse, FilterState } from './types';
import { filterPresets, initialFilterState } from '../hooks/useFilters';
import { calculateVelocity } from '../utils/formatters';
import { getFromApiCache, setInApiCache, generateCacheKey } from '../utils/performance';
import config, { validateConfig } from './config';
import YouTubeService from '../services/youtube.service';
import { DailymotionService } from '../services/dailymotion.service';
import { RedditService } from '../services/reddit.service';

const BASE_URL = '/api/v1/';
const TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Initialize YouTube service if API key is available
let youtubeService: YouTubeService | null = null;
if (config.features.useRealYouTubeData && config.youtubeApiKey && config.youtubeApiKey.trim()) {
  try {
    youtubeService = new YouTubeService(config.youtubeApiKey);
    console.log('YouTube service initialized with API key');
  } catch (error) {
    console.log('Failed to initialize YouTube service:', error);
    youtubeService = null;
  }
} else {
  console.log('YouTube service not initialized - no valid API key provided');
}

// Helper function to convert upload date filter to YouTube API format
const getPublishedAfterDate = (uploadDate: string, customDate?: { start: string | null; end: string | null }): string | undefined => {
  if (uploadDate === 'custom' && customDate?.start) {
    return customDate.start;
  }
  
  const now = new Date();
  switch (uploadDate) {
    case 'today':
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '3m':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
};

// Helper function to get YouTube sort order
const getYouTubeSortOrder = (sortBy: string): 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' => {
  switch (sortBy) {
    case 'date': return 'date';
    case 'views': return 'viewCount';
    case 'trending': 
    default: return 'relevance';
  }
};

// Helper to map UI duration brackets to YouTube API videoDuration values
const getYouTubeVideoDurations = (durationBrackets: number[]): Array<'short' | 'medium' | 'long'> => {
  if (!durationBrackets || durationBrackets.length === 0) return [];
  const set = new Set<'short' | 'medium' | 'long'>();
  for (const br of durationBrackets) {
    if (br === 60) {
      // < 1 min is a subset of "short" (<4 min)
      set.add('short');
    } else if (br === 300) {
      // 1-5 min spans short (1-4) and medium (4-5)
      set.add('short');
      set.add('medium');
    } else if (br === 1200) {
      // 5-20 min maps to medium
      set.add('medium');
    } else if (br === Infinity) {
      // > 20 min maps to long
      set.add('long');
    }
  }
  return Array.from(set);
};

// --- AXIOS INSTANCE ---
// A centralized, configured axios instance for all API calls.
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTORS for RETRY LOGIC & ERROR HANDLING ---
apiClient.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error: AxiosError) => {
    const config = error.config as any; // Use 'any' to add custom properties
    if (!config) return Promise.reject(error);
    
    config.retries = config.retries || 0;

    // Conditions for retrying the request
    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (config.retries < MAX_RETRIES && isRetryable) {
      config.retries += 1;
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, config.retries - 1) * RETRY_DELAY_MS;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config); // Re-attempt the request
    }

    // --- Structured Error Handling ---
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const status = error.response.status;
      const data = error.response.data as { message?: string };
      
      let userMessage = `Error ${status}: Something went wrong on our end.`;
      if (status === 400) userMessage = 'Your request was invalid. Please check the parameters.';
      if (status === 401) userMessage = 'You are not authorized to perform this action.';
      if (status === 403) userMessage = 'API quota exceeded or access denied.';
      if (status === 404) userMessage = 'The requested resource could not be found.';
      if (status === 429) userMessage = 'Too many requests. Please wait a moment before trying again.';
      
      throw new ApiError(data.message || error.message, status, userMessage);
    } 
    else if (error.request) {
      // The request was made but no response was received (e.g., network error)
      throw new ApiError(error.message, undefined, 'Network error. Please check your connection.');
    } 
    else {
      // Something happened in setting up the request that triggered an Error
      throw new ApiError(error.message, undefined, 'An unexpected error occurred while sending the request.');
    }
  }
);


// --- DYNAMIC MOCK BACKEND LOGIC ---
// This section simulates a backend API that generates data dynamically based on filters.
// This ensures consistent data quantity regardless of filters and maintains pagination.

/**
 * Generates a video based on filters and index
 */
const generateMockVideo = (index: number, filters: ApiFilterParams): Video => {
  // Seed random generation with index + filter hash for consistency
  const seed = index + JSON.stringify(filters).length;
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const platforms = filters.platform !== 'all' ? [filters.platform] : ['youtube', 'dailymotion', 'reddit'];
  const selectedPlatform = platforms[Math.floor(seededRandom(seed) * platforms.length)] as 'youtube' | 'dailymotion' | 'reddit';
  
  // Generate data that respects filter constraints
  let views = Math.floor(seededRandom(seed + 1) * 20000000) + 1000;
  
  // Apply view count filter constraints during generation
  if (filters.viewCount.min > 0 || filters.viewCount.max < Infinity) {
    const min = Math.max(filters.viewCount.min, 1000);
    const max = Math.min(filters.viewCount.max, 20000000);
    views = Math.floor(seededRandom(seed + 1) * (max - min)) + min;
  }
  
  // Generate subscriber count that respects filter constraints
  let subscriberCount = Math.floor(seededRandom(seed + 2) * 10000000);
  if (filters.subscriberCount.min > 0 || filters.subscriberCount.max < Infinity) {
    const min = Math.max(filters.subscriberCount.min, 0);
    const max = Math.min(filters.subscriberCount.max, 10000000);
    subscriberCount = Math.floor(seededRandom(seed + 2) * (max - min)) + min;
  }
  
  // Generate duration that respects filter constraints
  let duration = Math.floor(seededRandom(seed + 3) * 2400) + 15;
  if (filters.duration.length > 0) {
    const durationBracket = filters.duration[Math.floor(seededRandom(seed + 4) * filters.duration.length)];
    switch (durationBracket) {
      case 60: // < 1 min
        duration = Math.floor(seededRandom(seed + 3) * 50) + 10;
        break;
      case 300: // 1-5 min
        duration = Math.floor(seededRandom(seed + 3) * 240) + 60;
        break;
      case 1200: // 5-20 min
        duration = Math.floor(seededRandom(seed + 3) * 900) + 300;
        break;
      case Infinity: // > 20 min
        duration = Math.floor(seededRandom(seed + 3) * 1800) + 1200;
        break;
    }
  }
  
  // Generate upload date that respects filter constraints
  let uploadDate: Date;
  if (filters.uploadDate !== 'all') {
    const now = new Date();
    switch (filters.uploadDate) {
      case 'today':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 24 * 60 * 60 * 1000);
        break;
      case '24h':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        uploadDate = new Date(now.getTime() - seededRandom(seed + 5) * 365 * 24 * 60 * 60 * 1000);
    }
  } else {
    uploadDate = new Date(Date.now() - seededRandom(seed + 5) * 1.5 * 365 * 24 * 60 * 60 * 1000);
  }
  
  // Generate channel age for YouTube
  let channelAge: number | undefined = undefined;
  if (selectedPlatform === 'youtube') {
    if (filters.channelAge !== 'all') {
      const maxAge = typeof filters.channelAge === 'number' ? filters.channelAge : 5;
      channelAge = Math.floor(seededRandom(seed + 6) * maxAge) + 1;
    } else {
      channelAge = Math.floor(seededRandom(seed + 6) * 10) + 1;
    }
  }
  
  // Generate titles based on keywords
  let title = `${selectedPlatform === 'youtube' ? 'Video' : selectedPlatform === 'dailymotion' ? 'Clip' : 'Post'} #${index + 1}: Amazing Content`;
  if (filters.keywords && filters.keywords.trim()) {
    title = `${filters.keywords} - ${title}`;
  }
  
  const creatorId = Math.floor(seededRandom(seed + 7) * 1000) + 1;
  
  return {
    id: `${selectedPlatform}_filtered_${index}_${seed}`,
    platform: selectedPlatform,
    title,
    thumbnail: `https://picsum.photos/400/225.webp?random=${seed}`,
    url: '#',
    creatorName: `Creator ${creatorId}`,
    creatorAvatar: `https://i.pravatar.cc/40?u=${creatorId}`,
    subscriberCount,
    viewCount: views,
    likeCount: Math.floor(views * (seededRandom(seed + 8) * 0.08 + 0.02)),
    duration,
    uploadDate: uploadDate.toISOString(),
    channelAge,
    tags: filters.keywords ? filters.keywords.split(' ') : ['viral', 'trending', selectedPlatform],
    commentCount: Math.floor(views * (seededRandom(seed + 9) * 0.01 + 0.001)),
  };
};

/**
 * Simulates backend API that generates consistent data based on filters
 */
const _mockBackend = (filters: ApiFilterParams): ApiResponse => {
  console.log('[Mock Backend] Generating data for filters:', filters);
  
  // Simulate a large dataset - always return full page of data
  const { page, limit } = filters;
  const startIndex = (page - 1) * limit;
  
  // Generate videos for the current page based on filters
  const paginatedData: Video[] = [];
  for (let i = startIndex; i < startIndex + limit; i++) {
    paginatedData.push(generateMockVideo(i, filters));
  }
  
  // Sort the generated data
  paginatedData.sort((a, b) => {
    switch (filters.sortBy) {
      case 'date': 
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'views': 
        return b.viewCount - a.viewCount;
      case 'trending': 
      default: 
        return calculateVelocity(b.viewCount, b.uploadDate) - calculateVelocity(a.viewCount, a.uploadDate);
    }
  });
  
  // Simulate a large dataset with many pages available
  const simulatedTotal = 50000; // Large number to simulate real API
  const hasMore = (page * limit) < simulatedTotal;
  
  console.log('[Mock Backend] Generated:', {
    page,
    limit, 
    videosGenerated: paginatedData.length,
    hasMore,
    simulatedTotal
  });
  
  return {
    success: true,
    data: paginatedData,
    meta: { 
      total: simulatedTotal, 
      page, 
      limit, 
      hasMore, 
      fetchedAt: new Date().toISOString(), 
      cacheHit: false,
      nextPageState: hasMore ? { page: page + 1 } : undefined
    }
  };
};

// --- API CLIENT METHODS ---

/**
 * Fetches a paginated and filtered list of trending videos.
 * @param filters The filter and pagination parameters.
 * @returns A promise that resolves to an ApiResponse with a list of videos.
 */
/**
 * Applies client-side filtering to videos for features not natively supported by APIs
 */
const applyClientSideFiltering = (videos: Video[], filters: ApiFilterParams): Video[] => {
  let filteredVideos = videos;
  
  // Filter by view count range
  if (filters.viewCount.min > 0 || filters.viewCount.max < 50_000_000) {
    console.log(`[API] Applying view count filter: ${filters.viewCount.min} - ${filters.viewCount.max}`);
    filteredVideos = filteredVideos.filter(v => 
      v.viewCount >= filters.viewCount.min && 
      v.viewCount <= filters.viewCount.max
    );
  }
  
  // Filter by subscriber count range  
  if (filters.subscriberCount.min > 0 || filters.subscriberCount.max < 50_000_000) {
    console.log(`[API] Applying subscriber count filter: ${filters.subscriberCount.min} - ${filters.subscriberCount.max}`);
    filteredVideos = filteredVideos.filter(v => 
      v.subscriberCount >= filters.subscriberCount.min && 
      v.subscriberCount <= filters.subscriberCount.max
    );
  }
  
  // Filter by channel age
  if (filters.channelAge !== 'all') {
    const maxAge = typeof filters.channelAge === 'number' ? filters.channelAge : 5;
    console.log(`[API] Applying channel age filter: <= ${maxAge} years`);
    filteredVideos = filteredVideos.filter(v => 
      v.channelAge && v.channelAge <= maxAge
    );
  }
  
  // Filter by duration
  if (filters.duration.length > 0) {
    console.log(`[API] Applying duration filter:`, filters.duration);
    filteredVideos = filteredVideos.filter(video => {
      return filters.duration.some(durationBracket => {
        switch (durationBracket) {
          case 60: // < 1 min
            return video.duration < 60;
          case 300: // 1-5 min
            return video.duration >= 60 && video.duration < 300;
          case 1200: // 5-20 min
            return video.duration >= 300 && video.duration < 1200;
          case Infinity: // > 20 min
            return video.duration >= 1200;
          default:
            return false;
        }
      });
    });
  }
  
  return filteredVideos;
};

/**
 * Fetches real data from platform APIs with proper filtering
 */
export const fetchVideos = async (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  const fullFilters: ApiFilterParams = { ...initialFilterState, page: 1, limit: 20, ...filters };
  
  console.log('[Real API] Fetching with filters (pushing filters into API where possible):', fullFilters);
  
  // --- Caching Layer ---
  const cacheKey = generateCacheKey(fullFilters);
  const cachedResponse = getFromApiCache(cacheKey);
  if (cachedResponse) {
    console.log('[Real API] Returning cached response');
    return Promise.resolve(JSON.parse(JSON.stringify(cachedResponse)));
  }

  let videos: Video[] = [];
  let hasMore = false;
  let nextPageState = {};
  
  try {
    switch (fullFilters.platform) {
      case 'dailymotion': {
        console.log('[Real API] Calling DailyMotion API with filters');

        // Map sort preference
        const dmSort = fullFilters.sortBy === 'views' ? 'visited' : fullFilters.sortBy === 'date' ? 'recent' : undefined;

        let page = fullFilters.page || 1;
        const aggregated: Video[] = [];
        let localHasMore = true;
        const maxPages = 5;

        while (aggregated.length < fullFilters.limit && localHasMore && (page - (fullFilters.page || 1)) < maxPages) {
          const result = await DailymotionService.searchVideos(
            fullFilters.keywords,
            fullFilters.limit,
            page,
            dmSort
          );
          aggregated.push(...result.videos);
          localHasMore = result.hasMore;
          page += 1;
        }
        
        videos = applyClientSideFiltering(aggregated, fullFilters).slice(0, fullFilters.limit);
        hasMore = localHasMore;
        nextPageState = { page };
        
        break;
      }
      
      case 'reddit': {
        console.log('[Real API] Calling Reddit API with filters');

        // Map uploadDate to Reddit time parameter
        const mapUploadToRedditT = (u: string): 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' => {
          switch (u) {
            case 'today':
            case '24h': return 'day';
            case '7d': return 'week';
            case '30d': return 'month';
            case '3m':
            case '6m': return 'year';
            case '1y': return 'year';
            default: return 'all';
          }
        };
        const t = mapUploadToRedditT(fullFilters.uploadDate);

        // Map sort
        const redditSort = fullFilters.sortBy === 'views' ? 'top' : fullFilters.sortBy === 'date' ? 'new' : 'hot';

        let after = fullFilters.after;
        const aggregated: Video[] = [];
        let iterations = 0;
        const maxIters = 5;

        while (aggregated.length < fullFilters.limit && iterations < maxIters) {
          const result = await RedditService.searchVideos(
            fullFilters.keywords,
            Math.min(fullFilters.limit * 2, 100),
            after,
            t,
            redditSort
          );
          aggregated.push(...result.videos);
          after = result.nextAfter;
          iterations++;
          if (!after) break;
        }
        
        videos = applyClientSideFiltering(aggregated, fullFilters).slice(0, fullFilters.limit);
        hasMore = Boolean(after);
        nextPageState = after ? { after } : undefined;
        
        break;
      }
      
      default: {
        // YouTube API (real or fallback)
        if (youtubeService) {
          console.log('[Real API] Calling YouTube API with filters');
          
          const publishedAfter = getPublishedAfterDate(fullFilters.uploadDate, fullFilters.customDate);
          const order = getYouTubeSortOrder(fullFilters.sortBy);
          const durationOptions = getYouTubeVideoDurations(fullFilters.duration);

          // Determine per-call max (YouTube caps at 50)
          const perCallMax = 50;
          const maxPagesPerDuration = 3; // safety to limit quota
          const maxTotalPages = 6; // overall cap

          const aggregated: Video[] = [];
          let observedNextToken: string | undefined = undefined;
          let totalPagesFetched = 0;

          const durationsToQuery: Array<'short' | 'medium' | 'long' | undefined> = durationOptions.length > 0
            ? durationOptions
            : [undefined];

          for (const vd of durationsToQuery) {
            let pageToken: string | undefined = fullFilters.pageToken;
            for (let page = 0; page < maxPagesPerDuration; page++) {
              if (totalPagesFetched >= maxTotalPages) break;

              const searchResult = await youtubeService.searchVideos(
                fullFilters.keywords.trim(),
                perCallMax,
                order,
                publishedAfter,
                pageToken,
                vd as any
              );

              aggregated.push(...searchResult.videos);
              observedNextToken = searchResult.nextPageToken || observedNextToken;
              totalPagesFetched++;

              // Apply client-side filters progressively and stop early if we have enough
              const provisional = applyClientSideFiltering(aggregated, fullFilters);
              if (provisional.length >= fullFilters.limit) {
                break;
              }

              if (!searchResult.nextPageToken) break;
              pageToken = searchResult.nextPageToken;
            }
            // Re-check after finishing a duration bucket
            const provisionalAfterBucket = applyClientSideFiltering(aggregated, fullFilters);
            if (provisionalAfterBucket.length >= fullFilters.limit || totalPagesFetched >= maxTotalPages) {
              break;
            }
          }

          // Final filtering and truncation
          videos = applyClientSideFiltering(aggregated, fullFilters).slice(0, fullFilters.limit);
          hasMore = Boolean(observedNextToken);
          nextPageState = observedNextToken ? { pageToken: observedNextToken } : undefined;
          
          if (videos.length < fullFilters.limit) {
            console.log(`[YouTube] Got ${videos.length}/${fullFilters.limit} after filtering`);
          }
        } else {
          console.log('[Real API] No YouTube service available, using fallback');
          // Fallback to mock data generation
          const mockResponse = _mockBackend(fullFilters);
          return mockResponse;
        }
        break;
      }
    }
    
    // Ensure we always return the expected data structure
    const response: ApiResponse = {
      success: true,
      data: videos,
      meta: {
        total: -1, // Unknown total for real APIs
        page: fullFilters.page || 1,
        limit: fullFilters.limit,
        hasMore,
        fetchedAt: new Date().toISOString(),
        cacheHit: false,
        nextPageState: hasMore ? nextPageState : undefined
      },
    };
    
    console.log(`[Real API] Returning ${videos.length} videos, hasMore: ${hasMore}`);
    setInApiCache(cacheKey, response);
    return response;
    
  } catch (error) {
    console.error('[Real API] Error fetching data:', error);
    
    // Return error response
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to fetch videos',
      undefined,
      'Failed to load videos. Please try again.'
    );
  }
};
