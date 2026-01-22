import { Typography } from './Typography';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

/**
 * MacroSummary component for displaying daily macro overview.
 *
 * Shows:
 * - Calories prominently with remaining/over status
 * - Progress bar for calories
 * - Grid of 4 macros (protein, carbs, fat, fiber) with mini progress bars
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

const macroColors: Record<string, string> = {
  protein: 'bg-protein',
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  fiber: 'bg-fiber',
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

  return (
    <Card variant="elevated" padding="lg">
      {/* Calories - Primary display */}
      <div className="text-center mb-4">
        <div className="flex items-baseline justify-center">
          <Typography variant="h1" color="primary">
            {Math.round(calories.current)}
          </Typography>
          <Typography variant="bodySmall" color="tertiary" className="ml-1">
            / {Math.round(calories.goal)} cal
          </Typography>
        </div>

        <Typography
          variant="body"
          color={isOverCalories ? 'error' : 'secondary'}
        >
          {isOverCalories
            ? `${Math.abs(Math.round(caloriesRemaining))} over`
            : `${Math.round(caloriesRemaining)} remaining`}
        </Typography>
      </div>

      {/* Calories progress bar */}
      <ProgressBar
        current={calories.current}
        goal={calories.goal}
        macroType="calories"
        showValues={false}
        size="lg"
        className="mb-6"
      />

      {/* Macro breakdown */}
      <div className="grid grid-cols-4 gap-2">
        <MacroItem label="Protein" current={protein.current} goal={protein.goal} color="protein" />
        <MacroItem label="Carbs" current={carbs.current} goal={carbs.goal} color="carbs" />
        <MacroItem label="Fat" current={fat.current} goal={fat.goal} color="fat" />
        <MacroItem label="Fiber" current={fiber.current} goal={fiber.goal} color="fiber" />
      </div>
    </Card>
  );
}

interface MacroItemProps {
  label: string;
  current: number;
  goal: number;
  color: keyof typeof macroColors;
}

function MacroItem({ label, current, goal, color }: MacroItemProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-1">
        <div className={`w-2 h-2 rounded-full mr-1 ${macroColors[color]}`} />
        <Typography variant="caption" color="secondary">
          {label}
        </Typography>
      </div>
      <Typography variant="label" color="primary">
        {Math.round(current)}g
      </Typography>
      <Typography variant="caption" color="tertiary">
        / {Math.round(goal)}g
      </Typography>
      <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full ${macroColors[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
