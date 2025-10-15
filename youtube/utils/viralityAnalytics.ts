/**
 * Virality Analytics Utility
 * Calculates viral metrics, growth rates, and trend velocity for videos
 */

import { Video } from '../lib/types';

export interface ViralMetrics {
  viralityScore: number; // 0-100 score
  growthRate: number; // Views per hour
  trendingBadge: 'viral' | 'trending-fast' | 'rising' | 'steady' | null;
  velocityIndicator: {
    label: string;
    color: string;
    emoji: string;
  };
  engagementRate: number; // (likes + comments) / views
  viralityTier: 'mega' | 'high' | 'medium' | 'low'; // Virality tier
}

/**
 * Calculate hours since upload
 */
function getHoursSinceUpload(uploadDate: string): number {
  const now = new Date().getTime();
  const uploaded = new Date(uploadDate).getTime();
  return Math.max(1, (now - uploaded) / (1000 * 60 * 60)); // Minimum 1 hour
}

/**
 * Calculate engagement rate
 */
function calculateEngagementRate(video: Video): number {
  if (!video.viewCount || video.viewCount === 0) return 0;
  const interactions = (video.likeCount || 0) + (video.commentCount || 0);
  return (interactions / video.viewCount) * 100;
}

/**
 * Calculate views per hour (growth rate)
 */
function calculateGrowthRate(video: Video): number {
  const hoursSinceUpload = getHoursSinceUpload(video.uploadDate);
  return video.viewCount / hoursSinceUpload;
}

/**
 * Calculate virality score (0-100)
 * Factors: views per hour, engagement rate, recency boost
 */
function calculateViralityScore(video: Video): number {
  const hoursSinceUpload = getHoursSinceUpload(video.uploadDate);
  const viewsPerHour = calculateGrowthRate(video);
  const engagementRate = calculateEngagementRate(video);
  
  // Normalize views per hour (logarithmic scale)
  const viewScore = Math.min(50, Math.log10(viewsPerHour + 1) * 10);
  
  // Engagement score (0-30)
  const engagementScore = Math.min(30, engagementRate * 3);
  
  // Recency boost (0-20) - newer videos get higher boost
  const recencyBoost = Math.max(0, 20 - (hoursSinceUpload / 6)); // Decays over 120 hours
  
  const totalScore = viewScore + engagementScore + recencyBoost;
  return Math.min(100, Math.round(totalScore));
}

/**
 * Determine trending badge based on virality score
 */
function getTrendingBadge(score: number, growthRate: number): ViralMetrics['trendingBadge'] {
  if (score >= 80 && growthRate > 10000) return 'viral';
  if (score >= 65 && growthRate > 5000) return 'trending-fast';
  if (score >= 50) return 'rising';
  if (score >= 30) return 'steady';
  return null;
}

/**
 * Get velocity indicator with label and color
 */
function getVelocityIndicator(growthRate: number): ViralMetrics['velocityIndicator'] {
  if (growthRate > 50000) {
    return { label: 'Explosive', color: 'bg-red-600', emoji: '💥' };
  }
  if (growthRate > 20000) {
    return { label: 'Rapid', color: 'bg-orange-600', emoji: '🚀' };
  }
  if (growthRate > 10000) {
    return { label: 'Fast', color: 'bg-yellow-600', emoji: '⚡' };
  }
  if (growthRate > 5000) {
    return { label: 'Growing', color: 'bg-green-600', emoji: '📈' };
  }
  if (growthRate > 1000) {
    return { label: 'Moderate', color: 'bg-blue-600', emoji: '➡️' };
  }
  return { label: 'Steady', color: 'bg-gray-600', emoji: '📊' };
}

/**
 * Get virality tier
 */
function getViralityTier(score: number): ViralMetrics['viralityTier'] {
  if (score >= 80) return 'mega';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Calculate all viral metrics for a video
 */
export function calculateViralMetrics(video: Video): ViralMetrics {
  const viralityScore = calculateViralityScore(video);
  const growthRate = calculateGrowthRate(video);
  const engagementRate = calculateEngagementRate(video);
  const trendingBadge = getTrendingBadge(viralityScore, growthRate);
  const velocityIndicator = getVelocityIndicator(growthRate);
  const viralityTier = getViralityTier(viralityScore);

  return {
    viralityScore,
    growthRate,
    trendingBadge,
    velocityIndicator,
    engagementRate,
    viralityTier,
  };
}

/**
 * Analyze a collection of videos for overall trends
 */
export interface TrendAnalysis {
  totalVideos: number;
  avgViralityScore: number;
  topPerformers: Video[];
  viralCount: number;
  trendingFastCount: number;
  avgGrowthRate: number;
  highEngagementVideos: Video[];
}

export function analyzeTrends(videos: Video[]): TrendAnalysis {
  if (videos.length === 0) {
    return {
      totalVideos: 0,
      avgViralityScore: 0,
      topPerformers: [],
      viralCount: 0,
      trendingFastCount: 0,
      avgGrowthRate: 0,
      highEngagementVideos: [],
    };
  }

  const videosWithMetrics = videos.map(v => ({
    video: v,
    metrics: calculateViralMetrics(v),
  }));

  const totalScore = videosWithMetrics.reduce((sum, v) => sum + v.metrics.viralityScore, 0);
  const totalGrowth = videosWithMetrics.reduce((sum, v) => sum + v.metrics.growthRate, 0);
  
  const viralCount = videosWithMetrics.filter(v => v.metrics.trendingBadge === 'viral').length;
  const trendingFastCount = videosWithMetrics.filter(v => v.metrics.trendingBadge === 'trending-fast').length;

  // Top 10 by virality score
  const topPerformers = videosWithMetrics
    .sort((a, b) => b.metrics.viralityScore - a.metrics.viralityScore)
    .slice(0, 10)
    .map(v => v.video);

  // High engagement videos (top 10 by engagement rate)
  const highEngagementVideos = videosWithMetrics
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
    .slice(0, 10)
    .map(v => v.video);

  return {
    totalVideos: videos.length,
    avgViralityScore: Math.round(totalScore / videos.length),
    topPerformers,
    viralCount,
    trendingFastCount,
    avgGrowthRate: Math.round(totalGrowth / videos.length),
    highEngagementVideos,
  };
}

/**
 * Format growth rate for display
 */
export function formatGrowthRate(rate: number): string {
  if (rate >= 1000000) {
    return `${(rate / 1000000).toFixed(1)}M/hr`;
  }
  if (rate >= 1000) {
    return `${(rate / 1000).toFixed(1)}K/hr`;
  }
  return `${Math.round(rate)}/hr`;
}
