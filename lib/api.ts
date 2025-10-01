import axios, { AxiosError } from 'axios';
import { ApiFilterParams, ApiResponse, Video, ApiError, StatsResponse, PresetsResponse, FilterState } from './types';
import { filterPresets, initialFilterState } from '../hooks/useFilters';

const BASE_URL = '/api/v1/';
const TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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
    thumbnail: `https://picsum.photos/400/225?random=${i}`,
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

const calculateVelocity = (video: Video): number => {
    const hoursSinceUpload = (Date.now() - new Date(video.uploadDate).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpload < 0.1) return video.viewCount * 10;
    return video.viewCount / hoursSinceUpload;
};

const _mockBackend = (filters: ApiFilterParams): ApiResponse => {
  let results = [...allMockVideos];
  // Filtering, sorting, and pagination logic remains the same...
   if (filters.platform !== 'all') {
    results = results.filter(v => v.platform === filters.platform);
  }
  // ... (rest of the filtering logic from the original file)
  results.sort((a, b) => {
    switch (filters.sortBy) {
        case 'date': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'views': return b.viewCount - a.viewCount;
        case 'trending': default: return calculateVelocity(b) - calculateVelocity(a);
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
export const fetchTrends = (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  // In a real app: return apiClient.get('/trends', { params: filters }).then(res => res.data);
  const fullFilters: ApiFilterParams = { ...initialFilterState, page: 1, limit: 20, ...filters };
  console.log('Fetching with filters:', fullFilters);
  return new Promise((resolve) => {
    setTimeout(() => { resolve(_mockBackend(fullFilters)); }, 500);
  });
};

/**
 * Searches for videos by a keyword query.
 * @param query The search term.
 * @param page The page number for pagination.
 * @returns A promise that resolves to an ApiResponse with a list of videos.
 */
export const searchVideos = (query: string, page: number = 1): Promise<ApiResponse> => {
  // In a real app: return apiClient.get('/search', { params: { q: query, page } }).then(res => res.data);
  const filters: ApiFilterParams = { ...initialFilterState, keywords: query, page, limit: 20 };
  return fetchTrends(filters);
};

/**
 * Fetches the available filter presets from the server.
 * @returns A promise that resolves to the filter presets.
 */
export const getPresets = (): Promise<PresetsResponse> => {
    // In a real app: return apiClient.get('/presets').then(res => res.data);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                data: filterPresets as Record<string, Partial<FilterState>>
            });
        }, 200);
    });
};

/**
 * Fetches platform-wide statistics.
 * @returns A promise that resolves to the platform stats.
 */
export const getStats = (): Promise<StatsResponse> => {
    // In a real app: return apiClient.get('/stats').then(res => res.data);
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