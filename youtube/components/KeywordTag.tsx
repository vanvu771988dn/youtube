import React from 'react';
import { ParsedKeyword } from '../utils/keywordUtils';

interface KeywordTagProps {
  keyword: ParsedKeyword;
  onRemove?: (keywordId: string) => void;
  variant?: 'default' | 'filter' | 'suggestion';
  size?: 'sm' | 'md';
  className?: string;
}

const KeywordTag: React.FC<KeywordTagProps> = ({ 
  keyword, 
  onRemove, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors';
  
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5'
  };

  const variantClasses = {
    default: 'bg-cyan-100 text-cyan-800 border border-cyan-200 hover:bg-cyan-150',
    filter: 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600',
    suggestion: 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300 cursor-pointer'
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <span className={classes}>
      <span className="truncate max-w-[150px]" title={keyword.value}>
        {keyword.value}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(keyword.id);
          }}
          className="ml-1.5 -mr-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          aria-label={`Remove ${keyword.value} keyword`}
        >
          <svg 
            className="h-3 w-3" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default KeywordTag;