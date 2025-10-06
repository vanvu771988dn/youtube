// Represents a single video item, normalized from any source (YouTube, TikTok).
export interface Video {
  id: string;
  platform: 'youtube' | 'tiktok';
  title: string;
  thumbnail: string;
  url: string;
  creatorName: string;
  creatorAvatar: string;
  subscriberCount: number;
  viewCount: number;
  likeCount: number;
  duration: number; // in seconds
  uploadDate: string; // ISO 8601
  channelAge?: number; // in years (YouTube only)
  tags: string[];
  category?: string;
  commentCount?: number;
  // Channel-specific fields
  channelId?: string;
  channelCreatedAt?: string;
  monetizationEnabled?: boolean;
  monetizationStartDate?: string;
  videoCount?: number;
}

export interface Range {
  min: number;
  max: number;
}

export type UploadDateOption = 'all' | 'today' | '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';
export type ChannelAgeOption = 'all' | '6m' | '1y' | '2y' | '5y' | '10y';

export interface CustomDateRange {
  start: string | null; // ISO string
  end: string | null;   // ISO string
}

// NEW: Filter mode type
export type FilterMode = 'video' | 'channel';

// Video-specific filters
export interface VideoFilters {
  uploadDate: UploadDateOption;
  customDate: CustomDateRange;
  viewCount: Range;
  duration: number[]; // array of max seconds for each bracket
  trending24h: boolean;
}

// Channel-specific filters
export interface ChannelFilters {
  subscriberCount: Range;
  videoCount: Range;
  channelAge: ChannelAgeOption;
  monetizationEnabled: 'all' | 'yes' | 'no';
  monetizationAge: ChannelAgeOption; // Time since monetization started
}

// Main filter state with mode
export interface FilterState {
  // Common filters
  mode: FilterMode; // NEW: video or channel mode
  platform: 'all' | 'youtube' | 'tiktok';
  keywords: string;
  sortBy: 'trending' | 'views' | 'date' | 'subscribers'; // Added subscribers
  
  // Mode-specific filters
  videoFilters: VideoFilters;
  channelFilters: ChannelFilters;
}

// Parameters sent to the API, including pagination.
export type ApiFilterParams = FilterState & {
  page: number;
  limit: number;
};

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
        tiktokCount: number;
        lastUpdated: string;
    };
}

// Response for filter presets
export interface PresetsResponse {
    success: boolean;
    data: Record<string, Partial<FilterState>>;
}