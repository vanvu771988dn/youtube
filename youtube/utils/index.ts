/**
 * Centralized exports for all utility functions
 */

// Category utilities
export {
  getCategoryName,
  getCategoryIcon,
  getCategoryColor,
} from './categoryUtils';

// Locale utilities (language and country)
export {
  POPULAR_LANGUAGES,
  POPULAR_COUNTRIES,
  getLanguageLabel,
  getNativeLanguageLabel,
  getCountryLabel,
  getCountryFlag,
  formatLanguageDisplay,
  formatCountryDisplay,
} from './localeUtils';

export type {
  LanguageOption,
  CountryOption,
} from './localeUtils';

// Filter utilities (advanced metrics and calculations)
export {
  DURATION_PRESETS,
  ENGAGEMENT_TIERS,
  CHANNEL_SIZE_TIERS,
  calculateEngagementRate,
  calculateCommentRate,
  getEngagementTier,
  getChannelSizeTier,
  formatDuration,
  formatNumber,
  matchesDurationFilter,
  matchesEngagementTier,
  matchesChannelSizeTier,
  calculateFreshnessScore,
  calculateGrowthPotential,
  getTimeSinceUpload,
  countActiveFilters,
  getRecommendedPageSize,
} from './filterUtils';
