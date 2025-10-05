import React, { useState, useEffect, useMemo } from 'react';
import { FilterState } from '../lib/types';
import SearchBar from './SearchBar';
import { DURATION_OPTIONS, MAX_VIEWS, MAX_SUBSCRIBERS, MAX_VIDEO_COUNT, initialFilterState, filterPresets, COUNTRIES } from '../hooks/useFilters';
import { formatCount } from '../utils/formatters';
import { dequal } from 'dequal';

// --- PROPS INTERFACES ---

interface FilterBarProps {
  filters: FilterState;
  appliedFilters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  onApplyPreset: (preset: keyof typeof filterPresets) => void;
  applyFilters: () => void;
}

// --- REUSABLE SUB-COMPONENTS ---

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

// Updated dual-thumb range slider with unit steps of 1000
const RangeSlider: React.FC<{ 
  min: number; 
  max: number; 
  current: { min: number; max: number }; 
  onChange: (val: { min: number; max: number }) => void; 
  step?: number; 
  label: string;
  unit?: number; // Unit for snapping values
}> = ({ min, max, current, onChange, step = 1, label, unit = 1000 }) => {

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Math.min(Number(e.target.value), current.max);
        // Snap to nearest unit
        value = Math.round(value / unit) * unit;
        onChange({ min: value, max: current.max });
    };
    
    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Math.max(Number(e.target.value), current.min);
        // Snap to nearest unit
        value = Math.round(value / unit) * unit;
        onChange({ min: current.min, max: value });
    };
    
    const range = max - min;
    const minPos = range > 0 ? ((current.min - min) / range) * 100 : 0;
    const maxPos = range > 0 ? ((current.max - min) / range) * 100 : 100;

    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>{formatCount(current.min)}</span>
                <span>{formatCount(current.max)}</span>
            </div>
            <div className="relative h-2">
                <div className="absolute bg-slate-600 h-1 w-full rounded-full top-1/2 -translate-y-1/2"></div>
                <div className="absolute bg-cyan-500 h-1 rounded-full top-1/2 -translate-y-1/2" style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}></div>
                <input type="range" min={min} max={max} value={current.min} step={unit} onChange={handleMinChange} className="absolute w-full h-2 opacity-0 cursor-pointer" />
                <input type="range" min={min} max={max} value={current.max} step={unit} onChange={handleMaxChange} className="absolute w-full h-2 opacity-0 cursor-pointer" />
            </div>
        </div>
    );
};

