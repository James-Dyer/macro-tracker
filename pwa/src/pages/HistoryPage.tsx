import { useNavigate } from 'react-router-dom';
import { Typography, MealCard, Card, SwipeableCard } from '../components/ui';
import { useMeals } from '../hooks/useMeals';
import type { Meal } from '../hooks/useMeals';

/**
 * HistoryPage - Past meals with refined grouping
 */

export function HistoryPage() {
  const navigate = useNavigate();
  const { meals, loading, error, calculateDailyTotals, deleteMeal } = useMeals();

  // Group meals by date
  const mealsByDate = meals.reduce((groups, meal) => {
    const date = new Date(meal.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {} as Record<string, Meal[]>);

  // Sort dates descending
  const sortedDates = Object.keys(mealsByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const totalMeals = meals.length;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <Typography variant="body" color="secondary">
            Loading your history...
          </Typography>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-5 py-8 bg-app min-h-screen">
        <Card variant="filled" padding="md" className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <Typography variant="body" className="text-red-700 dark:text-red-400">
            {error}
          </Typography>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2">
          History
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          {totalMeals} {totalMeals === 1 ? 'meal' : 'meals'} logged
        </Typography>
      </div>

      {/* Meals by Date */}
      <div className="px-5 py-5">
        {sortedDates.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Typography variant="body" color="tertiary">
              No meals logged yet
            </Typography>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date, dayIndex) => {
              const mealsForDate = mealsByDate[date];
              const dailyTotals = calculateDailyTotals(mealsForDate);

              // Parse date for comparison
              const dateObj = new Date(mealsForDate[0].timestamp);
              const isToday = dateObj.toDateString() === new Date().toDateString();

              return (
                <div key={date} className={`animate-slide-up stagger-${Math.min(dayIndex + 1, 4)}`}>
                  {/* Date header */}
                  <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-gray-200">
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                      </Typography>
                      <Typography variant="caption" color="tertiary" className="ml-2">
                        {date}
                      </Typography>
                    </div>
                    <Typography variant="caption" color="tertiary" className="font-mono tabular-nums">
                      {dailyTotals.calories} cal
                    </Typography>
                  </div>

                  {/* Meals */}
                  <div className="space-y-3">
                    {mealsForDate.map((meal) => (
                      <SwipeableCard
                        key={meal.id}
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
                            navigate(`/dashboard/confirm/${meal.id}`, {
                              state: { mode: 'edit', meal },
                            });
                          }}
                        />
                      </SwipeableCard>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
