import { Typography } from './Typography';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue = (v) => v.toString()
}: SliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Typography variant="label">{label}</Typography>
        <Typography variant="bodySmall" color="secondary">
          {formatValue(value)}
        </Typography>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}
