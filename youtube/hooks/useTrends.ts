import { useState, useEffect, useCallback } from 'react';
import { fetchVideos } from '../lib/api';
import { Video, ApiResponse, ApiError, FilterState, PaginationState } from '../lib/types';

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

// Custom hook to manage fetching and state for video search/discovery
export const useVideos = (filters: FilterState): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pageState, setPageState] = useState<PaginationState>({ limit: 20 });
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  
  // Create a stable filter object for the useEffect dependency array.
  // The fetch effect will now only re-run when these applied filters change.
  const stableFilters = JSON.stringify(filters);

  const fetchData = useCallback(async (currentPageState: PaginationState, currentFilters: FilterState, isLoadMore: boolean) => {
    // For the very first load, or a filter change, set loading to true.
    // For "load more", we don't want the main spinner, so we don't set loading state here.
    if (!isLoadMore) {
      setLoading(true);
    }
    setError(null);

    try {
      const response: ApiResponse = await fetchVideos(currentPageState);
      if (response.success) {
        setVideos(prev => {
          if (currentPage === 1) {
            return response.data;
          }
          
          // Create a Set of existing video unique keys (platform + id) for faster lookup
          const existingKeys = new Set(prev.map(video => `${video.platform}:${video.id}`));
          
          // Filter out any duplicates from the new data
          const newVideos = response.data.filter(video => !existingKeys.has(`${video.platform}:${video.id}`));
          
          return [...prev, ...newVideos];
        });
        setHasMore(response.meta.hasMore && response.data.length > 0);
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
    // Reset page and videos when filters change
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