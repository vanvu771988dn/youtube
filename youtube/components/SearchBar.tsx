import React, { useState, useRef, useEffect } from 'react';
import { parseKeywords, formatKeywords, removeKeyword, validateKeywords, ParsedKeyword } from '../utils/keywordUtils';
import { getCountryLanguage } from '../services/translation.service';
import KeywordTag from './KeywordTag';

// Language code to language name mapping for UI display
const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
  'it': 'Italian',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'cs': 'Czech',
  'sk': 'Slovak',
  'hu': 'Hungarian',
  'tr': 'Turkish',
  'el': 'Greek',
  'hi': 'Hindi',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'ar': 'Arabic',
  'he': 'Hebrew'
};

interface SearchBarProps {
  keywords: string;
  onKeywordsChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  showKeywordTags?: boolean;
  showTranslationHint?: boolean;
  selectedCountry?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ keywords, onKeywordsChange, error, disabled = false, showKeywordTags = true, showTranslationHint = false, selectedCountry }) => {
  const [parsedKeywords, setParsedKeywords] = useState<ParsedKeyword[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update parsed keywords when keywords prop changes
  useEffect(() => {
    const parsed = parseKeywords(keywords);
    setParsedKeywords(parsed);
  }, [keywords]);

  const handleRemoveKeyword = (keywordId: string) => {
    if (disabled) return;
    const updatedKeywords = removeKeyword(parsedKeywords, keywordId);
    const newKeywordString = formatKeywords(updatedKeywords);
    onKeywordsChange(newKeywordString);
  };

  const validationError = validateKeywords(keywords);
  const displayError = error || validationError;

  const inputClasses = `w-full bg-slate-700 border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed ${
    displayError 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-slate-600 focus:border-cyan-500'
  }`;
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search with multiple keywords (separate with commas or semicolons)..."
          value={keywords}
          onChange={(e) => !disabled && onKeywordsChange(e.target.value)}
          onFocus={() => setShowHelp(true)}
          onBlur={() => setTimeout(() => setShowHelp(false), 150)}
          disabled={disabled}
          className={inputClasses}
          aria-label="Search trends with multiple keywords"
          maxLength={500}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${
              displayError ? 'text-red-400' : 'text-slate-400'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {keywords && !disabled && (
          <button
            type="button"
            onClick={() => onKeywordsChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-cyan-400 transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Keyword Tags */}
      {showKeywordTags && parsedKeywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {parsedKeywords.map((keyword) => (
            <KeywordTag
              key={keyword.id}
              keyword={keyword}
              onRemove={!disabled ? handleRemoveKeyword : undefined}
              variant="default"
              size="sm"
            />
          ))}
        </div>
      )}

      {/* Translation Hint */}
      {showTranslationHint && keywords && selectedCountry && selectedCountry !== 'ALL' && (() => {
        const targetLanguage = getCountryLanguage(selectedCountry);
        const targetLanguageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();
        
        // Only show hint if target language is not English
        if (targetLanguage === 'en') return null;
        
        return (
          <div className="mt-2 flex items-center gap-2 text-xs text-cyan-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>English keywords will be translated to {targetLanguageName} for better search results in {selectedCountry}</span>
          </div>
        );
      })()}

      {/* Help Text */}
      {showHelp && (
        <div className="absolute z-10 mt-1 p-3 bg-slate-800 border border-slate-600 rounded-md shadow-lg text-sm text-slate-300 max-w-md">
          <p className="mb-1"><strong>Multi-keyword search tips:</strong></p>
          <ul className="text-xs space-y-1 text-slate-400">
            <li>• Separate keywords with commas: <code className="text-cyan-400">gaming, tutorial</code></li>
            <li>• Use semicolons for phrases: <code className="text-cyan-400">how to cook; easy recipes</code></li>
            <li>• Mix single words and phrases: <code className="text-cyan-400">travel, "budget travel", tips</code></li>
            <li>• Maximum 10 keywords, 100 characters each</li>
          </ul>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="mt-1 text-sm text-red-400">
          {displayError}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
