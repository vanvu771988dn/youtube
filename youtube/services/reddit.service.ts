import axios from 'axios';
import { Video } from '../lib/types';

const REDDIT_API_BASE = '/api/reddit';

export class RedditService {
  static async fetchTrendingVideos(limit = 10): Promise<Video[]> {
    try {
      const response = await axios.get(REDDIT_API_BASE, {
        params: { path: '/r/videos/hot.json', limit },
      });
      console.log('[Reddit] Raw trending response:', response.data);
      const children = response.data?.data?.children || response.data?.children || [];
      return RedditService.convertRedditData(children);
    } catch (error) {
      console.error('[Reddit] Error fetching trending:', error);
      return [];
    }
  }

  static async searchVideos(query: string, limit = 10): Promise<Video[]> {
    try {
      const response = await axios.get(REDDIT_API_BASE, {
        params: { path: '/search.json', q: query, limit, type: 'link', sort: 'relevance', restrict_sr: false },
      });
      console.log('[Reddit] Raw search response:', response.data);
      const children = response.data?.data?.children || response.data?.children || [];
      return RedditService.convertRedditData(children);
    } catch (error) {
      console.error('[Reddit] Error searching:', error);
      return [];
    }
  }

  static convertRedditData(posts: any[]): Video[] {
    console.log('[Reddit] Raw children:', posts);
    return posts
      .map((item: any) => item.data)
      .filter((data: any) => {
        // Accept native Reddit videos, YouTube links, and other video embeds
        return (
          (data.is_video && data.media?.reddit_video) ||
          (data.domain && data.domain.includes('youtube.com')) ||
          (data.domain && data.domain.includes('youtu.be')) ||
          (data.media && data.media.type && data.media.type.includes('video'))
        );
      })
      .map((data: any) => {
        // Native Reddit video
        if (data.is_video && data.media?.reddit_video) {
          return {
            id: data.id,
            platform: 'reddit',
            title: data.title,
            thumbnail: data.thumbnail,
            url: `https://reddit.com${data.permalink}`,
            creatorName: data.author,
            creatorAvatar: '',
            subscriberCount: 0,
            viewCount: data.view_count || 0,
            likeCount: 0,
            duration: data.media.reddit_video.duration || 0,
            uploadDate: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : '',
            channelAge: undefined,
            tags: [],
            category: '',
            commentCount: data.num_comments || 0,
          };
        }
        // YouTube link
        if (data.domain && (data.domain.includes('youtube.com') || data.domain.includes('youtu.be'))) {
          return {
            id: data.id,
            platform: 'reddit',
            title: data.title,
            thumbnail: data.thumbnail,
            url: data.url,
            creatorName: data.author,
            creatorAvatar: '',
            subscriberCount: 0,
            viewCount: data.view_count || 0,
            likeCount: 0,
            duration: 0,
            uploadDate: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : '',
            channelAge: undefined,
            tags: [],
            category: '',
            commentCount: data.num_comments || 0,
          };
        }
        // Other video embeds
        if (data.media && data.media.type && data.media.type.includes('video')) {
          return {
            id: data.id,
            platform: 'reddit',
            title: data.title,
            thumbnail: data.thumbnail,
            url: data.url,
            creatorName: data.author,
            creatorAvatar: '',
            subscriberCount: 0,
            viewCount: data.view_count || 0,
            likeCount: 0,
            duration: 0,
            uploadDate: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : '',
            channelAge: undefined,
            tags: [],
            category: '',
            commentCount: data.num_comments || 0,
          };
        }
        return null;
      })
      .filter(Boolean) as Video[];
  }
}
