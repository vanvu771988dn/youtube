/**
 * Advanced filter utilities for video and channel metrics
 */

import { Video, FilterState } from '../lib/types';

/**
 * Duration range presets (in seconds)
 */
export const DURATION_PRESETS = {
  'shorts': { min: 0, max: 60, label: 'Shorts (< 1 min)' },
  'short': { min: 60, max: 300, label: 'Short (1-5 min)' },
  'medium': { min: 300, max: 1200, label: 'Medium (5-20 min)' },
  'long': { min: 1200, max: 3600, label: 'Long (20-60 min)' },
  'very-long': { min: 3600, max: Infinity, label: 'Very Long (1+ hour)' },
} as const;

/**
 * Engagement tier definitions
 */
export const ENGAGEMENT_TIERS = {
  'viral': { minViews: 10_000_000, minLikes: 500_000, label: 'Viral' },
  'high': { minViews: 1_000_000, minLikes: 50_000, label: 'High Engagement' },
  'medium': { minViews: 100_000, minLikes: 5_000, label: 'Medium Engagement' },
  'growing': { minViews: 10_000, minLikes: 500, label: 'Growing' },
  'emerging': { minViews: 1_000, minLikes: 50, label: 'Emerging' },
} as const;

/**
 * Channel size categories (by subscriber count)
 */
export const CHANNEL_SIZE_TIERS = {
  'mega': { min: 10_000_000, max: Infinity, label: 'Mega (10M+)' },
  'macro': { min: 1_000_000, max: 10_000_000, label: 'Macro (1M-10M)' },
  'mid': { min: 100_000, max: 1_000_000, label: 'Mid-tier (100K-1M)' },
  'micro': { min: 10_000, max: 100_000, label: 'Micro (10K-100K)' },
  'nano': { min: 1_000, max: 10_000, label: 'Nano (1K-10K)' },
  'emerging': { min: 0, max: 1_000, label: 'Emerging (< 1K)' },
} as const;

/**
 * Calculates engagement rate (likes per view)
 * @param video - Video object
 * @returns Engagement rate as percentage
 */
export function calculateEngagementRate(video: Video): number {
  if (video.viewCount === 0) return 0;
  return (video.likeCount / video.viewCount) * 100;
}

/**
 * Calculates comment rate (comments per view)
 * @param video - Video object
 * @returns Comment rate as percentage
 */
export function calculateCommentRate(video: Video): number {
  if (video.viewCount === 0 || !video.commentCount) return 0;
  return (video.commentCount / video.viewCount) * 100;
}

/**
 * Gets engagement tier for a video
 * @param video - Video object
 * @returns Engagement tier key or null
 */
