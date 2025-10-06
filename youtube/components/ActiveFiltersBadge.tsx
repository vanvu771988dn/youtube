import React from 'react';
import { FilterState } from '../lib/types';
import { initialFilterState } from '../hooks/useFilters';
import { dequal } from 'dequal';

interface ActiveFiltersBadgeProps {
  filters: FilterState;
  onRemoveFilter: (filterPath: string) => void;
}

const ActiveFiltersBadge: React.FC<ActiveFiltersBadgeProps> = ({ filters, onRemoveFilter }) => {
  const activeFilters: Array<{ label: string; path: string }> = [];

  // Check mode
  if (filters.mode !== initialFilterState.mode) {
    activeFilters.push({
      label: `Mode: ${filters.mode === 'video' ? '🎬 Video' : '👤 Channel'}`,
      path: 'mode'
    });
  }

  // Check platform
  if (filters.platform !== 'all') {
    activeFilters.push({
      label: `Platform: ${filters.platform}`,
      path: 'platform'
    });
  }

  // Check search
  if (filters.keywords) {
    activeFilters.push({
      label: `Search: "${filters.keywords}"`,
      path: 'keywords'
    });
  }

  // Check sort
  if (filters.sortBy !== 'trending') {
    activeFilters.push({
      label: `Sort: ${filters.sortBy}`,
      path: 'sortBy'
    });
  }

  // Video mode filters
  if (filters.mode === 'video') {
    const vf = filters.videoFilters;
    
    if (vf.uploadDate !== 'all') {
      activeFilters.push({
        label: `Upload: ${vf.uploadDate}`,
        path: 'videoFilters.uploadDate'
      });
    }

    if (!dequal(vf.viewCount, initialFilterState.videoFilters.viewCount)) {
      activeFilters.push({
        label: `Views: ${vf.viewCount.min.toLocaleString()}-${vf.viewCount.max.toLocaleString()}`,
        path: 'videoFilters.viewCount'
      });
    }

    if (vf.duration.length > 0) {
      const labels = vf.duration.map(d => {
        if (d === 60) return '<1m';
        if (d === 300) return '1-5m';
        if (d === 1200) return '5-20m';
        return '>20m';
      });
      activeFilters.push({
        label: `Duration: ${labels.join(', ')}`,
        path: 'videoFilters.duration'
      });
    }

    if (vf.trending24h) {
      activeFilters.push({
        label: '🔥 Trending 24h',
        path: 'videoFilters.trending24h'
      });
    }
  } else {
    // Channel mode filters
    const cf = filters.channelFilters;

    if (!dequal(cf.subscriberCount, initialFilterState.channelFilters.subscriberCount)) {
      activeFilters.push({
        label: `Subs: ${cf.subscriberCount.min.toLocaleString()}-${cf.subscriberCount.max.toLocaleString()}`,
        path: 'channelFilters.subscriberCount'
      });
    }

    if (!dequal(cf.videoCount, initialFilterState.channelFilters.videoCount)) {
      activeFilters.push({
        label: `Videos: ${cf.videoCount.min}-${cf.videoCount.max}`,
        path: 'channelFilters.videoCount'
      });
    }

    if (cf.channelAge !== 'all') {
      activeFilters.push({
        label: `Channel Age: ${cf.channelAge}`,
        path: 'channelFilters.channelAge'
      });
    }

    if (cf.monetizationEnabled !== 'all') {
      activeFilters.push({
        label: `Monetization: ${cf.monetizationEnabled === 'yes' ? '✓' : '✗'}`,
        path: 'channelFilters.monetizationEnabled'
      });
    }

    if (cf.monetizationAge !== 'all') {
      activeFilters.push({
        label: `Monetized: ${cf.monetizationAge}`,
        path: 'channelFilters.monetizationAge'
      });
    }
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-400">Active Filters:</span>
        {activeFilters.map((filter, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30"
          >
            {filter.label}
            <button
              onClick={() => onRemoveFilter(filter.path)}
              className="ml-1 hover:text-white transition"
              title="Remove filter"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ActiveFiltersBadge;