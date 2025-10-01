import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Video, FilterState } from './lib/types';
import { useFilters } from './hooks/useFilters';
import { useDebounce } from './hooks/useDebounce';
import { fetchTrends } from './lib/api';
import { dequal } from 'dequal';

import Header from './components/Header';
import FilterBar from './components/FilterBar';
import VideoGrid from './components/VideoGrid';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const { filters, updateFilter, clearFilters, applyPreset } = useFilters();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const prevFiltersRef = useRef<FilterState | null>(null);
  
  const debouncedFilters = useDebounce(filters, 400);

  // Effect for handling NEW searches when filters change
  useEffect(() => {
    // Only trigger if the debounced filters have actually changed
    if (prevFiltersRef.current && dequal(debouncedFilters, prevFiltersRef.current)) {
      return;
    }
    prevFiltersRef.current = debouncedFilters;
    
    // Reset state for a new search
    setVideos([]);
    setPage(1);
    setHasMore(true);

    let active = true;
    const loadFirstPage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiFilters = { ...debouncedFilters, page: 1, limit: 20 };
        const response = await fetchTrends(apiFilters);
        if (active) {
          setVideos(response.data);
          setHasMore(response.meta.hasMore);
          setPage(2); // Set page for the *next* load
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadFirstPage();

    // Cleanup function to prevent setting state on unmounted component
    return () => { active = false; };
  }, [debouncedFilters]);

  // Callback for loading MORE results on scroll
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
      const apiFilters = { ...debouncedFilters, page, limit: 20 };
      const response = await fetchTrends(apiFilters);
      setVideos(prev => [...prev, ...response.data]);
      setHasMore(response.meta.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, debouncedFilters]);

  // Callback ref for the IntersectionObserver
  const lastVideoElementRef = useCallback((gridNode: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore) {
        loadMore();
      }
    }, { rootMargin: '400px' });
    
    // Observe the last element child of the grid container
    if (gridNode?.lastElementChild) {
      observer.current.observe(gridNode.lastElementChild);
    }
  }, [isLoading, hasMore, loadMore]);
  
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Header />
      <main className="container mx-auto p-4">
        <FilterBar 
          filters={filters} 
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          onApplyPreset={applyPreset}
        />
        
        {error && <div className="my-4"><ErrorMessage message={error} /></div>}

        <VideoGrid videos={videos} ref={lastVideoElementRef} />
        
        {isLoading && (
            <div className="h-20 flex items-center justify-center">
              <LoadingSpinner />
            </div>
        )}

        {!isLoading && !hasMore && videos.length > 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>You've reached the end of the trends.</p>
          </div>
        )}

        {!isLoading && videos.length === 0 && !error && (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-slate-400">No Trends Found</h2>
                <p className="text-slate-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;