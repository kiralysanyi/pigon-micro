import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing an input value.
 * @param value The value of the input to debounce.
 * @param delay The delay in milliseconds for debouncing.
 * * @returns The debounced value.
 */
export const useDebounce = (value: any, delay: number): any => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function to cancel the timer if the component unmounts or dependencies change
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Re-run the effect whenever value or delay changes

    return debouncedValue;
};