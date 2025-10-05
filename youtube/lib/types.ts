// FIX: Replaced placeholder content with all necessary type definitions for the application.

// Represents a single video item from supported platforms (YouTube, Dailymotion, Reddit).
export interface Video {
  id: string;
  platform: Exclude<PlatformType, 'all'>;
  title: string;
  thumbnail: string;
  url: string;
  creatorName: string;
  creatorAvatar: string; // Added field used in VideoCard
  subscriberCount: number;
  viewCount: number;
  likeCount: number;
  duration: number; // in seconds
  uploadDate: string; // ISO 8601
  channelAge?: number; // in years (YouTube only)
  tags: string[];
  category?: string;
  commentCount?: number;
  monetizationEnabled?: boolean; // Whether the channel is monetized (if known)
  channelVideoCount?: number; // Number of videos on the channel (if known)
}

export interface Range {
  min: number;
  max: number;
}

export type UploadDateOption = 'all' | 'today' | '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';

export interface CustomDateRange {
  start: string | null; // ISO string
  end: string | null;   // ISO string
}

// Defines the state of the UI filters.
export interface FilterState {
  platform: PlatformType;
  uploadDate: UploadDateOption;
  customDate: CustomDateRange;
  viewCount: Range;
  subscriberCount: Range;
  channelVideoCount: Range; // new filter: number of videos on channel
  keywords: string;
  channelAge: 'all' | 1 | 3 | 5; // years
  duration: number[]; // array of max seconds for each bracket
  trending24h: boolean;
  monetization: 'all' | 'enabled' | 'disabled'; // new filter: channel monetization
  sortBy: 'trending' | 'views' | 'date';
}

// Parameters sent to the API, including pagination.
export interface PaginationState {
  pageToken?: string;  // For YouTube
  after?: string;      // For Reddit
  page?: number;       // For Dailymotion
  limit: number;
}

export type ApiFilterParams = FilterState & PaginationState;

// The expected structure of the API response.
export interface ApiResponse {
  success: boolean;
  data: Video[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    fetchedAt: string;
    cacheHit: boolean;
    nextPageState?: {
      pageToken?: string;  // For YouTube
      after?: string;      // For Reddit
      page?: number;       // For Dailymotion and PeerTube
    };
  };
}

// Custom error class for API interactions
export class ApiError extends Error {
  constructor(message: string, public status?: number, public userMessage?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response for platform statistics
export interface StatsResponse {
    success: boolean;
    data: {
        totalVideos: number;
        youtubeCount: number;
        dailymotionCount: number;
        lastUpdated: string;
    };
}

// Response for filter presets
export interface PresetsResponse {
    success: boolean;
    data: Record<string, Partial<FilterState>>;
}

// Union type for platforms
export type PlatformType = 'all' | 'youtube' | 'dailymotion' | 'reddit';