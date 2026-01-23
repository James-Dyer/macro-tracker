import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

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
  const [goals, setGoals] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's goals
  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error: fetchError } = await supabase
        .from("daily_goal")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        // If no goals exist yet, use defaults
        if (fetchError.code === "PGRST116") {
          setGoals({
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65,
            fiber: 30,
          });
        } else {
          throw fetchError;
        }
      } else {
        setGoals(data);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch goals");
      // Set defaults on error
      setGoals({
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        fiber: 30,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update or create goals
  const saveGoals = async (newGoals: Omit<DailyGoal, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
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

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, []);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    saveGoals,
  };
}
