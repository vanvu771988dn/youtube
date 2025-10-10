import axios, { AxiosError } from 'axios';
import { ApiFilterParams, ApiResponse, Video, ApiError, PresetsResponse, FilterState } from './types';
import { filterPresets, initialFilterState } from '../hooks/useFilters';
import { calculateVelocity } from '../utils/formatters';
import { getFromApiCache, setInApiCache, generateCacheKey } from '../utils/performance';
import config from './config';
import YouTubeService from '../services/youtube.service';
import { RedditService } from '../services/reddit.service';
import { DailymotionService } from '../services/dailymotion.service';

const BASE_URL = '/api/v1/';
const TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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

// Maintain pagination state per unique filter signature to avoid losing data on client filtering
type YTPaginationState = { nextPageToken?: string; seenIds: Set<string>; buffer: Video[] };
const ytPaginationState = new Map<string, YTPaginationState>();

const buildYouTubeQueryKey = (filters: ApiFilterParams): string => {
  // Only include inputs that affect the upstream YouTube query
  const keyObj = {
    keywords: filters.keywords || '',
    order: filters.sortBy,
    uploadDate: filters.videoFilters.uploadDate,
    customDateStart: filters.videoFilters.customDate.start || null,
    platform: filters.platform, // 'all' or 'youtube' behave the same upstream, but keep for separation
    region: filters.country && filters.country !== 'ALL' ? filters.country : null,
    language: filters.language && filters.language !== 'ALL' ? filters.language : null,
    category: (filters as any).category || config.youtube?.defaultCategoryId,
  };
  return JSON.stringify(keyObj);
};

const getPublishedAfterDate = (uploadDate: string, customDate?: { start: string | null; end: string | null }): string | undefined => {
  if (uploadDate === 'custom' && customDate?.start) {
    return customDate.start;
  }
  
  const now = new Date();
  switch (uploadDate) {
    case 'today': {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '3m':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case '6m':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
};

const getYouTubeSortOrder = (sortBy: FilterState['sortBy']): 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' => {
  switch (sortBy) {
    case 'date': return 'date';
    case 'views': return 'viewCount';
    case 'trending':
    case 'subscribers':
    default: return 'relevance';
  }
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;
    if (!config) return Promise.reject(error);
    
    config.retries = config.retries || 0;
    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (config.retries < MAX_RETRIES && isRetryable) {
      config.retries += 1;
      const delay = Math.pow(2, config.retries - 1) * RETRY_DELAY_MS;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string };
      
      let userMessage = `Error ${status}: Something went wrong on our end.`;
      if (status === 400) userMessage = 'Your request was invalid. Please check the parameters.';
      if (status === 401) userMessage = 'You are not authorized to perform this action.';
      if (status === 403) userMessage = 'API quota exceeded or access denied.';
      if (status === 404) userMessage = 'The requested resource could not be found.';
      if (status === 429) userMessage = 'Too many requests. Please wait a moment before trying again.';
      
      throw new ApiError(data.message || (error as any).message, status, userMessage);
    } else if ((error as any).request) {
      throw new ApiError((error as any).message, undefined, 'Network error. Please check your connection.');
    } else {
      throw new ApiError((error as any).message, undefined, 'An unexpected error occurred while sending the request.');
    }
  }
);


const mapChannelAgeToYears = (age: FilterState['channelFilters']['channelAge']): number | null => {
  if (age === 'all') return null;
  switch (age) {
    case '6m': return 0.5;
    case '1y': return 1;
    case '2y': return 2;
    case '5y': return 5;
    case '10y': return 10;
    default: return null;
  }
};


