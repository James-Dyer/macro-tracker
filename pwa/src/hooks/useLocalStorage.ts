import { useState, useEffect } from 'react';

/**
 * useLocalStorage - Persist state to localStorage
 *
 * Usage:
 *   const [name, setName] = useLocalStorage('userName', 'Guest');
 *
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 * @returns [value, setValue] - same API as useState
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Initialize state from localStorage (or use initialValue)
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from localStorage
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 2. Sync to localStorage whenever value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // 3. Return same API as useState
  return [storedValue, setStoredValue] as const;
}
