// Utility functions for handling multiple keywords in search

export interface ParsedKeyword {
  id: string;
  value: string;
  original: string;
}

/**
 * Parses a keyword string into individual terms
 * Supports separation by comma, semicolon, or pipe
 */
export const parseKeywords = (keywordsString: string): ParsedKeyword[] => {
  if (!keywordsString || typeof keywordsString !== 'string') {
    return [];
  }

  const terms = keywordsString
    .split(/[;,|]+/) // Split by semicolon, comma, or pipe
    .map(term => term.trim())
    .filter(term => term.length > 0 && term.length <= 100) // Filter out empty and overly long terms
    .slice(0, 10); // Limit to 10 keywords max

  return terms.map((term, index) => ({
    id: `keyword-${index}-${term.replace(/\s+/g, '-').toLowerCase()}`,
    value: term,
    original: term
  }));
};

/**
 * Converts parsed keywords back to a search string
 */
export const formatKeywords = (keywords: ParsedKeyword[]): string => {
  return keywords.map(k => k.value).join(', ');
};

/**
 * Adds a new keyword to existing parsed keywords
 */
export const addKeyword = (keywords: ParsedKeyword[], newKeyword: string): ParsedKeyword[] => {
  const trimmed = newKeyword.trim();
  if (!trimmed || trimmed.length > 100) return keywords;
  
  // Check for duplicates (case-insensitive)
  const exists = keywords.some(k => k.value.toLowerCase() === trimmed.toLowerCase());
  if (exists) return keywords;

  const newParsed: ParsedKeyword = {
    id: `keyword-${keywords.length}-${trimmed.replace(/\s+/g, '-').toLowerCase()}`,
    value: trimmed,
    original: trimmed
  };

  return [...keywords, newParsed].slice(0, 10); // Maintain 10 keyword limit
};

/**
 * Removes a keyword by id
 */
export const removeKeyword = (keywords: ParsedKeyword[], keywordId: string): ParsedKeyword[] => {
  return keywords.filter(k => k.id !== keywordId);
};

/**
 * Validates a keyword string and returns error message if invalid
 */
export const validateKeywords = (keywordsString: string): string | null => {
  if (!keywordsString) return null;
  
  if (keywordsString.length > 500) {
    return 'Search terms too long (max 500 characters)';
  }

  const terms = parseKeywords(keywordsString);
  if (terms.length === 0) {
    return 'Please enter at least one search term';
  }

  if (terms.length > 10) {
    return 'Too many search terms (max 10)';
  }

  const tooLong = terms.find(t => t.value.length > 100);
  if (tooLong) {
    return `Search term "${tooLong.value}" is too long (max 100 characters)`;
  }

  return null;
};

/**
 * Gets keyword suggestions based on current input
 */
export const getKeywordSuggestions = (currentInput: string, existingKeywords: ParsedKeyword[]): string[] => {
  const current = currentInput.toLowerCase().trim();
  if (!current) return [];

  // Basic suggestions - in a real app, these might come from an API
  const suggestions = [
    'tutorial', 'review', 'gaming', 'music', 'cooking', 'technology', 
    'travel', 'fitness', 'education', 'entertainment', 'news', 'sports'
  ];

  return suggestions
    .filter(s => s.includes(current) && !existingKeywords.some(k => k.value.toLowerCase().includes(s)))
    .slice(0, 5);
};

/**
 * Highlights keywords in text (useful for search result highlighting)
 */
export const highlightKeywords = (text: string, keywords: ParsedKeyword[]): string => {
  if (!text || keywords.length === 0) return text;

  let highlightedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });

  return highlightedText;
};

/**
 * Checks if keyword search should use AND logic (all keywords) or OR logic (any keyword)
 */
export const shouldUseAndLogic = (keywords: ParsedKeyword[]): boolean => {
  // Use AND logic for 2-3 keywords, OR logic for more keywords
  return keywords.length >= 2 && keywords.length <= 3;
};

/**
 * Generates search query variations for better API results
 */
export const generateSearchVariations = (keywords: ParsedKeyword[]): string[] => {
  if (keywords.length <= 1) {
    return keywords.map(k => k.value);
  }

  const variations = [];
  
  // Individual keywords
  variations.push(...keywords.map(k => k.value));
  
  // Combined variations (for 2-4 keywords)
  if (keywords.length <= 4) {
    // All keywords together
    variations.push(keywords.map(k => k.value).join(' '));
    
    // Pairs of keywords
    if (keywords.length >= 2) {
      for (let i = 0; i < keywords.length - 1; i++) {
        for (let j = i + 1; j < keywords.length; j++) {
          variations.push(`${keywords[i].value} ${keywords[j].value}`);
        }
      }
    }
  }

  return [...new Set(variations)]; // Remove duplicates
};