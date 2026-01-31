import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface FoodItem {
  id?: string;
  meal_id?: string;
  name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Meal {
  id: string;
  user_id: string;
  timestamp: string;
  photo_url?: string;       // Contains signed URL for full image (generated from photo_path)
  photo_path?: string;      // Storage path for full image
  thumbnail_url?: string;   // Contains signed URL for thumbnail (generated from thumbnail_path)
  thumbnail_path?: string;  // Storage path for thumbnail
  notes?: string;
  created_at: string;
  food_items: FoodItem[];
}

export interface DailyMacros {
  calories: { current: number; goal: number };
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
  fiber: { current: number; goal: number };
}

/**
 * Hook for managing meals data
 */
export function useMeals() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all meals for current user
  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // Route guard handles this, but be defensive
        setMeals([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("meal")
        .select(
          `
          *,
          food_items:food_item(*)
        `
        )
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (fetchError) throw fetchError;

      // Generate signed URLs for thumbnails only (fallback to full photo for old meals)
      const mealsWithSignedUrls = await Promise.all(
        (data || []).map(async (meal) => {
          // Prefer thumbnail, fallback to full photo for backward compatibility
          const pathToSign = meal.thumbnail_path || meal.photo_path;

          if (!pathToSign) {
            return meal;
          }

          const { data: signedData, error: signError } = await supabase.storage
            .from("meal-photos")
            .createSignedUrl(pathToSign, 3600); // 3600 seconds = 1 hour

          if (signError || !signedData?.signedUrl) {
            console.warn(`Failed to generate signed URL for meal ${meal.id}:`, signError);
            return meal;
          }

          // Store signed URL in thumbnail_url (MealCard prefers this)
          return {
            ...meal,
            thumbnail_url: signedData.signedUrl,
            // Don't generate photo_url to save API calls - only needed for detail view
          };
        })
      );

      setMeals(mealsWithSignedUrls as Meal[]);
    } catch (err) {
      console.error("Error fetching meals:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch meals");
    } finally {
      setLoading(false);
    }
  };

  // Fetch meals when user is available
  useEffect(() => {
    if (user) {
      fetchMeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Get today's meals
  const getTodayMeals = (): Meal[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return meals.filter((meal) => {
      const mealDate = new Date(meal.timestamp);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate.getTime() === today.getTime();
    });
  };

  // Calculate daily totals from meals
  const calculateDailyTotals = (mealsToSum: Meal[]) => {
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
  };

  // Delete a meal
  const deleteMeal = async (mealId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("meal")
        .delete()
        .eq("id", mealId);

      if (deleteError) throw deleteError;

      // Update local state
      setMeals(meals.filter((m) => m.id !== mealId));
    } catch (err) {
      console.error("Error deleting meal:", err);
      throw err;
    }
  };

  return {
    meals,
    loading,
    error,
    refetch: fetchMeals,
    getTodayMeals,
    calculateDailyTotals,
    deleteMeal,
  };
}
