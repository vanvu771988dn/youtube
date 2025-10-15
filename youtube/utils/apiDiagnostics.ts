/**
 * API Diagnostics Utility
 * Tests YouTube API key validity and connectivity
 */

import { config } from '../lib/config';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

/**
 * Test if YouTube API key is configured
 */
export function testApiKeyConfiguration(): DiagnosticResult {
  const apiKey = config.youtubeApiKey;
  
  if (!apiKey) {
    return {
      success: false,
      message: '❌ YouTube API key is not configured',
      error: 'Missing VITE_YOUTUBE_API_KEY in .env.local file',
      details: {
        hint: 'Create a .env.local file with: VITE_YOUTUBE_API_KEY=your_key_here',
        configValue: apiKey
      }
    };
  }
  
  if (apiKey.length < 30) {
    return {
      success: false,
      message: '⚠️ YouTube API key looks invalid (too short)',
      error: 'API key should be around 39 characters',
      details: {
        actualLength: apiKey.length,
        expectedLength: '~39 characters'
      }
    };
  }
  
  return {
    success: true,
    message: '✅ API key is configured',
    details: {
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...'
    }
  };
}

/**
 * Test YouTube API connectivity
 */
export async function testYouTubeApiConnectivity(): Promise<DiagnosticResult> {
  const apiKey = config.youtubeApiKey;
  
  if (!apiKey) {
    return {
      success: false,
      message: '❌ Cannot test - API key not configured',
      error: 'Configure API key first'
    };
  }
  
  try {
    console.log('[API Test] Testing YouTube API connectivity...');
    
    // Simple test: fetch a single trending video
    const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: '❌ YouTube API request failed',
        error: data.error?.message || response.statusText,
        details: {
          status: response.status,
          errorCode: data.error?.code,
          errorDetails: data.error?.errors?.[0]
        }
      };
    }
    
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        message: '⚠️ API responded but returned no videos',
        details: {
          response: data
        }
      };
    }
    
    return {
      success: true,
      message: '✅ YouTube API is working!',
      details: {
        videosFetched: data.items.length,
        sampleVideo: data.items[0].snippet.title,
        quotaUsed: '1 unit (test successful)'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: '❌ Network or fetch error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        hint: 'Check internet connection, firewall, or CORS issues',
        errorType: error?.constructor?.name
      }
    };
  }
}

/**
 * Run all diagnostics
 */
export async function runFullDiagnostics(): Promise<DiagnosticResult[]> {
  console.log('\n=== Running API Diagnostics ===\n');
  
  const results: DiagnosticResult[] = [];
  
  // Test 1: Configuration
  const configTest = testApiKeyConfiguration();
  results.push(configTest);
  console.log(configTest.message);
  if (configTest.details) console.log('Details:', configTest.details);
  
  // Test 2: Connectivity (only if config is valid)
  if (configTest.success) {
    console.log('\n[API Test] Testing connectivity...');
    const connectivityTest = await testYouTubeApiConnectivity();
    results.push(connectivityTest);
    console.log(connectivityTest.message);
    if (connectivityTest.details) console.log('Details:', connectivityTest.details);
    if (connectivityTest.error) console.error('Error:', connectivityTest.error);
  }
  
  console.log('\n=== Diagnostics Complete ===\n');
  
  return results;
}

/**
 * Get common error solutions
 */
export function getErrorSolutions(errorMessage: string): string[] {
  const solutions: string[] = [];
  
  if (errorMessage.includes('API key')) {
    solutions.push('1. Get a YouTube API key from Google Cloud Console');
    solutions.push('2. Enable YouTube Data API v3 in your project');
    solutions.push('3. Add VITE_YOUTUBE_API_KEY=your_key to .env.local');
    solutions.push('4. Restart the dev server (npm run dev)');
  }
  
  if (errorMessage.includes('quota')) {
    solutions.push('1. Check your API quota in Google Cloud Console');
    solutions.push('2. Wait 24 hours for quota reset');
    solutions.push('3. Request a quota increase if needed');
  }
  
  if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
    solutions.push('1. Check your internet connection');
    solutions.push('2. Check if googleapis.com is accessible');
    solutions.push('3. Disable VPN or firewall temporarily');
    solutions.push('4. Check browser console for CORS errors');
  }
  
  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    solutions.push('1. Verify API key is correct and not restricted');
    solutions.push('2. Check API key restrictions in Google Cloud Console');
    solutions.push('3. Ensure YouTube Data API v3 is enabled');
  }
  
  return solutions;
}
