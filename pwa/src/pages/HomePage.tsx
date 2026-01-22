import { Typography, MacroSummary, MealCard } from '../components/ui';

/**
 * HomePage - Daily tracking overview
 *
 * Redesigned with staggered animations and refined spacing
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
                <MealCard
                  timestamp={meal.timestamp}
                  photoUrl={meal.photoUrl}
                  foodItems={meal.foodItems}
                  onClick={() => console.log('Meal clicked:', meal.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
