import { useState, useEffect, useCallback } from 'react';
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
 * Performance Impact:
 * - Eliminates redundant Storage API calls
 * - Batch URL generation for multiple paths
 * - Instant URL availability from cache
 *
 * Usage:
 *   const { getSignedUrl, getSignedUrls } = useSignedUrls();
 *   const url = await getSignedUrl('path/to/image.jpg');
 *   const urls = await getSignedUrls(['path1.jpg', 'path2.jpg']);
 */
export function useSignedUrls(userId?: string) {
  const [urlCache, setUrlCache] = useState<SignedUrlCache>({});

  // Persistent cache in localStorage
  const { cachedData, setCachedData } = useCachedStorage<SignedUrlCache>({
    key: userId ? `signed-url-${userId}` : 'signed-url-no-user',
    ttl: 50 * 60 * 1000, // 50 minutes
  });

  // Load cache on mount
  useEffect(() => {
    if (cachedData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrlCache(cachedData);

      if (import.meta.env.DEV) {
        console.log('[useSignedUrls] Loaded URL cache:', Object.keys(cachedData).length, 'entries');
      }
    }
  }, [cachedData]);

  // Check if URL is still valid (not expired or close to expiry) - memoized
  const isUrlValid = useCallback((path: string): boolean => {
    const cached = urlCache[path];
    if (!cached) return false;

    const now = Date.now();
    const timeUntilExpiry = cached.expiresAt - now;

    // Consider expired if less than 10 minutes remaining
    return timeUntilExpiry > 10 * 60 * 1000;
  }, [urlCache]);

  // Get single signed URL (from cache or generate new) - memoized
  const getSignedUrl = useCallback(async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;

    // Check cache first
    if (isUrlValid(path)) {
      if (import.meta.env.DEV) {
        console.log('[useSignedUrls] Cache hit:', path);
      }
      return urlCache[path].url;
    }

    // Generate new signed URL
    try {
      const { data, error } = await supabase.storage
        .from('meal-photos')
        .createSignedUrl(path, 3600); // 1 hour validity

      if (error || !data?.signedUrl) {
        console.warn('[useSignedUrls] Failed to generate signed URL:', error);
        return null;
      }

      // Update cache
      const newCache = {
        ...urlCache,
        [path]: {
          url: data.signedUrl,
          expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
        },
      };

      setUrlCache(newCache);
      setCachedData(newCache);

      if (import.meta.env.DEV) {
        console.log('[useSignedUrls] Generated and cached URL:', path);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[useSignedUrls] Error generating signed URL:', error);
      return null;
    }
  }, [isUrlValid, urlCache, setCachedData]);

  // Get multiple signed URLs (batch operation) - memoized
  const getSignedUrls = useCallback(async (paths: (string | null | undefined)[]): Promise<(string | null)[]> => {
    const validPaths = paths.filter((p): p is string => Boolean(p));
    const results: (string | null)[] = new Array(paths.length).fill(null);

    // Check which URLs need generation
    const toGenerate: string[] = [];
    const cacheHits: Map<string, string> = new Map();

    validPaths.forEach((path) => {
      if (isUrlValid(path)) {
        cacheHits.set(path, urlCache[path].url);
      } else {
        toGenerate.push(path);
      }
    });

    if (import.meta.env.DEV) {
      console.log('[useSignedUrls] Batch request:', {
        total: validPaths.length,
        cacheHits: cacheHits.size,
        toGenerate: toGenerate.length,
      });
    }

    // Generate missing URLs
    if (toGenerate.length > 0) {
      const generated = await Promise.all(
        toGenerate.map(async (path) => {
          const url = await getSignedUrl(path);
          return { path, url };
        })
      );

      // Add generated URLs to cache hits
      generated.forEach(({ path, url }) => {
        if (url) {
          cacheHits.set(path, url);
        }
      });
    }

    // Map results back to original order
    paths.forEach((path, index) => {
      if (path && cacheHits.has(path)) {
        results[index] = cacheHits.get(path)!;
      }
    });

    return results;
  }, [isUrlValid, getSignedUrl]);

  // Clear cache (useful for logout) - memoized
  const clearCache = useCallback(() => {
    setUrlCache({});
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
