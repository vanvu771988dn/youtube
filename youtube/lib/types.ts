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
  country?: string; // Country code
  monetizationEnabled?: boolean; // YouTube only
  videoCount?: number; // Total videos on channel
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
  platform: 'all' | 'youtube' | 'tiktok';
  uploadDate: UploadDateOption;
  customDate: CustomDateRange;
  viewCount: Range;
  subscriberCount: Range;
  keywords: string;
  channelAge: 'all' | 1 | 3 | 5; // years
  duration: number[]; // array of max seconds for each bracket
  trending24h: boolean;
  sortBy: 'trending' | 'views' | 'date';
  country: string; // Country code or 'all'
  monetizationEnabled: 'all' | 'yes' | 'no';
  videoCount: Range; // Range of videos on channel
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