export function getEngagementTier(video: Video): keyof typeof ENGAGEMENT_TIERS | null {
  const tiers = Object.entries(ENGAGEMENT_TIERS) as Array<[keyof typeof ENGAGEMENT_TIERS, typeof ENGAGEMENT_TIERS[keyof typeof ENGAGEMENT_TIERS]]>;
  
  for (const [tier, criteria] of tiers) {
    if (video.viewCount >= criteria.minViews && video.likeCount >= criteria.minLikes) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Gets channel size tier based on subscriber count
 * @param subscriberCount - Number of subscribers
 * @returns Channel size tier key or null
 */
export function getChannelSizeTier(subscriberCount: number): keyof typeof CHANNEL_SIZE_TIERS | null {
  const tiers = Object.entries(CHANNEL_SIZE_TIERS) as Array<[keyof typeof CHANNEL_SIZE_TIERS, typeof CHANNEL_SIZE_TIERS[keyof typeof CHANNEL_SIZE_TIERS]]>;
  
  for (const [tier, range] of tiers) {
    if (subscriberCount >= range.min && subscriberCount < range.max) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Formats duration in human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 23m", "5m 30s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

/**
 * Formats large numbers in abbreviated form
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2M", "45.3K")
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Checks if a video matches duration filter
 * @param video - Video object
 * @param durationFilter - Array of max durations in seconds
 * @returns True if video matches the filter
 */
export function matchesDurationFilter(video: Video, durationFilter: number[]): boolean {
  if (!durationFilter || durationFilter.length === 0) return true;
  
  // If single value, treat as max duration
  if (durationFilter.length === 1) {
    return video.duration <= durationFilter[0];
  }
  
  // If two values, treat as [min, max] range
  const [min, max] = durationFilter;
  return video.duration >= min && video.duration <= max;
}

/**
 * Checks if a video matches engagement criteria
 * @param video - Video object
 * @param tier - Engagement tier
 * @returns True if video matches the engagement tier
 */
export function matchesEngagementTier(video: Video, tier: keyof typeof ENGAGEMENT_TIERS): boolean {
  const criteria = ENGAGEMENT_TIERS[tier];
  return video.viewCount >= criteria.minViews && video.likeCount >= criteria.minLikes;
}

/**
 * Checks if a channel matches size tier
 * @param subscriberCount - Subscriber count
 * @param tier - Channel size tier
 * @returns True if channel matches the tier
 */
export function matchesChannelSizeTier(subscriberCount: number, tier: keyof typeof CHANNEL_SIZE_TIERS): boolean {
  const range = CHANNEL_SIZE_TIERS[tier];
  return subscriberCount >= range.min && subscriberCount < range.max;
}

/**
 * Calculates video freshness score (0-100)
 * Higher score = more recent
 * @param uploadDate - ISO date string
 * @returns Freshness score
 */
export function calculateFreshnessScore(uploadDate: string): number {
  const now = new Date();
  const uploaded = new Date(uploadDate);
  const daysDiff = (now.getTime() - uploaded.getTime()) / (1000 * 60 * 60 * 24);
  
  // Score decreases exponentially with age
  if (daysDiff < 1) return 100;
  if (daysDiff < 7) return 90;
  if (daysDiff < 30) return 70;
  if (daysDiff < 90) return 50;
  if (daysDiff < 365) return 30;
  return 10;
}

/**
 * Calculates channel growth potential score (0-100)
 * Based on view-to-subscriber ratio
 * @param video - Video object
 * @returns Growth potential score
 */
export function calculateGrowthPotential(video: Video): number {
  if (video.subscriberCount === 0) return 0;
  
  const ratio = video.viewCount / video.subscriberCount;
  
  // High ratio = good growth potential
  if (ratio > 10) return 100;
  if (ratio > 5) return 80;
  if (ratio > 2) return 60;
  if (ratio > 1) return 40;
  if (ratio > 0.5) return 20;
  return 10;
}

/**
 * Gets time since upload in human-readable format
 * @param uploadDate - ISO date string
 * @returns Human-readable time string
 */
export function getTimeSinceUpload(uploadDate: string): string {
  const now = new Date();
  const uploaded = new Date(uploadDate);
  const seconds = Math.floor((now.getTime() - uploaded.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Counts how many filters are actively applied
 * @param filters - Filter state
 * @param defaults - Default filter state
 * @returns Number of active filters
 */
export function countActiveFilters(filters: FilterState, defaults: FilterState): number {
  let count = 0;
  
  // Check video filters
  if (filters.videoFilters?.uploadDate !== defaults.videoFilters?.uploadDate) count++;
  if (filters.videoFilters?.viewCount.min !== defaults.videoFilters?.viewCount.min) count++;
  if (filters.videoFilters?.viewCount.max !== defaults.videoFilters?.viewCount.max) count++;
  if (filters.videoFilters?.duration.length > 0) count++;
  if (filters.videoFilters?.trending24h) count++;
  
  // Check channel filters
  if (filters.channelFilters?.subscriberCount.min !== defaults.channelFilters?.subscriberCount.min) count++;
  if (filters.channelFilters?.subscriberCount.max !== defaults.channelFilters?.subscriberCount.max) count++;
  if (filters.channelFilters?.channelAge !== defaults.channelFilters?.channelAge) count++;
  if (filters.channelFilters?.videoCount.min !== defaults.channelFilters?.videoCount.min) count++;
  if (filters.channelFilters?.videoCount.max !== defaults.channelFilters?.videoCount.max) count++;
  
  // Check common filters
  if (filters.keywords.trim().length > 0) count++;
  if (filters.platform !== defaults.platform) count++;
  if (filters.country !== defaults.country) count++;
  if (filters.language !== defaults.language) count++;
  if (filters.category && filters.category !== '0') count++;
  
  return count;
}

/**
 * Gets recommended page size based on active filter count
 * More filters = larger page size for better results
 * @param activeFilterCount - Number of active filters
 * @returns Recommended page size
 */
export function getRecommendedPageSize(activeFilterCount: number): number {
  if (activeFilterCount >= 5) return 200;
  if (activeFilterCount >= 3) return 150;
  if (activeFilterCount >= 1) return 100;
  return 50;
}
