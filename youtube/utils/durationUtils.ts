/**
 * Utility functions for duration filtering and matching
 */

import {
  DURATION_SHORT,
  DURATION_MEDIUM,
  DURATION_LONG,
  DURATION_VERY_LONG,
} from '../lib/constants';

/**
 * Checks if a video duration matches a given duration bracket
 * 
 * @param videoDuration - The video duration in seconds
 * @param durationBracket - The bracket value to match against
 * @returns true if the video duration falls within the bracket
 * 
 * @example
 * ```ts
 * matchesDurationBracket(45, DURATION_SHORT)    // true (< 1 min)
 * matchesDurationBracket(180, DURATION_MEDIUM)  // true (1-5 min)
 * matchesDurationBracket(600, DURATION_LONG)    // true (5-20 min)
 * matchesDurationBracket(1500, DURATION_VERY_LONG) // true (> 20 min)
 * ```
 */
export function matchesDurationBracket(
  videoDuration: number,
  durationBracket: number
): boolean {
  switch (durationBracket) {
    case DURATION_SHORT:
      // Less than 1 minute
      return videoDuration < DURATION_SHORT;

    case DURATION_MEDIUM:
      // 1-5 minutes (inclusive upper bound)
      return videoDuration >= DURATION_SHORT && videoDuration <= DURATION_MEDIUM;

    case DURATION_LONG:
      // 5-20 minutes (inclusive upper bound)
      return videoDuration > DURATION_MEDIUM && videoDuration <= DURATION_LONG;

    case DURATION_VERY_LONG:
      // More than 20 minutes
      return videoDuration > DURATION_LONG;

    default:
      return false;
  }
}

/**
 * Checks if a video matches any of the selected duration brackets
 * 
 * @param videoDuration - The video duration in seconds
 * @param selectedBrackets - Array of duration bracket values to check against
 * @returns true if the video matches at least one bracket
 * 
 * @example
 * ```ts
 * matchesAnyDurationBracket(180, [DURATION_MEDIUM, DURATION_LONG]) // true
 * matchesAnyDurationBracket(30, [DURATION_MEDIUM, DURATION_LONG])  // false
 * ```
 */
export function matchesAnyDurationBracket(
  videoDuration: number,
  selectedBrackets: number[]
): boolean {
  if (selectedBrackets.length === 0) {
    return true; // No filter applied
  }

  return selectedBrackets.some(bracket => 
    matchesDurationBracket(videoDuration, bracket)
  );
}

/**
 * Gets a human-readable label for a duration bracket
 * 
 * @param durationBracket - The bracket value
 * @returns A formatted label string
 * 
 * @example
 * ```ts
 * getDurationBracketLabel(DURATION_SHORT)     // "< 1 min"
 * getDurationBracketLabel(DURATION_MEDIUM)    // "1-5 min"
 * getDurationBracketLabel(DURATION_LONG)      // "5-20 min"
 * getDurationBracketLabel(DURATION_VERY_LONG) // "> 20 min"
 * ```
 */
export function getDurationBracketLabel(durationBracket: number): string {
  switch (durationBracket) {
    case DURATION_SHORT:
      return '< 1 min';
    case DURATION_MEDIUM:
      return '1-5 min';
    case DURATION_LONG:
      return '5-20 min';
    case DURATION_VERY_LONG:
      return '> 20 min';
    default:
      return 'Unknown';
  }
}

/**
 * Validates if a value is a valid duration bracket
 * 
 * @param value - The value to check
 * @returns true if the value is a valid duration bracket
 */
export function isValidDurationBracket(value: number): boolean {
  return [
    DURATION_SHORT,
    DURATION_MEDIUM,
    DURATION_LONG,
    DURATION_VERY_LONG,
  ].includes(value);
}
