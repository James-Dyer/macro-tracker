import { Typography, Card, Button, Input } from '../components/ui';
import { useState } from 'react';

/**
 * SettingsPage - Refined settings with visual macro hints
 *
 * Features:
 * - Daily macro goals with color-coded indicators
 * - Account management
 * - Staggered card animations
 */

export function SettingsPage() {
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');
  const [carbsGoal, setCarbsGoal] = useState('250');
  const [fatGoal, setFatGoal] = useState('65');
  const [fiberGoal, setFiberGoal] = useState('30');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGoals = async () => {
    setIsSaving(true);
    console.log('Saving goals:', {
      calories: calorieGoal,
      protein: proteinGoal,
      carbs: carbsGoal,
      fat: fatGoal,
      fiber: fiberGoal,
    });
    // TODO: Save to Supabase
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleSignOut = () => {
    console.log('Signing out');
    // TODO: Implement Supabase sign out
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2" className="text-gray-900">
          Settings
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Customize your daily targets
        </Typography>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Daily Goals */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
            <Typography variant="h3" className="text-gray-900">
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
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                placeholder="2000"
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
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  placeholder="150"
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
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(e.target.value)}
                  placeholder="250"
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
                  value={fatGoal}
                  onChange={(e) => setFatGoal(e.target.value)}
                  placeholder="65"
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
                  value={fiberGoal}
                  onChange={(e) => setFiberGoal(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <Button
              title={isSaving ? 'Saving...' : 'Save Goals'}
              onClick={handleSaveGoals}
              loading={isSaving}
              size="lg"
              fullWidth
            />
          </div>
        </Card>

        {/* Account */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-2">
          <Typography variant="h3" className="mb-5 pb-4 border-b border-gray-200 text-gray-900">
            Account
          </Typography>

          <div className="space-y-5">
            <div>
              <Typography variant="label" color="secondary" className="mb-2 block">
                Email Address
              </Typography>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="body" className="font-mono text-sm">
                  user@example.com
                </Typography>
              </div>
            </div>

            <Button
              title="Sign Out"
              variant="secondary"
              onClick={handleSignOut}
              size="lg"
              fullWidth
            />
          </div>
        </Card>

        {/* App Info */}
        <Card variant="filled" padding="lg" className="animate-slide-up stagger-3">
          <Typography variant="label" color="secondary" className="mb-3 block">
            About
          </Typography>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Typography variant="bodySmall" color="tertiary">
                Version
              </Typography>
              <Typography variant="bodySmall" className="font-mono text-gray-600">
                1.0.0
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="bodySmall" color="tertiary">
                Stack
              </Typography>
              <Typography variant="bodySmall" className="font-mono text-gray-600">
                React + Vite + Supabase
              </Typography>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
