import axios, { AxiosError } from 'axios';
import { ApiFilterParams, ApiResponse, Video, ApiError, PresetsResponse, FilterState } from './types';
import { filterPresets, initialFilterState } from '../hooks/useFilters';
import { getFromApiCache, setInApiCache, generateCacheKey } from '../utils/performance';
import config from './config';
import YouTubeService from '../services/youtube.service';
import { RedditService } from '../services/reddit.service';
import { DailymotionService } from '../services/dailymotion.service';
import { fetchYouTubePage } from './aggregator';
import { API_TIMEOUT, MAX_RETRIES, RETRY_DELAY_MS, DEFAULT_PAGE_SIZE } from './constants';
import { CHANNEL_AGE_TO_YEARS } from './constants';

const BASE_URL = '/api/v1/';

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


// Lightweight Axios client (kept in case of future server requests)
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
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


/**
 * Maps channel age filter value to years
 * Uses centralized mapping from constants
 */
const mapChannelAgeToYears = (age: FilterState['channelFilters']['channelAge']): number | null => {
  return CHANNEL_AGE_TO_YEARS[age] ?? null;
};


/**
 * Fetches trending videos based on filter parameters
 * Handles caching, pagination, and multi-platform support
 */
export const fetchTrends = async (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  const fullFilters: ApiFilterParams = {
    ...initialFilterState,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    ...filters
  } as ApiFilterParams;

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
      console.log('Fetching YouTube page via aggregator:', fullFilters);
      const { data, hasMore } = await fetchYouTubePage(fullFilters, youtubeService);
      const response: ApiResponse = {
        success: true,
        data,
        meta: {
          total: -1,
          page: fullFilters.page,
          limit: fullFilters.limit,
          hasMore,
          fetchedAt: new Date().toISOString(),
          cacheHit: false,
        },
      };
      setInApiCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('YouTube aggregator error:', error);
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

/**
 * Searches for videos using a query string
 * Convenience wrapper around fetchTrends
 */
export const searchVideos = (query: string, page: number = 1): Promise<ApiResponse> => {
  const filters: ApiFilterParams = {
    ...initialFilterState,
    keywords: query,
    page,
    limit: DEFAULT_PAGE_SIZE
  } as ApiFilterParams;
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

