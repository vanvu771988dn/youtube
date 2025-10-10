import axios from 'axios';
import { Video } from '../lib/types';

const DAILYMOTION_API_BASE = 'https://api.dailymotion.com';

export class DailymotionService {
  static async fetchTrendingVideos(limit = 10): Promise<Video[]> {
    try {
      const response = await axios.get(`${DAILYMOTION_API_BASE}/videos`, {
        params: {
          sort: 'trending',
          limit,
          fields: 'id,title,thumbnail_url,url,owner.screenname,owner.avatar_360_url,views_total,created_time,duration,tags,channel',
        },
      });
      console.log('[Dailymotion] Raw trending response:', response.data);
      return DailymotionService.convertDailymotionData(response.data.list || []);
    } catch (error) {
      console.error('[Dailymotion] Error fetching trending:', error);
      return [];
    }
  }

  static async searchVideos(query: string, limit = 10, page = 1, sort?: 'recent' | 'visited' | 'relevance'): Promise<{ videos: Video[]; hasMore: boolean }> {
    try {
      // Build params object, only include search if query is not empty
      const params: Record<string, any> = {
        limit,
        page,
        fields: 'id,title,thumbnail_url,url,owner.screenname,owner.avatar_360_url,views_total,created_time,duration,tags,channel',
      };

      // Only add search parameter if there's an actual query
      if (query && query.trim()) {
        params.search = query.trim();
      } else {
        // If no search query, use a sort parameter to get popular videos
        params.sort = 'recent';
      }

      if (sort) {
        params.sort = sort;
      }

      const response = await axios.get(`${DAILYMOTION_API_BASE}/videos`, {
        params,
      });
      console.log('[Dailymotion] Raw search response:', response.data);
      const videos = DailymotionService.convertDailymotionData(response.data.list || []);

      const hasMore = Boolean((response.data as any)?.has_more) || (videos.length === limit);
      
      console.log(`[Dailymotion] Returning ${videos.length} videos, page ${page}, hasMore: ${hasMore}`);
      return { videos: videos.slice(0, limit), hasMore };
    } catch (error) {
      console.error('[Dailymotion] Error searching:', error);
      return { videos: [], hasMore: false };
    }
  }

  static convertDailymotionData(videos: any[]): Video[] {
    return videos.map((video: any) => ({
      id: video.id,
      platform: 'dailymotion',
      title: video.title,
      thumbnail: video.thumbnail_url,
      url: video.url,
      creatorName: video.owner?.screenname || '',
      creatorAvatar: video.owner?.avatar_360_url || '',
      subscriberCount: 0,
      viewCount: video.views_total || 0,
      likeCount: 0,
      duration: video.duration || 0,
      uploadDate: video.created_time ? new Date(video.created_time * 1000).toISOString() : '',
      channelAge: undefined,
      tags: video.tags || [],
      category: video.channel || '',
      commentCount: undefined,
    }));
  }
}
