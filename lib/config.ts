/**
 * Application configuration
 * Centralizes environment variable access and provides defaults
 */

export const config = {
  // API Keys
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // API Configuration
  api: {
    baseUrl: '/api/v1/',
    timeout: 10000,
    maxRetries: 3,
    retryDelay: 1000,
  },
  
  // YouTube API Configuration
  youtube: {
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    defaultRegion: 'US',
    defaultMaxResults: 50,
    defaultCategoryId: '0', // All categories
  },
  
  // Application Settings
  app: {
    defaultPageSize: 20,
    maxPageSize: 100,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  },
  
  // Feature Flags
  features: {
    useRealYouTubeData: !!(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim()),
    enableCaching: true,
    enableRetry: true,
  }
} as const;

// Validation
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (config.features.useRealYouTubeData && !config.youtubeApiKey) {
    errors.push('YouTube API key is required when using real YouTube data');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default config;

