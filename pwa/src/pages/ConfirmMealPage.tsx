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

  // Detect mode based on URL param and route state
  const isQuickAdd = !mealId && (location.state as { mode?: string })?.mode === 'quick-add';
  const mode = mealId ? "edit" : isQuickAdd ? "quick-add" : "new";
  // Only read analysisResult for "new" mode to avoid type confusion
  const analysisResult = mode === "new" ? (location.state as AnalysisResult | undefined) : undefined;
  const editMeal = mode === "edit" ? location.state?.meal : undefined;

  // Initialize foods and notes lazily to avoid a separate useEffect
  const [foods, setFoods] = useState<DetectedFood[]>(() => {
    if (mode === "edit" && editMeal) return editMeal.food_items || [];
    if (mode === "new" && analysisResult) return analysisResult.foods || [];
    // quick-add: one blank food item; EditFoodSheet opens immediately below
    return [{ name: "", weight_g: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }];
  });
  const [notes] = useState<string>(() => {
    if (mode === "edit" && editMeal) return editMeal.notes || "";
    if (mode === "new" && analysisResult) return analysisResult.userContext || "";
    return "";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit sheet state — editingIndex tracks which card is open,
  // draftFood holds unsaved edits until the user taps Save.
  // For quick-add, the sheet opens immediately on index 0 with a blank food.
  const [editingIndex, setEditingIndex] = useState<number | null>(
    () => isQuickAdd ? 0 : null
  );
  const [draftFood, setDraftFood] = useState<DetectedFood | null>(
    () => isQuickAdd ? { name: "", weight_g: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } : null
  );
  // isNewFood lets handleCancelEdit remove the card if it was never filled in
  const [isNewFood, setIsNewFood] = useState(isQuickAdd);

  // Redirect if invalid state (quick-add bypasses the analysisResult check)
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

  // Discard draft edits; remove the card entirely if it was just added blank.
  // In quick-add mode, cancelling the sheet means abandoning the whole flow.
  const handleCancelEdit = () => {
    if (isQuickAdd) {
      navigate("/dashboard", { replace: true });
      return;
    }
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
      (f) => !f.name.trim() || f.weight_g < 0
    );
    if (invalidFood) {
      setError("All foods must have a name");
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
              // quick-add has no photo; new meals carry photoPath/thumbnailPath from analysisResult
              photoPath: analysisResult?.photoPath,
              thumbnailPath: analysisResult?.thumbnailPath,
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

        // Notify any mounted useCachedMeals instances to invalidate and refetch
        window.dispatchEvent(new CustomEvent('meals-updated'));
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error saving meal:", err);
      setError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Add fast-save: called from the EditFoodSheet Save button.
  // Commits the current draft + any already-added foods directly to the backend
  // without requiring a second "Save Meal" tap on the confirm page.
  const handleQuickAddSave = async () => {
    if (!draftFood || draftFood.calories <= 0) {
      setError("Enter at least the calories");
      return;
    }

    // Build the final food list: committed foods + current draft.
    // Fall back to "Quick Add" when the user skips the name field.
    const finalisedDraft = {
      ...draftFood,
      name: draftFood.name.trim() || "Quick Add",
    };
    const foodsToSave = editingIndex !== null
      ? foods.map((f, i) => (i === editingIndex ? finalisedDraft : f))
      : [...foods, finalisedDraft];

    setIsSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated. Please log in again.');

      const { error: saveError } = await supabase.functions.invoke("save-meal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          notes: notes || undefined,
          foodItems: foodsToSave.map((food) => ({
            name: food.name,
            weight_g: food.weight_g,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            fiber: food.fiber,
          })),
        },
      });

      if (saveError) throw saveError;

      window.dispatchEvent(new CustomEvent('meals-updated'));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error saving quick add:", err);
      setError(err instanceof Error ? err.message : "Failed to save meal");
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10">
        <Typography variant="h2">
          {mode === "edit" ? "Edit Meal" : mode === "quick-add" ? "Quick Add" : "Confirm Meal"}
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          {mode === "edit"
            ? "Update food items"
            : mode === "quick-add"
            ? "Add calories and macros manually"
            : "Review and adjust detected foods"}
        </Typography>
      </div>

      <div className="px-5 py-5 space-y-4">
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

      {/* Edit Food — full-screen page overlay, slides in over the confirm screen.
           No sheet/backdrop/scroll tricks needed; iOS treats this like a normal page. */}
      {editingIndex !== null && draftFood && (
        <div className="fixed inset-0 z-50 bg-app overflow-y-auto animate-slide-up">
          {/* Header — sticky, mirrors the app's standard header style */}
          <div className="sticky top-0 z-10 bg-header backdrop-blur-sm border-b border-themed px-5 pt-safe-top">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 text-primary font-medium text-sm"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                Back
              </button>
              <Typography variant="h3">Edit Food</Typography>
              <button
                onClick={isQuickAdd ? handleQuickAddSave : handleSaveEdit}
                disabled={isSaving}
                className="text-primary font-semibold text-sm disabled:opacity-40"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-5 space-y-4 pb-safe-bottom">
            {/* Food name */}
            <div>
              <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                Food name
              </Typography>
              <input
                type="text"
                value={draftFood.name}
                onChange={(e) => handleDraftUpdate("name", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                placeholder="e.g. Grilled chicken"
              />
            </div>

            {/* Calories + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                  Calories
                </Typography>
                <input
                  type="number"
                  value={draftFood.calories || ""}
                  onChange={(e) => handleDraftUpdate("calories", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                  Weight (g)
                </Typography>
                <input
                  type="number"
                  value={draftFood.weight_g || ""}
                  onChange={(e) => handleDraftUpdate("weight_g", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Protein / Carbs / Fat */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                  Protein (g)
                </Typography>
                <input
                  type="number"
                  value={draftFood.protein || ""}
                  onChange={(e) => handleDraftUpdate("protein", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                  Carbs (g)
                </Typography>
                <input
                  type="number"
                  value={draftFood.carbs || ""}
                  onChange={(e) => handleDraftUpdate("carbs", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                  Fat (g)
                </Typography>
                <input
                  type="number"
                  value={draftFood.fat || ""}
                  onChange={(e) => handleDraftUpdate("fat", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Fiber */}
            <div>
              <Typography variant="label" className="text-gray-500 dark:text-gray-400 mb-1">
                Fiber (g)
              </Typography>
              <input
                type="number"
                value={draftFood.fiber || ""}
                onChange={(e) => handleDraftUpdate("fiber", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
                placeholder="0"
              />
            </div>

            {/* Error (quick-add) */}
            {isQuickAdd && error && (
              <Typography variant="bodySmall" className="text-red-500 text-center">
                {error}
              </Typography>
            )}

            {/* Remove food */}
            <button
              onClick={handleDeleteFood}
              className="w-full flex items-center justify-center gap-2 py-3 text-red-500 text-sm font-medium rounded-xl border border-red-200 dark:border-red-900/40 active:bg-red-50 dark:active:bg-red-950/20 mt-2"
            >
              <TrashIcon className="w-4 h-4" />
              Remove this food
            </button>
          </div>
        </div>
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


function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
