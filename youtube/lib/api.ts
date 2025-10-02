import axios, { AxiosError } from 'axios';
import { ApiFilterParams, ApiResponse, Video, ApiError, StatsResponse, PresetsResponse, FilterState } from './types';
import { filterPresets, initialFilterState } from '../hooks/useFilters';
import { calculateVelocity } from '../utils/formatters';
import { getFromApiCache, setInApiCache, generateCacheKey } from '../utils/performance';
import config, { validateConfig } from './config';
import YouTubeService from '../services/youtube.service';
import { DailymotionService } from '../services/dailymotion.service';
import { PeerTubeService } from '../services/peertube.service';
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


// --- MOCK BACKEND LOGIC ---
// This section simulates a backend API. In a real application, the methods below
// would make actual network requests using `apiClient`. Here, they simulate
// the request and then resolve with mock data.

const allMockVideos: Video[] = Array.from({ length: 200 }, (_, i) => {
  const isYouTube = Math.random() > 0.4;
  const views = Math.floor(Math.random() * 20000000) + 1000;
  const uploadDate = new Date(Date.now() - Math.random() * 1.5 * 365 * 24 * 60 * 60 * 1000); 

  return {
    id: `${isYouTube ? 'yt' : 'tk'}_${i}`,
    platform: isYouTube ? 'youtube' : 'tiktok',
    title: `Trending ${isYouTube ? 'Video' : 'Clip'} #${i + 1}: A Viral Moment`,
    thumbnail: `https://picsum.photos/400/225.webp?random=${i}`, // Use efficient WebP format
    url: '#',
    creatorName: `Creator ${i + 1}`,
    creatorAvatar: `https://i.pravatar.cc/40?u=${i}`,
    subscriberCount: Math.floor(Math.random() * 10000000),
    viewCount: views,
    likeCount: Math.floor(views * (Math.random() * 0.08 + 0.02)),
    duration: Math.floor(Math.random() * 2400) + 15,
    uploadDate: uploadDate.toISOString(),
    channelAge: isYouTube ? Math.floor(Math.random() * 10) + 1 : undefined,
    tags: ['viral', 'trending', isYouTube ? 'youtube' : 'tiktok'],
    commentCount: Math.floor(views * (Math.random() * 0.01 + 0.001)),
  };
});

