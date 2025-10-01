// FIX: Replaced placeholder content with the main application component.
import React, { useRef, useCallback, useEffect } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import VideoGrid from './components/VideoGrid';
import { useFilters, initialFilterState } from './hooks/useFilters';
import { useTrends } from './hooks/useTrends';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { VideoCardSkeleton } from './components/VideoCard';

const App: React.FC = () => {
  const { filters, onFilterChange, onClearFilters, onApplyPreset } = useFilters(initialFilterState);
  const { videos, isLoading, isLoadingMore, error, hasMore, fetchMore } = useTrends(filters);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastVideoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, fetchMore]);

  // For accessibility and user feedback when filters change
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isLoading && gridRef.current) {
        // A slight delay to ensure content is painted before focus.
        setTimeout(() => gridRef.current?.focus(), 100);
    }
  }, [isLoading, filters]);


  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <FilterBar 
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          onApplyPreset={onApplyPreset}
        />

        <div ref={gridRef} tabIndex={-1} className="outline-none" aria-live="polite" aria-busy={isLoading || isLoadingMore}>
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => <VideoCardSkeleton key={i} />)}
            </div>
          )}

          {error && <ErrorMessage message={error.userMessage || 'Could not fetch trends. Please try again later.'} />}

          {!isLoading && !error && videos.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-slate-400">No videos found.</h2>
              <p className="text-slate-500 mt-2">Try adjusting your filters.</p>
            </div>
          )}

          <VideoGrid videos={videos} lastItemRef={lastVideoElementRef} />
          
          {isLoadingMore && (
             <div className="flex justify-center items-center py-10">
                <LoadingSpinner />
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
