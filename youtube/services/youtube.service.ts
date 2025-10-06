import { Video } from '../lib/types';

// YouTube Data API v3 types
interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
      standard?: { url: string };
      maxres?: { url: string };
    };
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    tags?: string[];
    categoryId: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
  };
}

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    publishedAt: string;
    country?: string;
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
  };
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
      channelTitle: string;
      channelId: string;
      publishedAt: string;
    };
  }>;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface YouTubeVideosResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface YouTubeChannelsResponse {
  items: YouTubeChannel[];
}

class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  private calculateChannelAge(publishedAt: string): number {
    const channelDate = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - channelDate.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  }

  private getBestThumbnail(thumbnails: YouTubeVideo['snippet']['thumbnails']): string {
    return thumbnails.maxres?.url || 
           thumbnails.standard?.url || 
           thumbnails.high?.url || 
           thumbnails.medium?.url || 
           thumbnails.default?.url;
  }

  private estimateMonetization(channel: YouTubeChannel): boolean {
    const subscriberCount = parseInt(channel.statistics.subscriberCount, 10);
    const videoCount = parseInt(channel.statistics.videoCount, 10);
    return subscriberCount >= 1000 && videoCount >= 10;
  }

  async getTrendingVideos(
    maxResults: number = 50,
    regionCode: string = 'US',
    categoryId: string = '0'
  ): Promise<Video[]> {
    try {
      const searchUrl = `${this.baseUrl}/videos`;
      const searchParams = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode,
        maxResults: maxResults.toString(),
        key: this.apiKey,
      });

      if (categoryId !== '0') {
        searchParams.append('videoCategoryId', categoryId);
      }

      const response = await fetch(`${searchUrl}?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data: YouTubeVideosResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      const channelIds = [...new Set(data.items.map(video => video.snippet.channelId))];
      const channels = await this.getChannelsInfo(channelIds);
      const channelMap = new Map(channels.map(channel => [channel.id, channel]));

      const videos: Video[] = data.items.map(video => {
        const channel = channelMap.get(video.snippet.channelId);
        const duration = this.parseDuration(video.contentDetails.duration);
        const channelAge = channel ? this.calculateChannelAge(channel.snippet.publishedAt) : undefined;
        const videoCount = channel ? parseInt(channel.statistics.videoCount, 10) : 0;
        const monetizationEnabled = channel ? this.estimateMonetization(channel) : false;

        return {
          id: video.id,
          platform: 'youtube' as const,
          title: video.snippet.title,
          thumbnail: this.getBestThumbnail(video.snippet.thumbnails),
          url: `https://www.youtube.com/watch?v=${video.id}`,
          creatorName: video.snippet.channelTitle,
          creatorAvatar: channel?.snippet.thumbnails.high?.url || 
                        channel?.snippet.thumbnails.medium?.url || 
                        channel?.snippet.thumbnails.default?.url || '',
          subscriberCount: channel ? parseInt(channel.statistics.subscriberCount, 10) : 0,
          viewCount: parseInt(video.statistics.viewCount, 10),
          likeCount: parseInt(video.statistics.likeCount, 10),
          duration,
          uploadDate: video.snippet.publishedAt,
          channelAge,
          tags: video.snippet.tags || [],
          category: video.snippet.categoryId,
          commentCount: parseInt(video.statistics.commentCount, 10),
          country: channel?.snippet.country || regionCode,
          monetizationEnabled,
          videoCount,
        };
      });

      return videos;
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      throw new Error(`Failed to fetch trending videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchVideos(
    query: string,
    maxResults: number = 50,
    order: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' = 'relevance',
    publishedAfter?: string,
    regionCode?: string
  ): Promise<Video[]> {
    try {
      const searchUrl = `${this.baseUrl}/search`;
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        order,
        key: this.apiKey,
      });

      if (publishedAfter) {
        searchParams.append('publishedAfter', publishedAfter);
      }

      if (regionCode) {
        searchParams.append('regionCode', regionCode);
      }

      const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
      
      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData: YouTubeSearchResponse = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      const videoIds = searchData.items.map(item => item.id.videoId);
      const videos = await this.getVideosInfo(videoIds, regionCode);

      return videos;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getVideosInfo(videoIds: string[], regionCode?: string): Promise<Video[]> {
    try {
      const videosUrl = `${this.baseUrl}/videos`;
      const videosParams = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
        key: this.apiKey,
      });

      const videosResponse = await fetch(`${videosUrl}?${videosParams}`);
      
      if (!videosResponse.ok) {
        throw new Error(`YouTube API error: ${videosResponse.status} ${videosResponse.statusText}`);
      }

      const videosData: YouTubeVideosResponse = await videosResponse.json();
      
      if (!videosData.items || videosData.items.length === 0) {
        return [];
      }

      const channelIds = [...new Set(videosData.items.map(video => video.snippet.channelId))];
      const channels = await this.getChannelsInfo(channelIds);
      const channelMap = new Map(channels.map(channel => [channel.id, channel]));

      const videos: Video[] = videosData.items.map(video => {
        const channel = channelMap.get(video.snippet.channelId);
        const duration = this.parseDuration(video.contentDetails.duration);
        const channelAge = channel ? this.calculateChannelAge(channel.snippet.publishedAt) : undefined;
        const videoCount = channel ? parseInt(channel.statistics.videoCount, 10) : 0;
        const monetizationEnabled = channel ? this.estimateMonetization(channel) : false;

        return {
          id: video.id,
          platform: 'youtube' as const,
          title: video.snippet.title,
          thumbnail: this.getBestThumbnail(video.snippet.thumbnails),
          url: `https://www.youtube.com/watch?v=${video.id}`,
          creatorName: video.snippet.channelTitle,
          creatorAvatar: channel?.snippet.thumbnails.high?.url || 
                        channel?.snippet.thumbnails.medium?.url || 
                        channel?.snippet.thumbnails.default?.url || '',
          subscriberCount: channel ? parseInt(channel.statistics.subscriberCount, 10) : 0,
          viewCount: parseInt(video.statistics.viewCount, 10),
          likeCount: parseInt(video.statistics.likeCount, 10),
          duration,
          uploadDate: video.snippet.publishedAt,
          channelAge,
          tags: video.snippet.tags || [],
          category: video.snippet.categoryId,
          commentCount: parseInt(video.statistics.commentCount, 10),
          country: channel?.snippet.country || regionCode || 'US',
          monetizationEnabled,
          videoCount,
        };
      });

      return videos;
    } catch (error) {
      console.error('Error getting videos info:', error);
      throw new Error(`Failed to get videos info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getChannelsInfo(channelIds: string[]): Promise<YouTubeChannel[]> {
    try {
      const channelsUrl = `${this.baseUrl}/channels`;
      const channelsParams = new URLSearchParams({
        part: 'snippet,statistics',
        id: channelIds.join(','),
        key: this.apiKey,
      });

      const channelsResponse = await fetch(`${channelsUrl}?${channelsParams}`);
      
      if (!channelsResponse.ok) {
        throw new Error(`YouTube API error: ${channelsResponse.status} ${channelsResponse.statusText}`);
      }

      const channelsData: YouTubeChannelsResponse = await channelsResponse.json();
      return channelsData.items || [];
    } catch (error) {
      console.error('Error getting channels info:', error);
      return [];
    }
  }

  async getVideoCategories(regionCode: string = 'US'): Promise<Array<{id: string, title: string}>> {
    try {
      const categoriesUrl = `${this.baseUrl}/videoCategories`;
      const categoriesParams = new URLSearchParams({
        part: 'snippet',
        regionCode,
        key: this.apiKey,
      });

      const response = await fetch(`${categoriesUrl}?${categoriesParams}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title
      })) || [];
    } catch (error) {
      console.error('Error getting video categories:', error);
      return [];
    }
  }
}

export default YouTubeService;