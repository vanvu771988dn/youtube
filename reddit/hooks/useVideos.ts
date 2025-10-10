import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVideos } from '../../youtube/lib/api';
import { Video, ApiResponse, ApiError, FilterState, PaginationState, ApiFilterParams } from '../../youtube/lib/types';
import { mergeVideosWithoutDuplicates } from '../../youtube/utils/deduplication';

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export const useVideos = (filters: FilterState): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Use ref to store pagination state to avoid stale closures
  const paginationRef = useRef<PaginationState>({ limit: 50, after: undefined });
  const filtersRef = useRef<FilterState>({ ...filters, platform: 'reddit' });
  
  // Create a stable filter object for the useEffect dependency array
  const stableFilters = JSON.stringify(filters);

  // Reset pagination state for Reddit
  const resetPaginationState = useCallback(() => {
    paginationRef.current = { limit: 50, after: undefined };
  }, []);

  // Function to fetch videos with pagination
  const fetchData = useCallback(async (isLoadMore: boolean = false) => {
    if (loading) {
      console.log('[Reddit useVideos] Already loading, skipping request');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const currentFilters = { ...filtersRef.current, platform: 'reddit' as const };
    const currentPagination = paginationRef.current;
    
    console.log('[Reddit useVideos] Starting fetch:', { 
      isLoadMore, 
      currentPagination,
      platform: currentFilters.platform
    });

    try {
      const mergedParams: ApiFilterParams = {
        ...currentFilters,
        ...currentPagination
      };
      
      console.log('[Reddit useVideos] API params:', mergedParams);
      const response = await fetchVideos(mergedParams);

      if (response.success) {
        const newVideos = response.data || [];
        console.log('[Reddit useVideos] Received videos:', newVideos.length);
        
        if (newVideos.length === 0) {
          setHasMore(false);
          return;
        }
        
        setVideos(prev => {
          if (isLoadMore) {
            // Merge with existing videos and remove duplicates
            const merged = mergeVideosWithoutDuplicates(prev, newVideos);
            console.log('[Reddit useVideos] Merged videos:', prev.length, '+', newVideos.length, '=', merged.length);
            return merged;
          } else {
            // Replace all videos (initial load or refresh)
            console.log('[Reddit useVideos] Replacing videos:', newVideos.length);
            return newVideos;
          }
        });
        
        // Update pagination state with next after token
        if (response.meta?.nextPageState?.after) {
          paginationRef.current = {
            ...paginationRef.current,
            after: response.meta.nextPageState.after
          };
          console.log('[Reddit useVideos] Updated pagination state:', paginationRef.current);
        }
        
        const responseHasMore = response.meta?.hasMore ?? false;
        setHasMore(responseHasMore && newVideos.length > 0);
        console.log('[Reddit useVideos] Has more:', responseHasMore, 'New videos:', newVideos.length);
      } else {
        throw new Error('API request was not successful.');
      }
    } catch (err) {
      console.error('[Reddit useVideos] Error fetching data:', err);
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
    console.log('[Reddit useVideos] Filters changed, resetting state');
    // Update current filters, force Reddit platform
    filtersRef.current = { ...filters, platform: 'reddit' };
    
    // Reset everything when filters change
    setVideos([]);
    setHasMore(true);
    setError(null);
    
    // Reset pagination state
    resetPaginationState();
    
    // Fetch initial data
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFilters]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      console.log('[Reddit useVideos] Loading more videos...');
      fetchData(true);
    } else {
      console.log('[Reddit useVideos] Cannot load more:', { loading, hasMore });
    }
  }, [loading, hasMore, fetchData]);

  const refresh = useCallback(() => {
    console.log('[Reddit useVideos] Refreshing videos...');
    setVideos([]);
    setHasMore(true);
    setError(null);
    resetPaginationState();
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