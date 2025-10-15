/**
 * Utility functions for language and country selection in filters
 */

export interface LanguageOption {
  code: string; // BCP-47 language code
  label: string;
  nativeLabel?: string;
}

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2
  label: string;
  flag?: string;
}

/**
 * Most popular languages on YouTube
 * BCP-47 language codes
 */
export const POPULAR_LANGUAGES: LanguageOption[] = [
  { code: 'ALL', label: 'All Languages' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '简体中文' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', nativeLabel: '繁體中文' },
];

/**
 * Popular countries/regions for trending content
 * ISO 3166-1 alpha-2 codes
 */
export const POPULAR_COUNTRIES: CountryOption[] = [
  { code: 'ALL', label: 'All Countries', flag: '🌍' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'BR', label: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', label: 'Mexico', flag: '🇲🇽' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'JP', label: 'Japan', flag: '🇯🇵' },
  { code: 'KR', label: 'South Korea', flag: '🇰🇷' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: 'RU', label: 'Russia', flag: '🇷🇺' },
  { code: 'PL', label: 'Poland', flag: '🇵🇱' },
  { code: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'TR', label: 'Turkey', flag: '🇹🇷' },
  { code: 'ID', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'TH', label: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', label: 'Vietnam', flag: '🇻🇳' },
  { code: 'PH', label: 'Philippines', flag: '🇵🇭' },
  { code: 'MY', label: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', label: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', label: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'EG', label: 'Egypt', flag: '🇪🇬' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦' },
  { code: 'AR', label: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', label: 'Chile', flag: '🇨🇱' },
  { code: 'CO', label: 'Colombia', flag: '🇨🇴' },
];

/**
 * Gets language label from BCP-47 code
 * @param code - Language code (e.g., 'en', 'es', 'zh-TW')
 * @returns Language label or the code if not found
 */
export function getLanguageLabel(code: string): string {
  const language = POPULAR_LANGUAGES.find(lang => lang.code === code);
  return language?.label || code;
}

/**
 * Gets native language label from BCP-47 code
 * @param code - Language code
 * @returns Native language label or English label if not available
 */
export function getNativeLanguageLabel(code: string): string {
  const language = POPULAR_LANGUAGES.find(lang => lang.code === code);
  return language?.nativeLabel || language?.label || code;
}

/**
 * Gets country label from ISO 3166-1 alpha-2 code
 * @param code - Country code (e.g., 'US', 'GB')
 * @returns Country label or the code if not found
 */
export function getCountryLabel(code: string): string {
  const country = POPULAR_COUNTRIES.find(c => c.code === code);
  return country?.label || code;
}

/**
 * Gets country flag emoji from ISO 3166-1 alpha-2 code
 * @param code - Country code
 * @returns Flag emoji or globe emoji if not found
 */
export function getCountryFlag(code: string): string {
  const country = POPULAR_COUNTRIES.find(c => c.code === code);
  return country?.flag || '🌍';
}

/**
 * Formats language selection for display
 * Shows both English and native labels
 */
export function formatLanguageDisplay(code: string): string {
  const language = POPULAR_LANGUAGES.find(lang => lang.code === code);
  if (!language) return code;
  
  if (language.nativeLabel && language.nativeLabel !== language.label) {
    return `${language.label} (${language.nativeLabel})`;
  }
  return language.label;
}

/**
 * Formats country selection for display
 * Shows flag and country name
 */
export function formatCountryDisplay(code: string): string {
  const country = POPULAR_COUNTRIES.find(c => c.code === code);
  if (!country) return code;
  
  return `${country.flag} ${country.label}`;
}
