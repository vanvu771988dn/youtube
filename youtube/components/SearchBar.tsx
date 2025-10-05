import React from 'react';

interface SearchBarProps {
  keywords: string;
  onKeywordsChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ keywords, onKeywordsChange, error, disabled = false }) => {
  const inputClasses = `w-full bg-slate-700 border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed ${
    error 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-slate-600 focus:border-cyan-500'
  }`;
  
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search by keyword or #tag..."
        value={keywords}
        onChange={(e) => !disabled && onKeywordsChange(e.target.value)}
        disabled={disabled}
        className={inputClasses}
        aria-label="Search trends"
        maxLength={500}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 ${
            error ? 'text-red-400' : 'text-slate-400'
          }`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
