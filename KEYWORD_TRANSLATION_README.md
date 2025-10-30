# Keyword Translation Feature

## Overview

The VideoTrending app now automatically translates English search keywords to the target country's native language when filtering by country. This improves search results by using localized keywords that are more commonly used in that specific country's YouTube content.

## How It Works

### When Translation Is Triggered

- **Automatic**: Translation is automatically applied when:
  1. A country filter is selected (not "All Countries")
  2. Keywords are entered in the search bar
  
- **Visual Indicator**: A translation hint appears below the search bar showing:
  ```
  🌍 English keywords will be translated to [TARGET_LANGUAGE] for better search results in [COUNTRY]
  ```

### Translation Process

1. **Country-Language Mapping**: The system maps each country to its primary language:
   - Japan (JP) → Japanese (ja)
   - South Korea (KR) → Korean (ko) 
   - France (FR) → French (fr)
   - Germany (DE) → German (de)
   - And many more...

2. **Language Detection**: The system checks if keywords are in English using:
   - Common English words detection
   - Character script analysis (Latin vs non-Latin characters)
   - Multiple heuristics for accuracy

3. **Translation Service**: Uses MyMemory Translation API (free service):
   - Translates English keywords to target country's language
   - Caches results to avoid repeated API calls
   - Rate limiting (1 second between requests)
   - Falls back to original keywords if translation fails

3. **Keyword Processing**: 
   - Handles multiple keywords separated by commas, semicolons, or pipes
   - Preserves original separators in translated output
   - Supports both OR and AND keyword matching logic

### Examples

**Country**: Japan (JP) → Target Language: Japanese
**Input**: `cooking, recipe, easy` (English)
**Output**: `料理, レシピ, 簡単` (Japanese)

**Country**: South Korea (KR) → Target Language: Korean
**Input**: `gaming, tutorial` (English)
**Output**: `게임, 튜토리얼` (Korean)

**Country**: France (FR) → Target Language: French
**Input**: `how to make; recipe` (English)
**Output**: `comment faire; recette` (French)

## Technical Implementation

### Files Modified

1. **`services/translation.service.ts`** - New translation service
2. **`lib/aggregator.ts`** - Integration with YouTube API calls
3. **`components/SearchBar.tsx`** - Visual translation indicator
4. **`components/FilterBar.tsx`** - Pass country context to SearchBar
5. **`components/EnhancedFilterBar.tsx`** - Same integration for enhanced version

### API Integration

- Translation happens before making YouTube API calls
- Both video search and channel search support translation
- Only triggered when country filter is applied (not "ALL")

### Performance Optimizations

- **Caching**: Translated keywords are cached to avoid repeated API calls
- **Rate Limiting**: Minimum 1-second interval between translation requests
- **Smart Detection**: Skips translation for text already detected as English
- **Error Handling**: Falls back to original keywords if translation fails

## Usage

1. **Select a Country**: Choose any country from the country dropdown (not "All Countries")
2. **Enter Keywords**: Type your search keywords in any language
3. **See Translation Hint**: Notice the translation indicator below the search bar
4. **Apply Filters**: The system will automatically translate keywords before searching
5. **View Results**: Get better, localized results for the selected country

## Error Handling

- **Network Issues**: Falls back to original keywords if translation service is unavailable
- **API Limits**: Implements rate limiting to respect free service constraints
- **Invalid Input**: Gracefully handles malformed or empty input
- **Language Detection Errors**: Conservative approach - translates when uncertain

## Benefits

- **Better Localized Results**: Native language keywords find more relevant content for specific countries
- **User-Friendly**: No need to manually translate English keywords to local languages
- **Country-Specific Content**: Helps find content that locals actually search for in their language
- **Automatic**: Works seamlessly without user intervention
- **Performance**: Caching prevents unnecessary repeated translations
- **Wide Language Support**: Supports 35+ languages across major countries

## Future Enhancements

- Support for additional translation services
- User preference to enable/disable translation
- Display both original and translated keywords
- Support for more sophisticated language detection
- Offline language detection capabilities