import { Typography, MealCard } from '../components/ui';

/**
 * HistoryPage - View past meals
 *
 * Shows meals grouped by date
 */

export function HistoryPage() {
  // Mock data - will be replaced with real data from Supabase
  const mealsByDate = [
    {
      date: new Date(2024, 0, 21),
      meals: [
        {
          id: '1',
          timestamp: new Date(2024, 0, 21, 8, 30),
          foodItems: [
            {
              name: 'Oatmeal with Berries',
              calories: 350,
              protein: 12,
              carbs: 58,
              fat: 8,
              weight_g: 250,
            },
          ],
        },
        {
          id: '2',
          timestamp: new Date(2024, 0, 21, 12, 15),
          foodItems: [
            {
              name: 'Chicken Salad',
              calories: 420,
              protein: 38,
              carbs: 22,
              fat: 18,
              weight_g: 320,
            },
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
            {
              name: 'Turkey Sandwich',
              calories: 380,
              protein: 28,
              carbs: 42,
              fat: 10,
              weight_g: 280,
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <Typography variant="h2">History</Typography>
        <Typography variant="bodySmall" color="secondary">
          View your past meals
        </Typography>
      </div>

      {/* Meals by Date */}
      <div className="p-4">
        {mealsByDate.length === 0 ? (
          <div className="text-center py-12">
            <Typography variant="body" color="tertiary">
              No meals logged yet
            </Typography>
          </div>
        ) : (
          <div className="space-y-6">
            {mealsByDate.map((day, index) => (
              <div key={index}>
                <div className="mb-3">
                  <Typography variant="label" color="secondary">
                    {day.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                  <Typography variant="caption" color="tertiary" className="ml-2">
                    {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'}
                  </Typography>
                </div>

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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
