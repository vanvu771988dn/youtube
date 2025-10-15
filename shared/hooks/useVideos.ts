import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVideos } from '../../youtube/lib/api';
import { Video, ApiResponse, ApiError, FilterState, PaginationState, ApiFilterParams, PlatformType } from '../../youtube/lib/types';
import { mergeVideosWithoutDuplicates } from '../../youtube/utils/deduplication';

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Universal hook for fetching videos from any platform with proper pagination and deduplication
 * @param filters - Filter state including platform selection
 * @returns Hook return object with videos, loading state, and control functions
 */
export const useVideos = (filters: FilterState): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Use ref to store pagination state to avoid stale closures
  const paginationRef = useRef<PaginationState>({ limit: 200 });
  const filtersRef = useRef<FilterState>(filters);
  
  // Create a stable filter object for the useEffect dependency array
  const stableFilters = JSON.stringify(filters);

  // Reset pagination state when platform changes
  const resetPaginationState = useCallback((platform: PlatformType) => {
    const baseState: PaginationState = { limit: 200 };
    
    // Reset platform-specific pagination states
    switch (platform) {
      case 'youtube':
        paginationRef.current = { ...baseState, pageToken: undefined };
        break;
      case 'reddit':
        paginationRef.current = { ...baseState, after: undefined };
        break;
      case 'dailymotion':
        paginationRef.current = { ...baseState, page: 1 };
        break;
      case 'all':
      default:
        // For 'all' platform, use page-based pagination (most common)
        paginationRef.current = { ...baseState, page: 1 };
        break;
    }
    console.log(`[Unified useVideos] Reset pagination for ${platform}:`, paginationRef.current);
  }, []);

  // Function to fetch videos with pagination
  const fetchData = useCallback(async (isLoadMore: boolean = false) => {
    if (loading) {
      console.log('[Unified useVideos] Already loading, skipping request');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const currentFilters = filtersRef.current;
    const currentPagination = paginationRef.current;
    
    console.log('[Unified useVideos] Starting fetch:', { 
      isLoadMore, 
      currentPagination,
      platform: currentFilters.platform
    });

    try {
      const mergedParams: ApiFilterParams = {
        ...currentFilters,
        ...currentPagination
      };
      
      console.log('[Unified useVideos] API params:', mergedParams);
      const response = await fetchVideos(mergedParams);

      if (response.success) {
        const newVideos = response.data || [];
        console.log(`[Unified useVideos] Received ${newVideos.length} videos for platform: ${currentFilters.platform}`);
        
        if (newVideos.length === 0) {
          setHasMore(false);
          return;
        }
        
        setVideos(prev => {
          if (isLoadMore) {
            // Merge with existing videos and remove duplicates
            const merged = mergeVideosWithoutDuplicates(prev, newVideos);
            console.log('[Unified useVideos] Merged videos:', prev.length, '+', newVideos.length, '=', merged.length);
            return merged;
          } else {
            // Replace all videos (initial load or refresh)
            console.log('[Unified useVideos] Replacing videos:', newVideos.length);
            return newVideos;
          }
        });
        
        // Update pagination state with next page state if available
        if (response.meta?.nextPageState) {
          paginationRef.current = {
            ...paginationRef.current,
            ...response.meta.nextPageState
          };
          console.log('[Unified useVideos] Updated pagination state:', paginationRef.current);
        }
        
        const responseHasMore = response.meta?.hasMore ?? false;
        setHasMore(responseHasMore && newVideos.length > 0);
        console.log('[Unified useVideos] Has more:', responseHasMore, 'New videos:', newVideos.length);
      } else {
        throw new Error('API request was not successful.');
      }
    } catch (err) {
      console.error('[Unified useVideos] Error fetching data:', err);
      if (err instanceof ApiError) {
        setError(err);
      } else {
        const genericError = new ApiError(
          err instanceof Error ? err.message : 'An unknown error occurred.',
          undefined,
          'An unexpected error occurred.'
        );
        setError(genericError);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Effect to reset and fetch data when applied filters change
  useEffect(() => {
    console.log('[Unified useVideos] Filters changed, resetting state');
    // Update current filters
    filtersRef.current = filters;
    
    // Reset everything when filters change
    setVideos([]);
    setHasMore(true);
    setError(null);
    
    // Reset pagination state based on platform
    resetPaginationState(filters.platform);
    
    // Fetch initial data
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFilters]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      console.log(`[Unified useVideos] Loading more videos for platform: ${filtersRef.current.platform}`);
      fetchData(true);
    } else {
      console.log('[Unified useVideos] Cannot load more:', { loading, hasMore, platform: filtersRef.current.platform });
    }
  }, [loading, hasMore, fetchData]);

  const refresh = useCallback(() => {
    console.log(`[Unified useVideos] Refreshing videos for platform: ${filtersRef.current.platform}`);
    setVideos([]);
    setHasMore(true);
    setError(null);
    resetPaginationState(filtersRef.current.platform);
    fetchData(false);
  }, [fetchData, resetPaginationState]);

  return { 
    videos, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  };
};

export default useVideos;