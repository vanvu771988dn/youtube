// Represents a single video item, normalized from any source (YouTube, TikTok).
export interface Video {
  id: string;
  platform: 'youtube' | 'tiktok' | 'reddit' | 'dailymotion';
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
  language?: string; // default language/audio language
  country?: string; // ISO 3166-1 alpha-2 country code
  // Channel-specific fields
  channelId?: string;
  channelCreatedAt?: string;
  channelDescription?: string;
  channelThumbnail?: string;
  channelViewCount?: number;
  monetizationEnabled?: boolean;
  monetizationStartDate?: string;
  videoCount?: number;
  avgVideoLength?: number; // computed average length of videos for a channel (seconds)
  lastUpdatedAt?: string; // latest upload date among grouped videos
  // Viral analytics (computed client-side)
  viralityScore?: number;
  growthRate?: number;
  engagementRate?: number;
  trendingBadge?: 'viral' | 'trending-fast' | 'rising' | 'steady' | null;
  viralityTier?: 'mega' | 'high' | 'medium' | 'low';
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

// Platform type used across the app (includes all supported platforms)
export type PlatformType = 'all' | 'youtube' | 'tiktok' | 'reddit' | 'dailymotion';

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
  avgVideoLength: Range; // in seconds
  createdDate?: CustomDateRange; // Channel created date range
}

// Main filter state with mode
export interface FilterState {
  // Common filters
  mode: FilterMode; // NEW: video or channel mode
  platform: PlatformType;
  keywords: string;
  keywordMatch: 'OR' | 'AND'; // Keyword matching logic for multiple keywords
  sortBy: 'trending' | 'views' | 'date' | 'subscribers'; // Added subscribers
  country: string; // ISO 3166-1 alpha-2 region code for YouTube or 'ALL'
  language: string; // BCP-47 (e.g., 'en') or 'ALL'
  category?: string; // YouTube category ID as string ("0" means all)
  excludeGaming: boolean; // Exclude Gaming category (ID: 20) from results
  
  // Mode-specific filters
  videoFilters: VideoFilters;
  channelFilters: ChannelFilters;
}

// Parameters sent to the API, including pagination.
export type ApiFilterParams = FilterState & {
  page: number;
  limit: number;
};

// Pagination state used for client-side navigation between pages/tokens
export type PaginationState = {
  limit: number;
  page?: number;
  pageToken?: string;
  after?: string; // Reddit pagination token
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
    nextPageState?: Partial<PaginationState>;
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
