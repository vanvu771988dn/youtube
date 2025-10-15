import YouTubeService from './youtube.service';
import { Video } from '../lib/types';

export interface KeywordFilters {
  dateRange: '24h' | '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';
  category: string;
  region: string;
  maxResults: number;
  customStartDate?: string;
  customEndDate?: string;
}

export interface KeywordCount {
  keyword: string;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface CategoryCount {
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
}

export interface KeywordAnalysisResult {
  generatedAt: string;
  totalVideosAnalyzed: number;
  period: string;
  topKeywords: KeywordCount[];
  topTags: TagCount[];
  topCategories: CategoryCount[];
}

// Stop words to exclude from keyword analysis
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just',
  'now', 'my', 'your', 'our', 'like', 'get', 'got', 'new', 'out',
  'up', 'down', 'over', 'after', 'before', 'into', 'through', 'during',
]);

// Category ID to name mapping
const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
};

function extractKeywords(text: string, minLength: number = 3): string[] {
  if (!text) return [];
  
  // Convert to lowercase and remove special characters
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleaned.split(/\s+/);
  
  // Filter out stop words and short words
  return words.filter(word => 
    word.length >= minLength && 
    !STOP_WORDS.has(word) &&
    !word.match(/^\d+$/) // exclude pure numbers
  );
}

function countOccurrences<T>(items: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return counts;
}

function getDateRangeTimestamp(dateRange: string, customStart?: string, customEnd?: string): string | undefined {
  if (dateRange === 'custom') {
    return customStart;
  }
  
  const now = new Date();
  let daysAgo = 30;
  
  switch (dateRange) {
    case '24h':
      daysAgo = 1;
      break;
    case '7d':
      daysAgo = 7;
      break;
    case '30d':
      daysAgo = 30;
      break;
    case '90d':
      daysAgo = 90;
      break;
    case '6m':
      daysAgo = 180;
      break;
    case '1y':
      daysAgo = 365;
      break;
  }
  
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

export async function analyzeKeywords(filters: KeywordFilters): Promise<KeywordAnalysisResult> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set VITE_YOUTUBE_API_KEY in your .env.local file.');
  }
  
  const youtubeService = new YouTubeService(apiKey);
  
  let allVideos: Video[] = [];
  
  try {
    // Fetch trending videos
    console.log('[Keyword Analysis] Fetching trending videos...');
    const trendingResult = await youtubeService.getTrendingVideos(
      50,
      filters.region,
      filters.category === 'all' ? '0' : filters.category
    );
    allVideos.push(...trendingResult.videos);
    
    // Fetch recent popular videos based on date range
    if (filters.dateRange !== '24h') {
      console.log('[Keyword Analysis] Fetching recent popular videos...');
      const publishedAfter = getDateRangeTimestamp(
        filters.dateRange,
        filters.customStartDate,
        filters.customEndDate
      );
      
      const pagesToFetch = Math.ceil(filters.maxResults / 50);
      let pageToken: string | undefined;
      
      for (let i = 0; i < pagesToFetch && allVideos.length < filters.maxResults; i++) {
        const searchResult = await youtubeService.searchVideos(
          '', // empty query for all videos
          50,
          'viewCount',
          publishedAfter,
          pageToken
        );
        
        allVideos.push(...searchResult.videos);
        pageToken = searchResult.nextPageToken;
        
        if (!pageToken) break;
      }
    }
    
    // Limit to maxResults
    allVideos = allVideos.slice(0, filters.maxResults);
    
    if (allVideos.length === 0) {
      throw new Error('No videos found for the selected filters');
    }
    
    console.log(`[Keyword Analysis] Analyzing ${allVideos.length} videos...`);
    
    // Extract keywords from titles and descriptions
    const allKeywords: string[] = [];
    const allTags: string[] = [];
    const categoryMap = new Map<string, number>();
    
    for (const video of allVideos) {
      // Extract keywords from title
      const titleKeywords = extractKeywords(video.title);
      allKeywords.push(...titleKeywords);
      
      // Extract tags
      if (video.tags && video.tags.length > 0) {
        const normalizedTags = video.tags.map(tag => tag.toLowerCase());
        allTags.push(...normalizedTags);
      }
      
      // Count categories
      const categoryId = video.category || 'Unknown';
      categoryMap.set(categoryId, (categoryMap.get(categoryId) || 0) + 1);
    }
    
    // Count keyword occurrences
    const keywordCounts = countOccurrences(allKeywords);
    const tagCounts = countOccurrences(allTags);
    
    // Convert to sorted arrays
    const topKeywords: KeywordCount[] = Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
    
    const topTags: TagCount[] = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
    
    const topCategories: CategoryCount[] = Array.from(categoryMap.entries())
      .map(([categoryId, count]) => ({
        categoryId,
        categoryName: CATEGORY_NAMES[categoryId] || `Category ${categoryId}`,
        count,
        percentage: (count / allVideos.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const result: KeywordAnalysisResult = {
      generatedAt: new Date().toISOString(),
      totalVideosAnalyzed: allVideos.length,
      period: filters.dateRange === 'custom' 
        ? `${filters.customStartDate} to ${filters.customEndDate}`
        : filters.dateRange,
      topKeywords,
      topTags,
      topCategories,
    };
    
    console.log('[Keyword Analysis] Analysis complete:', {
      keywords: topKeywords.length,
      tags: topTags.length,
      categories: topCategories.length
    });
    
    return result;
  } catch (error) {
    console.error('[Keyword Analysis] Error:', error);
    throw error;
  }
}
