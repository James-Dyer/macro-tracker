import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Typography, Button, Card } from "../components/ui";
import { supabase } from "../services/supabase";
import { useMeals, type FoodItem } from "../hooks/useMeals";

/**
 * DetectedFood interface matches the AI response from analyze-meal Edge Function
 */
interface DetectedFood {
  id?: string; // Added for edit mode
  name: string;
  weight_g: number;
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
  thumbnailPath: string; // Storage path for the thumbnail
  userContext?: string; // User-provided context from LogMealPage
}

/**
 * ConfirmMealPage - Review and edit AI-detected foods before saving
 *
 * Supports two modes:
 * 1. New meal mode: Receives analysis results from LogMealPage via router state
 * 2. Edit mode: Uses mealId param to load existing meal data
 *
 * Food cards are read-only. Tap a card (or the pencil icon) to open the
 * EditFoodSheet overlay where all fields are editable.
 */
export function ConfirmMealPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mealId } = useParams<{ mealId?: string }>();
  const { updateMeal } = useMeals();

  // Detect mode based on URL param
  const mode = mealId ? "edit" : "new";
  const analysisResult = location.state as AnalysisResult | undefined;
  const editMeal = mode === "edit" ? location.state?.meal : undefined;

  // Initialize foods and notes lazily to avoid a separate useEffect
  const [foods, setFoods] = useState<DetectedFood[]>(() => {
    if (mode === "edit" && editMeal) return editMeal.food_items || [];
    if (analysisResult) return analysisResult.foods || [];
    return [];
  });
  const [notes, setNotes] = useState<string>(() => {
    if (mode === "edit" && editMeal) return editMeal.notes || "";
    if (analysisResult) return analysisResult.userContext || "";
    return "";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit sheet state — editingIndex tracks which card is open,
  // draftFood holds unsaved edits until the user taps Save
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftFood, setDraftFood] = useState<DetectedFood | null>(null);
  // isNewFood lets handleCancelEdit remove the card if it was never filled in
  const [isNewFood, setIsNewFood] = useState(false);

  // Redirect if invalid state
  if (mode === "new" && !analysisResult) {
    navigate("/dashboard/log", { replace: true });
    return null;
  }
  if (mode === "edit" && !editMeal) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  // Open the edit sheet for an existing food card
  const openEditSheet = (index: number) => {
    setEditingIndex(index);
    setDraftFood({ ...foods[index] });
    setIsNewFood(false);
  };

  // Add a blank food and immediately open its edit sheet
  const handleAddFood = () => {
    const newFood: DetectedFood = {
      name: "",
      weight_g: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    const newFoods = [...foods, newFood];
    setFoods(newFoods);
    setEditingIndex(newFoods.length - 1);
    setDraftFood({ ...newFood });
    setIsNewFood(true);
  };

  // Update a field in the draft (always parse numeric fields to avoid type coercion bugs)
  const handleDraftUpdate = (field: keyof DetectedFood, value: string) => {
    if (!draftFood) return;
    setDraftFood({
      ...draftFood,
      [field]: field === "name" ? value : parseFloat(value) || 0,
    });
  };

  // Apply draft edits to the foods array and close the sheet
  const handleSaveEdit = () => {
    if (editingIndex === null || !draftFood) return;
    const newFoods = [...foods];
    newFoods[editingIndex] = draftFood;
    setFoods(newFoods);
    setEditingIndex(null);
    setDraftFood(null);
    setIsNewFood(false);
  };

  // Discard draft edits; remove the card entirely if it was just added blank
  const handleCancelEdit = () => {
    if (isNewFood && editingIndex !== null) {
      setFoods(foods.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setDraftFood(null);
    setIsNewFood(false);
  };

  // Remove the food being edited from the list
  const handleDeleteFood = () => {
    if (editingIndex === null) return;
    setFoods(foods.filter((_, i) => i !== editingIndex));
    setEditingIndex(null);
    setDraftFood(null);
    setIsNewFood(false);
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

    const invalidFood = foods.find(
      (f) => !f.name.trim() || f.weight_g <= 0
    );
    if (invalidFood) {
      setError("All foods must have a name and weight");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (mode === "edit" && mealId) {
        await updateMeal(
          mealId,
          { notes: notes || undefined },
          foods as FoodItem[]
        );
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated. Please log in again.');
        }

        const { error: saveError } = await supabase.functions.invoke(
          "save-meal",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: {
              photoPath: analysisResult!.photoPath,
              thumbnailPath: analysisResult!.thumbnailPath,
              notes: notes || undefined,
              foodItems: foods.map((food) => ({
                name: food.name,
                weight_g: food.weight_g,
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
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error saving meal:", err);
      setError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10">
        <Typography variant="h2">
          {mode === "edit" ? "Edit Meal" : "Confirm Meal"}
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          {mode === "edit"
            ? "Update food items and notes"
            : "Review and adjust detected foods"}
        </Typography>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Notes Field */}
        <div>
          <Typography variant="label" className="text-gray-700 mb-1">
            Notes (optional)
          </Typography>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            placeholder="Add notes about this meal..."
            rows={2}
          />
        </div>

        {/* Scale Detection Info (only for new meals) */}
        {mode === "new" && analysisResult?.scaleDetected && (
          <Card variant="filled" padding="md">
            <div className="flex items-center gap-2">
              <ScaleIcon className="w-5 h-5 text-green-600" />
              <Typography variant="body" className="text-green-700 font-medium">
                Scale detected: {analysisResult.scaleWeight}g
              </Typography>
            </div>
          </Card>
        )}

        {/* Confidence Score (only for new meals) */}
        {mode === "new" && analysisResult && (
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
              <Typography variant="bodySmall" className="font-semibold text-themed">
                {Math.round(analysisResult.confidence * 100)}%
              </Typography>
            </div>
          </Card>
        )}

        {/* Food Cards — read-only, tap to edit */}
        <div className="space-y-3">
          {foods.map((food, index) => (
            <button
              key={index}
              onClick={() => openEditSheet(index)}
              className="w-full text-left bg-elevated rounded-xl shadow-md border border-themed p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Typography variant="h3" className="truncate">
                    {food.name || (
                      <span className="text-gray-400 font-normal italic text-sm">
                        Tap to name this food
                      </span>
                    )}
                  </Typography>
                  <Typography variant="bodySmall" color="secondary" className="mt-0.5">
                    {food.weight_g}g
                  </Typography>
                </div>
                {/* Edit icon — visual affordance for tappability */}
                <div className="p-1.5 text-gray-400 shrink-0">
                  <PencilIcon className="w-4 h-4" />
                </div>
              </div>
              {/* Macro badges — same style as MealCard */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <MacroBadge label="cal" value={food.calories} color="#16a34a" bg="#f0fdf4" />
                <MacroBadge label="P" value={food.protein} color="#2563eb" bg="#eff6ff" />
                <MacroBadge label="C" value={food.carbs} color="#f59e0b" bg="#fffbeb" />
                <MacroBadge label="F" value={food.fat} color="#dc2626" bg="#fef2f2" />
                <MacroBadge label="Fi" value={food.fiber} color="#7c3aed" bg="#f5f3ff" />
              </div>
            </button>
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
          <Typography variant="h3" className="mb-3">
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

      {/* Edit Food Sheet — slides up from bottom like a native sheet */}
      {editingIndex !== null && draftFood && (
        <>
          {/* Backdrop — tapping it cancels the edit */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={handleCancelEdit}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-elevated rounded-t-2xl shadow-2xl animate-slide-up-sheet max-h-[90vh] overflow-y-auto">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Sticky Save / Cancel */}
            <div className="sticky top-0 bg-elevated z-10 px-4 pb-3 pt-1 border-b border-themed">
              <div className="flex gap-3">
                <Button
                  title="Cancel"
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={handleCancelEdit}
                />
                <Button
                  title="Save"
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleSaveEdit}
                />
              </div>
            </div>

            {/* Edit form */}
            <div className="px-4 pt-4 pb-8 space-y-4">
              {/* Food Name */}
              <div>
                <Typography variant="label" className="text-gray-700 mb-1">
                  Food name
                </Typography>
                <input
                  type="text"
                  value={draftFood.name}
                  onChange={(e) => handleDraftUpdate("name", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Food name"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>

              {/* Weight */}
              <div>
                <Typography variant="label" className="text-gray-700 mb-1">
                  Weight (grams)
                </Typography>
                <input
                  type="number"
                  value={draftFood.weight_g || ""}
                  onChange={(e) => handleDraftUpdate("weight_g", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
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
                    value={draftFood.calories || ""}
                    onChange={(e) => handleDraftUpdate("calories", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Typography variant="label" className="text-gray-700 mb-1">
                    Protein (g)
                  </Typography>
                  <input
                    type="number"
                    value={draftFood.protein || ""}
                    onChange={(e) => handleDraftUpdate("protein", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Typography variant="label" className="text-gray-700 mb-1">
                    Carbs (g)
                  </Typography>
                  <input
                    type="number"
                    value={draftFood.carbs || ""}
                    onChange={(e) => handleDraftUpdate("carbs", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Typography variant="label" className="text-gray-700 mb-1">
                    Fat (g)
                  </Typography>
                  <input
                    type="number"
                    value={draftFood.fat || ""}
                    onChange={(e) => handleDraftUpdate("fat", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Typography variant="label" className="text-gray-700 mb-1">
                    Fiber (g)
                  </Typography>
                  <input
                    type="number"
                    value={draftFood.fiber || ""}
                    onChange={(e) => handleDraftUpdate("fiber", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Delete food */}
              <button
                onClick={handleDeleteFood}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-500 text-sm font-medium rounded-xl border border-red-200 dark:border-red-900/40 active:bg-red-50 dark:active:bg-red-950/20"
              >
                <TrashIcon className="w-4 h-4" />
                Remove this food
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MacroBadge({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="px-2 py-0.5 rounded text-xs font-mono font-semibold tabular-nums"
      style={{ color, backgroundColor: bg }}
    >
      {label} {Math.round(value)}
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

function PencilIcon({ className }: { className?: string }) {
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
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}
