import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Input, Button, Card, ButtonGroup, Slider } from '../../components/ui';
import { useGoals } from '../../hooks/useGoals';
import {
  type Goal,
  type ActivityLevel,
  type Sex,
  type WeightUnit,
  type HeightUnit,
  type UserStats,
  calculateRecommendedMacros,
} from '../../utils/macroCalculations';

type Mode = 'recommended' | 'manual';

export function OnboardingGoalsPage() {
  const navigate = useNavigate();
  const { saveGoals, loading: savingGoals } = useGoals();

  // Mode state
  const [mode, setMode] = useState<Mode>('recommended');

  // Recommended mode state
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState(180);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(10);
  const [heightCm, setHeightCm] = useState(178);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('ft-in');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [proteinBias, setProteinBias] = useState(0.30);

  // Manual mode state
  const [manualCalories, setManualCalories] = useState(2000);
  const [manualProtein, setManualProtein] = useState(150);
  const [manualCarbs, setManualCarbs] = useState(200);
  const [manualFat, setManualFat] = useState(65);
  const [manualFiber, setManualFiber] = useState(25);

  // Calculate recommended macros
  const calculatedMacros = useMemo(() => {
    if (mode !== 'recommended') return null;

    const height = heightUnit === 'ft-in'
      ? heightFeet * 12 + heightInches
      : heightCm;

    const stats: UserStats = {
      age,
      sex,
      weight,
      weightUnit,
      height,
      heightUnit,
      goal,
      activityLevel,
      proteinBias,
    };

    return calculateRecommendedMacros(stats);
  }, [age, sex, weight, weightUnit, heightFeet, heightInches, heightCm, heightUnit, goal, activityLevel, proteinBias, mode]);

  const handleContinue = async () => {
    const macros = mode === 'recommended' && calculatedMacros
      ? calculatedMacros
      : {
          calories: manualCalories,
          protein: manualProtein,
          carbs: manualCarbs,
          fat: manualFat,
          fiber: manualFiber,
        };

    try {
      await saveGoals(macros);
      navigate('/onboarding/how-it-works');
    } catch (error) {
      console.error('Failed to save goals:', error);
      // Error is shown via useGoals error state
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Typography variant="h2" className="text-center">
            Set Your Daily Goals
          </Typography>
          <Typography variant="bodySmall" color="secondary" className="text-center mt-2">
            Personalized nutrition targets to help you succeed
          </Typography>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        {/* Mode Tabs */}
        <div className="flex gap-3 mb-8 animate-fade-in">
          <button
            onClick={() => setMode('recommended')}
            className={`
              flex-1 py-4 px-6 rounded-2xl font-semibold text-sm transition-all duration-300
              ${mode === 'recommended'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
              }
            `}
          >
            ✨ Recommended
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`
              flex-1 py-4 px-6 rounded-2xl font-semibold text-sm transition-all duration-300
              ${mode === 'manual'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
              }
            `}
          >
            ⚙️ Manual
          </button>
        </div>

        {/* Recommended Mode */}
        {mode === 'recommended' && (
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card className="animate-slide-up stagger-1">
              <Typography variant="h3" className="mb-6 text-gray-800">
                About You
              </Typography>

              <div className="space-y-5">
                {/* Age */}
                <div>
                  <Typography variant="label" className="mb-2 block">
                    Age
                  </Typography>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    placeholder="30"
                    min={13}
                    max={100}
                  />
                </div>

                {/* Sex */}
                <div>
                  <Typography variant="label" className="mb-2 block">
                    Sex
                  </Typography>
                  <ButtonGroup
                    options={[
                      { value: 'male' as const, label: 'Male' },
                      { value: 'female' as const, label: 'Female' },
                    ]}
                    value={sex}
                    onChange={setSex}
                    columns={2}
                  />
                </div>

                {/* Weight */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Typography variant="label">Weight</Typography>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setWeightUnit('lbs')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          weightUnit === 'lbs'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        lbs
                      </button>
                      <button
                        onClick={() => setWeightUnit('kg')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          weightUnit === 'kg'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        kg
                      </button>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    placeholder={weightUnit === 'lbs' ? '180' : '82'}
                    min={50}
                    max={500}
                  />
                </div>

                {/* Height */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Typography variant="label">Height</Typography>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setHeightUnit('ft-in')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          heightUnit === 'ft-in'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        ft/in
                      </button>
                      <button
                        onClick={() => setHeightUnit('cm')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          heightUnit === 'cm'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        cm
                      </button>
                    </div>
                  </div>
                  {heightUnit === 'ft-in' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          type="number"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(Number(e.target.value))}
                          placeholder="5"
                          min={3}
                          max={8}
                          label="Feet"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={heightInches}
                          onChange={(e) => setHeightInches(Number(e.target.value))}
                          placeholder="10"
                          min={0}
                          max={11}
                          label="Inches"
                        />
                      </div>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      placeholder="178"
                      min={100}
                      max={250}
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Goal Card */}
            <Card className="animate-slide-up stagger-2">
              <Typography variant="h3" className="mb-6 text-gray-800">
                Your Goal
              </Typography>

              <div className="space-y-5">
                <div>
                  <Typography variant="label" className="mb-2 block">
                    What do you want to achieve?
                  </Typography>
                  <ButtonGroup
                    options={[
                      { value: 'lose' as const, label: 'Lose Weight' },
                      { value: 'maintain' as const, label: 'Maintain' },
                      { value: 'gain' as const, label: 'Gain Weight' },
                    ]}
                    value={goal}
                    onChange={setGoal}
                    columns={3}
                  />
                </div>

                <div>
                  <Typography variant="label" className="mb-2 block">
                    Activity Level
                  </Typography>
                  <ButtonGroup
                    options={[
                      { value: 'sedentary' as const, label: 'Sedentary' },
                      { value: 'moderate' as const, label: 'Moderate' },
                      { value: 'active' as const, label: 'Active' },
                    ]}
                    value={activityLevel}
                    onChange={setActivityLevel}
                    columns={3}
                  />
                  <Typography variant="bodySmall" color="secondary" className="mt-2">
                    {activityLevel === 'sedentary' && 'Little to no exercise'}
                    {activityLevel === 'moderate' && '3-5 days/week exercise'}
                    {activityLevel === 'active' && '6-7 days/week intense exercise'}
                  </Typography>
                </div>
              </div>
            </Card>

            {/* Advanced Settings */}
            <div className="animate-slide-up stagger-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-3 px-4 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-emerald-50 transition-all text-sm font-medium text-gray-600 hover:text-primary flex items-center justify-center gap-2"
              >
                {showAdvanced ? '▼' : '▶'} Advanced Settings
              </button>

              {showAdvanced && (
                <Card className="mt-3 animate-scale-in">
                  <Slider
                    label="Protein Preference"
                    value={proteinBias}
                    onChange={setProteinBias}
                    min={0.25}
                    max={0.35}
                    step={0.01}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />
                  <Typography variant="bodySmall" color="secondary" className="mt-2">
                    Higher protein helps with satiety and muscle preservation
                  </Typography>
                </Card>
              )}
            </div>

            {/* Live Preview Card */}
            {calculatedMacros && (
              <Card className="bg-gradient-to-br from-primary to-emerald-600 text-white animate-slide-up stagger-4">
                <Typography variant="h3" className="mb-4 text-white">
                  Your Daily Targets
                </Typography>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Typography variant="bodySmall" className="text-emerald-100 mb-1">
                      Calories
                    </Typography>
                    <Typography variant="h2" className="text-white tabular-nums">
                      {calculatedMacros.calories}
                    </Typography>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Typography variant="bodySmall" className="text-blue-100 mb-1">
                      Protein
                    </Typography>
                    <Typography variant="h2" className="text-white tabular-nums">
                      {calculatedMacros.protein}g
                    </Typography>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Typography variant="bodySmall" className="text-amber-100 mb-1">
                      Carbs
                    </Typography>
                    <Typography variant="h2" className="text-white tabular-nums">
                      {calculatedMacros.carbs}g
                    </Typography>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Typography variant="bodySmall" className="text-red-100 mb-1">
                      Fat
                    </Typography>
                    <Typography variant="h2" className="text-white tabular-nums">
                      {calculatedMacros.fat}g
                    </Typography>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <Typography variant="bodySmall" className="text-emerald-100">
                      Fiber
                    </Typography>
                    <Typography variant="body" className="text-white font-semibold tabular-nums">
                      {calculatedMacros.fiber}g
                    </Typography>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <div className="space-y-6">
            <Card className="animate-slide-up">
              <Typography variant="h3" className="mb-6 text-gray-800">
                Enter Your Goals
              </Typography>

              <div className="space-y-5">
                <Input
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(Number(e.target.value))}
                  label="Daily Calories"
                  placeholder="2000"
                  min={1000}
                  max={5000}
                />

                <Input
                  type="number"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(Number(e.target.value))}
                  label="Protein (g)"
                  placeholder="150"
                  min={0}
                  max={500}
                />

                <Input
                  type="number"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(Number(e.target.value))}
                  label="Carbohydrates (g)"
                  placeholder="200"
                  min={0}
                  max={1000}
                />

                <Input
                  type="number"
                  value={manualFat}
                  onChange={(e) => setManualFat(Number(e.target.value))}
                  label="Fat (g)"
                  placeholder="65"
                  min={0}
                  max={300}
                />

                <Input
                  type="number"
                  value={manualFiber}
                  onChange={(e) => setManualFiber(Number(e.target.value))}
                  label="Fiber (g)"
                  placeholder="25"
                  min={0}
                  max={100}
                />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 safe-area-pb">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Button
            title={savingGoals ? 'Saving...' : 'Continue'}
            onClick={handleContinue}
            disabled={savingGoals}
            fullWidth
            size="lg"
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
