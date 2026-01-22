import { Typography, MacroSummary, MealCard } from '../components/ui';

/**
 * HomePage - Daily tracking overview
 *
 * Shows:
 * - Today's macro summary
 * - List of today's meals
 * - Quick access to log new meal
 */

export function HomePage() {
  // Mock data - will be replaced with real data from Supabase
  const todayMacros = {
    calories: { current: 1450, goal: 2000 },
    protein: { current: 95, goal: 150 },
    carbs: { current: 180, goal: 250 },
    fat: { current: 45, goal: 65 },
    fiber: { current: 18, goal: 30 },
  };

  const todayMeals = [
    {
      id: '1',
      timestamp: new Date(2024, 0, 21, 8, 30),
      photoUrl: undefined,
      foodItems: [
        {
          name: 'Oatmeal with Berries',
          calories: 350,
          protein: 12,
          carbs: 58,
          fat: 8,
          weight_g: 250,
        },
        {
          name: 'Greek Yogurt',
          calories: 150,
          protein: 15,
          carbs: 8,
          fat: 5,
          weight_g: 170,
        },
      ],
    },
    {
      id: '2',
      timestamp: new Date(2024, 0, 21, 12, 15),
      photoUrl: undefined,
      foodItems: [
        {
          name: 'Grilled Chicken Breast',
          calories: 284,
          protein: 53,
          carbs: 0,
          fat: 6,
          weight_g: 170,
        },
        {
          name: 'Brown Rice',
          calories: 216,
          protein: 5,
          carbs: 45,
          fat: 2,
          weight_g: 195,
        },
        {
          name: 'Steamed Broccoli',
          calories: 55,
          protein: 4,
          carbs: 11,
          fat: 1,
          weight_g: 156,
        },
      ],
    },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <Typography variant="h2">Today</Typography>
        <Typography variant="bodySmall" color="secondary">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </div>

      {/* Macro Summary */}
      <div className="p-4">
        <MacroSummary {...todayMacros} />
      </div>

      {/* Meals List */}
      <div className="px-4">
        <Typography variant="h3" className="mb-4">
          Meals
        </Typography>

        {todayMeals.length === 0 ? (
          <div className="text-center py-8">
            <Typography variant="body" color="tertiary">
              No meals logged yet today
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                timestamp={meal.timestamp}
                photoUrl={meal.photoUrl}
                foodItems={meal.foodItems}
                onClick={() => console.log('Meal clicked:', meal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
