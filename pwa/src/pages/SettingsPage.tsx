import { Typography, Card, Button, Input } from '../components/ui';
import { useState } from 'react';

/**
 * SettingsPage - User settings and goals
 *
 * Features:
 * - Set daily macro goals
 * - Account settings
 * - Sign out
 */

export function SettingsPage() {
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');
  const [carbsGoal, setCarbsGoal] = useState('250');
  const [fatGoal, setFatGoal] = useState('65');
  const [fiberGoal, setFiberGoal] = useState('30');

  const handleSaveGoals = () => {
    console.log('Saving goals:', {
      calories: calorieGoal,
      protein: proteinGoal,
      carbs: carbsGoal,
      fat: fatGoal,
      fiber: fiberGoal,
    });
    // TODO: Save to Supabase
  };

  const handleSignOut = () => {
    console.log('Signing out');
    // TODO: Implement Supabase sign out
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <Typography variant="h2">Settings</Typography>
      </div>

      <div className="p-4 space-y-6">
        {/* Daily Goals */}
        <Card padding="lg">
          <Typography variant="h3" className="mb-4">
            Daily Goals
          </Typography>

          <div className="space-y-4">
            <Input
              label="Calories"
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              placeholder="2000"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Protein (g)"
                type="number"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                placeholder="150"
              />
              <Input
                label="Carbs (g)"
                type="number"
                value={carbsGoal}
                onChange={(e) => setCarbsGoal(e.target.value)}
                placeholder="250"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fat (g)"
                type="number"
                value={fatGoal}
                onChange={(e) => setFatGoal(e.target.value)}
                placeholder="65"
              />
              <Input
                label="Fiber (g)"
                type="number"
                value={fiberGoal}
                onChange={(e) => setFiberGoal(e.target.value)}
                placeholder="30"
              />
            </div>

            <Button
              title="Save Goals"
              onClick={handleSaveGoals}
              fullWidth
            />
          </div>
        </Card>

        {/* Account */}
        <Card padding="lg">
          <Typography variant="h3" className="mb-4">
            Account
          </Typography>

          <div className="space-y-4">
            <div>
              <Typography variant="label" color="secondary" className="mb-1">
                Email
              </Typography>
              <Typography variant="body">user@example.com</Typography>
            </div>

            <Button
              title="Sign Out"
              variant="secondary"
              onClick={handleSignOut}
              fullWidth
            />
          </div>
        </Card>

        {/* App Info */}
        <Card padding="lg" variant="filled">
          <Typography variant="label" color="secondary" className="mb-2">
            About
          </Typography>
          <Typography variant="bodySmall" color="tertiary">
            MacroTracker v1.0.0
          </Typography>
          <Typography variant="caption" color="tertiary" className="mt-1">
            Built with React + Vite + Supabase
          </Typography>
        </Card>
      </div>
    </div>
  );
}
