import { Typography, MacroSummary, MealCard, Card } from '../components/ui';
import { useMeals } from '../hooks/useMeals';
import { useGoals } from '../hooks/useGoals';

/**
 * HomePage - Daily tracking overview
 *
 * Redesigned with staggered animations and refined spacing
 */

export function HomePage() {
  const { meals, loading: mealsLoading, error: mealsError, getTodayMeals, calculateDailyTotals } = useMeals();
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
          <Typography variant="caption" color="tertiary" className="font-mono tabular-nums">
            {todayMeals.reduce((sum, meal) =>
              sum + meal.foodItems.reduce((mealSum, item) => mealSum + item.calories, 0), 0
            )} cal
          </Typography>
        </div>

        {todayMeals.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <Typography variant="body" color="tertiary">
              No meals logged yet today
            </Typography>
            <Typography variant="bodySmall" color="tertiary" className="mt-1">
              Tap the camera icon below to start
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal, index) => (
              <div
                key={meal.id}
                className={`animate-slide-up stagger-${Math.min(index + 2, 4)}`}
              >
                <MealCard meal={meal} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
