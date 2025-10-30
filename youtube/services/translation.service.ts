/**
 * Translation Service for Video Trending App
 * Translates keywords to target country language before making API calls
 */

interface TranslationResponse {
  text: string;
  from?: {
    language?: {
      iso: string;
    };
  };
}

// Country code to language code mapping
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  // Major countries with their primary languages
  'US': 'en', // United States -> English
  'CA': 'en', // Canada -> English
  'GB': 'en', // United Kingdom -> English
  'AU': 'en', // Australia -> English
  'NZ': 'en', // New Zealand -> English
  'IE': 'en', // Ireland -> English
  
  'JP': 'ja', // Japan -> Japanese
  'KR': 'ko', // South Korea -> Korean
  'CN': 'zh', // China -> Chinese
  'TW': 'zh', // Taiwan -> Chinese
  'HK': 'zh', // Hong Kong -> Chinese
  
  'FR': 'fr', // France -> French
  'BE': 'fr', // Belgium -> French (primary)
  'CH': 'fr', // Switzerland -> French (one of official languages)
  'LU': 'fr', // Luxembourg -> French
  
  'ES': 'es', // Spain -> Spanish
  'MX': 'es', // Mexico -> Spanish
  'AR': 'es', // Argentina -> Spanish
  'CO': 'es', // Colombia -> Spanish
  'PE': 'es', // Peru -> Spanish
  'VE': 'es', // Venezuela -> Spanish
  'CL': 'es', // Chile -> Spanish
  
  'DE': 'de', // Germany -> German
  'AT': 'de', // Austria -> German
  
  'IT': 'it', // Italy -> Italian
  
  'RU': 'ru', // Russia -> Russian
  'UA': 'ru', // Ukraine -> Russian (widely spoken)
  'BY': 'ru', // Belarus -> Russian
  'KZ': 'ru', // Kazakhstan -> Russian
  
  'BR': 'pt', // Brazil -> Portuguese
  'PT': 'pt', // Portugal -> Portuguese
  
  'NL': 'nl', // Netherlands -> Dutch
  
  'SE': 'sv', // Sweden -> Swedish
  'NO': 'no', // Norway -> Norwegian
  'DK': 'da', // Denmark -> Danish
  'FI': 'fi', // Finland -> Finnish
  
  'PL': 'pl', // Poland -> Polish
  'CZ': 'cs', // Czech Republic -> Czech
  'SK': 'sk', // Slovakia -> Slovak
  'HU': 'hu', // Hungary -> Hungarian
  
  'TR': 'tr', // Turkey -> Turkish
  'GR': 'el', // Greece -> Greek
  
  'IN': 'hi', // India -> Hindi
  'PK': 'ur', // Pakistan -> Urdu
  'BD': 'bn', // Bangladesh -> Bengali
  
  'TH': 'th', // Thailand -> Thai
  'VN': 'vi', // Vietnam -> Vietnamese
  'ID': 'id', // Indonesia -> Indonesian
  'MY': 'ms', // Malaysia -> Malay
  'PH': 'tl', // Philippines -> Filipino/Tagalog
  'SG': 'en', // Singapore -> English
  
  'SA': 'ar', // Saudi Arabia -> Arabic
  'AE': 'ar', // UAE -> Arabic
  'EG': 'ar', // Egypt -> Arabic
  'MA': 'ar', // Morocco -> Arabic
  
  'IL': 'he', // Israel -> Hebrew
  
  'ZA': 'en', // South Africa -> English
  'NG': 'en', // Nigeria -> English
  'KE': 'en', // Kenya -> English
  
  // Default fallback
  'ALL': 'en'
};

/**
 * Get language code for a country code
 * @param countryCode Country code (e.g., 'JP', 'KR', 'FR')
 * @returns Language code (e.g., 'ja', 'ko', 'fr') or 'en' as fallback
 */
export function getCountryLanguage(countryCode: string): string {
  return COUNTRY_LANGUAGE_MAP[countryCode?.toUpperCase()] || 'en';
}

