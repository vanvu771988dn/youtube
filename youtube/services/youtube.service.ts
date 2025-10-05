import { Video } from '../types';

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
    duration: string; // ISO 8601 duration format
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
  };
  statistics: {
    subscriberCount: string;
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
  prevPageToken?: string;
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

  /**
   * Converts ISO 8601 duration to seconds
   * @param duration ISO 8601 duration string (e.g., "PT4M13S")
   * @returns Duration in seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Calculates channel age in years
   * @param publishedAt Channel creation date
   * @returns Channel age in years
   */
  private calculateChannelAge(publishedAt: string): number {
    const channelDate = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - channelDate.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  }

  /**
   * Gets the best available thumbnail URL
   * @param thumbnails YouTube thumbnail object
   * @returns Best thumbnail URL
   */
  private getBestThumbnail(thumbnails: YouTubeVideo['snippet']['thumbnails']): string {
    return thumbnails.maxres?.url || 
           thumbnails.standard?.url || 
           thumbnails.high?.url || 
           thumbnails.medium?.url || 
           thumbnails.default?.url;
  }


  /**
   * Searches for videos on YouTube
   * @param query Search query
   * @param maxResults Maximum number of results (default: 50)
   * @param order Sort order (default: 'relevance')
   * @param publishedAfter ISO date string for filtering by upload date
   * @returns Promise<Video[]>
   */
  async searchVideos(
    query: string,
    maxResults: number = 50,
    order: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' = 'relevance',
    publishedAfter?: string,
    pageToken?: string,
    videoDuration?: 'short' | 'medium' | 'long'
  ): Promise<{ videos: Video[]; nextPageToken?: string }> {
    try {
      // First, search for videos
      const searchUrl = `${this.baseUrl}/search`;
      const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        maxResults: maxResults.toString(),
        order,
        key: this.apiKey,
        //regionCode: 'US',  // Add region code for better results
        safeSearch: 'none'  // Allow all content
        //videoEmbeddable: 'true'  // Only embeddable videos
      });
      
      // If no specific query, use a broad category-based search
      if (query && query.trim()) {
        searchParams.append('q', query);
      } else {
        // When no query is provided, let's get trending videos by using common categories
        searchParams.append('q', 'trending');
      }

      if (publishedAfter) {
        searchParams.append('publishedAfter', publishedAfter);
      }

      if (pageToken) {
        searchParams.append('pageToken', pageToken);
      }

      if (videoDuration) {
        // short: <4m, medium: 4-20m, long: >20m
        searchParams.append('videoDuration', videoDuration);
      }
      
      console.log('YouTube API request:', `${searchUrl}?${searchParams}`);

      const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('YouTube API error response:', errorText);
        throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
      }

      const searchData: YouTubeSearchResponse = await searchResponse.json();
      console.log('YouTube search response:', searchData);
      
      if (!searchData.items || searchData.items.length === 0) {
        return { videos: [], nextPageToken: undefined };
      }

      // Get detailed video information
      const videoIds = searchData.items.map(item => item.id.videoId);
      const videos = await this.getVideosInfo(videoIds);

      return {
        videos,
        nextPageToken: searchData.nextPageToken
      };
    } catch (error) {
      console.error('Error searching videos:', error);
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets detailed information for specific videos
   * @param videoIds Array of video IDs
   * @returns Promise<Video[]>
   */
  async getVideosInfo(videoIds: string[]): Promise<Video[]> {
    if (!videoIds.length) {
      return [];
    }
    
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

      // Get channel information
      const channelIds = [...new Set(videosData.items.map(video => video.snippet.channelId))];
      const channels = await this.getChannelsInfo(channelIds);
      const channelMap = new Map(channels.map(channel => [channel.id, channel]));

      // Transform to our Video format
      const videos: Video[] = videosData.items.map(video => {
        const channel = channelMap.get(video.snippet.channelId);
        const duration = this.parseDuration(video.contentDetails.duration);
        const channelAge = channel ? this.calculateChannelAge(channel.snippet.publishedAt) : undefined;

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
        };
      });

      return videos;
    } catch (error) {
      console.error('Error getting videos info:', error);
      throw new Error(`Failed to get videos info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets channel information for multiple channels
   * @param channelIds Array of channel IDs
   * @returns Promise<YouTubeChannel[]>
   */
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

  /**
   * Gets video categories
   * @param regionCode Region code (default: 'US')
   * @returns Promise<Array<{id: string, title: string}>>
   */
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

