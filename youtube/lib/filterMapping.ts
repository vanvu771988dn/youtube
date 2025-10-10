import { FilterState, ApiFilterParams, Video } from './types';

// Build a key for caching/pagination state based on inputs affecting YouTube upstream
export const buildYouTubeQueryKey = (filters: ApiFilterParams): string => {
  const keyObj = {
    keywords: filters.keywords || '',
    order: filters.sortBy,
    uploadDate: filters.videoFilters.uploadDate,
    customDateStart: filters.videoFilters.customDate.start || null,
    platform: filters.platform,
    region: filters.country && filters.country !== 'ALL' ? filters.country : null,
    language: filters.language && filters.language !== 'ALL' ? filters.language : null,
    category: (filters as any).category || null,
  };
  return JSON.stringify(keyObj);
};

export const getPublishedAfterDate = (
  uploadDate: string,
  customDate?: { start: string | null; end: string | null }
): string | undefined => {
  if (uploadDate === 'custom' && customDate?.start) return customDate.start;
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

export const mapChannelAgeToYears = (
  age: FilterState['channelFilters']['channelAge']
): number | null => {
  if (age === 'all') return null;
  switch (age) {
    case '6m':
      return 0.5;
    case '1y':
      return 1;
    case '2y':
      return 2;
    case '5y':
      return 5;
    case '10y':
      return 10;
    default:
      return null;
  }
};