/**
 * Translate keywords to country's language
 * @param keywords Keywords to translate
 * @param countryCode Country code (e.g., 'JP', 'KR')
 * @returns Translated keywords
 */
export async function translateKeywordsForCountry(keywords: string, countryCode: string): Promise<string> {
  if (!countryCode || countryCode === 'ALL') {
    return keywords; // No translation needed
  }
  
  const targetLanguage = getCountryLanguage(countryCode);
  if (targetLanguage === 'en') {
    return keywords; // No translation needed for English-speaking countries
  }
  
  return translationService.translateKeywords(keywords, targetLanguage);
}

class TranslationService {
  private cache: Map<string, string> = new Map();
  private readonly FREE_TRANSLATE_API = 'https://api.mymemory.translated.net/get';
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  /**
   * Translates text to target language using free translation service
   * @param text Text to translate
   * @param targetLanguage Target language code (e.g., 'en', 'ja', 'ko', 'fr')
   * @returns Promise<string> Translated text in target language
   */
  async translateToLanguage(text: string, targetLanguage: string = 'en'): Promise<string> {
    // Create cache key with target language
    const cacheKey = `${text}:${targetLanguage}`;
    
    // Return early if already cached
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log(`[Translation] Using cached translation: "${text}" -> "${cached}" (${targetLanguage})`);
      return cached;
    }

    // Don't translate if target language is English and text is likely already English
    if (targetLanguage === 'en' && this.isLikelyEnglish(text)) {
      this.cache.set(cacheKey, text);
      return text;
    }
    
    // Don't translate if target language is not English but text doesn't appear to be English
    if (targetLanguage !== 'en' && !this.isLikelyEnglish(text)) {
      console.log(`[Translation] Text doesn't appear to be English, skipping translation to ${targetLanguage}`);
      this.cache.set(cacheKey, text);
      return text;
    }

