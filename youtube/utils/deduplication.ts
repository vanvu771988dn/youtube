import { Video } from '../lib/types';

/**
 * Creates a unique identifier for a video based on platform and content
 * @param video - The video object
 * @returns A unique string identifier
 */
export const createVideoUniqueId = (video: Video): string => {
  // For platform-specific IDs, combine platform and ID
  if (video.platform && video.id) {
    return `${video.platform}:${video.id}`;
  }
  
  // Fallback: use URL if available
  if (video.url) {
    return `url:${video.url}`;
  }
  
  // Last resort: use title + creator combination
  return `content:${video.title}:${video.creatorName}`;
};

/**
 * Removes duplicate videos from an array based on unique identifiers
 * @param videos - Array of videos to deduplicate
 * @returns Array of unique videos
 */
export const deduplicateVideos = (videos: Video[]): Video[] => {
  const seen = new Set<string>();
  const uniqueVideos: Video[] = [];
  
  for (const video of videos) {
    const uniqueId = createVideoUniqueId(video);
    
    if (!seen.has(uniqueId)) {
      seen.add(uniqueId);
      uniqueVideos.push(video);
    }
  }
  
  return uniqueVideos;
};

/**
 * Merges new videos with existing videos, removing duplicates
 * @param existingVideos - Current list of videos
 * @param newVideos - New videos to append
 * @returns Combined array with duplicates removed
 */
export const mergeVideosWithoutDuplicates = (existingVideos: Video[], newVideos: Video[]): Video[] => {
  // Combine arrays and deduplicate
  const combined = [...existingVideos, ...newVideos];
  return deduplicateVideos(combined);
};

/**
 * Checks if a video already exists in the provided array
 * @param video - Video to check for
 * @param videoArray - Array to search in
 * @returns true if video exists, false otherwise
 */
export const videoExists = (video: Video, videoArray: Video[]): boolean => {
  const targetId = createVideoUniqueId(video);
  return videoArray.some(existingVideo => createVideoUniqueId(existingVideo) === targetId);
};