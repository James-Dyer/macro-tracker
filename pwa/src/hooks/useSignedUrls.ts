import { useRef, useEffect, useCallback } from 'react';
import { useCachedStorage } from './useCachedStorage';
import { supabase } from '../services/supabase';

/**
 * SignedUrlCache - Cache entry for signed URLs
 */
interface SignedUrlCache {
  [path: string]: {
    url: string;
    expiresAt: number;
  };
}

/**
 * useSignedUrls - Optimized signed URL generation with caching
 *
 * Why: Generating signed URLs for every meal on every render is expensive.
 * This hook caches URLs and only regenerates when they're about to expire.
 *
 * Cache Strategy:
 * - TTL: 50 minutes (URLs valid for 1 hour, refresh before expiry)
 * - Key format: signed-url-{userId}
 * - Pre-emptive refresh: Regenerate 10 minutes before expiry
 *
 * Implementation note: Uses useRef (not useState) for the in-memory cache.
 * useState caused a stale closure bug: parallel getSignedUrl calls all captured
 * the same stale cache value, so each overwrote the others via setUrlCache.
 * Only the last resolved promise survived, causing repeated refetches and a
 * re-render cascade (urlCache change → callbacks recreated → effects re-ran).
 * useRef reads current value at call time, making concurrent calls safe.
 *
 * Usage:
 *   const { getSignedUrl, getSignedUrls } = useSignedUrls();
 *   const url = await getSignedUrl('path/to/image.jpg');
 *   const urls = await getSignedUrls(['path1.jpg', 'path2.jpg']);
 */
export function useSignedUrls(userId?: string) {
  // Ref instead of state: no stale closures, no re-render cascade on cache updates
  const urlCacheRef = useRef<SignedUrlCache>({});

  // Persistent cache in localStorage
  const { cachedData, setCachedData } = useCachedStorage<SignedUrlCache>({
    key: userId ? `signed-url-${userId}` : 'signed-url-no-user',
    ttl: 50 * 60 * 1000, // 50 minutes
  });

  // Hydrate ref from localStorage on mount (one-time)
  useEffect(() => {
    if (cachedData) {
      urlCacheRef.current = cachedData;

      if (import.meta.env.DEV) {
        console.log('[useSignedUrls] Loaded URL cache:', Object.keys(cachedData).length, 'entries');
      }
    }
  }, [cachedData]);

  // Check if URL is still valid - reads ref directly, always current
  const isUrlValid = useCallback((path: string): boolean => {
    const cached = urlCacheRef.current[path];
    if (!cached) return false;
    // Consider expired if less than 10 minutes remaining
    return (cached.expiresAt - Date.now()) > 10 * 60 * 1000;
  }, []); // No deps: ref access is always current, no closure capture needed

  // Get single signed URL (from cache or generate new)
  const getSignedUrl = useCallback(async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;

    if (isUrlValid(path)) {
      if (import.meta.env.DEV) {
        console.log('[useSignedUrls] Cache hit:', path);
      }
      return urlCacheRef.current[path].url;
    }

    try {
      const { data, error } = await supabase.storage
        .from('meal-photos')
        .createSignedUrl(path, 3600); // 1 hour validity

      if (error || !data?.signedUrl) {
        console.warn('[useSignedUrls] Failed to generate signed URL:', error);
        return null;
      }

      // Mutate ref directly: concurrent calls each read the latest ref.current,
      // so parallel fetches accumulate correctly instead of overwriting each other.
      urlCacheRef.current = {
        ...urlCacheRef.current,
        [path]: {
          url: data.signedUrl,
          expiresAt: Date.now() + 3600 * 1000,
        },
      };
      setCachedData(urlCacheRef.current);

      if (import.meta.env.DEV) {
        console.log('[useSignedUrls] Generated and cached URL:', path);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[useSignedUrls] Error generating signed URL:', error);
      return null;
    }
  }, [isUrlValid, setCachedData]); // Stable: no urlCache state dep

  // Get multiple signed URLs (batch operation)
  const getSignedUrls = useCallback(async (paths: (string | null | undefined)[]): Promise<(string | null)[]> => {
    const results: (string | null)[] = new Array(paths.length).fill(null);
    const toGenerate: { path: string; index: number }[] = [];
    let cacheHitCount = 0;

    paths.forEach((path, index) => {
      if (!path) return;
      if (isUrlValid(path)) {
        results[index] = urlCacheRef.current[path].url;
        cacheHitCount++;
      } else {
        toGenerate.push({ path, index });
      }
    });

    if (import.meta.env.DEV) {
      console.log('[useSignedUrls] Batch request:', {
        total: paths.filter(Boolean).length,
        cacheHits: cacheHitCount,
        toGenerate: toGenerate.length,
      });
    }

    if (toGenerate.length > 0) {
      await Promise.all(
        toGenerate.map(async ({ path, index }) => {
          const url = await getSignedUrl(path);
          results[index] = url;
        })
      );
    }

    return results;
  }, [isUrlValid, getSignedUrl]); // Both stable now

  // Clear cache (useful for logout)
  const clearCache = useCallback(() => {
    urlCacheRef.current = {};
    setCachedData(null);

    if (import.meta.env.DEV) {
      console.log('[useSignedUrls] Cache cleared');
    }
  }, [setCachedData]);

  return {
    getSignedUrl,
    getSignedUrls,
    clearCache,
  };
}
