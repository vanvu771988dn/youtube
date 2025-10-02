import React, { Suspense } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import { useFilters } from './hooks/useFilters';
import { useTrends } from './hooks/useTrends';
import ErrorBoundary from './components/errors/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Dynamically import the VideoGrid component for code splitting.
// This means its code won't be loaded until it's needed.
const VideoGrid = React.lazy(() => import('./components/VideoGrid'));

const App: React.FC = () => {
  const { filters, appliedFilters, onFilterChange, onClearFilters, onApplyPreset, applyFilters } = useFilters();
  const { videos, loading, error, hasMore, loadMore, refresh } = useTrends(appliedFilters);

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <FilterBar 
          filters={filters}
          appliedFilters={appliedFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          onApplyPreset={onApplyPreset}
          applyFilters={applyFilters}
        />
        <ErrorBoundary>
          {/* Suspense provides a fallback UI while the lazy component loads */}
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
            />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
