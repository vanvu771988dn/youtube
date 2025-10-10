import React, { Suspense, useMemo } from 'react';
import Header from './Header';
import EnhancedFilterBar from './EnhancedFilterBar';
import { useEnhancedFilters } from '../hooks/useEnhancedFilters';
import { useVideos } from '../hooks/useVideos';
import ErrorBoundary from './errors/ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';

// Dynamically import the VideoGrid component for code splitting.
const VideoGrid = React.lazy(() => import('./VideoGrid'));

const EnhancedApp: React.FC = () => {
  // Use enhanced filters with configuration
  const filterOptions = useMemo(() => ({
    autoApply: false,        // Manual apply for better control
    validateOnChange: true,  // Real-time validation
    persistFilters: true,    // Remember user preferences
    storageKey: 'video-trending-filters'
  }), []);

  const {
    filters,
    appliedFilters,
    validationErrors,
    isApplying,
    onFilterChange,
    applyFilters,
    onClearFilters,
    onApplyPreset,
    batchFilterChanges,
    isFiltered,
    hasPendingChanges,
    hasBatchedChanges,
    isValid,
    getPlatformCapabilities,
    getFilterSummary,
    filterPresets,
  } = useEnhancedFilters(undefined, filterOptions);

  // Use videos hook with applied filters (not draft filters)
  const [showFilters, setShowFilters] = React.useState(true);
  const { videos, loading, error, hasMore, loadMore, refresh } = useVideos(appliedFilters);

  // Enhanced logging for debugging
  React.useEffect(() => {
    console.log('[EnhancedApp] Filter state changed:', {
      hasPendingChanges,
      hasBatchedChanges,
      isValid,
      validationErrors: validationErrors.length,
      appliedFiltersCount: getFilterSummary().count
    });
  }, [hasPendingChanges, hasBatchedChanges, isValid, validationErrors.length, getFilterSummary]);

  // Log when filters are actually applied and data is fetched
  React.useEffect(() => {
    console.log('[EnhancedApp] Applied filters changed, will trigger data fetch:', appliedFilters);
  }, [appliedFilters]);

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
        
        {/* Enhanced Filter System */}
        {showFilters && (
        <EnhancedFilterBar 
          filters={filters}
          appliedFilters={appliedFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          onApplyPreset={onApplyPreset}
          applyFilters={applyFilters}
          batchFilterChanges={batchFilterChanges}
          validationErrors={validationErrors}
          isApplying={isApplying}
          hasPendingChanges={hasPendingChanges}
          hasBatchedChanges={hasBatchedChanges}
          isValid={isValid}
          getPlatformCapabilities={getPlatformCapabilities}
          getFilterSummary={getFilterSummary}
          filterPresets={filterPresets}
        />
        )}
        
        {/* Filter Summary for Debugging (Remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-slate-800 rounded-lg text-sm">
            <h3 className="font-bold mb-2">Filter Debug Info:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>Has Pending: <span className={hasPendingChanges ? 'text-yellow-400' : 'text-gray-400'}>{hasPendingChanges ? 'Yes' : 'No'}</span></div>
              <div>Is Valid: <span className={isValid ? 'text-green-400' : 'text-red-400'}>{isValid ? 'Yes' : 'No'}</span></div>
              <div>Errors: <span className="text-red-400">{validationErrors.length}</span></div>
              <div>Active Filters: <span className="text-cyan-400">{getFilterSummary().count}</span></div>
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-400 font-medium">Validation Errors:</p>
                <ul className="text-red-300 text-xs list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.field}: {error.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
              mode={appliedFilters.mode}
              onSimilarChannel={(name) => {
                applyFilters({
                  ...(appliedFilters as any),
                  mode: 'channel',
                  sortBy: 'views',
                  keywords: name,
                  page: 1,
                  limit: 20,
                } as any);
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default EnhancedApp;