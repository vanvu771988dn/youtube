/**
 * Hashtag Analytics Utility
 * Extracts, analyzes, and ranks hashtags from video collections
 */

import { Video } from '../lib/types';

export interface HashtagStats {
  tag: string;
  count: number;
  totalViews: number;
  avgViews: number;
  videos: Video[];
  trending: boolean; // High view count + recent uploads
}

export interface HashtagAnalysis {
  topHashtags: HashtagStats[];
  trendingHashtags: HashtagStats[];
  totalUniqueHashtags: number;
  avgHashtagsPerVideo: number;
}

/**
 * Normalize hashtag (remove #, lowercase, trim)
 */
function normalizeHashtag(tag: string): string {
  return tag.replace(/^#/, '').toLowerCase().trim();
}

/**
 * Extract all hashtags from videos and calculate stats
 */
export function analyzeHashtags(videos: Video[]): HashtagAnalysis {
  if (videos.length === 0) {
    return {
      topHashtags: [],
      trendingHashtags: [],
      totalUniqueHashtags: 0,
      avgHashtagsPerVideo: 0,
    };
  }

  const hashtagMap = new Map<string, HashtagStats>();
  let totalHashtagCount = 0;

  // Process all videos
  videos.forEach(video => {
    if (!video.tags || video.tags.length === 0) return;
    
    totalHashtagCount += video.tags.length;

    video.tags.forEach(tag => {
      const normalized = normalizeHashtag(tag);
      if (!normalized) return;

      if (hashtagMap.has(normalized)) {
        const stats = hashtagMap.get(normalized)!;
        stats.count += 1;
        stats.totalViews += video.viewCount || 0;
        stats.videos.push(video);
      } else {
        hashtagMap.set(normalized, {
          tag: normalized,
          count: 1,
          totalViews: video.viewCount || 0,
          avgViews: 0,
          videos: [video],
          trending: false,
        });
      }
    });
  });

  // Calculate average views and trending status
  const hashtagStats = Array.from(hashtagMap.values()).map(stats => {
    stats.avgViews = Math.round(stats.totalViews / stats.count);
    
    // Trending if: used in 3+ videos, high avg views, and recent uploads
    const recentVideos = stats.videos.filter(v => {
      const hoursSince = (Date.now() - new Date(v.uploadDate).getTime()) / (1000 * 60 * 60);
      return hoursSince < 72; // Within 3 days
    });
    stats.trending = stats.count >= 3 && stats.avgViews > 100000 && recentVideos.length > 0;
    
    return stats;
  });

  // Sort by count descending
  const topHashtags = hashtagStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Filter trending hashtags
  const trendingHashtags = hashtagStats
    .filter(s => s.trending)
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 10);

  return {
    topHashtags,
    trendingHashtags,
    totalUniqueHashtags: hashtagMap.size,
    avgHashtagsPerVideo: totalHashtagCount / videos.length,
  };
}

/**
 * Get hashtag suggestions based on a search query
 */
export function getHashtagSuggestions(query: string, videos: Video[]): string[] {
  const analysis = analyzeHashtags(videos);
  const normalizedQuery = query.toLowerCase();
  
  return analysis.topHashtags
    .filter(h => h.tag.includes(normalizedQuery))
    .slice(0, 10)
    .map(h => h.tag);
}

/**
 * Extract common title patterns from videos
 */
export interface TitlePattern {
  pattern: string;
  count: number;
  example: string;
  avgViews: number;
}

export function analyzeTitlePatterns(videos: Video[]): TitlePattern[] {
  // Common viral title patterns
  const patterns = [
    { regex: /^How (I|to)\s/i, pattern: 'How I/to...' },
    { regex: /\d+\s+(Things|Ways|Tips|Reasons)/i, pattern: 'X Things/Ways/Tips' },
    { regex: /Why\s+(I|You|Your)\s/i, pattern: 'Why I/You...' },
    { regex: /\[.*?\]|\(.*?\)/i, pattern: '[Brackets] or (Parens)' },
    { regex: /^(The|A)\s+Ultimate\s+Guide/i, pattern: 'Ultimate Guide' },
    { regex: /\d+\s+(Hour|Minute|Day|Week|Month)/i, pattern: 'Time-based' },
    { regex: /!{2,}|\?{2,}/i, pattern: 'Multiple punctuation' },
    { regex: /vs\./i, pattern: 'VS/Comparison' },
    { regex: /^(I|We)\s+(Tried|Tested|Made)/i, pattern: 'I Tried/Tested' },
    { regex: /\bDIY\b/i, pattern: 'DIY' },
  ];

  const results = patterns.map(p => {
    const matches = videos.filter(v => p.regex.test(v.title));
    if (matches.length === 0) {
      return {
        pattern: p.pattern,
        count: 0,
        example: '',
        avgViews: 0,
      };
    }

    const totalViews = matches.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    return {
      pattern: p.pattern,
      count: matches.length,
      example: matches[0].title,
      avgViews: Math.round(totalViews / matches.length),
    };
  });

  return results
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Identify content gaps (low competition niches)
 */
export interface ContentGap {
  topic: string;
  searchVolume: number; // Based on video count with topic
  competition: number; // Average views of competitors
  opportunity: number; // 0-100 score (high searchVolume, low competition)
}

export function identifyContentGaps(videos: Video[], keywords: string[]): ContentGap[] {
  const gaps: ContentGap[] = keywords.map(keyword => {
    const relevantVideos = videos.filter(v => 
      v.title.toLowerCase().includes(keyword.toLowerCase()) ||
      v.tags?.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
    );

    const searchVolume = relevantVideos.length;
    const totalViews = relevantVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const competition = searchVolume > 0 ? totalViews / searchVolume : 0;

    // Opportunity score: high search volume but low competition
    const normalizedVolume = Math.min(100, searchVolume * 2);
    const normalizedCompetition = Math.min(100, competition / 100000);
    const opportunity = Math.round(normalizedVolume * (100 - normalizedCompetition) / 100);

    return {
      topic: keyword,
      searchVolume,
      competition: Math.round(competition),
      opportunity,
    };
  });

  return gaps.sort((a, b) => b.opportunity - a.opportunity);
}
