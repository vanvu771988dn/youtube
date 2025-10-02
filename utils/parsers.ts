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
 * Normalizes video data from different platforms into a consistent `Video` object.
 * This is a conceptual example; actual implementation depends on real API responses.
 * @param data The raw video data object from a platform's API.
 * @param platform The platform the data is from ('youtube' or 'tiktok').
 * @returns A normalized `Video` object.
 */
export const normalizeVideoData = (data: any, platform: 'youtube' | 'tiktok'): Video => {
  if (platform === 'youtube') {
    // Example mapping for a YouTube API Video resource
    return {
      id: typeof data.id === 'object' ? data.id.videoId : data.id,
      platform: 'youtube',
      title: data.snippet.title,
      thumbnail: data.snippet.thumbnails.high.url,
      url: `https://www.youtube.com/watch?v=${typeof data.id === 'object' ? data.id.videoId : data.id}`,
      creatorName: data.snippet.channelTitle,
      creatorAvatar: 'https://i.pravatar.cc/40?u=' + data.snippet.channelId, // Placeholder
      subscriberCount: data.statistics ? parseInt(data.statistics.subscriberCount, 10) : 0,
      viewCount: data.statistics ? parseInt(data.statistics.viewCount, 10) : 0,
      likeCount: data.statistics ? parseInt(data.statistics.likeCount, 10) : 0,
      duration: data.contentDetails ? parseISODuration(data.contentDetails.duration) : 0,
      uploadDate: data.snippet.publishedAt,
      channelAge: undefined, // This would require another API call in reality
      tags: data.snippet.tags || [],
      category: data.snippet.categoryId,
      commentCount: data.statistics ? parseInt(data.statistics.commentCount, 10) : 0,
    };
  } else {
    // Example mapping for a hypothetical TikTok API item
    return {
      id: data.id,
      platform: 'tiktok',
      title: data.title,
      thumbnail: data.cover_image_url,
      url: data.share_url,
      creatorName: data.author.nickname,
      creatorAvatar: data.author.avatar_thumb.url_list[0],
      subscriberCount: data.author.follower_count, // TikTok calls them followers
      viewCount: data.statistics.play_count,
      likeCount: data.statistics.digg_count,
      duration: data.duration, // Assuming duration is already in seconds
      uploadDate: new Date(data.create_time * 1000).toISOString(),
      channelAge: undefined,
      tags: data.text_extra?.map((t: any) => t.hashtag_name).filter(Boolean) || [],
      category: undefined,
      commentCount: data.statistics.comment_count,
    };
  }
};