const _mockBackend = (filters: ApiFilterParams): ApiResponse => {
  let results = [...allMockVideos];
  
  if (filters.platform !== 'all') {
    results = results.filter(v => v.platform === filters.platform);
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

  // Filter by video duration
  if (filters.duration.length > 0) {
    results = results.filter(video => {
      // A video is kept if its duration matches ANY of the selected brackets.
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

// --- API CLIENT METHODS ---

/**
 * Fetches a paginated and filtered list of trending videos.
 * @param filters The filter and pagination parameters.
 * @returns A promise that resolves to an ApiResponse with a list of videos.
 */
export const fetchTrends = async (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  const fullFilters: ApiFilterParams = { ...initialFilterState, page: 1, limit: 20, ...filters };
  // --- Caching Layer ---
  const cacheKey = generateCacheKey(fullFilters);
  const cachedResponse = getFromApiCache(cacheKey);
  if (cachedResponse) {
    return Promise.resolve(JSON.parse(JSON.stringify(cachedResponse)));
  }

  let videos: Video[] = [];
  let total = 0;
  let hasMore = false;

  // Platform-specific fetch logic
  console.log('[fetchTrends] Filters:', fullFilters);
  switch (fullFilters.platform) {
    case 'dailymotion': {
      if (fullFilters.keywords && fullFilters.keywords.trim()) {
        videos = await DailymotionService.searchVideos(fullFilters.keywords, fullFilters.limit);
      } else {
        videos = await DailymotionService.fetchTrendingVideos(fullFilters.limit);
      }
      console.log('[Dailymotion] Videos:', videos);
      total = videos.length;
      hasMore = false;
      const response: ApiResponse = {
        success: true,
        data: videos,
        meta: {
          total,
          page: fullFilters.page,
          limit: fullFilters.limit,
          hasMore,
          fetchedAt: new Date().toISOString(),
          cacheHit: false,
        },
      };
      setInApiCache(cacheKey, response);
      return response;
    }
    case 'peertube': {
      if (fullFilters.keywords && fullFilters.keywords.trim()) {
        videos = await PeerTubeService.searchVideos(fullFilters.keywords, fullFilters.limit);
      } else {
        videos = await PeerTubeService.fetchTrendingVideos(fullFilters.limit);
      }
      console.log('[PeerTube] Videos:', videos);
      total = videos.length;
      hasMore = false;
      const response: ApiResponse = {
        success: true,
        data: videos,
        meta: {
          total,
          page: fullFilters.page,
          limit: fullFilters.limit,
          hasMore,
          fetchedAt: new Date().toISOString(),
          cacheHit: false,
        },
      };
      setInApiCache(cacheKey, response);
      return response;
    }
    case 'reddit': {
      if (fullFilters.keywords && fullFilters.keywords.trim()) {
        videos = await RedditService.searchVideos(fullFilters.keywords, fullFilters.limit);
      } else {
        videos = await RedditService.fetchTrendingVideos(fullFilters.limit);
      }
      console.log('[Reddit] Videos:', videos);
      total = videos.length;
      hasMore = false;
      const response: ApiResponse = {
        success: true,
        data: videos,
        meta: {
          total,
          page: fullFilters.page,
          limit: fullFilters.limit,
          hasMore,
          fetchedAt: new Date().toISOString(),
          cacheHit: false,
        },
      };
      setInApiCache(cacheKey, response);
      return response;
    }
    case 'all': {
      // Fetch 50 from each platform, then paginate the merged result
      const perPlatformLimit = 50;
      const [youtube, dailymotion, peertube, reddit] = await Promise.all([
        (youtubeService ? (async () => {
          if (fullFilters.keywords && fullFilters.keywords.trim()) {
            const publishedAfter = getPublishedAfterDate(fullFilters.uploadDate, fullFilters.customDate);
            const order = getYouTubeSortOrder(fullFilters.sortBy);
            return youtubeService.searchVideos(
              fullFilters.keywords,
              perPlatformLimit,
              order,
              publishedAfter
            );
          } else {
            return youtubeService.getTrendingVideos(
              perPlatformLimit,
              config.youtube.defaultRegion,
              (fullFilters as any).category || config.youtube.defaultCategoryId
            );
          }
        })() : Promise.resolve([])),
        DailymotionService.fetchTrendingVideos(perPlatformLimit),
        PeerTubeService.fetchTrendingVideos(perPlatformLimit),
        RedditService.fetchTrendingVideos(perPlatformLimit),
      ]);
      const allVideos = [
        ...youtube,
        ...dailymotion,
        ...peertube,
        ...reddit,
      ];
      // Sort merged videos by trending (velocity) by default
      allVideos.sort((a, b) => {
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
      const total = allVideos.length;
      const startIndex = (fullFilters.page - 1) * fullFilters.limit;
      const endIndex = fullFilters.page * fullFilters.limit;
      const paginatedData = allVideos.slice(startIndex, endIndex);
      hasMore = endIndex < total;
      const response: ApiResponse = {
        success: true,
        data: paginatedData,
        meta: {
          total,
          page: fullFilters.page,
          limit: fullFilters.limit,
          hasMore,
          fetchedAt: new Date().toISOString(),
          cacheHit: false,
        },
      };
      setInApiCache(cacheKey, response);
      return response;
    }
    default:
      // --- Real YouTube API or Mock Backend ---
      if (youtubeService && fullFilters.platform !== 'tiktok') {
        try {
          console.log('Fetching from YouTube API (cache miss):', fullFilters);
          
          let videos: Video[] = [];
          
          if (fullFilters.keywords && fullFilters.keywords.trim()) {
            // Search for videos with keywords
            const publishedAfter = getPublishedAfterDate(fullFilters.uploadDate, fullFilters.customDate);
            const order = getYouTubeSortOrder(fullFilters.sortBy);
            
            videos = await youtubeService.searchVideos(
              fullFilters.keywords,
              fullFilters.limit * 2, // Get more results to filter
              order,
              publishedAfter
            );
          } else {
            // Get trending videos
            videos = await youtubeService.getTrendingVideos(
              fullFilters.limit * 2, // Get more results to filter
              config.youtube.defaultRegion,
              (fullFilters as any).category || config.youtube.defaultCategoryId
            );
          }
          
          // Apply client-side filtering for features not supported by YouTube API
          let filteredVideos = videos;
          
          // Filter by platform (should only be YouTube at this point)
          if (fullFilters.platform === 'youtube') {
            filteredVideos = filteredVideos.filter(v => v.platform === 'youtube');
          }
          
          // Filter by view count range
          if (fullFilters.viewCount.min > 0 || fullFilters.viewCount.max < Infinity) {
            filteredVideos = filteredVideos.filter(v => 
              v.viewCount >= fullFilters.viewCount.min && 
              v.viewCount <= fullFilters.viewCount.max
            );
          }
          
          // Filter by subscriber count range
          if (fullFilters.subscriberCount.min > 0 || fullFilters.subscriberCount.max < Infinity) {
            filteredVideos = filteredVideos.filter(v => 
              v.subscriberCount >= fullFilters.subscriberCount.min && 
              v.subscriberCount <= fullFilters.subscriberCount.max
            );
          }
          
          // Filter by channel age
          if (fullFilters.channelAge !== 'all') {
            const maxAge = typeof fullFilters.channelAge === 'number' ? fullFilters.channelAge : fullFilters.channelAge;
            filteredVideos = filteredVideos.filter(v => 
              v.channelAge && v.channelAge <= maxAge
            );
          }
          
          // Filter by duration
          if (fullFilters.duration.length > 0) {
            filteredVideos = filteredVideos.filter(video => {
              return fullFilters.duration.some(durationBracket => {
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
          
          // Apply sorting
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
          
          // Apply pagination
          const total = filteredVideos.length;
          const startIndex = (fullFilters.page - 1) * fullFilters.limit;
          const endIndex = fullFilters.page * fullFilters.limit;
          const paginatedData = filteredVideos.slice(startIndex, endIndex);
          hasMore = endIndex < total;
          
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
          
          // Cache the response
          setInApiCache(cacheKey, response);
          return response;
          
        } catch (error) {
          console.error('YouTube API error, falling back to mock data:', error);
          // Fall back to mock data if YouTube API fails
          // Continue to mock backend logic below
        }
      }

      // --- Mock Fetch Layer (Fallback) ---
      console.log('Fetching from mock backend (cache miss):', fullFilters);
      return new Promise((resolve) => {
        // Simulate network latency
        setTimeout(() => { 
          const response = _mockBackend(fullFilters);
          setInApiCache(cacheKey, response); // Store the new response in the cache
          resolve(response);
        }, 500);
      });
  }
};
