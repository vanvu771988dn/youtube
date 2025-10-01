import React from 'react';

interface SearchBarProps {
  keywords: string;
  onKeywordsChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ keywords, onKeywordsChange }) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search by keyword or #tag..."
        value={keywords}
        onChange={(e) => onKeywordsChange(e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        aria-label="Search trends"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
