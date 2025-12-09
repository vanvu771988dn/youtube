import { FilterState, ApiFilterParams, Video } from './types';
import { CHANNEL_AGE_TO_YEARS } from './constants';

// Build a key for caching/pagination state based on inputs affecting YouTube upstream
export const buildYouTubeQueryKey = (filters: ApiFilterParams): string => {
  const keyObj = {
    mode: filters.mode,
    keywords: filters.keywords || '',
    keywordMatch: filters.keywordMatch || 'OR',
    order: filters.sortBy,
    uploadDate: filters.videoFilters.uploadDate,
    customDateStart: filters.videoFilters.customDate.start || null,
    platform: filters.platform,
    region: filters.country && filters.country !== 'ALL' ? filters.country : null,
    language: filters.language && filters.language !== 'ALL' ? filters.language : null,
    category: (filters as any).category || null,
    excludeGaming: filters.excludeGaming || false,
    // Include channel filters that affect pagination
    channelAge: filters.channelFilters.channelAge,
    subscriberMin: filters.channelFilters.subscriberCount.min,
    subscriberMax: filters.channelFilters.subscriberCount.max,
    videoCountMin: filters.channelFilters.videoCount.min,
    videoCountMax: filters.channelFilters.videoCount.max,
    channelCreatedStart: (filters.channelFilters as any).createdDate?.start || null,
    channelCreatedEnd: (filters.channelFilters as any).createdDate?.end || null,
    // Include video filters that affect pagination
    duration: filters.videoFilters.duration.join(','),
    viewCountMin: filters.videoFilters.viewCount.min,
    viewCountMax: filters.videoFilters.viewCount.max,
  };
  return JSON.stringify(keyObj);
};

/**
 * Ensures a date string is in proper ISO format for YouTube API
 * YouTube API requires timestamps to end with 'Z' or have a valid timezone offset
 */
const ensureValidTimestamp = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    // Always return in UTC format with 'Z' suffix
    return date.toISOString();
  } catch (error) {
    console.warn('Invalid date format, using current time:', dateStr);
    return new Date().toISOString();
  }
};

export const getPublishedAfterDate = (
  uploadDate: string,
  customDate?: { start: string | null; end: string | null }
): string | undefined => {
  try {
    if (uploadDate === 'custom' && customDate?.start) {
      return ensureValidTimestamp(customDate.start);
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
      case 'all':
      default:
        return undefined;
    }
  } catch (error) {
    console.warn('Error generating publishedAfter date, skipping filter:', error);
    // Return undefined to skip the date filter entirely if there's any error
    return undefined;
  }
};

export const getYouTubeSortOrder = (
  sortBy: FilterState['sortBy']
): 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' => {
  switch (sortBy) {
    case 'date':
      return 'date';
    case 'views':
      return 'viewCount';
    case 'trending':
    case 'subscribers':
    default:
      return 'relevance';
  }
};

/**
 * Maps channel age filter value to years
 * Uses centralized mapping from constants
 */
export const mapChannelAgeToYears = (
  age: FilterState['channelFilters']['channelAge']
): number | null => {
  return CHANNEL_AGE_TO_YEARS[age] ?? null;
};
