import React, { useState, useMemo, useRef, useCallback } from 'react';
import { FilterState, VideoFilters, ChannelFilters } from '../lib/types';
import SearchBar from './SearchBar';
import { 
  DURATION_OPTIONS, 
  MAX_VIEWS, 
  MAX_SUBSCRIBERS, 
  MAX_VIDEO_COUNT,
  CHANNEL_AGE_OPTIONS,
  COUNTRY_OPTIONS,
  YOUTUBE_CATEGORIES,
  FILTER_STEP,
} from '../lib/constants';
import { initialFilterState, filterPresets } from '../hooks/useFilters';
import { formatCount } from '../utils/formatters';
import { dequal } from 'dequal';

interface FilterBarProps {
  filters: FilterState;
  appliedFilters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onVideoFilterChange: <K extends keyof VideoFilters>(key: K, value: VideoFilters[K]) => void;
  onChannelFilterChange: <K extends keyof ChannelFilters>(key: K, value: ChannelFilters[K]) => void;
  onClearFilters: () => void;
  onApplyPreset: (preset: keyof typeof filterPresets) => void;
  applyFilters: () => void;
}

// Reusable Components
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center cursor-pointer">
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className={`block w-12 h-6 rounded-full transition ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
    </div>
    <div className="ml-3 text-sm font-medium">{label}</div>
  </label>
);

const RangeSlider: React.FC<{ 
  min: number; 
  max: number; 
  current: { min: number; max: number }; 
  onChange: (val: { min: number; max: number }) => void; 
  step?: number; 
  label: string; 
}> = ({ min, max, current, onChange, step = 1, label }) => {
  const clamp = (val: number, low: number, high: number) => Math.min(Math.max(val, low), high);
  const snap = (val: number) => (step > 0 ? Math.round(val / step) * step : val);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<null | 'min' | 'max'>(null);

  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [minDraft, setMinDraft] = useState<string>('');
  const [maxDraft, setMaxDraft] = useState<string>('');

  const range = max - min;
  const toPct = useCallback((v: number) => (range > 0 ? ((v - min) / range) * 100 : 0), [range, min]);
  const fromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    return min + pct * range;
  }, [min, range]);

  const minPos = toPct(current.min);
  const maxPos = toPct(current.max);

  const startEditMin = () => { setMinDraft(String(current.min)); setEditingMin(true); };
  const startEditMax = () => { setMaxDraft(String(current.max)); setEditingMax(true); };

  const commitMin = () => {
    const raw = Number(minDraft);
    if (!Number.isNaN(raw)) {
      const value = snap(clamp(raw, min, current.max));
      onChange({ min: value, max: current.max });
    }
    setEditingMin(false);
  };
  const commitMax = () => {
    const raw = Number(maxDraft);
    if (!Number.isNaN(raw)) {
      const value = snap(clamp(raw, current.min, max));
      onChange({ min: current.min, max: value });
    }
    setEditingMax(false);
  };

  const handleMinKey: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      const value = snap(clamp(current.min - step, min, current.max));
      onChange({ min: value, max: current.max });
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      const value = snap(clamp(current.min + step, min, current.max));
      onChange({ min: value, max: current.max });
      e.preventDefault();
    }
  };
  const handleMaxKey: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      const value = snap(clamp(current.max - step, current.min, max));
      onChange({ min: current.min, max: value });
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      const value = snap(clamp(current.max + step, current.min, max));
      onChange({ min: current.min, max: value });
      e.preventDefault();
    }
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const valueAtPointer = fromClientX(e.clientX);
    // choose nearest handle
    const distToMin = Math.abs(valueAtPointer - current.min);
    const distToMax = Math.abs(valueAtPointer - current.max);
    const handle: 'min' | 'max' = distToMin <= distToMax ? 'min' : 'max';
    setDragging(handle);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    if (handle === 'min') {
      const value = snap(clamp(valueAtPointer, min, current.max));
      onChange({ min: value, max: current.max });
    } else {
      const value = snap(clamp(valueAtPointer, current.min, max));
      onChange({ min: current.min, max: value });
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragging) return;
    const valueAtPointer = fromClientX(e.clientX);
    if (dragging === 'min') {
      const value = snap(clamp(valueAtPointer, min, current.max));
      onChange({ min: value, max: current.max });
    } else {
      const value = snap(clamp(valueAtPointer, current.min, max));
      onChange({ min: current.min, max: value });
    }
  };
  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    setDragging(null);
    try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>

      <div
        ref={containerRef}
        className="relative h-10 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-600 rounded-full"></div>
        {/* Active range */}
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-cyan-500 rounded-full" style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}></div>

        {/* Visible handles (keyboard accessible) */}
        <button
          type="button"
          aria-label={`${label} minimum`}
          onKeyDown={handleMinKey}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-cyan-600 shadow focus:outline-none focus:ring-2 focus:ring-cyan-500"
          style={{ left: `${minPos}%` }}
        />
        <button
          type="button"
          aria-label={`${label} maximum`}
          onKeyDown={handleMaxKey}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-cyan-600 shadow focus:outline-none focus:ring-2 focus:ring-cyan-500"
          style={{ left: `${maxPos}%` }}
        />

        {/* Value bubbles (click to edit) */}
        <div className="absolute -top-8 -translate-x-1/2" style={{ left: `${minPos}%` }}>
          {editingMin ? (
            <input
              autoFocus
              type="number"
              min={min}
              max={current.max}
              step={step}
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              onBlur={commitMin}
              onKeyDown={(e) => { if (e.key === 'Enter') commitMin(); if (e.key === 'Escape') setEditingMin(false); }}
              className="w-20 text-center bg-cyan-600 text-white rounded px-2 py-1 text-xs shadow focus:outline-none"
            />
          ) : (
            <button type="button" onClick={startEditMin} className="bg-cyan-600 text-white rounded px-2 py-1 text-xs shadow hover:bg-cyan-500">
              {formatCount(current.min)}
            </button>
          )}
        </div>
        <div className="absolute -top-8 -translate-x-1/2" style={{ left: `${maxPos}%` }}>
          {editingMax ? (
            <input
              autoFocus
              type="number"
              min={current.min}
              max={max}
              step={step}
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              onBlur={commitMax}
              onKeyDown={(e) => { if (e.key === 'Enter') commitMax(); if (e.key === 'Escape') setEditingMax(false); }}
              className="w-20 text-center bg-cyan-600 text-white rounded px-2 py-1 text-xs shadow focus:outline-none"
            />
          ) : (
            <button type="button" onClick={startEditMax} className="bg-cyan-600 text-white rounded px-2 py-1 text-xs shadow hover:bg-cyan-500">
              {formatCount(current.max)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Video Mode Filters
const VideoFiltersComponent: React.FC<{
  filters: VideoFilters;
  onFilterChange: <K extends keyof VideoFilters>(key: K, value: VideoFilters[K]) => void;
  commonSelectClasses: string;
}> = ({ filters, onFilterChange, commonSelectClasses }) => (
  <>
    <div>
      <label className="block text-sm font-medium mb-1">Upload Date</label>
      <select 
        value={filters.uploadDate} 
        onChange={(e) => onFilterChange('uploadDate', e.target.value as any)}
        className={commonSelectClasses}
      >
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last Week</option>
        <option value="30d">Last Month</option>
        <option value="3m">Last 3 Months</option>
        <option value="6m">Last 6 Months</option>
        <option value="1y">Last Year</option>
        <option value="custom">Custom Range</option>
      </select>
      {filters.uploadDate === 'custom' && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input type="date" value={filters.customDate.start || ''} onChange={(e)=>onFilterChange('customDate', { ...filters.customDate, start: e.target.value || null } as any)} className={commonSelectClasses} />
          <input type="date" value={filters.customDate.end || ''} onChange={(e)=>onFilterChange('customDate', { ...filters.customDate, end: e.target.value || null } as any)} className={commonSelectClasses} />
        </div>
      )}
    </div>

    <div className="pt-4 self-end">
      <ToggleSwitch 
        checked={filters.trending24h} 
        onChange={val => onFilterChange('trending24h', val)} 
        label="Trending in last 24h"
      />
    </div>

    <div className="md:col-span-2">
      <RangeSlider 
        label="View Count" 
        min={0} 
        max={MAX_VIEWS} 
        step={FILTER_STEP} 
        current={filters.viewCount} 
        onChange={(val) => onFilterChange('viewCount', val)} 
      />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1">Video Duration</label>
      <div className="flex flex-wrap gap-2 mt-2">
        {DURATION_OPTIONS.map(opt => (
          <button 
            type="button" 
            key={opt.value} 
            onClick={() => {
              const newDurations = filters.duration.includes(opt.value) 
                ? filters.duration.filter(d => d !== opt.value) 
                : [...filters.duration, opt.value];
              onFilterChange('duration', newDurations);
            }} 
            className={`text-xs px-3 py-1.5 rounded-full transition ${
              filters.duration.includes(opt.value) 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  </>
);

// Channel Mode Filters
const ChannelFiltersComponent: React.FC<{
  filters: ChannelFilters;
  onFilterChange: <K extends keyof ChannelFilters>(key: K, value: ChannelFilters[K]) => void;
  commonSelectClasses: string;
}> = ({ filters, onFilterChange, commonSelectClasses }) => (
  <>
    <div className="md:col-span-2">
      <RangeSlider 
        label="Subscriber Count" 
        min={0} 
        max={MAX_SUBSCRIBERS} 
        step={FILTER_STEP} 
        current={filters.subscriberCount} 
        onChange={(val) => onFilterChange('subscriberCount', val)} 
      />
    </div>

    <div className="md:col-span-2">
      <RangeSlider 
        label="Number of Videos" 
        min={0} 
        max={MAX_VIDEO_COUNT} 
        step={10} 
        current={filters.videoCount} 
        onChange={(val) => onFilterChange('videoCount', val)} 
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Channel Age</label>
      <select 
        value={filters.channelAge} 
        onChange={(e) => onFilterChange('channelAge', e.target.value as any)}
        className={commonSelectClasses}
      >
        {CHANNEL_AGE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Monetization</label>
      <select 
        value={filters.monetizationEnabled} 
        onChange={(e) => onFilterChange('monetizationEnabled', e.target.value as any)}
        className={commonSelectClasses}
      >
        <option value="all">All Channels</option>
        <option value="yes">Monetized Only</option>
        <option value="no">Non-Monetized Only</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Monetization Age</label>
      <select 
        value={filters.monetizationAge} 
        onChange={(e) => onFilterChange('monetizationAge', e.target.value as any)}
        className={commonSelectClasses}
      >
        {CHANNEL_AGE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.value === 'all' ? 'Any' : `${opt.label} monetized`}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Avg. Video Length</label>
      <div className="mt-4">
        <RangeSlider 
          label="" 
          min={0} 
          max={7200} 
          step={60} 
          current={filters.avgVideoLength} 
          onChange={(val) => onFilterChange('avgVideoLength', val)} 
        />
      </div>
    </div>

    {/* Channel Created Date Range */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1">Channel Created</label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <input 
          type="date" 
          placeholder="From"
          value={(filters as any).createdDate?.start || ''} 
          onChange={(e) => {
            const current = (filters as any).createdDate || { start: null, end: null };
            onFilterChange('createdDate' as any, { ...current, start: e.target.value || null });
          }}
          className={commonSelectClasses} 
        />
        <input 
          type="date" 
          placeholder="To"
          value={(filters as any).createdDate?.end || ''} 
          onChange={(e) => {
            const current = (filters as any).createdDate || { start: null, end: null };
            onFilterChange('createdDate' as any, { ...current, end: e.target.value || null });
          }}
          className={commonSelectClasses} 
        />
      </div>
    </div>
  </>
);

// Main Filter Controls
const FilterControls: React.FC<{ 
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onVideoFilterChange: <K extends keyof VideoFilters>(key: K, value: VideoFilters[K]) => void;
  onChannelFilterChange: <K extends keyof ChannelFilters>(key: K, value: ChannelFilters[K]) => void;
  commonSelectClasses: string;
}> = ({ filters, onFilterChange, onVideoFilterChange, onChannelFilterChange, commonSelectClasses }) => (
  <div className="space-y-4">

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {/* Common Filters */}
      <div className="lg:col-span-3">
        <label className="block text-sm font-medium mb-1">Search</label>
        <SearchBar 
          keywords={filters.keywords} 
          onKeywordsChange={(value) => onFilterChange('keywords', value)} 
        />
        <div className="text-xs text-slate-400 mt-1">Separate multiple keywords with semicolons (;) or commas (,)</div>
      </div>
      
      <div className="pt-4 self-end">
        <label className="block text-sm font-medium mb-2">Keyword Match</label>
        <div className="flex gap-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="keywordMatch"
              value="OR"
              checked={filters.keywordMatch === 'OR'}
              onChange={() => onFilterChange('keywordMatch', 'OR')}
              className="mr-2"
            />
            <span className="text-sm">OR (Any)</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="keywordMatch"
              value="AND"
              checked={filters.keywordMatch === 'AND'}
              onChange={() => onFilterChange('keywordMatch', 'AND')}
              className="mr-2"
            />
            <span className="text-sm">AND (All)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Platform</label>
        <select 
          value={filters.platform} 
          onChange={(e) => onFilterChange('platform', e.target.value as any)} 
          className={commonSelectClasses}
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="dailymotion">Dailymotion</option>
          <option value="reddit">Reddit</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Sort By</label>
        <select 
          value={filters.sortBy} 
          onChange={(e) => onFilterChange('sortBy', e.target.value as any)} 
          className={commonSelectClasses}
        >
          <option value="trending">Trending</option>
          <option value="views">Most Views</option>
          <option value="date">Newest</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Country</label>
        <select
          value={filters.country}
          onChange={(e) => onFilterChange('country', e.target.value as any)}
          className={commonSelectClasses}
        >
          <option value="ALL">All</option>
          {COUNTRY_OPTIONS.map(opt => (
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <select
          value={filters.language}
          onChange={(e) => onFilterChange('language', e.target.value as any)}
          className={commonSelectClasses}
        >
          <option value="ALL">All</option>
          <option value="en">English</option>
          <option value="vi">Vietnamese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ru">Russian</option>
          <option value="id">Indonesian</option>
        </select>
      </div>

      {/* YouTube Category */}
      <div>
        <label className="block text-sm font-medium mb-1">YouTube Category</label>
        <select
          value={filters.category || '0'}
          onChange={(e) => onFilterChange('category', e.target.value as any)}
          className={commonSelectClasses}
        >
          {YOUTUBE_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Exclude Gaming Checkbox */}
      <div className="pt-4 self-end">
        <ToggleSwitch
          checked={filters.excludeGaming}
          onChange={(val) => onFilterChange('excludeGaming', val)}
          label="Exclude Gaming"
        />
      </div>

      {/* Mode Toggle Tabs */}
      <div className="lg:col-span-4 col-span-2 border-t border-slate-700 pt-4 mt-2">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => onFilterChange('mode', 'video')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.mode === 'video'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🎬 Video Filters
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('mode', 'channel')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.mode === 'channel'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            👤 Channel Filters
          </button>
        </div>

        {/* Filter Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.mode === 'video' ? (
            <VideoFiltersComponent
              filters={filters.videoFilters}
              onFilterChange={onVideoFilterChange}
              commonSelectClasses={commonSelectClasses}
            />
          ) : (
            <ChannelFiltersComponent
              filters={filters.channelFilters}
              onFilterChange={onChannelFilterChange}
              commonSelectClasses={commonSelectClasses}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);

// Main Component
const FilterBar: React.FC<FilterBarProps> = ({ 
  filters, 
  appliedFilters, 
  onFilterChange, 
  onVideoFilterChange,
  onChannelFilterChange,
  onClearFilters, 
  onApplyPreset, 
  applyFilters 
}) => {
  const commonSelectClasses = "bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition w-full text-sm";
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    return Object.keys(appliedFilters).reduce((count, key) => {
      const filterKey = key as keyof FilterState;
      if (!dequal(appliedFilters[filterKey], initialFilterState[filterKey])) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [appliedFilters]);

  const hasPendingChanges = useMemo(() => !dequal(filters, appliedFilters), [filters, appliedFilters]);

  return (
    <>
      {/* Mobile Button */}
      <div className="md:hidden sticky top-[60px] z-10 bg-slate-900/80 backdrop-blur-sm py-2 px-4 mb-4 border-b border-slate-700">
        <button 
          type="button" 
          onClick={() => setMobileSheetOpen(true)} 
          className="w-full bg-slate-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-6.586L4.293 6.707A1 1 0 014 6V3z" clipRule="evenodd" />
          </svg>
          Filters {activeFilterCount > 0 && <span className="bg-cyan-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
          {hasPendingChanges && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-yellow-400"></span>}
        </button>
      </div>

      {/* Mobile Sheet */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 animate-fade-in" onClick={() => setMobileSheetOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-slate-800 rounded-t-2xl shadow-2xl overflow-y-auto" style={{ animation: 'slideInUp 0.3s ease-out' }}>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold">Filters</h2>
              <button type="button" onClick={() => setMobileSheetOpen(false)} className="p-1 text-2xl leading-none rounded-full hover:bg-slate-700 w-8 h-8 flex items-center justify-center">×</button>
            </div>
            <FilterControls 
              filters={filters}
              onFilterChange={onFilterChange}
              onVideoFilterChange={onVideoFilterChange}
              onChannelFilterChange={onChannelFilterChange}
              commonSelectClasses={commonSelectClasses}
            />
            <div className="p-4 border-t border-slate-700 bg-slate-800 flex gap-2 sticky bottom-0">
              <button type="button" onClick={onClearFilters} disabled={dequal(filters, initialFilterState)} className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500 disabled:cursor-not-allowed">Reset</button>
              <button type="button" onClick={() => { applyFilters(); setMobileSheetOpen(false); }} disabled={!hasPendingChanges} className="flex-1 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500 disabled:cursor-not-allowed transition">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filter Bar */}
      <div className="hidden md:block bg-slate-800/50 p-4 rounded-lg mb-6">
        <FilterControls 
          filters={filters}
          onFilterChange={onFilterChange}
          onVideoFilterChange={onVideoFilterChange}
          onChannelFilterChange={onChannelFilterChange}
          commonSelectClasses={commonSelectClasses}
        />
        <div className="px-4 pt-4 mt-2 border-t border-slate-700/50 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2 items-center">
            <label htmlFor="presets" className="text-sm font-medium">Presets:</label>
            <select 
              id="presets"
              value=""
              onChange={(e) => {
                const presetKey = e.target.value as keyof typeof filterPresets;
                if (presetKey && filterPresets[presetKey]) {
                  onApplyPreset(presetKey);
                }
              }}
              className="bg-slate-700 border-none rounded text-xs p-1"
            >
              <option value="" disabled>Select...</option>
              <option value="viral-videos">🔥 Viral Videos</option>
              <option value="deep-dives">📚 Deep Dives</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={onClearFilters} 
              disabled={dequal(filters, initialFilterState)}
              className="text-sm text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition"
            >
              Reset Filters
            </button>
            <button 
              type="button" 
              onClick={applyFilters} 
              disabled={!hasPendingChanges}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg disabled:bg-slate-500 disabled:cursor-not-allowed transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
};

export default FilterBar;