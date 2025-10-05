import React from 'react';
import { useEnhancedFilters } from './hooks/useEnhancedFilters';
import { useVideos } from './hooks/useVideos';
import EnhancedFilterBar from './components/EnhancedFilterBar';
import VideoGrid from './components/VideoGrid';

/**
 * Enhanced Filter Demo Component
 * 
 * This component demonstrates the complete enhanced filtering system with:
 * - Filter validation and sanitization
 * - Batching to prevent excessive API calls
 * - Real-time filter state management
 * - Proper application of all filter conditions before data fetching
 * - 50M max values with 1K step increments for sliders
 */
const EnhancedFilterDemo: React.FC = () => {
  // Initialize enhanced filters with localStorage persistence
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
    hasPendingChanges,
    hasBatchedChanges,
    isValid,
    getPlatformCapabilities,
    getFilterSummary,
    filterPresets,
    initialFilterState,
  } = useEnhancedFilters(undefined, {
    persistFilters: true,
    validateOnChange: true,
    autoApply: false, // Manual application only via Apply button
    storageKey: 'enhanced-video-filters',
  });

  // Use the unified useVideos hook with applied filters
  const {
    videos,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    meta
  } = useVideos(appliedFilters);

  const handleRefresh = () => {
    console.log('[Demo] Refreshing data with current applied filters:', appliedFilters);
    refresh();
  };

  const filterSummary = getFilterSummary();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">
            Enhanced Filter System Demo
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <span>Applied Filters: {filterSummary.count}</span>
            <span>Pending Changes: {hasPendingChanges ? 'Yes' : 'No'}</span>
            <span>Valid State: {isValid ? '✓' : '✗'}</span>
            {validationErrors.length > 0 && (
              <span className="text-red-400">
                Validation Errors: {validationErrors.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Enhanced Filter Bar */}
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

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Draft Filters:</strong>
                <pre className="text-slate-300 overflow-x-auto">
                  {JSON.stringify(filters, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Applied Filters:</strong>
                <pre className="text-slate-300 overflow-x-auto">
                  {JSON.stringify(appliedFilters, null, 2)}
                </pre>
              </div>
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-2">
                <strong className="text-red-400">Validation Errors:</strong>
                <ul className="text-red-300 ml-4">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>• {err.field}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            {loading ? 'Loading...' : `${videos.length} Videos Found`}
            {meta && meta.total > 0 && (
              <span className="text-slate-400 text-sm ml-2">
                (Page {meta.page} of ~{Math.ceil(meta.total / meta.limit)})
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || !isValid}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-500 px-4 py-2 rounded-lg transition"
          >
            Refresh Data
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Error Loading Videos</span>
            </div>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Video Grid */}
        <VideoGrid
          videos={videos}
          loading={loading}
          hasMore={hasMore}
          loadMore={loadMore}
          error={error}
        />

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg transition"
            >
              Load More Videos
            </button>
          </div>
        )}

        {/* Filter Application Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">How Enhanced Filtering Works:</h3>
          <ul className="text-blue-200 space-y-1 text-sm">
            <li>• <strong>Adjust filters</strong> using the controls above (they are saved as "draft" filters)</li>
            <li>• <strong>Click "Apply Filters"</strong> to validate, sanitize, and wrap all conditions before fetching data</li>
            <li>• <strong>View/Subscriber sliders</strong> use 1,000-unit steps up to 50 million maximum</li>
            <li>• <strong>Platform-specific features</strong> are automatically enabled/disabled based on selection</li>
            <li>• <strong>Validation errors</strong> prevent invalid filter combinations from being applied</li>
            <li>• <strong>All filters</strong> are wrapped and applied together, then sent to the API for precise data fetching</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFilterDemo;