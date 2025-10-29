/**
 * Country utility functions for displaying country information
 */

// Common country codes and their display names
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'KR': 'South Korea',
  'AU': 'Australia',
  'BR': 'Brazil',
  'IN': 'India',
  'RU': 'Russia',
  'CN': 'China',
  'IT': 'Italy',
  'ES': 'Spain',
  'MX': 'Mexico',
  'NL': 'Netherlands',
  'PL': 'Poland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'TR': 'Turkey',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'SA': 'Saudi Arabia',
  'AE': 'UAE',
  'IL': 'Israel',
  'TH': 'Thailand',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'NZ': 'New Zealand',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'UY': 'Uruguay',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
};

/**
 * Gets the country flag emoji for a given country code
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Flag emoji string
 */
export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍'; // World emoji for unknown/invalid countries
  }

  // Convert country code to flag emoji using Unicode regional indicator symbols
  const code = countryCode.toUpperCase();
  const flagOffset = 0x1F1E6; // Unicode offset for regional indicator A
  const firstChar = code.charCodeAt(0) - 65 + flagOffset;
  const secondChar = code.charCodeAt(1) - 65 + flagOffset;
  
  try {
    return String.fromCodePoint(firstChar, secondChar);
  } catch {
    return '🌍'; // Fallback for invalid codes
  }
};

/**
 * Gets the country name for a given country code
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Country name or the code itself if not found
 */
export const getCountryName = (countryCode: string): string => {
  if (!countryCode) {
    return 'Unknown';
  }
  
  const code = countryCode.toUpperCase();
  return COUNTRY_NAMES[code] || code;
};

/**
 * Gets a formatted country display string with flag and name
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @param showName Whether to include the country name
 * @returns Formatted string like "🇺🇸 United States" or just "🇺🇸"
 */
export const getCountryDisplay = (countryCode: string, showName: boolean = true): string => {
  const flag = getCountryFlag(countryCode);
  if (!showName) {
    return flag;
  }
  
  const name = getCountryName(countryCode);
  return `${flag} ${name}`;
};

/**
 * Gets all available countries as options for dropdowns
 * @returns Array of country options with code, name, and flag
 */
export const getCountryOptions = (): Array<{ code: string; name: string; flag: string; display: string }> => {
  return Object.entries(COUNTRY_NAMES)
    .map(([code, name]) => ({
      code,
      name,
      flag: getCountryFlag(code),
      display: `${getCountryFlag(code)} ${name}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Validates if a country code is valid
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns True if the country code is valid
 */
export const isValidCountryCode = (countryCode: string): boolean => {
  if (!countryCode || countryCode.length !== 2) {
    return false;
  }
  
  const code = countryCode.toUpperCase();
  return COUNTRY_NAMES.hasOwnProperty(code);
};