import { Card } from './Card';

/**
 * MealCard - Redesigned with better visual hierarchy
 *
 * Layout: Photo + stacked content with macro badges
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
  thumbnailUrl?: string;  // Optimized thumbnail (preferred for list views)
  foodItems: FoodItem[];
  onClick?: () => void;
}

const macroConfig = {
  protein: { color: '#2563eb', bg: '#eff6ff', label: 'P' },
  carbs: { color: '#f59e0b', bg: '#fffbeb', label: 'C' },
  fat: { color: '#dc2626', bg: '#fef2f2', label: 'F' },
};

export function MealCard({ timestamp, photoUrl, thumbnailUrl, foodItems, onClick }: MealCardProps) {
  const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);

  const timeString = timestamp.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Prefer thumbnail for performance, fallback to full photo
  const displayUrl = thumbnailUrl || photoUrl;

  return (
    <Card
      variant="elevated"
      padding="none"
      className={`
        overflow-hidden transition-all duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        hover:shadow-lg
      `}
      onClick={onClick}
    >
      <div className="flex gap-3 p-3 bg-elevated">
        {/* Photo thumbnail */}
        {displayUrl ? (
          <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-100">
            <img
              src={displayUrl}
              alt="Meal"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {timeString}
              </div>
            </div>
            <div className="font-mono text-lg font-bold tabular-nums text-gray-900">
              {totalCalories}
              <span className="text-xs text-gray-400 font-normal ml-0.5">cal</span>
            </div>
          </div>

          {/* Food items */}
          <div className="mb-2 space-y-0.5">
            {foodItems.slice(0, 2).map((item, index) => (
              <div key={index} className="text-sm text-gray-600 truncate">
                {item.name}
                <span className="text-gray-400 text-xs ml-1">({item.weight_g}g)</span>
              </div>
            ))}
            {foodItems.length > 2 && (
              <div className="text-xs text-gray-400 font-medium">
                +{foodItems.length - 2} more
              </div>
            )}
          </div>

          {/* Macro badges */}
          <div className="flex gap-1.5">
            <MacroBadge value={totalProtein} type="protein" />
            <MacroBadge value={totalCarbs} type="carbs" />
            <MacroBadge value={totalFat} type="fat" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface MacroBadgeProps {
  value: number;
  type: 'protein' | 'carbs' | 'fat';
}

function MacroBadge({ value, type }: MacroBadgeProps) {
  const config = macroConfig[type];

  return (
    <div
      className="px-2 py-0.5 rounded text-xs font-mono font-semibold tabular-nums"
      style={{
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {config.label} {Math.round(value)}
    </div>
  );
}
