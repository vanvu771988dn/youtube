import { useState, useEffect, useCallback } from 'react';
import { fetchTrends } from '../lib/api';
import { Video, ApiResponse, ApiError, FilterState } from '../lib/types';

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Custom hook to manage fetching and state for videos
 * This replaces the old useVideos hook and uses the correct API methods
 */
export const useVideos = (filters: FilterState): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  
  // Create a stable filter object for the useEffect dependency array
  const stableFilters = JSON.stringify(filters);

  const fetchData = useCallback(async (currentPage: number, currentFilters: FilterState, isLoadMore: boolean) => {
    // For the very first load, or a filter change, set loading to true
    if (!isLoadMore) {
      setLoading(true);
    }
    setError(null);

    try {
      const response: ApiResponse = await fetchTrends({ 
        ...currentFilters, 
        page: currentPage, 
        limit: 50 
      });
      
      if (response.success) {
        setVideos(prev => currentPage === 1 ? response.data : [...prev, ...response.data]);
        setHasMore(response.meta.hasMore);
      } else {
        throw new Error('API request was not successful.');
      }
    } catch (err) {
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
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      }
    }
  }, []);

  // Effect to reset and fetch data when applied filters change
  useEffect(() => {
    setPage(1);
    fetchData(1, filters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFilters, fetchData]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, filters, true);
    }
  };

  const refresh = () => {
    setPage(1);
    fetchData(1, filters, false);
  };

  return { videos, loading, error, hasMore, loadMore, refresh };
};