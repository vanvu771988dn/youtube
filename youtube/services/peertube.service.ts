import axios from 'axios';
import { Video } from '../lib/types';

const PEERTUBE_API_BASE = 'https://framatube.org/api/v1'; // Example instance

export class PeerTubeService {
  static async fetchTrendingVideos(limit = 10): Promise<Video[]> {
    try {
      const response = await axios.get(`${PEERTUBE_API_BASE}/videos`, {
        params: { sort: '-trending', count: limit },
      });
      console.log('[PeerTube] Raw trending response:', response.data);
      return PeerTubeService.convertPeerTubeData(response.data.data || []);
    } catch (error) {
      console.error('[PeerTube] Error fetching trending:', error);
      return [];
    }
  }

  static async searchVideos(query: string, limit = 10): Promise<Video[]> {
    try {
      const response = await axios.get(`${PEERTUBE_API_BASE}/search/videos`, {
        params: { q: query, count: limit },
      });
      console.log('[PeerTube] Raw search response:', response.data);
      return PeerTubeService.convertPeerTubeData(response.data.data || []);
    } catch (error) {
      console.error('[PeerTube] Error searching:', error);
      return [];
    }
  }

  static convertPeerTubeData(videos: any[]): Video[] {
    return videos.map((video: any) => ({
      id: video.uuid,
      platform: 'peertube',
      title: video.name,
      thumbnail: video.thumbnailPath,
      url: video.url,
      creatorName: video.account?.displayName || '',
      creatorAvatar: video.account?.avatar || '',
      subscriberCount: 0,
      viewCount: video.views || 0,
      likeCount: video.likes || 0,
      duration: video.duration || 0,
      uploadDate: video.publishedAt || '',
      channelAge: undefined,
      tags: video.tags || [],
      category: video.category?.label || '',
      commentCount: video.commentsEnabled ? undefined : 0,
    }));
  }
}
