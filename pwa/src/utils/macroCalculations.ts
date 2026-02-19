export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female';
export type WeightUnit = 'lbs' | 'kg';
export type HeightUnit = 'ft-in' | 'cm';

export interface UserStats {
  age: number;
  sex: Sex;
  weight: number;
  weightUnit: WeightUnit;
  height: number; // in cm or total inches
  heightUnit: HeightUnit;
  goal: Goal;
  activityLevel: ActivityLevel;
  proteinBias?: number; // 0.25 to 0.35
}

export interface CalculatedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Convert weight to kg
function convertWeightToKg(weight: number, unit: WeightUnit): number {
  return unit === 'lbs' ? weight * 0.453592 : weight;
}

// Convert height to cm
function convertHeightToCm(height: number, unit: HeightUnit): number {
  // If unit is ft-in, height is in total inches
  return unit === 'ft-in' ? height * 2.54 : height;
}

// Mifflin-St Jeor BMR calculation
function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateRecommendedMacros(
  stats: UserStats
): CalculatedMacros {
  const weightKg = convertWeightToKg(stats.weight, stats.weightUnit);
  const heightCm = convertHeightToCm(stats.height, stats.heightUnit);

  // Calculate BMR
  const bmr = calculateBMR(weightKg, heightCm, stats.age, stats.sex);

  // Apply activity multiplier
  // Standard Mifflin-St Jeor activity multipliers (5-level scale)
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary:  1.2,    // Desk job, little/no exercise
    light:      1.375,  // Light exercise 1–3 days/week
    moderate:   1.55,   // Moderate exercise 3–5 days/week
    active:     1.725,  // Hard exercise 6–7 days/week
    very_active: 1.9,   // Very hard exercise or physical job
  };
  const tdee = bmr * activityMultipliers[stats.activityLevel];

  // Apply goal adjustment
  const goalAdjustments: Record<Goal, number> = {
    lose: -500,
    maintain: 0,
    gain: 500,
  };
  const calories = Math.round(tdee + goalAdjustments[stats.goal]);

  // Calculate macros
  const proteinBias = stats.proteinBias ?? 0.30;
  const proteinCalories = calories * proteinBias;
  const protein = Math.round(proteinCalories / 4);

  const fatCalories = calories * 0.25;
  const fat = Math.round(fatCalories / 9);

  const remainingCalories = calories - proteinCalories - fatCalories;
  const carbs = Math.round(remainingCalories / 4);

  const fiber = Math.round((calories / 1000) * 12);

  return { calories, protein, carbs, fat, fiber };
}
