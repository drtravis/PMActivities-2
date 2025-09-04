import { useState, useEffect } from 'react';

/**
 * Custom hook that persists state to localStorage
 * @param key - localStorage key
 * @param defaultValue - default value if nothing in localStorage
 * @returns [state, setState] tuple like useState
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or default value
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Clear a specific localStorage key
 */
export function clearPersistentState(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }
}

/**
 * Clear all persistent state keys with a specific prefix
 */
export function clearPersistentStateByPrefix(prefix: string): void {
  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn(`Error clearing localStorage keys with prefix "${prefix}":`, error);
    }
  }
}
