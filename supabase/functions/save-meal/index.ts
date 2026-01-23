import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FoodItemData {
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface SaveMealRequest {
  timestamp?: string; // ISO timestamp, defaults to now
  photoUrl?: string; // URL from Supabase Storage
  notes?: string;
  foodItems: FoodItemData[];
}

interface SaveMealResponse {
  mealId: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Method guard: only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // Get Supabase client with user's auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Parse request
    const {
      timestamp,
      photoUrl,
      notes,
      foodItems,
    }: SaveMealRequest = await req.json();

    // Validate food items
    if (!foodItems || foodItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one food item is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate each food item
    for (const item of foodItems) {
      if (!item.name || item.name.trim() === "") {
        return new Response(
          JSON.stringify({ error: "Food item name is required" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      if (item.weightGrams <= 0) {
        return new Response(
          JSON.stringify({ error: "Food item weight must be positive" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      if (item.calories < 0) {
        return new Response(
          JSON.stringify({ error: "Calories cannot be negative" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // Insert meal record
    const { data: meal, error: mealError } = await supabaseClient
      .from("meal")
      .insert({
        user_id: user.id,
        timestamp: timestamp || new Date().toISOString(),
        photo_url: photoUrl || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (mealError) {
      console.error("Error inserting meal:", mealError);
      throw new Error(`Failed to save meal: ${mealError.message}`);
    }

    // Insert food items
    const foodItemsToInsert = foodItems.map((item) => ({
      meal_id: meal.id,
      name: item.name.trim(),
      weight_g: Math.round(item.weightGrams),
      calories: Math.round(item.calories),
      protein: Math.round(item.protein * 10) / 10,
      carbs: Math.round(item.carbs * 10) / 10,
      fat: Math.round(item.fat * 10) / 10,
      fiber: Math.round(item.fiber * 10) / 10,
    }));

    const { error: itemsError } = await supabaseClient
      .from("food_item")
      .insert(foodItemsToInsert);

    if (itemsError) {
      console.error("Error inserting food items:", itemsError);

      // Rollback: delete the meal if food items failed
      await supabaseClient.from("meal").delete().eq("id", meal.id);

      throw new Error(`Failed to save food items: ${itemsError.message}`);
    }

    const response: SaveMealResponse = {
      mealId: meal.id,
      success: true,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in save-meal:", error);

    const errorResponse: SaveMealResponse = {
      mealId: "",
      success: false,
      error: error.message || "Failed to save meal",
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
