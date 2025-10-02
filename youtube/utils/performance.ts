import { ApiResponse } from '../lib/types';

// A simple in-memory cache to store recent API responses.
// In a real app, this might be an LRU cache or leverage browser storage.
const apiCache = new Map<string, ApiResponse>();
const MAX_CACHE_SIZE = 50; // Store the last 50 unique API calls

/**
 * Retrieves a response from the cache based on a generated key.
 * @param key The cache key string.
 * @returns A cached ApiResponse or undefined if not found.
 */
export const getFromApiCache = (key: string): ApiResponse | undefined => {
  return apiCache.get(key);
};

/**
 * Stores a response in the cache.
 * @param key The cache key string.
 * @param data The ApiResponse to cache.
 */
export const setInApiCache = (key: string, data: ApiResponse) => {
  if (apiCache.size >= MAX_CACHE_SIZE) {
    // Evict the oldest entry to keep the cache size manageable.
    const oldestKey = apiCache.keys().next().value;
    apiCache.delete(oldestKey);
  }
  // Create a deep copy to prevent mutation issues with the in-memory mock.
  const dataToCache = JSON.parse(JSON.stringify(data));
  dataToCache.meta.cacheHit = true; // Mark the response as a cache hit
  apiCache.set(key, dataToCache);
};

/**
 * Generates a stable, unique string key from a filter object for caching.
 * @param filters The filter object.
 * @returns A JSON string representing the sorted filters.
 */
export const generateCacheKey = (filters: object): string => {
  // Sort keys to ensure {a:1, b:2} and {b:2, a:1} produce the same key
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      acc[key] = filters[key];
      return acc;
    }, {} as Record<string, any>);
    
  return JSON.stringify(sortedFilters);
};
