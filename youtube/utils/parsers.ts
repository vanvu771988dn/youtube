import { Video } from '../lib/types';

/**
 * Parses an ISO 8601 duration string (e.g., "PT2M34S") into seconds.
 * @param duration The ISO 8601 duration string.
 * @returns The total duration in seconds.
 */
export const parseISODuration = (duration: string): number => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  if (!matches) return 0;

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  return (hours * 3600) + (minutes * 60) + seconds;
};

const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'am', 'are', 'was', 'were', 'it', 'i', 'you', 'he', 'she', 'we', 'they', 'how', 'what', 'when', 'where', 'why']);

/**
 * Extracts meaningful keywords from a text string.
 * It removes common stop words, punctuation, and returns unique, lowercase words.
 * @param text The input string (e.g., video title or description).
 * @returns An array of keyword strings.
 */
export const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  
  const words = text
    .toLowerCase()
    // Remove punctuation except hashtags
    .replace(/[^\w\s#]/g, '')
    // Split by whitespace
    .split(/\s+/)
    // Filter out stop words and short words
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  // Return unique keywords
  return [...new Set(words)];
};

/**
 * Normalizes video data from various platforms into our common Video type
 * @param data Raw video data from the API
 * @param platform The platform the data is from ('youtube' | 'dailymotion' | 'reddit').
 * @returns Normalized Video object
 */
export const normalizeVideoData = (data: any, platform: 'youtube' | 'dailymotion' | 'reddit'): Video => {
  switch (platform) {
    case 'youtube':
      return {
        id: data.id,
        platform: 'youtube',
        title: data.title,
        thumbnail: data.thumbnail,
        url: data.url,
        creatorName: data.channelTitle,
        creatorAvatar: data.channelThumbnail,
        subscriberCount: data.channelSubscriberCount || 0,
        viewCount: data.viewCount,
        likeCount: data.likeCount,
        duration: data.duration,
        uploadDate: data.publishedAt,
        tags: data.tags || [],
        channelAge: data.channelAge,
        category: data.categoryId,
        commentCount: data.commentCount || 0,
      };
    case 'dailymotion':
      return {
        id: data.id,
        platform: 'dailymotion',
        title: data.title,
        thumbnail: data.thumbnail_url,
        url: data.url,
        creatorName: data.owner.screenname,
        creatorAvatar: data.owner.avatar_360_url,
        subscriberCount: 0, // Dailymotion API doesn't provide this
        viewCount: data.views_total,
        likeCount: 0, // Not provided by API
        duration: data.duration,
        uploadDate: data.created_time,
        tags: data.tags || [],
        channelAge: undefined,
        category: data.channel || undefined,
        commentCount: 0, // Not provided by API
      };
    case 'reddit':
      return {
        id: data.id,
        platform: 'reddit',
        title: data.title,
        thumbnail: data.thumbnail,
        url: data.url,
        creatorName: data.author,
        creatorAvatar: data.authorAvatar || '',
        subscriberCount: data.subredditSubscribers || 0,
        viewCount: data.score || 0,
        likeCount: data.upvotes || 0,
        duration: data.duration || 0,
        uploadDate: data.created_utc,
        tags: [data.subreddit || ''],
        channelAge: undefined,
        category: data.subreddit || undefined,
        commentCount: data.num_comments || 0,
      };
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};