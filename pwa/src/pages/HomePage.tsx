import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, MacroSummary, MealCard, Card, SwipeableCard } from '../components/ui';
import { useMeals } from '../hooks/useMeals';
import { useGoals } from '../hooks/useGoals';

/**
 * HomePage - Daily tracking overview
 *
 * Redesigned with staggered animations and refined spacing
 */

export function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loading: mealsLoading, error: mealsError, getTodayMeals, calculateDailyTotals, deleteMeal } = useMeals();
  const { goals, loading: goalsLoading } = useGoals();

  // Get today's meals
  const todayMeals = getTodayMeals();

  // Calculate totals
  const totals = calculateDailyTotals(todayMeals);

  // Combine with goals
  const todayMacros = {
    calories: { current: totals.calories, goal: goals?.calories || 2000 },
    protein: { current: totals.protein, goal: goals?.protein || 150 },
    carbs: { current: totals.carbs, goal: goals?.carbs || 250 },
    fat: { current: totals.fat, goal: goals?.fat || 65 },
    fiber: { current: totals.fiber, goal: goals?.fiber || 30 },
  };

  const loading = mealsLoading || goalsLoading;

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Navigate to LogMealPage with the selected file
      navigate('/log', {
        state: { selectedFile: file }
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <Typography variant="body" color="secondary">
            Loading your meals...
          </Typography>
        </div>
      </div>
    );
  }

  // Error state
  if (mealsError) {
    return (
      <div className="px-5 py-8">
        <Card variant="filled" padding="md" className="bg-red-50 border border-red-200">
          <Typography variant="body" className="text-red-700">
            {mealsError}
          </Typography>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen">
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2" className="text-gray-900">
          Today
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </div>

      {/* Macro Summary */}
      <div className="px-5 py-5">
        <MacroSummary {...todayMacros} />
      </div>

      {/* Meals Section */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4 animate-slide-up stagger-1">
          <Typography variant="h3" className="text-gray-900">
            Meals
          </Typography>
        </div>

        {todayMeals.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <button
              onClick={handleCameraClick}
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors active:scale-95"
            >
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
            <Typography variant="body" color="tertiary">
              No meals logged yet today
            </Typography>
            <Typography variant="bodySmall" color="tertiary" className="mt-1">
              Tap the plus to log your first meal
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal, index) => (
              <div
                key={meal.id}
                className={`animate-slide-up stagger-${Math.min(index + 2, 4)}`}
              >
                <SwipeableCard
                  onDelete={async () => {
                    await deleteMeal(meal.id);
                  }}
                >
                  <MealCard
                    timestamp={new Date(meal.timestamp)}
                    photoUrl={meal.photo_url}
                    thumbnailUrl={meal.thumbnail_url}
                    foodItems={meal.food_items}
                    onClick={() => {
                      navigate(`/confirm/${meal.id}`, {
                        state: { mode: 'edit', meal },
                      });
                    }}
                  />
                </SwipeableCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
