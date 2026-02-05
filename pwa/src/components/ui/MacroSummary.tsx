import { Typography } from './Typography';
import { Card } from './Card';

/**
 * MacroSummary component - Redesigned with circular progress rings
 *
 * Visual approach: Kitchen scale dial aesthetic with precision data display
 */

interface MacroData {
  current: number;
  goal: number;
}

interface MacroSummaryProps {
  calories: MacroData;
  protein: MacroData;
  carbs: MacroData;
  fat: MacroData;
  fiber: MacroData;
}

const macroConfig = {
  protein: { color: '#2563eb', label: 'Protein' },
  carbs: { color: '#f59e0b', label: 'Carbs' },
  fat: { color: '#dc2626', label: 'Fat' },
  fiber: { color: '#7c3aed', label: 'Fiber' },
};

export function MacroSummary({
  calories,
  protein,
  carbs,
  fat,
  fiber,
}: MacroSummaryProps) {
  const caloriesRemaining = calories.goal - calories.current;
  const isOverCalories = caloriesRemaining < 0;
  const caloriesPercentage = (calories.current / calories.goal) * 100;

  return (
    <Card variant="elevated" padding="lg" className="animate-scale-in relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative mb-6">
        <Typography variant="h3" className="text-themed">
          Calories
        </Typography>
        <div className="-mt-0.5 flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-themed-tertiary">
            Goal:
          </span>
          <span className="font-mono text-sm font-bold tabular-nums text-themed-tertiary">
            {Math.round(calories.goal)}
          </span>
        </div>
      </div>

      {/* Main calorie display */}
      <div className="text-center mb-6 relative">
        <div className="inline-block relative">
          {/* Large calorie ring */}
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-200 dark:text-gray-900"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={isOverCalories ? '#dc2626' : '#16a34a'}
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - Math.min(caloriesPercentage, 100) / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{
                filter: `drop-shadow(0 0 12px ${isOverCalories ? '#dc262640' : '#16a34a40'})`,
              }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`font-mono text-5xl font-bold tabular-nums leading-none ${
                isOverCalories ? 'text-red-600 dark:text-red-400' : 'text-themed'
              }`}
            >
              {Math.round(caloriesRemaining)}
            </div>
            <div className="text-xs font-semibold text-themed-secondary uppercase tracking-wider mt-2">
              remaining
            </div>
          </div>
        </div>
      </div>

      {/* Macro rings grid */}
      <div className="grid grid-cols-4 gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
        <MacroRing {...protein} {...macroConfig.protein} />
        <MacroRing {...carbs} {...macroConfig.carbs} />
        <MacroRing {...fat} {...macroConfig.fat} />
        <MacroRing {...fiber} {...macroConfig.fiber} />
      </div>
    </Card>
  );
}

interface MacroRingProps extends MacroData {
  color: string;
  label: string;
}

function MacroRing({ current, goal, color, label }: MacroRingProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const size = 72;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center animate-slide-up">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-900"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono font-bold text-sm tabular-nums" style={{ color }}>
            {Math.round(current)}
          </div>
        </div>
      </div>

      {/* Label below ring */}
      <div className="mt-2 text-center">
        <div className="text-xs font-medium text-themed-secondary uppercase tracking-wide">
          {label}
        </div>
        <div className="text-xs text-themed-tertiary font-mono tabular-nums mt-0.5">
          / {goal}g
        </div>
      </div>
    </div>
  );
}
