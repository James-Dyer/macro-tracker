import { Typography, MealCard } from '../components/ui';

/**
 * HistoryPage - Past meals with refined grouping
 */

export function HistoryPage() {
  // Mock data
  const mealsByDate = [
    {
      date: new Date(2024, 0, 21),
      meals: [
        {
          id: '1',
          timestamp: new Date(2024, 0, 21, 8, 30),
          foodItems: [
            { name: 'Oatmeal with Berries', calories: 350, protein: 12, carbs: 58, fat: 8, weight_g: 250 },
          ],
        },
        {
          id: '2',
          timestamp: new Date(2024, 0, 21, 12, 15),
          foodItems: [
            { name: 'Chicken Salad', calories: 420, protein: 38, carbs: 22, fat: 18, weight_g: 320 },
          ],
        },
      ],
    },
    {
      date: new Date(2024, 0, 20),
      meals: [
        {
          id: '3',
          timestamp: new Date(2024, 0, 20, 13, 0),
          foodItems: [
            { name: 'Turkey Sandwich', calories: 380, protein: 28, carbs: 42, fat: 10, weight_g: 280 },
          ],
        },
      ],
    },
  ];

  const totalMeals = mealsByDate.reduce((sum, day) => sum + day.meals.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2" className="text-gray-900">
          History
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          {totalMeals} {totalMeals === 1 ? 'meal' : 'meals'} logged
        </Typography>
      </div>

      {/* Meals by Date */}
      <div className="px-5 py-5">
        {mealsByDate.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Typography variant="body" color="tertiary">
              No meals logged yet
            </Typography>
          </div>
        ) : (
          <div className="space-y-6">
            {mealsByDate.map((day, dayIndex) => {
              const isToday = day.date.toDateString() === new Date().toDateString();
              const totalDayCalories = day.meals.reduce((sum, meal) =>
                sum + meal.foodItems.reduce((mealSum, item) => mealSum + item.calories, 0), 0
              );

              return (
                <div key={dayIndex} className={`animate-slide-up stagger-${Math.min(dayIndex + 1, 4)}`}>
                  {/* Date header */}
                  <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-gray-200">
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {isToday ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </Typography>
                      <Typography variant="caption" color="tertiary" className="ml-2">
                        {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                    </div>
                    <Typography variant="caption" color="tertiary" className="font-mono tabular-nums">
                      {totalDayCalories} cal
                    </Typography>
                  </div>

                  {/* Meals */}
                  <div className="space-y-3">
                    {day.meals.map((meal) => (
                      <MealCard
                        key={meal.id}
                        timestamp={meal.timestamp}
                        foodItems={meal.foodItems}
                        onClick={() => console.log('Meal clicked:', meal.id)}
                      />
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
