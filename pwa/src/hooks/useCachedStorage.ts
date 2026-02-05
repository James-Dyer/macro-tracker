import { useState, useEffect } from 'react';

/**
 * CacheEntry - Generic cache entry with TTL support
 * @template T - Type of the cached data
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * useCachedStorage - Generic caching hook with TTL support
 *
 * Why: Reduces redundant API calls by caching data with automatic expiration.
 * Handles multi-user scenarios by requiring explicit cache keys.
 *
 * Usage:
 *   const { cachedData, setCachedData, clearCache, isExpired } = useCachedStorage<DailyGoal>({
 *     key: `goals-${userId}`,
 *     ttl: 24 * 60 * 60 * 1000, // 24 hours
 *   });
 *
 * @param key - localStorage key (should include user_id for multi-account safety)
 * @param ttl - Time to live in milliseconds
 * @returns Cache management utilities
 */
export function useCachedStorage<T>(config: { key: string; ttl: number }) {
  const { key, ttl } = config;

  // Initialize state from cache (or null if expired/missing)
  const [cachedData, setCachedDataState] = useState<T | null>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return null;

      const entry = JSON.parse(item) as CacheEntry<T>;

      // Check if cache is expired
      const now = Date.now();
      const age = now - entry.timestamp;

      if (age > entry.ttl) {
        // Cache expired - delete and return null
        window.localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      // Corrupted cache - delete and return null
      console.error(`[useCachedStorage] Error reading cache key "${key}":`, error);
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore - localStorage might be unavailable
      }
      return null;
    }
  });

  // Set cached data with timestamp
  const setCachedData = (data: T | null) => {
    setCachedDataState(data);

    if (data === null) {
      // Clear cache
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error(`[useCachedStorage] Error clearing cache key "${key}":`, error);
      }
      return;
    }

    // Save to cache with timestamp
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      window.localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      // Handle quota exceeded or other localStorage errors
      console.error(`[useCachedStorage] Error setting cache key "${key}":`, error);

      // If quota exceeded, try to clear old caches
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[useCachedStorage] localStorage quota exceeded - attempting cleanup');
        // Note: cleanup is handled by cacheManager.ts
      }
    }
  };

  // Clear cache
  const clearCache = () => {
    setCachedData(null);
  };

  // Check if current cache is expired (for conditional refetching)
  const isExpired = (): boolean => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return true;

      const entry = JSON.parse(item) as CacheEntry<T>;
      const now = Date.now();
      const age = now - entry.timestamp;

      return age > entry.ttl;
    } catch {
      return true;
    }
  };

  // Sync state to localStorage on data change
  useEffect(() => {
    // State updates are handled by setCachedData, so this is a no-op
    // Keeping useEffect structure for consistency with other hooks
  }, [cachedData]);

  return {
    cachedData,
    setCachedData,
    clearCache,
    isExpired,
  };
}
