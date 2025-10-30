import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterState } from '../lib/types';
import SearchBar from './SearchBar';
import { DURATION_OPTIONS, MAX_VIEWS, MAX_SUBSCRIBERS, FILTER_STEP, YOUTUBE_CATEGORIES } from '../lib/constants';
import { formatCount } from '../utils/formatters';

// --- PROPS INTERFACES ---

interface EnhancedFilterBarProps {
  filters: FilterState;
  appliedFilters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K], options?: { skipValidation?: boolean; immediate?: boolean }) => void;
  onClearFilters: (applyImmediately?: boolean) => void;
  onApplyPreset: (preset: string, applyImmediately?: boolean) => void;
  applyFilters: (customFilters?: FilterState) => void;
  batchFilterChanges: (changes: Partial<FilterState>) => void;
  validationErrors: Array<{ field: keyof FilterState; message: string }>;
  isApplying: boolean;
  hasPendingChanges: boolean;
  hasBatchedChanges: boolean;
  isValid: boolean;
  getPlatformCapabilities: (platform: FilterState['platform']) => {
    supportsSubscriberFilter: boolean;
    supportsChannelAge: boolean;
    supportsTrending24h: boolean;
    supportsDurationFilter: boolean;
    supportsViewCountFilter: boolean;
    supportsCustomDateRange: boolean;
  };
  getFilterSummary: () => {
    activeFilters: Partial<FilterState>;
    count: number;
    isEmpty: boolean;
  };
  filterPresets: Record<string, Partial<FilterState>>;
}

// --- REUSABLE SUB-COMPONENTS ---

