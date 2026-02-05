import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCachedStorage } from './useCachedStorage';
import { useGoals, type DailyGoal } from './useGoals';

/**
 * useCachedGoals - Wrap useGoals with 24h cache
 *
 * Why: Goals rarely change (maybe once per week), so 24h cache drastically
 * reduces unnecessary API calls. Cache is invalidated on manual saves.
 *
 * Cache Strategy:
 * - TTL: 24 hours (goals change infrequently)
 * - Invalidation: On saveGoals() call
 * - Key format: goals-{userId}
 *
 * Usage:
 *   const { goals, loading, error, saveGoals, refetch } = useCachedGoals();
 *   // Same API as useGoals, but with caching
 */
export function useCachedGoals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get cache utilities
  const { cachedData, setCachedData, isExpired } = useCachedStorage<DailyGoal>({
    key: user ? `goals-${user.id}` : 'goals-no-user',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Get original hook (only for fetching/saving, not for state)
  const {
    goals: freshGoals,
    loading: fetchLoading,
    error: fetchError,
    refetch: fetchFromServer,
    saveGoals: saveToServer,
  } = useGoals();

  // Determine current goals (cache or fresh)
  const [goals, setGoals] = useState<DailyGoal | null>(cachedData);

  // Fetch from server if cache is expired or missing
  useEffect(() => {
    if (!user) {
      setGoals(null);
      setLoading(false);
      return;
    }

    // If we have valid cached data, use it immediately
    if (cachedData && !isExpired()) {
      setGoals(cachedData);
      setLoading(false);

      if (import.meta.env.DEV) {
        console.log('[useCachedGoals] Using cached goals:', cachedData);
      }
      return;
    }

    // Cache expired or missing - fetch from server
    setLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cachedData, isExpired]);

  // Update state when fresh data arrives
  useEffect(() => {
    if (!fetchLoading && freshGoals) {
      // Fresh data arrived - update cache and state
      setCachedData(freshGoals);
      setGoals(freshGoals);
      setLoading(false);

      if (import.meta.env.DEV) {
        console.log('[useCachedGoals] Cached fresh goals from server');
      }
    } else if (!fetchLoading && !freshGoals && cachedData === null) {
      // No goals exist (new user needs onboarding)
      setGoals(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLoading, freshGoals, setCachedData]);

  // Handle errors
  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  }, [fetchError]);

  // Wrapped saveGoals - invalidates cache after save
  const saveGoals = async (
    newGoals: Omit<DailyGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const saved = await saveToServer(newGoals);

      // Update cache with new data
      setCachedData(saved);
      setGoals(saved);

      if (import.meta.env.DEV) {
        console.log('[useCachedGoals] Cache invalidated and updated after save');
      }

      return saved;
    } catch (err) {
      console.error('[useCachedGoals] Error saving goals:', err);
      throw err;
    }
  };

  // Wrapped refetch - clears cache and fetches fresh
  const refetch = async () => {
    setCachedData(null); // Clear cache
    setLoading(true);
    await fetchFromServer();

    if (import.meta.env.DEV) {
      console.log('[useCachedGoals] Cache cleared, refetched from server');
    }
  };

  return {
    goals,
    loading,
    error,
    refetch,
    saveGoals,
  };
}