export const fetchTrends = async (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  const fullFilters: ApiFilterParams = { ...initialFilterState, page: 1, limit: 50, ...(filters as any) } as any;

  const cacheKey = generateCacheKey(fullFilters);
  const cachedResponse = getFromApiCache(cacheKey);
  
  if (cachedResponse) {
    console.log('Serving from API cache (cache hit):', fullFilters);
    return Promise.resolve(JSON.parse(JSON.stringify(cachedResponse)));
  }

  // Require YouTube API for YouTube or All platforms
  if (!youtubeService) {
    throw new ApiError('YouTube API not configured', 500, 'YouTube API key is missing or invalid.');
  }
  if (fullFilters.platform !== 'tiktok') {
    try {
      console.log('Fetching from YouTube API with pagination (cache miss):', fullFilters);

      // Reset pagination if this is the first page
      const key = buildYouTubeQueryKey(fullFilters);
      if (fullFilters.page === 1) {
        ytPaginationState.set(key, { nextPageToken: undefined, seenIds: new Set<string>(), buffer: [] });
      }
      const state = ytPaginationState.get(key)!;

      // Start from buffered leftovers first
      let pool: Video[] = state.buffer ? [...state.buffer] : [];
      state.buffer = [];

      // Accumulate enough filtered items to satisfy requested limit
      let safetyPages = 10; // prevent runaway loops
      let nextToken: string | undefined = state.nextPageToken;

      while (pool.length < fullFilters.limit && safetyPages > 0) {
        safetyPages--;

        let pageVideos: Video[] = [];
        let pageNextToken: string | undefined;

        if (fullFilters.keywords && fullFilters.keywords.trim()) {
          const publishedAfter = getPublishedAfterDate(fullFilters.videoFilters.uploadDate, fullFilters.videoFilters.customDate);
          const order = getYouTubeSortOrder(fullFilters.sortBy);
          const { videos, nextPageToken } = await youtubeService.searchVideos(
            fullFilters.keywords,
            50, // fetch max per call to reduce API roundtrips
            order,
            publishedAfter,
            nextToken,
            fullFilters.language !== 'ALL' ? fullFilters.language : undefined
          );
          pageVideos = videos;
          pageNextToken = nextPageToken;
        } else {
          const { videos, nextPageToken } = await youtubeService.getTrendingVideos(
            50,
            fullFilters.country !== 'ALL' ? fullFilters.country : config.youtube.defaultRegion,
            (fullFilters as any).category || config.youtube.defaultCategoryId,
            nextToken
          );
          pageVideos = videos;
          pageNextToken = nextPageToken;
        }

        // Apply client-side filters that YouTube doesn't support directly
        let filteredVideos = pageVideos;

        if (fullFilters.platform === 'youtube') {
          filteredVideos = filteredVideos.filter(v => v.platform === 'youtube');
        }

        const vc = fullFilters.videoFilters.viewCount;
        if (vc.min > 0 || vc.max < Infinity) {
          filteredVideos = filteredVideos.filter(v => v.viewCount >= vc.min && v.viewCount <= vc.max);
        }

        const sc = fullFilters.channelFilters.subscriberCount;
        if (sc.min > 0 || sc.max < Infinity) {
          filteredVideos = filteredVideos.filter(v => v.subscriberCount >= sc.min && v.subscriberCount <= sc.max);
        }

        // Language filter (client-side)
        if (fullFilters.language && fullFilters.language !== 'ALL') {
          filteredVideos = filteredVideos.filter(v => (v.language || '').toLowerCase().startsWith(fullFilters.language.toLowerCase()));
        }

        const maxYears = mapChannelAgeToYears(fullFilters.channelFilters.channelAge);
        if (maxYears !== null) {
          filteredVideos = filteredVideos.filter(v => typeof v.channelAge === 'number' && v.channelAge <= maxYears);
        }

        if (fullFilters.videoFilters.duration.length > 0) {
          filteredVideos = filteredVideos.filter(video => {
            return fullFilters.videoFilters.duration.some(durationBracket => {
              switch (durationBracket) {
                case 60:
                  return video.duration < 60;
                case 300:
                  return video.duration >= 60 && video.duration < 300;
                case 1200:
                  return video.duration >= 300 && video.duration < 1200;
                case Infinity:
                  return video.duration >= 1200;
                default:
                  return false;
              }
            });
          });
        }

        // Add to pool de-duplicating by seenIds
        for (const v of filteredVideos) {
          if (!state.seenIds.has(v.id)) {
            state.seenIds.add(v.id);
            pool.push(v);
          }
        }

        // If we still need more and there's a next page, continue
        if (pool.length < fullFilters.limit && pageNextToken) {
          nextToken = pageNextToken;
        } else {
          state.nextPageToken = pageNextToken;
          break;
        }
      }

      // In channel mode, aggregate by channel and compute stats (avg length, last update) and de-duplicate
      if (fullFilters.mode === 'channel') {
        const groups = new Map<string, Video[]>();
        for (const v of pool) {
          const k = v.channelId || v.creatorName;
          const arr = groups.get(k) || [];
          arr.push(v);
          groups.set(k, arr);
        }

        let aggregated: Video[] = [];
        for (const [k, arr] of groups.entries()) {
          // Compute stats
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

        // Filter by avg video length if provided
        const avgRange = fullFilters.channelFilters.avgVideoLength;
        if (avgRange && (avgRange.min > 0 || avgRange.max < Infinity)) {
          aggregated = aggregated.filter(v => (v.avgVideoLength || 0) >= avgRange.min && (v.avgVideoLength || 0) <= avgRange.max);
        }

        pool = aggregated;
      }

      // Sort after collecting
      pool.sort((a, b) => {
        switch (fullFilters.sortBy) {
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

      const pageData = pool.slice(0, fullFilters.limit);
      // Save leftover items for next call
      state.buffer = pool.slice(fullFilters.limit);
      state.nextPageToken = nextToken;
      const stillHasMore = state.buffer.length > 0 || !!state.nextPageToken;

      const response: ApiResponse = {
        success: true,
        data: pageData,
        meta: {
          total: -1, // unknown from client-side aggregation
          page: fullFilters.page,
          limit: fullFilters.limit,
          hasMore: stillHasMore,
          fetchedAt: new Date().toISOString(),
          cacheHit: false,
        },
      };

      setInApiCache(cacheKey, response);
      return response;

    } catch (error) {
      console.error('YouTube API error:', error);
      throw error;
    }
  }

  // For tiktok or unsupported platforms, return empty results (no mock)
  return {
    success: true,
    data: [],
    meta: {
      total: 0,
      page: fullFilters.page,
      limit: fullFilters.limit,
      hasMore: false,
      fetchedAt: new Date().toISOString(),
      cacheHit: false,
    },
  };
};

export const searchVideos = (query: string, page: number = 1): Promise<ApiResponse> => {
  const filters: ApiFilterParams = { ...initialFilterState, keywords: query, page, limit: 50 } as any;
  return fetchTrends(filters);
};


// Unified fetchVideos to support multiple platforms with proper pagination state
export const fetchVideos = async (params: ApiFilterParams): Promise<ApiResponse> => {
  const { platform, keywords = '', page = 1, limit } = params as any;

  // Reddit platform uses 'after' token for pagination
  if (platform === 'reddit') {
    const { videos, nextAfter } = await RedditService.searchVideos(keywords, limit, (params as any).after);
    return {
      success: true,
      data: videos,
      meta: {
        total: -1,
        page,
        limit,
        hasMore: !!nextAfter,
        fetchedAt: new Date().toISOString(),
        cacheHit: false,
        nextPageState: { after: nextAfter, limit }
      }
    };
  }

  // Dailymotion platform uses page-based pagination
  if (platform === 'dailymotion') {
    const { videos, hasMore } = await DailymotionService.searchVideos(keywords, limit, page);
    return {
      success: true,
      data: videos,
      meta: {
        total: -1,
        page,
        limit,
        hasMore,
        fetchedAt: new Date().toISOString(),
        cacheHit: false,
        nextPageState: hasMore ? { page: page + 1, limit } : undefined,
      }
    };
  }

  // Default: YouTube, TikTok (mock), or All -> reuse fetchTrends
  const response = await fetchTrends(params);
  return {
    ...response,
    meta: {
      ...response.meta,
      // Provide next page state for client hooks that expect it
      nextPageState: response.meta.hasMore ? { page: (params.page ?? 1) + 1, limit: params.limit } : undefined,
    }
  };
};

