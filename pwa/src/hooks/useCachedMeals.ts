import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCachedStorage } from './useCachedStorage';
import { useSignedUrls } from './useSignedUrls';
import { useMeals, type Meal, type FoodItem } from './useMeals';

/**
 * useCachedMeals - Hybrid caching strategy for meals
 *
 * Why: Today's meals change frequently (new meals logged), but historical
 * meals are static. This hybrid approach provides fast loads while keeping
 * data fresh where it matters.
 *
 * Cache Strategy:
 * - Today's meals: 5-minute TTL (balance between freshness and performance)
 * - Recent meals (last 7 days): 30-minute TTL (infrequent access, rarely change)
 * - Key format: meals-today-{userId}, meals-recent-{userId}
 * - Invalidation: On create/update/delete operations
 *
 * Performance Impact:
 * - HomePage loads instantly from cache (today's meals)
 * - HistoryPage gets fast initial render (recent meals cache)
 * - Cache auto-refreshes in background when expired
 *
 * Usage:
 *   const { meals, loading, error, getTodayMeals, deleteMeal, updateMeal, refetch } = useCachedMeals();
 *   // Same API as useMeals, but with intelligent caching
 */
export function useCachedMeals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  // Signed URL caching
  const { getSignedUrls } = useSignedUrls(user?.id);

  // Tracks whether fresh server data has been loaded at least once this session.
  // Used to prevent the first effect from re-running (and calling setMeals again)
  // after the second effect writes to the localStorage caches, which would cause
  // a redundant signed-URL pass and flicker the meal cards.
  const freshDataLoadedRef = useRef(false);

  // Cache for today's meals (5 min TTL)
  const {
    cachedData: cachedTodayMeals,
    setCachedData: setCachedTodayMeals,
    isExpired: isTodayExpired,
  } = useCachedStorage<Meal[]>({
    key: user ? `meals-today-${user.id}` : 'meals-today-no-user',
    ttl: 5 * 60 * 1000, // 5 minutes
  });

  // Cache for recent meals (30 min TTL)
  const {
    cachedData: cachedRecentMeals,
    setCachedData: setCachedRecentMeals,
    isExpired: isRecentExpired,
  } = useCachedStorage<Meal[]>({
    key: user ? `meals-recent-${user.id}` : 'meals-recent-no-user',
    ttl: 30 * 60 * 1000, // 30 minutes
  });

  // Get original hook (only for fetching/mutating, not for state)
  const {
    meals: freshMeals,
    loading: fetchLoading,
    error: fetchError,
    refetch: fetchFromServer,
    deleteMeal: deleteFromServer,
    updateMeal: updateOnServer,
  } = useMeals();

  // Helper: Get today's date string (YYYY-MM-DD)
  const getTodayDateString = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Helper: Split meals into today and recent
  const splitMeals = useCallback((allMeals: Meal[]) => {
    const todayStr = getTodayDateString();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const todayMeals: Meal[] = [];
    const recentMeals: Meal[] = [];

    allMeals.forEach((meal) => {
      const mealDateStr = new Date(meal.timestamp).toISOString().split('T')[0];
      const mealDate = new Date(meal.timestamp);

      if (mealDateStr === todayStr) {
        todayMeals.push(meal);
      } else if (mealDate >= sevenDaysAgo) {
        recentMeals.push(meal);
      }
    });

    return { todayMeals, recentMeals };
  }, [getTodayDateString]);

  // Helper: Generate signed URLs for meals (with caching)
  const generateSignedUrlsForMeals = useCallback(async (mealsToProcess: Meal[]): Promise<Meal[]> => {
    // Extract all thumbnail paths (prefer thumbnail_path, fallback to photo_path)
    const paths = mealsToProcess.map((meal) => meal.thumbnail_path || meal.photo_path);

    // Batch generate signed URLs (uses cache)
    const signedUrls = await getSignedUrls(paths);

    // Map signed URLs back to meals
    return mealsToProcess.map((meal, index) => ({
      ...meal,
      thumbnail_url: signedUrls[index] || undefined,
    }));
  }, [getSignedUrls]);

  // Reset freshDataLoadedRef when user changes (logout / account switch)
  useEffect(() => {
    freshDataLoadedRef.current = false;
  }, [user?.id]);

  // Initial load: Use cache if available, otherwise wait for server fetch.
  // This effect is skipped once fresh server data has arrived to prevent
  // re-running (and calling setMeals with a new array) every time the second
  // effect writes updated caches back to localStorage.
  useEffect(() => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }

    // Fresh data already populates meals state; ignore subsequent cache updates
    if (freshDataLoadedRef.current) return;

    // Check if we have valid cached data
    const hasTodayCache = cachedTodayMeals && !isTodayExpired();
    const hasRecentCache = cachedRecentMeals && !isRecentExpired();

    if (hasTodayCache || hasRecentCache) {
      // Use cached data immediately (with signed URL generation)
      const combined = [
        ...(cachedTodayMeals || []),
        ...(cachedRecentMeals || []),
      ];

      // Generate signed URLs for cached meals (uses URL cache)
      generateSignedUrlsForMeals(combined).then((mealsWithUrls) => {
        setMeals(mealsWithUrls);
        setLoading(false);

        if (import.meta.env.DEV) {
          console.log('[useCachedMeals] Using cached meals:', {
            today: cachedTodayMeals?.length || 0,
            recent: cachedRecentMeals?.length || 0,
          });
        }
      });

      // If either cache is expired, refetch in background
      if (!hasTodayCache || !hasRecentCache) {
        if (import.meta.env.DEV) {
          console.log('[useCachedMeals] Cache partially expired, fetching fresh data in background');
        }
      }
      return;
    }

    // No valid cache - fetch from server
    setLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cachedTodayMeals, cachedRecentMeals, isTodayExpired, isRecentExpired, generateSignedUrlsForMeals]);

  // Update state when fresh data arrives from the server.
  // Split meals BEFORE generating signed URLs so we never generate URLs for
  // meals older than 7 days (which the dashboard and history both exclude).
  useEffect(() => {
    if (!fetchLoading && freshMeals.length >= 0) {
      // Mark fresh data as loaded before the async work so the first effect
      // skips its cache-reprocessing pass when setCachedTodayMeals fires.
      freshDataLoadedRef.current = true;

      const { todayMeals, recentMeals } = splitMeals(freshMeals);

      Promise.all([
        generateSignedUrlsForMeals(todayMeals),
        generateSignedUrlsForMeals(recentMeals),
      ]).then(([todayWithUrls, recentWithUrls]) => {
        setCachedTodayMeals(todayWithUrls);
        setCachedRecentMeals(recentWithUrls);
        setMeals([...todayWithUrls, ...recentWithUrls]);
        setLoading(false);

        if (import.meta.env.DEV) {
          console.log('[useCachedMeals] Cached fresh meals from server:', {
            today: todayWithUrls.length,
            recent: recentWithUrls.length,
          });
        }
      });
    }
  }, [fetchLoading, freshMeals, splitMeals, setCachedTodayMeals, setCachedRecentMeals, generateSignedUrlsForMeals]);

  // Handle errors
  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  }, [fetchError]);

  // Cross-component cache invalidation: ConfirmMealPage dispatches 'meals-updated'
  // after a new/quick-add save so any mounted useCachedMeals instance refetches
  // without prop drilling or a full navigation.
  useEffect(() => {
    const handleMealsUpdated = () => {
      setCachedTodayMeals(null);
      setCachedRecentMeals(null);
      fetchFromServer();
    };
    window.addEventListener('meals-updated', handleMealsUpdated);
    return () => window.removeEventListener('meals-updated', handleMealsUpdated);
  }, [setCachedTodayMeals, setCachedRecentMeals, fetchFromServer]);

  // Get today's meals (filtered from current state)
  const getTodayMeals = useCallback((): Meal[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return meals.filter((meal) => {
      const mealDate = new Date(meal.timestamp);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate.getTime() === today.getTime();
    });
  }, [meals]);

  // Calculate daily totals (same as original)
  const calculateDailyTotals = useCallback((mealsToSum: Meal[]) => {
    return mealsToSum.reduce(
      (totals, meal) => {
        meal.food_items.forEach((item) => {
          totals.calories += item.calories;
          totals.protein += item.protein;
          totals.carbs += item.carbs;
          totals.fat += item.fat;
          totals.fiber += item.fiber;
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, []);

  // Wrapped deleteMeal - invalidates cache after delete
  const deleteMeal = useCallback(async (mealId: string) => {
    // Optimistically remove from local state
    const previousMeals = [...meals];
    setMeals(meals.filter((m) => m.id !== mealId));

    try {
      await deleteFromServer(mealId);

      // Invalidate caches (refetch will happen automatically)
      setCachedTodayMeals(null);
      setCachedRecentMeals(null);

      if (import.meta.env.DEV) {
        console.log('[useCachedMeals] Cache invalidated after delete');
      }
    } catch (err) {
      console.error('[useCachedMeals] Error deleting meal:', err);
      // Revert optimistic update on error
      setMeals(previousMeals);
      throw err;
    }
  }, [meals, deleteFromServer, setCachedTodayMeals, setCachedRecentMeals]);

  // Wrapped updateMeal - invalidates cache after update
  const updateMeal = useCallback(async (
    mealId: string,
    updates: { notes?: string },
    foodItems: FoodItem[]
  ) => {
    try {
      await updateOnServer(mealId, updates, foodItems);

      // Invalidate caches (refetch will happen automatically)
      setCachedTodayMeals(null);
      setCachedRecentMeals(null);

      if (import.meta.env.DEV) {
        console.log('[useCachedMeals] Cache invalidated after update');
      }

      // Refetch will happen in next effect cycle
      await fetchFromServer();
    } catch (err) {
      console.error('[useCachedMeals] Error updating meal:', err);
      throw err;
    }
  }, [updateOnServer, setCachedTodayMeals, setCachedRecentMeals, fetchFromServer]);

  // Wrapped refetch - clears cache and fetches fresh
  const refetch = useCallback(async () => {
    setCachedTodayMeals(null);
    setCachedRecentMeals(null);
    setLoading(true);
    await fetchFromServer();

    if (import.meta.env.DEV) {
      console.log('[useCachedMeals] Cache cleared, refetched from server');
    }
  }, [setCachedTodayMeals, setCachedRecentMeals, fetchFromServer]);

  return {
    meals,
    loading,
    error,
    refetch,
    getTodayMeals,
    calculateDailyTotals,
    deleteMeal,
    updateMeal,
  };
}