// All filter controls
const FilterControls: React.FC<{ 
  filters: FilterState; 
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  commonSelectClasses: string;
}> = ({ filters, onFilterChange, commonSelectClasses }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {/* Basic Filters */}
        <div className="lg:col-span-4">
          <label className="block text-sm font-medium mb-1">Search</label>
          <SearchBar keywords={filters.keywords} onKeywordsChange={(value) => onFilterChange('keywords', value)} />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select value={filters.platform} onChange={(e) => onFilterChange('platform', e.target.value as FilterState['platform'])} className={commonSelectClasses}>
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <select value={filters.country} onChange={(e) => onFilterChange('country', e.target.value)} className={commonSelectClasses}>
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Upload Date</label>
          <select value={filters.uploadDate} onChange={(e) => onFilterChange('uploadDate', e.target.value as FilterState['uploadDate'])} className={commonSelectClasses}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last Week</option>
            <option value="30d">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select value={filters.sortBy} onChange={(e) => onFilterChange('sortBy', e.target.value as FilterState['sortBy'])} className={commonSelectClasses}>
            <option value="trending">Trending</option>
            <option value="views">Most Views</option>
            <option value="date">Newest</option>
          </select>
        </div>
        
        {/* YouTube Specific Filters */}
        <div>
          <label className="block text-sm font-medium mb-1">Monetization</label>
          <select value={filters.monetizationEnabled} onChange={(e) => onFilterChange('monetizationEnabled', e.target.value as FilterState['monetizationEnabled'])} className={commonSelectClasses}>
            <option value="all">All Channels</option>
            <option value="yes">Monetized Only</option>
            <option value="no">Not Monetized</option>
          </select>
        </div>
        
        <div className="pt-4 self-end">
            <ToggleSwitch checked={filters.trending24h} onChange={val => onFilterChange('trending24h', val)} label="Trending in last 24h"/>
        </div>
        
        {/* Range Filters with 1000 unit steps */}
        <div className="md:col-span-2">
            <RangeSlider 
              label="View Count" 
              min={0} 
              max={MAX_VIEWS} 
              step={1000} 
              unit={1000}
              current={filters.viewCount} 
              onChange={(val) => onFilterChange('viewCount', val)} 
            />
        </div>
        
        <div className="md:col-span-2">
            <RangeSlider 
              label="Subscriber Count" 
              min={0} 
              max={MAX_SUBSCRIBERS} 
              step={1000} 
              unit={1000}
              current={filters.subscriberCount} 
              onChange={(val) => onFilterChange('subscriberCount', val)} 
            />
        </div>
        
        <div className="md:col-span-2">
            <RangeSlider 
              label="Channel Video Count" 
              min={0} 
              max={MAX_VIDEO_COUNT} 
              step={10} 
              unit={10}
              current={filters.videoCount} 
              onChange={(val) => onFilterChange('videoCount', val)} 
            />
        </div>
        
        {/* Duration Filter */}
        <div className="lg:col-span-4">
          <label className="block text-sm font-medium mb-1">Video Duration</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DURATION_OPTIONS.map(opt => (
                <button type="button" key={opt.value} onClick={() => {
                    const newDurations = filters.duration.includes(opt.value) ? filters.duration.filter(d => d !== opt.value) : [...filters.duration, opt.value];
                    onFilterChange('duration', newDurations);
                }} className={`text-xs px-3 py-1.5 rounded-full transition ${filters.duration.includes(opt.value) ? 'bg-cyan-500 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}>
                    {opt.label}
                </button>
            ))}
          </div>
        </div>
    </div>
);

// --- MAIN FILTER BAR COMPONENT ---

const FilterBar: React.FC<FilterBarProps> = ({ filters, appliedFilters, onFilterChange, onClearFilters, onApplyPreset, applyFilters }) => {
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
        {/* Mobile Button and Sheet */}
        <div className="md:hidden sticky top-[60px] z-10 bg-slate-900/80 backdrop-blur-sm py-2 px-4 mb-4 border-b border-slate-700">
             <button type="button" onClick={() => setMobileSheetOpen(true)} className="w-full bg-slate-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-6.586L4.293 6.707A1 1 0 014 6V3z" clipRule="evenodd" /></svg>
                Filters {activeFilterCount > 0 && <span className="bg-cyan-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
                {hasPendingChanges && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-yellow-400"></span>}
            </button>
        </div>
        
        {isMobileSheetOpen && (
            <div className="fixed inset-0 bg-black/60 z-30 animate-fade-in" onClick={() => setMobileSheetOpen(false)}>
                <div onClick={e => e.stopPropagation()} className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-slate-800 rounded-t-2xl shadow-2xl overflow-y-auto" style={{ animation: 'slideInUp 0.3s ease-out' }}>
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Filters</h2>
                        <button type="button" onClick={() => setMobileSheetOpen(false)} className="p-1 text-2xl leading-none rounded-full hover:bg-slate-700 w-8 h-8 flex items-center justify-center">×</button>
                    </div>
                    <FilterControls 
                        filters={filters}
                        onFilterChange={onFilterChange}
                        commonSelectClasses={commonSelectClasses}
                    />
                     <div className="p-4 border-t border-slate-700 bg-slate-800 flex gap-2">
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
                        <option value="viral-shorts">Viral Shorts</option>
                        <option value="new-creators">New Creators</option>
                        <option value="deep-dives">Deep Dives</option>
                        <option value="monetized-channels">Monetized Channels</option>
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