    try {
      // Rate limiting: ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`[Translation] Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      const encodedText = encodeURIComponent(text);
      const url = `${this.FREE_TRANSLATE_API}?q=${encodedText}&langpair=autodetect|${targetLanguage}`;
      
      console.log(`[Translation] Translating: "${text}" -> ${targetLanguage}`);
      
      this.lastRequestTime = Date.now();
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[Translation] API error: ${response.status}`);
        return text; // Return original text on API error
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText.trim();
        
        // Cache the translation
        this.cache.set(cacheKey, translated);
        
        console.log(`[Translation] Translated: "${text}" -> "${translated}" (${targetLanguage})`);
        return translated;
      } else {
        console.warn('[Translation] No translation returned, using original text');
        return text;
      }
    } catch (error) {
      console.error('[Translation] Error translating text:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Translates multiple keywords separated by delimiters to target language
   * @param keywords Keywords string (can contain ; , | separators)
   * @param targetLanguage Target language code (e.g., 'ja', 'ko', 'fr')
   * @returns Promise<string> Translated keywords joined with original separators
   */
  async translateKeywords(keywords: string, targetLanguage: string = 'en'): Promise<string> {
    if (!keywords || !keywords.trim()) {
      return keywords;
    }

    // Detect separators used in the original string
    const separators = [';', ',', '|'];
    let usedSeparator = ','; // default
    
    for (const sep of separators) {
      if (keywords.includes(sep)) {
        usedSeparator = sep;
        break;
      }
    }

    // Split keywords by common separators
    const keywordList = keywords
      .split(/[;,|]+/)
      .map(k => k.trim())
      .filter(Boolean);

    if (keywordList.length === 0) {
      return keywords;
    }

    // Translate each keyword
    const translatedKeywords: string[] = [];
    for (const keyword of keywordList) {
      const translated = await this.translateToLanguage(keyword, targetLanguage);
      translatedKeywords.push(translated);
    }

    const result = translatedKeywords.join(usedSeparator + ' ');
    console.log(`[Translation] Keywords translation: "${keywords}" -> "${result}" (${targetLanguage})`);
    return result;
  }

  /**
   * Simple heuristic to detect if text is likely already in English
   * @param text Text to check
   * @returns boolean True if likely English
   */
  private isLikelyEnglish(text: string): boolean {
    // Basic heuristic: check for common English words and characters
    const englishWords = [
      // Common articles, prepositions, and conjunctions
      'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
      // Question words
      'how', 'what', 'why', 'when', 'where', 'who', 'which',
      // Common verbs
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'get', 'got', 'make', 'made', 'take', 'took', 'go', 'went', 'come', 'came',
      // Common nouns
      'time', 'year', 'day', 'way', 'man', 'woman', 'people', 'person', 'world', 'life',
      // Common adjectives
      'good', 'bad', 'big', 'small', 'new', 'old', 'first', 'last', 'long', 'short',
      // Content-specific words
      'video', 'watch', 'youtube', 'channel', 'subscribe', 'like', 'comment', 'share',
      'tutorial', 'review', 'game', 'gaming', 'music', 'news', 'comedy', 'entertainment'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Check if contains multiple common English words (more reliable)
    const englishWordCount = englishWords.filter(word => 
      lowerText.includes(` ${word} `) || 
      lowerText.startsWith(`${word} `) || 
      lowerText.endsWith(` ${word}`) ||
      lowerText === word
    ).length;
    
    // Check if contains only Latin characters and common punctuation
    const hasOnlyLatinChars = /^[a-zA-Z0-9\s\-_.,!?'"()\[\]#@&]+$/.test(text);
    
    // Check for non-Latin scripts (strong indicator of non-English)
    const hasNonLatinScript = /[\u0080-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1100-\u11FF\u1200-\u137F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1A20-\u1AAF\u1B00-\u1B7F\u1B80-\u1BBF\u1BC0-\u1BFF\u1C00-\u1C4F\u1C50-\u1C7F\u1CC0-\u1CCF\u1CD0-\u1CFF\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u20D0-\u20FF\u2100-\u214F\u2150-\u218F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2400-\u243F\u2440-\u245F\u2460-\u24FF\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u27F0-\u27FF\u2800-\u28FF\u2900-\u297F\u2980-\u29FF\u2A00-\u2AFF\u2B00-\u2BFF\u2C00-\u2C5F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2DE0-\u2DFF\u2E00-\u2E7F\u2E80-\u2EFF\u2F00-\u2FDF\u2FF0-\u2FFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31A0-\u31BF\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA4D0-\uA4FF\uA500-\uA63F\uA640-\uA69F\uA6A0-\uA6FF\uA700-\uA71F\uA720-\uA7FF\uA800-\uA82F\uA830-\uA83F\uA840-\uA87F\uA880-\uA8DF\uA8E0-\uA8FF\uA900-\uA92F\uA930-\uA95F\uA960-\uA97F\uA980-\uA9DF\uA9E0-\uA9FF\uAA00-\uAA5F\uAA60-\uAA7F\uAA80-\uAADF\uAAE0-\uAAFF\uAB00-\uAB2F\uAB30-\uAB6F\uAB70-\uABBF\uABC0-\uABFF\uAC00-\uD7AF\uD7B0-\uD7FF\uD800-\uDB7F\uDB80-\uDBFF\uDC00-\uDFFF\uE000-\uF8FF\uF900-\uFAFF\uFB00-\uFB4F\uFB50-\uFDFF\uFE00-\uFE0F\uFE10-\uFE1F\uFE20-\uFE2F\uFE30-\uFE4F\uFE50-\uFE6F\uFE70-\uFEFF\uFF00-\uFFEF]/.test(text);
    
    // Definitely not English if contains non-Latin scripts
    if (hasNonLatinScript) {
      return false;
    }
    
    // Consider it English if:
    // 1. Has multiple English words (2+ for reliability), OR
    // 2. Has at least one English word AND only Latin characters for short text
    return englishWordCount >= 2 || (englishWordCount >= 1 && hasOnlyLatinChars && text.length < 30);
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[Translation] Cache cleared');
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const translationService = new TranslationService();
export default TranslationService;