import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTrends } from '../lib/api';
import { Video, ApiResponse, ApiError, FilterState } from '../lib/types';

interface UseTrendsReturn {
  videos: Video[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

// Improved: Better state management and race condition prevention, adapted to new FilterState shape
export const useTrends = (filters: FilterState): UseTrendsReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  // Use useMemo for stable filter comparison
  const stableFilters = useMemo(() => ({
    mode: filters.mode,
    platform: filters.platform,
    keywords: filters.keywords,
    sortBy: filters.sortBy,
    country: filters.country,
    language: filters.language,
    uploadDate: filters.videoFilters.uploadDate,
    customDateStart: filters.videoFilters.customDate.start,
    customDateEnd: filters.videoFilters.customDate.end,
    viewCountMin: filters.videoFilters.viewCount.min,
    viewCountMax: filters.videoFilters.viewCount.max,
    duration: filters.videoFilters.duration.join(','),
    trending24h: filters.videoFilters.trending24h,
    subscriberCountMin: filters.channelFilters.subscriberCount.min,
    subscriberCountMax: filters.channelFilters.subscriberCount.max,
    videoCountMin: filters.channelFilters.videoCount.min,
    videoCountMax: filters.channelFilters.videoCount.max,
    avgLenMin: filters.channelFilters.avgVideoLength.min,
    avgLenMax: filters.channelFilters.avgVideoLength.max,
    channelAge: filters.channelFilters.channelAge,
    monetizationEnabled: filters.channelFilters.monetizationEnabled,
    monetizationAge: filters.channelFilters.monetizationAge,
  }), [
    filters.mode,
    filters.platform,
    filters.keywords,
    filters.sortBy,
    filters.country,
    filters.language,
    filters.videoFilters.uploadDate,
    filters.videoFilters.customDate.start,
    filters.videoFilters.customDate.end,
    filters.videoFilters.viewCount.min,
    filters.videoFilters.viewCount.max,
    filters.videoFilters.duration.join(','),
    filters.videoFilters.trending24h,
    filters.channelFilters.subscriberCount.min,
    filters.channelFilters.subscriberCount.max,
    filters.channelFilters.videoCount.min,
    filters.channelFilters.videoCount.max,
    filters.channelFilters.avgVideoLength.min,
    filters.channelFilters.avgVideoLength.max,
    filters.channelFilters.channelAge,
    filters.channelFilters.monetizationEnabled,
    filters.channelFilters.monetizationAge,
  ]);

  const fetchData = useCallback(async (currentPage: number, currentFilters: FilterState, isLoadMore: boolean) => {
    if (!isLoadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const response: ApiResponse = await fetchTrends({ 
        ...currentFilters, 
        page: currentPage, 
        limit: ((currentFilters as any).limit ?? 50) 
      } as any);
      
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
      
      // On error, prevent further loading attempts
      setHasMore(false);
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  // Effect to reset and fetch data when filters change
  useEffect(() => {
    setPage(1);
    setVideos([]);
    fetchData(1, filters, false);
  }, [stableFilters, fetchData, filters]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, filters, true);
    }
  }, [loading, loadingMore, hasMore, page, filters, fetchData]);

  const refresh = useCallback(() => {
    setPage(1);
    setVideos([]);
    fetchData(1, filters, false);
  }, [filters, fetchData]);

  return { 
    videos, 
    loading: loading || loadingMore,
    error, 
    hasMore, 
    loadMore, 
    refresh 
  };
};
