import React, { useState } from 'react';
import config from '../lib/config';
import YouTubeService from '../services/youtube.service';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

const YouTubeTest: React.FC = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testYouTubeAPI = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Check if API key is configured
      if (!config.youtubeApiKey) {
        setTestResult({
          success: false,
          message: 'YouTube API key not configured',
          error: 'Please set YOUTUBE_API_KEY in your .env.local file'
        });
        return;
      }

      // Initialize YouTube service
      const youtubeService = new YouTubeService(config.youtubeApiKey);

      // Test 1: Get recent videos (without keywords)
      console.log('Testing YouTube API - Getting recent videos...');
      const recentVideos = await youtubeService.searchVideos('', 5);
      
      if (recentVideos.length === 0) {
        setTestResult({
          success: false,
          message: 'No recent videos found',
          error: 'API returned empty results'
        });
        return;
      }

      // Test 2: Search for videos with keywords
      console.log('Testing YouTube API - Searching for videos...');
      const searchResults = await youtubeService.searchVideos('trending', 3);

      setTestResult({
        success: true,
        message: 'YouTube API integration successful!',
        data: {
          recentVideos: recentVideos.length,
          searchResults: searchResults.length,
          sampleVideo: {
            title: recentVideos[0]?.title,
            creator: recentVideos[0]?.creatorName,
            views: recentVideos[0]?.viewCount,
            platform: recentVideos[0]?.platform
          }
        }
      });

    } catch (error) {
      console.error('YouTube API test failed:', error);
      setTestResult({
        success: false,
        message: 'YouTube API test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">YouTube API Test</h3>
      
      <div className="mb-4">
        <p className="text-slate-300 mb-2">
          Test the YouTube Data API v3 integration:
        </p>
        <ul className="text-sm text-slate-400 list-disc list-inside mb-4">
          <li>Fetches recent videos</li>
          <li>Searches for videos by keyword</li>
          <li>Validates API key configuration</li>
        </ul>
      </div>

      <button
        onClick={testYouTubeAPI}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors"
      >
        {loading ? 'Testing...' : 'Test YouTube API'}
      </button>

      {testResult && (
        <div className={`mt-4 p-4 rounded-md ${
          testResult.success 
            ? 'bg-green-900 border border-green-700' 
            : 'bg-red-900 border border-red-700'
        }`}>
          <h4 className={`font-semibold ${
            testResult.success ? 'text-green-300' : 'text-red-300'
          }`}>
            {testResult.message}
          </h4>
          
          {testResult.error && (
            <p className="text-red-400 text-sm mt-2">{testResult.error}</p>
          )}
          
          {testResult.data && (
            <div className="mt-3 text-sm text-slate-300">
              <p>✅ Found {testResult.data.recentVideos} recent videos</p>
              <p>✅ Found {testResult.data.searchResults} search results</p>
              {testResult.data.sampleVideo && (
                <div className="mt-2 p-2 bg-slate-700 rounded">
                  <p><strong>Sample Video:</strong></p>
                  <p>Title: {testResult.data.sampleVideo.title}</p>
                  <p>Creator: {testResult.data.sampleVideo.creator}</p>
                  <p>Views: {testResult.data.sampleVideo.views?.toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        <p><strong>Configuration Status:</strong></p>
        <p>YouTube API Key: {config.youtubeApiKey ? '✅ Configured' : '❌ Missing'}</p>
        <p>Real Data Mode: {config.features.useRealYouTubeData ? '✅ Enabled' : '❌ Disabled'}</p>
      </div>
    </div>
  );
};

export default YouTubeTest;

