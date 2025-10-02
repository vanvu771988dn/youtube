import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a value.
 * This is useful for delaying a computation or API call until the user has stopped typing.
 *
 * @param value The value to be debounced. Can be of any type.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value, which updates only after the specified delay has passed
 *          without the original value changing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Set up a timer to update the debounced value after the delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Return a cleanup function to clear the timer.
      // This runs either on unmount or if `value` or `delay` changes.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-run the effect if value or delay changes
  );

  return debouncedValue;
}
