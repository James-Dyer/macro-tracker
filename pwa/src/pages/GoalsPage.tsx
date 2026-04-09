import { Typography, Card, Button } from '../components/ui';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCachedGoals } from '../hooks/useCachedGoals';

/**
 * GoalsPage - Daily macro goals display
 *
 * Goals are view-only here. Tap "Edit Goals" to open the full
 * calculator (OnboardingGoalsPage in edit mode), which navigates
 * back here with { goalsUpdated: true } so the cache is refreshed.
 */

export function GoalsPage() {
  const { goals, loading, refetch } = useCachedGoals();
  const navigate = useNavigate();
  const location = useLocation();

  // Form data kept in state so we can pass current values to the calculator
  const [formData, setFormData] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 30,
  });

  // Sync display values when goals load from cache/server
  useEffect(() => {
    if (goals) {
      setFormData({
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
        fiber: goals.fiber,
      });
    }
  }, [goals]);

  // When returning from the calculator after a save, refresh the cache
  // then wipe the state flag so repeated back-navigation doesn't re-trigger
  useEffect(() => {
    if ((location.state as { goalsUpdated?: boolean } | null)?.goalsUpdated) {
      refetch();
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate, refetch]);

  const macroRows = [
    { label: 'Calories', value: `${formData.calories} kcal`, colorClass: 'bg-primary' },
    { label: 'Protein',  value: `${formData.protein}g`,      colorClass: 'bg-protein' },
    { label: 'Carbs',    value: `${formData.carbs}g`,        colorClass: 'bg-carbs'   },
    { label: 'Fat',      value: `${formData.fat}g`,          colorClass: 'bg-fat'     },
    { label: 'Fiber',    value: `${formData.fiber}g`,        colorClass: 'bg-fiber'   },
  ];

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2">
          Daily Goals
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Your current nutrition targets
        </Typography>
      </div>

      <div className="px-5 py-5">
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-themed">
            <Typography variant="h3">
              Daily Goals
            </Typography>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-protein" />
              <div className="w-2 h-2 rounded-full bg-carbs" />
              <div className="w-2 h-2 rounded-full bg-fat" />
              <div className="w-2 h-2 rounded-full bg-fiber" />
            </div>
          </div>

          {/* Read-only macro rows */}
          <div className="space-y-4 mb-6">
            {macroRows.map(({ label, value, colorClass }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClass}`} />
                  <Typography variant="body" className="text-themed">
                    {label}
                  </Typography>
                </div>
                <Typography variant="body" className="tabular-nums font-semibold text-themed">
                  {loading ? '—' : value}
                </Typography>
              </div>
            ))}
          </div>

          <Button
            title="Edit Goals"
            onClick={() =>
              navigate('/dashboard/onboarding/goals', {
                state: { editMode: true, currentGoals: formData },
              })
            }
            disabled={loading}
            size="lg"
            fullWidth
          />
        </Card>
      </div>
    </div>
  );
}
