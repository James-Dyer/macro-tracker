import { Typography } from './Typography';

/**
 * ProgressBar component for visualizing macro progress.
 *
 * Features:
 * - Color-coded by macro type
 * - Shows current/goal values
 * - Overflow indication (turns red when over goal)
 * - Optional label and value display
 */

type MacroType = 'protein' | 'carbs' | 'fat' | 'fiber' | 'calories';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  current: number;
  goal: number;
  macroType: MacroType;
  label?: string;
  showValues?: boolean;
  size?: ProgressSize;
  className?: string;
}

const macroColors: Record<MacroType, string> = {
  protein: 'bg-protein',
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  fiber: 'bg-fiber',
  calories: 'bg-gray-500',
};

const macroUnits: Record<MacroType, string> = {
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
  calories: '',
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  current,
  goal,
  macroType,
  label,
  showValues = true,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOverGoal = current > goal;
  const barColor = isOverGoal ? 'bg-red-500' : macroColors[macroType];
  const unit = macroUnits[macroType];

  return (
    <div className={className}>
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <Typography variant="label" color="secondary">
              {label}
            </Typography>
          )}
          {showValues && (
            <Typography
              variant="bodySmall"
              color={isOverGoal ? 'error' : 'secondary'}
            >
              {Math.round(current)}{unit} / {Math.round(goal)}{unit}
            </Typography>
          )}
        </div>
      )}

      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${barColor} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
