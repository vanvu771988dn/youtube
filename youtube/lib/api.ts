import axios, { AxiosError } from 'axios';
import { ApiFilterParams, ApiResponse, Video, ApiError, StatsResponse, PresetsResponse, FilterState } from './types';
import { filterPresets, initialFilterState } from '../hooks/useFilters';
import { calculateVelocity } from '../utils/formatters';
import { getFromApiCache, setInApiCache, generateCacheKey } from '../utils/performance';
import config, { validateConfig } from './config';
import YouTubeService from '../services/youtube.service';

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

const getYouTubeSortOrder = (sortBy: string): 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' => {
  switch (sortBy) {
    case 'date': return 'date';
    case 'views': return 'viewCount';
    case 'trending': 
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
      
      throw new ApiError(data.message || error.message, status, userMessage);
    } 
    else if (error.request) {
      throw new ApiError(error.message, undefined, 'Network error. Please check your connection.');
    } 
    else {
      throw new ApiError(error.message, undefined, 'An unexpected error occurred while sending the request.');
    }
  }
);

// Mock data generation with new fields
const allMockVideos: Video[] = Array.from({ length: 500 }, (_, i) => {
  const isYouTube = Math.random() > 0.4;
  const views = Math.floor(Math.random() * 100000000) + 1000;
  const uploadDate = new Date(Date.now() - Math.random() * 1.5 * 365 * 24 * 60 * 60 * 1000);
  const subscriberCount = Math.floor(Math.random() * 50000000);
  const videoCount = Math.floor(Math.random() * 10000) + 1;
  const monetized = subscriberCount > 1000 && videoCount > 10;

  return {
    id: `${isYouTube ? 'yt' : 'tk'}_${i}`,
    platform: isYouTube ? 'youtube' : 'tiktok',
    title: `Trending ${isYouTube ? 'Video' : 'Clip'} #${i + 1}: A Viral Moment`,
    thumbnail: `https://picsum.photos/400/225.webp?random=${i}`,
    url: '#',
    creatorName: `Creator ${i + 1}`,
    creatorAvatar: `https://i.pravatar.cc/40?u=${i}`,
    subscriberCount,
    viewCount: views,
    likeCount: Math.floor(views * (Math.random() * 0.08 + 0.02)),
    duration: Math.floor(Math.random() * 2400) + 15,
    uploadDate: uploadDate.toISOString(),
    channelAge: isYouTube ? Math.floor(Math.random() * 10) + 1 : undefined,
    tags: ['viral', 'trending', isYouTube ? 'youtube' : 'tiktok'],
    commentCount: Math.floor(views * (Math.random() * 0.01 + 0.001)),
    country: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'IN', 'BR', 'MX', 'ES', 'VN'][Math.floor(Math.random() * 13)],
    monetizationEnabled: isYouTube ? monetized : undefined,
    videoCount: isYouTube ? videoCount : undefined,
  };
});

const _mockBackend = (filters: ApiFilterParams): ApiResponse => {
  let results = [...allMockVideos];
  
  if (filters.platform !== 'all') {
    results = results.filter(v => v.platform === filters.platform);
  }

  if (filters.country !== 'all') {
    results = results.filter(v => v.country === filters.country);
  }

  if (filters.monetizationEnabled !== 'all') {
    const wantMonetized = filters.monetizationEnabled === 'yes';
    results = results.filter(v => v.monetizationEnabled === wantMonetized);
  }

  if (filters.videoCount.min > 0 || filters.videoCount.max < 10000) {
    results = results.filter(v => v.videoCount && v.videoCount >= filters.videoCount.min && v.videoCount <= filters.videoCount.max);
  }

  if (filters.viewCount.min > 0 || filters.viewCount.max < 100000000) {
    results = results.filter(v => v.viewCount >= filters.viewCount.min && v.viewCount <= filters.viewCount.max);
  }

  if (filters.subscriberCount.min > 0 || filters.subscriberCount.max < 50000000) {
    results = results.filter(v => v.subscriberCount >= filters.subscriberCount.min && v.subscriberCount <= filters.subscriberCount.max);
  }

  if (filters.uploadDate !== 'all') {
    let startDate: Date | null = null;
    switch (filters.uploadDate) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    if (startDate) {
      results = results.filter(v => new Date(v.uploadDate) >= startDate!);
    }
  }

  if (filters.duration.length > 0) {
    results = results.filter(video => {
      return filters.duration.some(durationBracket => {
        switch (durationBracket) {
          case 60: return video.duration < 60;
          case 300: return video.duration >= 60 && video.duration < 300;
          case 1200: return video.duration >= 300 && video.duration < 1200;
          case Infinity: return video.duration >= 1200;
          default: return false;
        }
      });
    });
  }

  results.sort((a, b) => {
    switch (filters.sortBy) {
        case 'date': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'views': return b.viewCount - a.viewCount;
        case 'trending': default: return calculateVelocity(b.viewCount, b.uploadDate) - calculateVelocity(a.viewCount, a.uploadDate);
    }
  });

  const total = results.length;
  const { page, limit } = filters;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedData = results.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return {
    success: true,
    data: paginatedData,
    meta: { total, page, limit, hasMore, fetchedAt: new Date().toISOString(), cacheHit: false }
  };
};

