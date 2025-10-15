import React, { Suspense, useState, useMemo } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ActiveFiltersBadge from './components/ActiveFiltersBadge';
import FrontendSortBar, { FrontendSortOption } from './components/FrontendSortBar';
import ViralInsights from './components/ViralInsights';
import ApiDiagnostics from './components/ApiDiagnostics';
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
  
  const [showFilters, setShowFilters] = useState(true);
  const [showInsights, setShowInsights] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [frontendSort, setFrontendSort] = useState<FrontendSortOption>('none');
  
  const { videos, loading, error, hasMore, loadMore, refresh } = useTrends(appliedFilters);

  // Apply frontend sorting to videos
  const sortedVideos = useMemo(() => {
    if (frontendSort === 'none') return videos;
    
    const sorted = [...videos];
    switch (frontendSort) {
      case 'views':
        sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        break;
      case 'duration':
        sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
    }
    return sorted;
  }, [videos, frontendSort]);

  // Handle removing individual filters
  const handleRemoveFilter = (filterPath: string) => {
    if (filterPath === 'keywords') {
      onFilterChange('keywords', '');
    } else if (filterPath === 'keywordMatch') {
      onFilterChange('keywordMatch', 'OR');
    } else if (filterPath === 'mode') {
      onFilterChange('mode', 'video');
    } else if (filterPath === 'platform') {
      onFilterChange('platform', 'all');
    } else if (filterPath === 'sortBy') {
      onFilterChange('sortBy', 'trending');
    } else if (filterPath === 'excludeGaming') {
      onFilterChange('excludeGaming', false);
    } else if (filterPath.startsWith('videoFilters.')) {
      const key = filterPath.split('.')[1] as keyof typeof appliedFilters.videoFilters;
      if (key === 'uploadDate') onVideoFilterChange('uploadDate', 'all');
      else if (key === 'duration') onVideoFilterChange('duration', []);
      else if (key === 'trending24h') onVideoFilterChange('trending24h', false);
      else if (key === 'viewCount') onVideoFilterChange('viewCount', { min: 0, max: 20_000_000 });
    } else if (filterPath.startsWith('channelFilters.')) {
      const key = filterPath.split('.')[1] as keyof typeof appliedFilters.channelFilters;
      if (key === 'subscriberCount') onChannelFilterChange('subscriberCount', { min: 0, max: 10_000_000 });
      else if (key === 'videoCount') onChannelFilterChange('videoCount', { min: 0, max: 1_000_000 });
      else if (key === 'channelAge') onChannelFilterChange('channelAge', 'all');
      else if (key === 'monetizationEnabled') onChannelFilterChange('monetizationEnabled', 'all');
      else if (key === 'monetizationAge') onChannelFilterChange('monetizationAge', 'all');
    }
    applyFilters();
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Toggle Buttons */}
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowDiagnostics((v) => !v)}
            className={`text-sm font-semibold px-3 py-2 rounded transition ${
              showDiagnostics 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {showDiagnostics ? '🔍 Hide Diagnostics' : '🔍 API Test'}
          </button>
          <button
            type="button"
            onClick={() => setShowInsights((v) => !v)}
            className={`text-sm font-semibold px-3 py-2 rounded transition ${
              showInsights 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {showInsights ? '🔥 Hide Insights' : '🔥 Show Viral Insights'}
          </button>
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
        
        {/* API Diagnostics Panel */}
        {showDiagnostics && (
          <div className="mb-6">
            <ApiDiagnostics />
          </div>
        )}
        
        {/* Viral Insights Panel */}
        {showInsights && (
          <div className="mb-6">
            <ViralInsights 
              videos={sortedVideos}
              onHashtagClick={(hashtag) => {
                onFilterChange('keywords', hashtag);
                applyFilters();
              }}
            />
          </div>
        )}
        
        {/* Active Filters Badge */}
        <ActiveFiltersBadge
          filters={appliedFilters}
          onRemoveFilter={handleRemoveFilter}
          onKeywordsChange={(keywords) => {
            onFilterChange('keywords', keywords);
            applyFilters();
          }}
        />
        
        {/* Frontend Sort Bar */}
        <FrontendSortBar 
          currentSort={frontendSort}
          onSortChange={setFrontendSort}
        />
        
        <ErrorBoundary>
          <Suspense fallback={
            <div className="py-16">
              <LoadingSpinner />
            </div>
          }>
            <VideoGrid 
              videos={sortedVideos}
              loading={loading}
              error={error}
              hasMore={hasMore}
              loadMore={loadMore}
              refresh={refresh}
              mode={appliedFilters.mode}
              onSimilarChannel={(name) => {
                // Search by channel name
                onFilterChange('keywords', name);
                applyFilters();
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;