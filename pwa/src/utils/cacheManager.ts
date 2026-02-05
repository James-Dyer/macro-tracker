/**
 * cacheManager - Cache maintenance utilities
 *
 * Why: Prevents localStorage quota issues by cleaning up expired caches.
 * Provides centralized cache management across the app.
 */

import type { CacheEntry } from '../hooks/useCachedStorage';

/**
 * Clean up expired caches from localStorage
 *
 * Scans all localStorage keys for cache entries (keys starting with recognized prefixes)
 * and removes expired ones. This prevents localStorage quota issues.
 */
export function cleanupExpiredCaches(): void {
  try {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Scan all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Only check keys that look like cache keys (known prefixes)
      const isCacheKey =
        key.startsWith('goals-') ||
        key.startsWith('meals-') ||
        key.startsWith('signed-url-');

      if (!isCacheKey) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const entry = JSON.parse(item) as CacheEntry<unknown>;

        // Check if this looks like a valid cache entry
        if (
          typeof entry === 'object' &&
          entry !== null &&
          'timestamp' in entry &&
          'ttl' in entry
        ) {
          const age = now - entry.timestamp;
          if (age > entry.ttl) {
            keysToDelete.push(key);
          }
        }
      } catch {
        // Invalid JSON or structure - skip
        continue;
      }
    }

    // Delete expired caches
    keysToDelete.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors during cleanup
      }
    });

    if (keysToDelete.length > 0) {
      console.log(`[cacheManager] Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  } catch (error) {
    console.error('[cacheManager] Error during cache cleanup:', error);
  }
}

/**
 * Clear all caches for a specific user
 *
 * Useful when user signs out or switches accounts.
 * @param userId - User ID to clear caches for
 */
export function clearUserCaches(userId: string): void {
  try {
    const keysToDelete: string[] = [];

    // Scan all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Check if key contains user ID (our cache keys format: prefix-userId-...)
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }

    // Delete user caches
    keysToDelete.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors during cleanup
      }
    });

    if (keysToDelete.length > 0) {
      console.log(`[cacheManager] Cleared ${keysToDelete.length} cache entries for user ${userId}`);
    }
  } catch (error) {
    console.error('[cacheManager] Error clearing user caches:', error);
  }
}

/**
 * Get cache statistics (for debugging/UI display)
 *
 * Returns information about current cache usage.
 */
export function getCacheStats(): {
  totalCaches: number;
  expiredCaches: number;
  cacheSizeBytes: number;
} {
  try {
    const now = Date.now();
    let totalCaches = 0;
    let expiredCaches = 0;
    let cacheSizeBytes = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Only check keys that look like cache keys
      const isCacheKey =
        key.startsWith('goals-') ||
        key.startsWith('meals-') ||
        key.startsWith('signed-url-');

      if (!isCacheKey) continue;

      totalCaches++;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        // Add to size calculation (approximate bytes)
        cacheSizeBytes += item.length * 2; // UTF-16 strings are 2 bytes per char

        const entry = JSON.parse(item) as CacheEntry<unknown>;

        // Check if expired
        if (
          typeof entry === 'object' &&
          entry !== null &&
          'timestamp' in entry &&
          'ttl' in entry
        ) {
          const age = now - entry.timestamp;
          if (age > entry.ttl) {
            expiredCaches++;
          }
        }
      } catch {
        // Invalid JSON - skip
        continue;
      }
    }

    return {
      totalCaches,
      expiredCaches,
      cacheSizeBytes,
    };
  } catch (error) {
    console.error('[cacheManager] Error getting cache stats:', error);
    return {
      totalCaches: 0,
      expiredCaches: 0,
      cacheSizeBytes: 0,
    };
  }
}
