import { ApiFilterParams, Video } from './types';
import YouTubeService from '../services/youtube.service';
import { buildYouTubeQueryKey, getPublishedAfterDate, getYouTubeSortOrder, mapChannelAgeToYears } from './filterMapping';
import config from './config';
import { calculateVelocity } from '../utils/formatters';

// Internal pagination state across calls, keyed by meaningful filter signature
// Stores a buffer of leftover items and de-duplication set
const ytPaginationState = new Map<string, { nextPageToken?: string; seenIds: Set<string>; buffer: Video[] }>();

export const fetchYouTubePage = async (
  filters: ApiFilterParams,
  youtubeService: YouTubeService
): Promise<{ data: Video[]; hasMore: boolean }> => {
  const key = buildYouTubeQueryKey(filters);
  if (!ytPaginationState.has(key) || filters.page === 1) {
    ytPaginationState.set(key, { nextPageToken: undefined, seenIds: new Set<string>(), buffer: [] });
  }
  const state = ytPaginationState.get(key)!;

  // Start from buffered leftovers
  let pool: Video[] = state.buffer ? [...state.buffer] : [];
  state.buffer = [];

  let safetyPages = 10;
  let nextToken: string | undefined = state.nextPageToken;

  while (pool.length < filters.limit && safetyPages > 0) {
    safetyPages--;
    let pageVideos: Video[] = [];
    let pageNextToken: string | undefined;

    if (filters.keywords && filters.keywords.trim()) {
      const publishedAfter = getPublishedAfterDate(filters.videoFilters.uploadDate, filters.videoFilters.customDate);
      const order = getYouTubeSortOrder(filters.sortBy);
      const { videos, nextPageToken } = await youtubeService.searchVideos(
        filters.keywords,
        50,
        order,
        publishedAfter,
        nextToken,
        filters.language !== 'ALL' ? filters.language : undefined
      );
      pageVideos = videos;
      pageNextToken = nextPageToken;
    } else {
      const { videos, nextPageToken } = await youtubeService.getTrendingVideos(
        50,
        filters.country !== 'ALL' ? filters.country : config.youtube.defaultRegion,
        (filters as any).category || config.youtube.defaultCategoryId,
        nextToken
      );
      pageVideos = videos;
      pageNextToken = nextPageToken;
    }

    // Client-side filtering on video list
    let filteredVideos = pageVideos;

    if (filters.platform === 'youtube') {
      filteredVideos = filteredVideos.filter(v => v.platform === 'youtube');
    }

    const vc = filters.videoFilters.viewCount;
    if (vc.min > 0 || vc.max < Infinity) {
      filteredVideos = filteredVideos.filter(v => v.viewCount >= vc.min && v.viewCount <= vc.max);
    }

    const sc = filters.channelFilters.subscriberCount;
    if (sc.min > 0 || sc.max < Infinity) {
      filteredVideos = filteredVideos.filter(v => v.subscriberCount >= sc.min && v.subscriberCount <= sc.max);
    }

    if (filters.language && filters.language !== 'ALL') {
      filteredVideos = filteredVideos.filter(v => (v.language || '').toLowerCase().startsWith(filters.language.toLowerCase()));
    }

    const maxYears = mapChannelAgeToYears(filters.channelFilters.channelAge);
    if (maxYears !== null) {
      filteredVideos = filteredVideos.filter(v => typeof v.channelAge === 'number' && v.channelAge <= maxYears);
    }

    if (filters.videoFilters.duration.length > 0) {
      filteredVideos = filteredVideos.filter(video => {
        return filters.videoFilters.duration.some(durationBracket => {
          switch (durationBracket) {
            case 60:
              return video.duration < 60;
            case 300:
              return video.duration >= 60 && video.duration < 300;
            case 1200:
              return video.duration >= 300 && video.duration < 1200;
            case Infinity:
              return video.duration >= 1200;
            default:
              return false;
          }
        });
      });
    }

    // De-duplicate
    for (const v of filteredVideos) {
      if (!state.seenIds.has(v.id)) {
        state.seenIds.add(v.id);
        pool.push(v);
      }
    }

    if (pool.length < filters.limit && pageNextToken) {
      nextToken = pageNextToken;
    } else {
      state.nextPageToken = pageNextToken;
      break;
    }
  }

  // Channel aggregation
  if (filters.mode === 'channel') {
    const groups = new Map<string, Video[]>();
    for (const v of pool) {
      const k = v.channelId || v.creatorName;
      const arr = groups.get(k) || [];
      arr.push(v);
      groups.set(k, arr);
    }

    let aggregated: Video[] = [];
    for (const [k, arr] of groups.entries()) {
      const totalDuration = arr.reduce((s, x) => s + (x.duration || 0), 0);
      const avgVideoLength = arr.length > 0 ? Math.round(totalDuration / arr.length) : 0;
      const lastUpdatedAt = arr.map(x => x.uploadDate).sort().slice(-1)[0];
      const representative = arr.reduce((best, x) => (x.viewCount > best.viewCount ? x : best), arr[0]);
      const channelViewCount = representative.channelViewCount || arr.reduce((s, x) => s + (x.viewCount || 0), 0);
      const videoCount = representative.videoCount;

      aggregated.push({
        ...representative,
        avgVideoLength,
        lastUpdatedAt,
        channelViewCount,
        videoCount,
      });
    }

    // Filter by avg video length if provided
    const avgRange = filters.channelFilters.avgVideoLength;
    if (avgRange && (avgRange.min > 0 || avgRange.max < Infinity)) {
      aggregated = aggregated.filter(v => (v.avgVideoLength || 0) >= avgRange.min && (v.avgVideoLength || 0) <= avgRange.max);
    }

    pool = aggregated;
  }

  // Sort after collecting
  pool.sort((a, b) => {
    switch (filters.sortBy) {
      case 'date':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'views':
        return b.viewCount - a.viewCount;
      case 'subscribers':
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      case 'trending':
      default:
        return calculateVelocity(b.viewCount, b.uploadDate) - calculateVelocity(a.viewCount, a.uploadDate);
    }
  });

  const pageData = pool.slice(0, filters.limit);
  // Save leftover items for next call
  ytPaginationState.set(key, {
    ...ytPaginationState.get(key)!,
    buffer: pool.slice(filters.limit),
  });

  const hasMore = ytPaginationState.get(key)!.buffer.length > 0 || !!ytPaginationState.get(key)!.nextPageToken;
  return { data: pageData, hasMore };
};