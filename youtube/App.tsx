import React, { Suspense } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import { useFilters } from './hooks/useFilters';
import { useTrends } from './hooks/useTrends';
import ErrorBoundary from './components/errors/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import YouTubeTest from './components/YouTubeTest';

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
  
  const { videos, loading, error, hasMore, loadMore, refresh } = useTrends(appliedFilters);

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* YouTube API Test Component - Remove this after testing */}
        <div className="mb-6">
          <YouTubeTest />
        </div>
        
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
            />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;