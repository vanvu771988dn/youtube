import React from 'react';

export type FrontendSortOption = 'views' | 'date' | 'duration' | 'none';

interface FrontendSortBarProps {
  currentSort: FrontendSortOption;
  onSortChange: (sort: FrontendSortOption) => void;
}

const FrontendSortBar: React.FC<FrontendSortBarProps> = ({ currentSort, onSortChange }) => {
  const sortOptions: { value: FrontendSortOption; label: string; icon: string }[] = [
    { value: 'views', label: 'Most Views', icon: '👁️' },
    { value: 'date', label: 'Newest', icon: '📅' },
    { value: 'duration', label: 'Duration', icon: '⏱️' },
  ];

  return (
    <div className="mb-4 bg-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-300">Quick Sort:</span>
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortChange(currentSort === option.value ? 'none' : option.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentSort === option.value
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
            {currentSort === option.value && (
              <span className="text-xs">✓</span>
            )}
          </button>
        ))}
        {currentSort !== 'none' && (
          <button
            type="button"
            onClick={() => onSortChange('none')}
            className="ml-2 text-xs text-slate-400 hover:text-white underline"
          >
            Clear Sort
          </button>
        )}
      </div>
    </div>
  );
};

export default FrontendSortBar;