// Enhanced Toggle Switch with validation states
const ToggleSwitch: React.FC<{ 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label: string;
  disabled?: boolean;
  error?: string;
}> = ({ checked, onChange, label, disabled = false, error }) => (
  <div className="space-y-1">
    <label className={`flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`block w-12 h-6 rounded-full transition ${
          error ? 'bg-red-500' : 
          checked ? 'bg-cyan-500' : 'bg-slate-600'
        }`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}></div>
      </div>
      <div className="ml-3 text-sm font-medium">{label}</div>
    </label>
    {error && <p className="text-red-400 text-xs ml-16">{error}</p>}
  </div>
);

// Enhanced Range Slider with validation
const RangeSlider: React.FC<{ 
  min: number; 
  max: number; 
  current: { min: number; max: number }; 
  onChange: (val: { min: number; max: number }) => void; 
  step?: number; 
  label: string;
  disabled?: boolean;
  error?: string;
}> = ({ min, max, current, onChange, step = 1, label, disabled = false, error }) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = Math.min(Number(e.target.value), current.max);
    onChange({ min: value, max: current.max });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = Math.max(Number(e.target.value), current.min);
    onChange({ min: current.min, max: value });
  };
  
  const range = max - min;
  const minPos = range > 0 ? ((current.min - min) / range) * 100 : 0;
  const maxPos = range > 0 ? ((current.max - min) / range) * 100 : 100;

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{formatCount(current.min)}</span>
        <span>{formatCount(current.max)}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute bg-slate-600 h-1 w-full rounded-full top-1/2 -translate-y-1/2"></div>
        <div 
          className={`absolute h-1 rounded-full top-1/2 -translate-y-1/2 ${
            error ? 'bg-red-500' : 'bg-cyan-500'
          }`}
          style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
        ></div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={current.min} 
          step={step} 
          onChange={handleMinChange} 
          disabled={disabled}
          className="absolute w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
        />
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={current.max} 
          step={step} 
          onChange={handleMaxChange} 
          disabled={disabled}
          className="absolute w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
};

// Filter Controls with Enhanced Validation
const FilterControls: React.FC<{ 
  filters: FilterState; 
  onFilterChange: EnhancedFilterBarProps['onFilterChange'];
  batchFilterChanges: EnhancedFilterBarProps['batchFilterChanges'];
  validationErrors: EnhancedFilterBarProps['validationErrors'];
  getPlatformCapabilities: EnhancedFilterBarProps['getPlatformCapabilities'];
  commonSelectClasses: string;
}> = ({ filters, onFilterChange, batchFilterChanges, validationErrors, getPlatformCapabilities, commonSelectClasses }) => {
  
  const capabilities = getPlatformCapabilities(filters.platform);
  
  const getFieldError = (field: keyof FilterState) => {
    const error = validationErrors.find(e => e.field === field);
    return error?.message;
  };

  const getErrorSelectClasses = (field: keyof FilterState) => {
    const error = getFieldError(field);
    return error ? 
      commonSelectClasses.replace('border-slate-600', 'border-red-500') + ' ring-red-500' : 
      commonSelectClasses;
  };

  // Batch platform change with related filter resets
  const handlePlatformChange = useCallback((platform: FilterState['platform']) => {
    const newCapabilities = getPlatformCapabilities(platform);
    const changes: Partial<FilterState> = { platform };
    
    // Reset unsupported filters
    if (!newCapabilities.supportsSubscriberFilter) {
      changes.subscriberCount = { min: 0, max: MAX_SUBSCRIBERS };
    }
    if (!newCapabilities.supportsChannelAge) {
      changes.channelAge = 'all';
    }
    if (!newCapabilities.supportsTrending24h) {
      changes.trending24h = false;
    }
    if (!newCapabilities.supportsCustomDateRange && filters.uploadDate === 'custom') {
      changes.uploadDate = 'all';
      changes.customDate = { start: null, end: null };
    }
    
    batchFilterChanges(changes);
  }, [batchFilterChanges, getPlatformCapabilities, filters.uploadDate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {/* Basic Filters */}
      <div className="lg:col-span-4 space-y-1">
        <label className="block text-sm font-medium mb-1">Search</label>
        <SearchBar 
          keywords={filters.keywords} 
          onKeywordsChange={(value) => onFilterChange('keywords', value)}
          error={getFieldError('keywords')}
          showTranslationHint={true}
          selectedCountry={filters.country}
        />
        {getFieldError('keywords') && (
          <p className="text-red-400 text-xs">{getFieldError('keywords')}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium mb-1">Platform</label>
        <select 
          value={filters.platform} 
          onChange={(e) => handlePlatformChange(e.target.value as FilterState['platform'])} 
          className={getErrorSelectClasses('platform')}
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="dailymotion">Dailymotion</option>
          <option value="reddit">Reddit</option>
        </select>
        {getFieldError('platform') && (
          <p className="text-red-400 text-xs">{getFieldError('platform')}</p>
        )}
      </div>

      {/* Channel Created Date Range */}
      <div className="space-y-1">
        <label className="block text-sm font-medium mb-1">Channel Created</label>
        {filters.mode === 'channel' && !((filters.keywords || '').trim()) && (
          <p className="text-xs text-yellow-400 mb-1">Enter a search query to enable channel creation date filter (API limitation).</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input 
            type="date" 
            value={(filters.channelFilters as any).createdDate?.start || ''} 
            onChange={(e)=> onFilterChange('channelFilters' as any, { ...filters.channelFilters, createdDate: { ...filters.channelFilters.createdDate, start: e.target.value || null } } as any)} 
            className={commonSelectClasses}
            disabled={filters.mode === 'channel' && !((filters.keywords || '').trim())}
          />
          <input 
            type="date" 
            value={(filters.channelFilters as any).createdDate?.end || ''} 
            onChange={(e)=> onFilterChange('channelFilters' as any, { ...filters.channelFilters, createdDate: { ...filters.channelFilters.createdDate, end: e.target.value || null } } as any)} 
            className={commonSelectClasses}
            disabled={filters.mode === 'channel' && !((filters.keywords || '').trim())}
          />
        </div>
      </div>

      <div className="lg:col-span-4 space-y-1">
        <label className="block text-sm font-medium mb-1">Upload Date</label>
        <select 
          value={filters.uploadDate} 
          onChange={(e) => onFilterChange('uploadDate', e.target.value as FilterState['uploadDate'])} 
          className={getErrorSelectClasses('uploadDate')}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last Week</option>
          <option value="30d">Last Month</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
          {capabilities.supportsCustomDateRange && (
            <option value="custom">Custom Range</option>
          )}
        </select>
        {getFieldError('uploadDate') && (
          <p className="text-red-400 text-xs">{getFieldError('uploadDate')}</p>
        )}
      </div>

      {/* Custom Date Range */}
      {filters.uploadDate === 'custom' && capabilities.supportsCustomDateRange && (
        <div className="lg:col-span-2 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.customDate.start || ''}
              onChange={(e) => onFilterChange('customDate', {
                ...filters.customDate,
                start: e.target.value || null
              })}
              className={getErrorSelectClasses('customDate')}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.customDate.end || ''}
              onChange={(e) => onFilterChange('customDate', {
                ...filters.customDate,
                end: e.target.value || null
              })}
              className={getErrorSelectClasses('customDate')}
            />
          </div>
          {getFieldError('customDate') && (
            <p className="text-red-400 text-xs col-span-2">{getFieldError('customDate')}</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium mb-1">Sort By</label>
        <select 
          value={filters.sortBy} 
          onChange={(e) => onFilterChange('sortBy', e.target.value as FilterState['sortBy'])} 
          className={getErrorSelectClasses('sortBy')}
        >
          <option value="trending">Trending</option>
          <option value="views">Most Views</option>
          <option value="date">Newest</option>
          {filters.mode === 'channel' && <option value="subscribers">Most Subscribers</option>}
        </select>
        {getFieldError('sortBy') && (
          <p className="text-red-400 text-xs">{getFieldError('sortBy')}</p>
        )}
      </div>

      {/* YouTube Category */}
      <div className="space-y-1">
        <label className="block text-sm font-medium mb-1">YouTube Category</label>
        <select 
          value={(filters as any).category || '0'} 
          onChange={(e) => onFilterChange('category' as any, e.target.value as any)} 
          className={commonSelectClasses}
        >
          {YOUTUBE_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="pt-4 self-end space-y-3">
        <ToggleSwitch 
          checked={filters.trending24h} 
          onChange={val => onFilterChange('trending24h', val)}
          label="Trending in last 24h"
          disabled={!capabilities.supportsTrending24h}
          error={getFieldError('trending24h')}
        />
        <ToggleSwitch 
          checked={filters.excludeGaming} 
          onChange={val => onFilterChange('excludeGaming', val)}
          label="Exclude Gaming"
          error={getFieldError('excludeGaming')}
        />
      </div>
      
      {/* Advanced Filters */}
      <div className="md:col-span-2">
        <RangeSlider 
          label="View Count" 
          min={0} 
          max={MAX_VIEWS} 
          step={FILTER_STEP} 
          current={filters.viewCount} 
          onChange={(val) => onFilterChange('viewCount', val)}
          disabled={!capabilities.supportsViewCountFilter}
          error={getFieldError('viewCount')}
        />
      </div>

      <div className="md:col-span-2">
        <RangeSlider 
          label="Subscriber Count" 
          min={0} 
          max={MAX_SUBSCRIBERS} 
          step={FILTER_STEP} 
          current={filters.subscriberCount} 
          onChange={(val) => onFilterChange('subscriberCount', val)}
          disabled={!capabilities.supportsSubscriberFilter}
          error={getFieldError('subscriberCount')}
        />
      </div>

      {capabilities.supportsChannelAge && (
        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Channel Age</label>
          <select 
            value={filters.channelAge} 
            onChange={(e) => onFilterChange('channelAge', e.target.value as FilterState['channelAge'])} 
            className={getErrorSelectClasses('channelAge')}
          >
            <option value="all">Any Age</option>
            <option value={1}>Less than 1 year</option>
            <option value={3}>Less than 3 years</option>
            <option value={5}>Less than 5 years</option>
          </select>
          {getFieldError('channelAge') && (
            <p className="text-red-400 text-xs">{getFieldError('channelAge')}</p>
          )}
        </div>
      )}

      <div className="lg:col-span-4 space-y-1">
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
              disabled={!capabilities.supportsDurationFilter}
              className={`text-xs px-3 py-1.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${
                filters.duration.includes(opt.value) 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {getFieldError('duration') && (
          <p className="text-red-400 text-xs">{getFieldError('duration')}</p>
        )}
      </div>
    </div>
  );
};

// --- MAIN ENHANCED FILTER BAR COMPONENT ---

const EnhancedFilterBar: React.FC<EnhancedFilterBarProps> = ({ 
  filters, 
  appliedFilters, 
  onFilterChange, 
  onClearFilters, 
  onApplyPreset, 
  applyFilters,
  batchFilterChanges,
  validationErrors,
  isApplying,
  hasPendingChanges,
  hasBatchedChanges,
  isValid,
  getPlatformCapabilities,
  getFilterSummary,
  filterPresets
}) => {
  const commonSelectClasses = "bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition w-full text-sm";
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);

  const filterSummary = getFilterSummary();
  
  // Enhanced apply button state
  const canApply = hasPendingChanges && isValid && !isApplying;
  const showValidationIndicator = validationErrors.length > 0;
  
  const handleApplyFilters = useCallback(() => {
    if (canApply) {
      console.log('[Enhanced FilterBar] Applying all filter conditions:', filters);
      applyFilters();
      setMobileSheetOpen(false);
    }
  }, [canApply, applyFilters, filters]);

  const handleClearFilters = useCallback((applyImmediately = false) => {
    console.log('[Enhanced FilterBar] Clearing all filters');
    onClearFilters(applyImmediately);
  }, [onClearFilters]);

  const handlePresetApplication = useCallback((presetKey: string) => {
    console.log('[Enhanced FilterBar] Applying preset:', presetKey);
    onApplyPreset(presetKey, false); // Don't auto-apply, let user click Apply
  }, [onApplyPreset]);

  return (
    <>
      {/* Mobile Button and Sheet */}
      <div className="md:hidden sticky top-[60px] z-10 bg-slate-900/80 backdrop-blur-sm py-2 px-4 mb-4 border-b border-slate-700">
        <button 
          type="button" 
          onClick={() => setMobileSheetOpen(true)} 
          className="w-full bg-slate-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-6.586L4.293 6.707A1 1 0 014 6V3z" clipRule="evenodd" />
          </svg>
          Filters 
          {filterSummary.count > 0 && (
            <span className="bg-cyan-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {filterSummary.count}
            </span>
          )}
          {hasPendingChanges && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-yellow-400"></span>
          )}
          {showValidationIndicator && (
            <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-red-400"></span>
          )}
        </button>
      </div>

      {isMobileSheetOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 animate-fade-in" onClick={() => setMobileSheetOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-slate-800 rounded-t-2xl shadow-2xl overflow-y-auto" style={{ animation: 'slideInUp 0.3s ease-out' }}>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Filters</h2>
                {showValidationIndicator && (
                  <p className="text-red-400 text-sm">{validationErrors.length} validation error(s)</p>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setMobileSheetOpen(false)} 
                className="p-1 text-2xl leading-none rounded-full hover:bg-slate-700 w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <FilterControls 
              filters={filters}
              onFilterChange={onFilterChange}
              batchFilterChanges={batchFilterChanges}
              validationErrors={validationErrors}
              getPlatformCapabilities={getPlatformCapabilities}
              commonSelectClasses={commonSelectClasses}
            />
            
            <div className="p-4 border-t border-slate-700 bg-slate-800 flex gap-2">
              <button 
                type="button" 
                onClick={() => handleClearFilters(true)} 
                disabled={filterSummary.isEmpty}
                className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500 disabled:cursor-not-allowed transition"
              >
                Clear & Apply
              </button>
              <button 
                type="button" 
                onClick={handleApplyFilters}
                disabled={!canApply}
                className={`flex-1 font-bold py-2 px-4 rounded-lg transition ${
                  canApply 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                    : 'bg-slate-500 cursor-not-allowed text-slate-300'
                }`}
              >
                {isApplying ? 'Applying...' : `Apply Filters${hasPendingChanges ? ` (${filterSummary.count})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Filter Bar */}
      <div className="hidden md:block bg-slate-800/50 p-4 rounded-lg mb-6">
        <FilterControls 
          filters={filters}
          onFilterChange={onFilterChange}
          batchFilterChanges={batchFilterChanges}
          validationErrors={validationErrors}
          getPlatformCapabilities={getPlatformCapabilities}
          commonSelectClasses={commonSelectClasses}
        />
        
        <div className="px-4 pt-4 mt-2 border-t border-slate-700/50 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <label htmlFor="presets" className="text-sm font-medium">Presets:</label>
              <select 
                id="presets"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handlePresetApplication(e.target.value);
                  }
                }}
                className="bg-slate-700 border-none rounded text-xs p-1"
              >
                <option value="" disabled>Select...</option>
                {Object.keys(filterPresets).map(key => (
                  <option key={key} value={key}>
                    {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            
            {showValidationIndicator && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.length} error(s)
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => handleClearFilters(true)} 
              disabled={filterSummary.isEmpty}
              className="text-sm text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition"
            >
              Clear & Apply
            </button>
            
            <button 
              type="button" 
              onClick={handleApplyFilters}
              disabled={!canApply}
              className={`font-bold py-2 px-6 rounded-lg transition ${
                canApply 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                  : 'bg-slate-500 cursor-not-allowed text-slate-300'
              }`}
            >
              {isApplying ? 'Applying...' : hasPendingChanges ? 'Apply Changes' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default EnhancedFilterBar;