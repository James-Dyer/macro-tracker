import { Typography, Card, Button, Input } from '../components/ui';
import { useState, useEffect } from 'react';
import { useGoals } from '../hooks/useGoals';

/**
 * GoalsPage - Daily macro goals management
 *
 * Features:
 * - Daily macro goals with color-coded indicators (persisted to Supabase)
 * - Clean visual hierarchy with staggered animations
 */

export function GoalsPage() {
  const { goals, loading, saveGoals } = useGoals();
  const [isSaving, setIsSaving] = useState(false);

  // Form state initialized from goals
  const [formData, setFormData] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 30,
  });

  // Update form when goals load
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

  const handleSaveGoals = async () => {
    setIsSaving(true);
    try {
      await saveGoals(formData);
      console.log('Goals saved successfully');
    } catch (err) {
      console.error('Failed to save goals:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2">
          Daily Goals
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Customize your daily targets
        </Typography>
      </div>

      <div className="px-5 py-5">
        {/* Daily Goals */}
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

          <div className="space-y-5">
            {/* Calories - Full width with green accent */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <Typography variant="label" className="text-gray-700">
                  Calories
                </Typography>
              </div>
              <Input
                type="number"
                value={formData.calories.toString()}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                placeholder="2000"
                disabled={loading}
              />
            </div>

            {/* Macros - 2x2 grid with color indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-protein" />
                  <Typography variant="label" className="text-gray-700">
                    Protein (g)
                  </Typography>
                </div>
                <Input
                  type="number"
                  value={formData.protein.toString()}
                  onChange={(e) => setFormData({ ...formData, protein: parseInt(e.target.value) || 0 })}
                  placeholder="150"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-carbs" />
                  <Typography variant="label" className="text-gray-700">
                    Carbs (g)
                  </Typography>
                </div>
                <Input
                  type="number"
                  value={formData.carbs.toString()}
                  onChange={(e) => setFormData({ ...formData, carbs: parseInt(e.target.value) || 0 })}
                  placeholder="250"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-fat" />
                  <Typography variant="label" className="text-gray-700">
                    Fat (g)
                  </Typography>
                </div>
                <Input
                  type="number"
                  value={formData.fat.toString()}
                  onChange={(e) => setFormData({ ...formData, fat: parseInt(e.target.value) || 0 })}
                  placeholder="65"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-fiber" />
                  <Typography variant="label" className="text-gray-700">
                    Fiber (g)
                  </Typography>
                </div>
                <Input
                  type="number"
                  value={formData.fiber.toString()}
                  onChange={(e) => setFormData({ ...formData, fiber: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              title={isSaving ? 'Saving...' : 'Save Goals'}
              onClick={handleSaveGoals}
              loading={isSaving}
              disabled={loading || isSaving}
              size="lg"
              fullWidth
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
