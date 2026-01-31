import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Logger } from '../_shared/logger.ts';
import { ApiError, ErrorCode, createErrorResponse } from '../_shared/errors.ts';
import { EnvValidator } from '../_shared/env.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface FoodItemData {
  name: string;
  weight_g: number;
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

// Validate environment variables at startup
const envValidation = EnvValidator.validate({
  required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
});

if (!envValidation.valid) {
  console.error('Missing required environment variables:', envValidation.missing);
}

serve(async (req) => {
  const requestId = generateRequestId();
  const logger = new Logger('save-meal', { requestId });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info('Request received', { method: req.method });

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
      logger.warn('Missing authorization header');
      throw new ApiError(
        ErrorCode.MISSING_AUTH,
        'Missing authorization header',
        401
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
      logger.error('Authentication failed', userError);
      throw new ApiError(
        ErrorCode.INVALID_AUTH,
        'Unauthorized',
        403
      );
    }

    logger.info('User authenticated', { userId: user.id });

    // Parse request
    const {
      timestamp,
      photoUrl,
      notes,
      foodItems,
    }: SaveMealRequest = await req.json();

    logger.info('Saving meal', {
      hasPhotoUrl: !!photoUrl,
      hasNotes: !!notes,
      foodItemCount: foodItems?.length || 0
    });

    // Validate food items
    if (!foodItems || foodItems.length === 0) {
      logger.warn('No food items provided');
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'At least one food item is required',
        400,
        { hasFoodItems: !!foodItems, itemCount: foodItems?.length || 0 }
      );
    }

    // Validate each food item
    const invalidItems: Array<{ index: number; reason: string }> = [];
    for (let i = 0; i < foodItems.length; i++) {
      const item = foodItems[i];
      if (!item.name || item.name.trim() === "") {
        invalidItems.push({ index: i, reason: 'Missing name' });
      }
      if (item.weight_g <= 0) {
        invalidItems.push({ index: i, reason: 'Weight must be positive' });
      }
      if (item.calories < 0) {
        invalidItems.push({ index: i, reason: 'Calories cannot be negative' });
      }
    }

    if (invalidItems.length > 0) {
      logger.warn('Invalid food items detected', { invalidItems });
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid food items detected',
        400,
        { invalidItems }
      );
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
      logger.error('Failed to insert meal', mealError);
      throw new ApiError(
        ErrorCode.DATABASE_ERROR,
        'Failed to save meal',
        500,
        { error: mealError.message }
      );
    }

    logger.info('Meal inserted successfully', { mealId: meal.id });

    // Insert food items
    const foodItemsToInsert = foodItems.map((item) => ({
      meal_id: meal.id,
      name: item.name.trim(),
      weight_g: Math.round(item.weight_g),
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
      logger.error('Failed to insert food items', { mealId: meal.id, error: itemsError });

      // Attempt to rollback (delete meal)
      const { error: deleteError } = await supabaseClient
        .from('meal')
        .delete()
        .eq('id', meal.id);

      if (deleteError) {
        logger.error('Failed to rollback meal deletion', { mealId: meal.id, error: deleteError });
      } else {
        logger.info('Successfully rolled back meal insertion', { mealId: meal.id });
      }

      throw new ApiError(
        ErrorCode.DATABASE_ERROR,
        'Failed to save food items',
        500,
        { error: itemsError.message, mealId: meal.id }
      );
    }

    logger.info('Food items inserted successfully', { mealId: meal.id, count: foodItems.length });

    const response: SaveMealResponse = {
      mealId: meal.id,
      success: true,
    };

    logger.info('Meal saved successfully', { mealId: meal.id });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logger.error('save-meal error', error);
    return createErrorResponse(error, requestId, corsHeaders);
  }
});
