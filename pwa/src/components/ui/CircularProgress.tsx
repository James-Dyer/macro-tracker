/**
 * CircularProgress - SVG-based circular progress indicator
 *
 * Creates a ring-style progress visualization reminiscent of kitchen scale dials.
 * Supports animations and color customization.
 */

interface CircularProgressProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
  showValue?: boolean;
}

export function CircularProgress({
  current,
  goal,
  size = 120,
  strokeWidth = 8,
  color,
  label,
  showValue = true,
}: CircularProgressProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />

        {/* Progress circle */}
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
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>

      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono font-bold text-2xl tabular-nums text-gray-900">
            {Math.round(current)}
          </div>
          {label && (
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">
              {label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
