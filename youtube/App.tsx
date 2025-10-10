import React, { Suspense } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import { useFilters } from './hooks/useFilters';
import { useTrends } from './hooks/useTrends';
import ErrorBoundary from './components/errors/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

const VideoGrid = React.lazy(() => import('./components/VideoGrid'));

const App: React.FC = () => {
  const { 
    filters, 
    appliedFilters, 
    onFilterChange, 
    onVideoFilterChange,
    onChannelFilterChange,
    onClearFilters, 
    onApplyPreset, 
    applyFilters 
  } = useFilters();
  
  const [showFilters, setShowFilters] = React.useState(true);
  
  const { videos, loading, error, hasMore, loadMore, refresh } = useTrends(appliedFilters);

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Filter Toggle */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold px-3 py-2 rounded"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        {showFilters && (
          <FilterBar 
          filters={filters}
          appliedFilters={appliedFilters}
          onFilterChange={onFilterChange}
          onVideoFilterChange={onVideoFilterChange}
          onChannelFilterChange={onChannelFilterChange}
          onClearFilters={onClearFilters}
          onApplyPreset={onApplyPreset}
          applyFilters={applyFilters}
        />
        )}
        
        <ErrorBoundary>
          <Suspense fallback={
            <div className="py-16">
              <LoadingSpinner />
            </div>
          }>
            <VideoGrid 
              videos={videos}
              loading={loading}
              error={error}
              hasMore={hasMore}
              loadMore={loadMore}
              refresh={refresh}
              mode={appliedFilters.mode}
            />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;