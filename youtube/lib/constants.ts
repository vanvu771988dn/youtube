/**
 * Centralized constants for the application
 * All magic numbers and repeated values should be defined here
 */

// ============================================================================
// FILTER LIMITS
// ============================================================================

/** Maximum value for view count filter */
export const MAX_VIEWS = 50_000_000;

/** Maximum value for subscriber count filter */
export const MAX_SUBSCRIBERS = 50_000_000;

/** Maximum value for video count filter */
export const MAX_VIDEO_COUNT = 1_000_000;

/** Maximum value for average video length filter (2 hours in seconds) */
export const MAX_AVG_VIDEO_LENGTH = 7_200;

/** Default step size for range sliders - 1k units for counts */
export const FILTER_STEP = 1_000;

// ============================================================================
// DURATION BRACKETS (in seconds)
// ============================================================================

/** Duration bracket: less than 1 minute */
export const DURATION_SHORT = 60;

/** Duration bracket: 1-5 minutes */
export const DURATION_MEDIUM = 300;

/** Duration bracket: 5-20 minutes */
export const DURATION_LONG = 1_200;

/** Duration bracket: more than 20 minutes (represented as Infinity) */
export const DURATION_VERY_LONG = Infinity;

/**
 * Duration options for filter UI
 * Each option has a label for display and a value in seconds
 */
export const DURATION_OPTIONS = [
  { label: '< 1 min', value: DURATION_SHORT },
  { label: '1-5 min', value: DURATION_MEDIUM },
  { label: '5-20 min', value: DURATION_LONG },
  { label: '> 20 min', value: DURATION_VERY_LONG },
] as const;

// ============================================================================
// PAGINATION
// ============================================================================

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 50;

/** Page size when duration filter is active (fetch more to account for filtering) */
export const DURATION_FILTER_PAGE_SIZE = 100;

/** Page size when multiple restrictive filters are active */
export const MULTI_FILTER_PAGE_SIZE = 150;

/** Maximum number of API pages to fetch when filtering */
export const DEFAULT_SAFETY_PAGES = 10;

/** Maximum number of API pages to fetch when restrictive filters are active */
export const RESTRICTIVE_FILTER_SAFETY_PAGES = 30;

/** Maximum number of API pages to fetch when multiple restrictive filters are active */
export const MULTI_FILTER_SAFETY_PAGES = 50;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/** Base API timeout in milliseconds */
export const API_TIMEOUT = 10_000;

/** Maximum number of API retry attempts */
export const MAX_RETRIES = 3;

/** Base delay between retries in milliseconds */
export const RETRY_DELAY_MS = 1_000;

/** Cache timeout in milliseconds (5 minutes) */
export const CACHE_TIMEOUT_MS = 5 * 60 * 1_000;

/** Debounce delay for filter changes in milliseconds */
export const FILTER_DEBOUNCE_MS = 300;

// ============================================================================
// CHANNEL AGE OPTIONS
// ============================================================================

export const CHANNEL_AGE_OPTIONS = [
  { label: 'All', value: 'all' as const },
  { label: '6+ months', value: '6m' as const },
  { label: '1+ years', value: '1y' as const },
  { label: '2+ years', value: '2y' as const },
  { label: '5+ years', value: '5y' as const },
  { label: '10+ years', value: '10y' as const },
] as const;

/** Map channel age values to years */
export const CHANNEL_AGE_TO_YEARS: Record<string, number | null> = {
  'all': null,
  '6m': 0.5,
  '1y': 1,
  '2y': 2,
  '5y': 5,
  '10y': 10,
};

// ============================================================================
// COUNTRY OPTIONS
// ============================================================================

export const COUNTRY_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'Korea' },
  { code: 'VN', label: 'Vietnam' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
  { code: 'RU', label: 'Russia' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'TH', label: 'Thailand' },
  { code: 'PH', label: 'Philippines' },
] as const;

// ============================================================================
// YOUTUBE CATEGORIES
// ============================================================================

export const YOUTUBE_CATEGORIES = [
  { id: '0', label: 'All Categories' },
  { id: '1', label: 'Film & Animation' },
  { id: '2', label: 'Autos & Vehicles' },
  { id: '10', label: 'Music' },
  { id: '15', label: 'Pets & Animals' },
  { id: '17', label: 'Sports' },
  { id: '20', label: 'Gaming' },
  { id: '22', label: 'People & Blogs' },
  { id: '23', label: 'Comedy' },
  { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News & Politics' },
  { id: '26', label: 'Howto & Style' },
  { id: '27', label: 'Education' },
  { id: '28', label: 'Science & Technology' },
] as const;

// ============================================================================
// TIME INTERVALS
// ============================================================================

/** Time intervals in seconds for relative time calculations */
export const TIME_INTERVALS = {
  year: 31_536_000,
  month: 2_592_000,
  week: 604_800,
  day: 86_400,
  hour: 3_600,
  minute: 60,
  second: 1,
} as const;
