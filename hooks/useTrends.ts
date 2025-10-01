// FIX: Replaced placeholder content with the useTrends custom hook for data fetching.
import { useReducer, useCallback, useEffect } from 'react';
import { fetchTrends } from '../lib/api';
import { Video, ApiFilterParams, FilterState, ApiError } from '../lib/types';
import { useDebounce } from './useDebounce';
import { dequal } from 'dequal';

const PAGE_LIMIT = 20;

interface TrendsState {
  videos: Video[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
  hasMore: boolean;
  page: number;
}

type TrendsAction =
  | { type: 'FETCH_INIT' }
  | { type: 'FETCH_MORE' }
  | { type: 'FETCH_SUCCESS'; payload: { videos: Video[]; hasMore: boolean } }
  | { type: 'FETCH_MORE_SUCCESS'; payload: { videos: Video[]; hasMore: boolean } }
  | { type: 'FETCH_FAILURE'; payload: ApiError };

const trendsReducer = (state: TrendsState, action: TrendsAction): TrendsState => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        videos: [],
        isLoading: true,
        isLoadingMore: false,
        error: null,
        page: 1,
        hasMore: false,
      };
    case 'FETCH_MORE':
      return {
        ...state,
        isLoadingMore: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        videos: action.payload.videos,
        isLoading: false,
        hasMore: action.payload.hasMore,
        page: 2,
      };
    case 'FETCH_MORE_SUCCESS':
      // Prevent duplicate videos from being added
      const newVideos = action.payload.videos.filter(
        v => !state.videos.some(sv => sv.id === v.id)
      );
      return {
        ...state,
        videos: [...state.videos, ...newVideos],
        isLoadingMore: false,
        hasMore: action.payload.hasMore,
        page: state.page + 1,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
        error: action.payload,
      };
    default:
      throw new Error('Unhandled action type');
  }
};

const initialState: TrendsState = {
  videos: [],
  isLoading: true,
  isLoadingMore: false,
  error: null,
  hasMore: false,
  page: 1,
};

export const useTrends = (filters: FilterState) => {
  const [state, dispatch] = useReducer(trendsReducer, initialState);
  const debouncedFilters = useDebounce(filters, 500);

  const fetchInitial = useCallback(async (currentFilters: FilterState) => {
    dispatch({ type: 'FETCH_INIT' });
    try {
      const params: Partial<ApiFilterParams> = { ...currentFilters, page: 1, limit: PAGE_LIMIT };
      const response = await fetchTrends(params);
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: { videos: response.data, hasMore: response.meta.hasMore },
      });
    } catch (e) {
      dispatch({ type: 'FETCH_FAILURE', payload: e as ApiError });
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (!state.hasMore || state.isLoadingMore || state.isLoading) return;
    dispatch({ type: 'FETCH_MORE' });
    try {
      const params: Partial<ApiFilterParams> = { ...debouncedFilters, page: state.page, limit: PAGE_LIMIT };
      const response = await fetchTrends(params);
      dispatch({
        type: 'FETCH_MORE_SUCCESS',
        payload: { videos: response.data, hasMore: response.meta.hasMore },
      });
    } catch (e) {
      dispatch({ type: 'FETCH_FAILURE', payload: e as ApiError });
    }
  }, [state.page, state.hasMore, state.isLoading, state.isLoadingMore, debouncedFilters]);

  useEffect(() => {
    // Using dequal to prevent re-fetching if the debounced object reference changes but values are the same.
    const filtersChanged = !dequal(debouncedFilters, filters);
    fetchInitial(debouncedFilters);
  }, [debouncedFilters, fetchInitial]);

  return { ...state, fetchMore };
};
