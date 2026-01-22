import { Typography } from './Typography';
import { Card } from './Card';

/**
 * MealCard component for displaying a logged meal.
 *
 * Shows:
 * - Meal photo thumbnail (if available)
 * - Time and total calories
 * - Food items list (shows 3, truncates with "+X more")
 * - Macro pills showing P/C/F values with color coding
 */

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight_g: number;
}

interface MealCardProps {
  timestamp: Date;
  photoUrl?: string;
  foodItems: FoodItem[];
  onClick?: () => void;
}

const macroColors = {
  protein: 'bg-protein/10 text-protein',
  carbs: 'bg-carbs/10 text-carbs',
  fat: 'bg-fat/10 text-fat',
};

export function MealCard({ timestamp, photoUrl, foodItems, onClick }: MealCardProps) {
  const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);

  const timeString = timestamp.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card
      variant="elevated"
      padding="none"
      className={onClick ? 'cursor-pointer active:bg-gray-50' : ''}
      onClick={onClick}
    >
      <div className="flex">
        {/* Photo thumbnail */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Meal"
            className="w-20 h-20 object-cover rounded-l-xl"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-l-xl flex items-center justify-center">
            <Typography variant="caption" color="tertiary">
              No photo
            </Typography>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-2">
          {/* Header */}
          <div className="flex justify-between items-center mb-1">
            <Typography variant="label" color="primary">
              {timeString}
            </Typography>
            <Typography variant="body" color="primary">
              {totalCalories} cal
            </Typography>
          </div>

          {/* Food items */}
          <div className="mb-2">
            {foodItems.slice(0, 3).map((item, index) => (
              <Typography
                key={index}
                variant="bodySmall"
                color="secondary"
                className="truncate"
              >
                {item.name} ({item.weight_g}g)
              </Typography>
            ))}
            {foodItems.length > 3 && (
              <Typography variant="caption" color="tertiary">
                +{foodItems.length - 3} more items
              </Typography>
            )}
          </div>

          {/* Macro pills */}
          <div className="flex gap-1">
            <MacroPill label="P" value={totalProtein} color="protein" />
            <MacroPill label="C" value={totalCarbs} color="carbs" />
            <MacroPill label="F" value={totalFat} color="fat" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface MacroPillProps {
  label: string;
  value: number;
  color: keyof typeof macroColors;
}

function MacroPill({ label, value, color }: MacroPillProps) {
  return (
    <div className={`px-2 py-0.5 rounded ${macroColors[color]}`}>
      <Typography variant="caption">
        {label}: {Math.round(value)}g
      </Typography>
    </div>
  );
}
