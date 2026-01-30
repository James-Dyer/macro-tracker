import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Typography, Button, Card } from "../components/ui";
import { supabase } from "../services/supabase";

/**
 * DetectedFood interface matches the AI response from analyze-meal Edge Function
 */
interface DetectedFood {
  name: string;
  confidence: number;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/**
 * Analysis result from analyze-meal Edge Function
 */
interface AnalysisResult {
  foods: DetectedFood[];
  scaleDetected: boolean;
  scaleWeight?: number;
  confidence: number;
  photoPath: string; // Storage path for the meal photo
}

/**
 * ConfirmMealPage - Review and edit AI-detected foods before saving
 *
 * This page receives the analysis results from LogMealPage via router state.
 * Users can edit food names, weights, and macros before saving to the database.
 */
export function ConfirmMealPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const analysisResult = location.state as AnalysisResult | undefined;

  const [foods, setFoods] = useState<DetectedFood[]>(
    analysisResult?.foods || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no analysis result, redirect back to log page
  if (!analysisResult) {
    navigate("/log", { replace: true });
    return null;
  }

  const handleUpdateFood = (index: number, field: keyof DetectedFood, value: string | number) => {
    const newFoods = [...foods];
    newFoods[index] = {
      ...newFoods[index],
      [field]: typeof value === "string" ? value : parseFloat(value.toString()) || 0,
    };
    setFoods(newFoods);
  };

  const handleRemoveFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const handleAddFood = () => {
    setFoods([
      ...foods,
      {
        name: "",
        confidence: 1.0,
        weightGrams: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      },
    ]);
  };

  const calculateTotals = () => {
    return foods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
        fiber: totals.fiber + food.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  };

  const handleSave = async () => {
    if (foods.length === 0) {
      setError("Add at least one food item");
      return;
    }

    // Validate all foods have required data
    const invalidFood = foods.find(
      (f) => !f.name.trim() || f.weightGrams <= 0
    );
    if (invalidFood) {
      setError("All foods must have a name and weight");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Get public URL for the photo
      const { data: urlData } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(analysisResult.photoPath);

      // Call save-meal Edge Function
      const { error: saveError } = await supabase.functions.invoke(
        "save-meal",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            photoUrl: urlData.publicUrl,
            foodItems: foods.map((food) => ({
              name: food.name,
              weightGrams: food.weightGrams,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              fiber: food.fiber,
            })),
          },
        }
      );

      if (saveError) throw saveError;

      // Navigate to home page on success
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error saving meal:", err);
      setError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10">
        <Typography variant="h2" className="text-gray-900">
          Confirm Meal
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Review and adjust detected foods
        </Typography>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Scale Detection Info */}
        {analysisResult.scaleDetected && (
          <Card variant="filled" padding="md">
            <div className="flex items-center gap-2">
              <ScaleIcon className="w-5 h-5 text-green-600" />
              <Typography variant="body" className="text-green-700 font-medium">
                Scale detected: {analysisResult.scaleWeight}g
              </Typography>
            </div>
          </Card>
        )}

        {/* Confidence Score */}
        <Card variant="filled" padding="md">
          <Typography variant="label" className="text-gray-700 mb-1">
            Overall Confidence
          </Typography>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${analysisResult.confidence * 100}%` }}
              />
            </div>
            <Typography variant="bodySmall" className="font-semibold text-gray-900">
              {Math.round(analysisResult.confidence * 100)}%
            </Typography>
          </div>
        </Card>

        {/* Food Items */}
        <div className="space-y-3">
          {foods.map((food, index) => (
            <Card key={index} padding="md" variant="elevated">
              <div className="space-y-3">
                {/* Food name and confidence */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) =>
                        handleUpdateFood(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Food name"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveFood(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Weight */}
                <div>
                  <Typography variant="label" className="text-gray-700 mb-1">
                    Weight (grams)
                  </Typography>
                  <input
                    type="number"
                    value={food.weightGrams}
                    onChange={(e) =>
                      handleUpdateFood(index, "weightGrams", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Typography variant="label" className="text-gray-700 mb-1">
                      Calories
                    </Typography>
                    <input
                      type="number"
                      value={food.calories}
                      onChange={(e) =>
                        handleUpdateFood(index, "calories", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Typography variant="label" className="text-gray-700 mb-1">
                      Protein (g)
                    </Typography>
                    <input
                      type="number"
                      value={food.protein}
                      onChange={(e) =>
                        handleUpdateFood(index, "protein", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Typography variant="label" className="text-gray-700 mb-1">
                      Carbs (g)
                    </Typography>
                    <input
                      type="number"
                      value={food.carbs}
                      onChange={(e) =>
                        handleUpdateFood(index, "carbs", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Typography variant="label" className="text-gray-700 mb-1">
                      Fat (g)
                    </Typography>
                    <input
                      type="number"
                      value={food.fat}
                      onChange={(e) =>
                        handleUpdateFood(index, "fat", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Typography variant="label" className="text-gray-700 mb-1">
                      Fiber (g)
                    </Typography>
                    <input
                      type="number"
                      value={food.fiber}
                      onChange={(e) =>
                        handleUpdateFood(index, "fiber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Confidence indicator */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Typography variant="bodySmall" color="secondary">
                    AI Confidence:
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    className={
                      food.confidence > 0.8
                        ? "text-green-600 font-semibold"
                        : food.confidence > 0.5
                        ? "text-yellow-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {Math.round(food.confidence * 100)}%
                  </Typography>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Food Button */}
        <Button
          title="Add Another Food"
          variant="secondary"
          onClick={handleAddFood}
          fullWidth
        />

        {/* Totals Summary */}
        <Card variant="elevated" padding="md">
          <Typography variant="h3" className="text-gray-900 mb-3">
            Meal Totals
          </Typography>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Typography variant="bodySmall" color="secondary">
                Calories
              </Typography>
              <Typography variant="h3" className="text-primary">
                {Math.round(totals.calories)}
              </Typography>
            </div>
            <div>
              <Typography variant="bodySmall" color="secondary">
                Protein
              </Typography>
              <Typography variant="h3" className="text-primary">
                {Math.round(totals.protein)}g
              </Typography>
            </div>
            <div>
              <Typography variant="bodySmall" color="secondary">
                Carbs
              </Typography>
              <Typography variant="h3" className="text-primary">
                {Math.round(totals.carbs)}g
              </Typography>
            </div>
            <div>
              <Typography variant="bodySmall" color="secondary">
                Fat
              </Typography>
              <Typography variant="h3" className="text-primary">
                {Math.round(totals.fat)}g
              </Typography>
            </div>
            <div>
              <Typography variant="bodySmall" color="secondary">
                Fiber
              </Typography>
              <Typography variant="h3" className="text-primary">
                {Math.round(totals.fiber)}g
              </Typography>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card variant="filled" padding="md" className="bg-red-50 border border-red-200">
            <Typography variant="body" className="text-red-700">
              {error}
            </Typography>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            title={isSaving ? "Saving..." : "Save Meal"}
            onClick={handleSave}
            disabled={isSaving || foods.length === 0}
            size="lg"
            fullWidth
          />
          <Button
            title="Cancel"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={isSaving}
            size="lg"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
