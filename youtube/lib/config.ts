/**
 * Application configuration
 * Centralizes environment variable access and provides defaults
 */

export const config = {
  // API Keys
  youtubeApiKey: (typeof process !== 'undefined' && process.env?.YOUTUBE_API_KEY) || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_YOUTUBE_API_KEY : undefined),
  geminiApiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined),
  
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
    defaultPageSize: 50,
    maxPageSize: 100,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  },
  
  // Feature Flags
  features: {
    useRealYouTubeData: true, // enable real data when API key is provided (validated below)
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

