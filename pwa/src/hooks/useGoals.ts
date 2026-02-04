import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface DailyGoal {
  id?: string;
  user_id?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Hook for managing user's daily macro goals
 */
export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's goals
  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // Route guard handles this, but be defensive
        setGoals(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("daily_goal")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        // If no goals exist yet, return null (user needs onboarding)
        if (fetchError.code === "PGRST116") {
          setGoals(null);
        } else {
          throw fetchError;
        }
      } else {
        setGoals(data);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch goals");
      // On error, set to null (user may need onboarding)
      setGoals(null);
    } finally {
      setLoading(false);
    }
  };

  // Update or create goals
  const saveGoals = async (newGoals: Omit<DailyGoal, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      if (!user) {
        // Route guard handles this, but be defensive
        throw new Error("Not authenticated");
      }

      const { data, error: upsertError } = await supabase
        .from("daily_goal")
        .upsert(
          {
            user_id: user.id,
            ...newGoals,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      setGoals(data);
      return data;
    } catch (err) {
      console.error("Error saving goals:", err);
      throw err;
    }
  };

  // Fetch goals when user is available
  useEffect(() => {
    if (user) {
      fetchGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    saveGoals,
  };
}