export const fetchTrends = async (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  const fullFilters: ApiFilterParams = { ...initialFilterState, page: 1, limit: 50, ...filters };

  const cacheKey = generateCacheKey(fullFilters);
  const cachedResponse = getFromApiCache(cacheKey);
  
  if (cachedResponse) {
    console.log('Serving from API cache (cache hit):', fullFilters);
    return Promise.resolve(JSON.parse(JSON.stringify(cachedResponse)));
  }

  if (youtubeService && fullFilters.platform !== 'tiktok') {
    try {
      console.log('Fetching from YouTube API (cache miss):', fullFilters);
      
      let videos: Video[] = [];
      
      if (fullFilters.keywords && fullFilters.keywords.trim()) {
        const publishedAfter = getPublishedAfterDate(fullFilters.uploadDate, fullFilters.customDate);
        const order = getYouTubeSortOrder(fullFilters.sortBy);
        
        videos = await youtubeService.searchVideos(
          fullFilters.keywords,
          fullFilters.limit * 2,
          order,
          publishedAfter,
          fullFilters.country !== 'all' ? fullFilters.country : undefined
        );
      } else {
        videos = await youtubeService.getTrendingVideos(
          fullFilters.limit * 2,
          fullFilters.country !== 'all' ? fullFilters.country : config.youtube.defaultRegion,
          (fullFilters as any).category || config.youtube.defaultCategoryId
        );
      }
      
      let filteredVideos = videos;
      
      if (fullFilters.platform === 'youtube') {
        filteredVideos = filteredVideos.filter(v => v.platform === 'youtube');
      }
      
      if (fullFilters.viewCount.min > 0 || fullFilters.viewCount.max < Infinity) {
        filteredVideos = filteredVideos.filter(v => 
          v.viewCount >= fullFilters.viewCount.min && 
          v.viewCount <= fullFilters.viewCount.max
        );
      }
      
      if (fullFilters.subscriberCount.min > 0 || fullFilters.subscriberCount.max < Infinity) {
        filteredVideos = filteredVideos.filter(v => 
          v.subscriberCount >= fullFilters.subscriberCount.min && 
          v.subscriberCount <= fullFilters.subscriberCount.max
        );
      }

      if (fullFilters.videoCount.min > 0 || fullFilters.videoCount.max < 10000) {
        filteredVideos = filteredVideos.filter(v => 
          v.videoCount && v.videoCount >= fullFilters.videoCount.min && 
          v.videoCount <= fullFilters.videoCount.max
        );
      }

      if (fullFilters.monetizationEnabled !== 'all') {
        const wantMonetized = fullFilters.monetizationEnabled === 'yes';
        filteredVideos = filteredVideos.filter(v => v.monetizationEnabled === wantMonetized);
      }
      
      if (fullFilters.channelAge !== 'all') {
        const maxAge = typeof fullFilters.channelAge === 'number' ? fullFilters.channelAge : fullFilters.channelAge;
        filteredVideos = filteredVideos.filter(v => 
          v.channelAge && v.channelAge <= maxAge
        );
      }
      
      if (fullFilters.duration.length > 0) {
        filteredVideos = filteredVideos.filter(video => {
          return fullFilters.duration.some(durationBracket => {
            switch (durationBracket) {
              case 60: return video.duration < 60;
              case 300: return video.duration >= 60 && video.duration < 300;
              case 1200: return video.duration >= 300 && video.duration < 1200;
              case Infinity: return video.duration >= 1200;
              default: return false;
            }
          });
        });
      }
      
      filteredVideos.sort((a, b) => {
        switch (fullFilters.sortBy) {
          case 'date': 
            return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
          case 'views': 
            return b.viewCount - a.viewCount;
          case 'trending': 
          default: 
            return calculateVelocity(b.viewCount, b.uploadDate) - calculateVelocity(a.viewCount, a.uploadDate);
        }
      });
      
      const total = filteredVideos.length;
      const startIndex = (fullFilters.page - 1) * fullFilters.limit;
      const endIndex = fullFilters.page * fullFilters.limit;
      const paginatedData = filteredVideos.slice(startIndex, endIndex);
      const hasMore = endIndex < total;
      
      const response: ApiResponse = {
        success: true,
        data: paginatedData,
        meta: { 
          total, 
          page: fullFilters.page, 
          limit: fullFilters.limit, 
          hasMore, 
          fetchedAt: new Date().toISOString(), 
          cacheHit: false 
        }
      };
      
      setInApiCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('YouTube API error, falling back to mock data:', error);
    }
  }

  console.log('Fetching from mock backend (cache miss):', fullFilters);
  return new Promise((resolve) => {
    setTimeout(() => { 
      const response = _mockBackend(fullFilters);
      setInApiCache(cacheKey, response);
      resolve(response);
    }, 500);
  });
};

export const searchVideos = (query: string, page: number = 1): Promise<ApiResponse> => {
  const filters: ApiFilterParams = { ...initialFilterState, keywords: query, page, limit: 50 };
  return fetchTrends(filters);
};

export const getPresets = (): Promise<PresetsResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                data: filterPresets as Record<string, Partial<FilterState>>
            });
        }, 200);
    });
};

export const getStats = (): Promise<StatsResponse> => {
    const youtubeCount = allMockVideos.filter(v => v.platform === 'youtube').length;
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                data: {
                    totalVideos: allMockVideos.length,
                    youtubeCount: youtubeCount,
                    tiktokCount: allMockVideos.length - youtubeCount,
                    lastUpdated: new Date().toISOString(),
                }
            });
        }, 300);
    });
};