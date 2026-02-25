import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Typography, Button, Input, MacroSummarySkeleton, MealCardSkeleton, Skeleton } from '../ui';
import { supabase } from '../../services/supabase';

export function ProtectedRoute() {
  const { session, loading: authLoading, needsOnboarding, onboardingLoading, tier, tierLoading, redeemCode } = useAuth();
  const location = useLocation();

  // Invite code state — hooks must be declared before any early returns
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Pre-fill invite code from localStorage if a pending code was stored by LoginPage
  useEffect(() => {
    const pending = localStorage.getItem('pendingInviteCode');
    if (pending) setCode(pending);
  }, []);

  const loading = authLoading || onboardingLoading || tierLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-app pb-24">
        <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10">
          <Typography variant="h2">Today</Typography>
          <Skeleton className="h-3.5 w-32 mt-1" />
        </div>
        <div className="px-5 py-5 space-y-4">
          <MacroSummarySkeleton />
          <Typography variant="h3">Meals</Typography>
          <div className="space-y-3">
            <MealCardSkeleton />
            <MealCardSkeleton />
            <MealCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Block free-tier users during closed beta
  if (tier === 'free') {
    const handleApply = async () => {
      setApplying(true);
      setApplyError(null);

      const success = await redeemCode(code.trim());

      if (!success) {
        setApplyError("That code didn't work. Check it and try again.");
      }
      // On success, tier refetches automatically and this screen unmounts

      setApplying(false);
    };

    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-light flex items-center justify-center">
            <span className="text-3xl">🥗</span>
          </div>
          <div className="space-y-2">
            <Typography variant="h2">Invite Only</Typography>
            <Typography variant="body" color="secondary">
              MacroTracker is currently in closed beta. Enter your invite code to unlock access.
            </Typography>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-1">
            <Typography variant="bodySmall" color="secondary">Signed in as</Typography>
            <Typography variant="body" className="font-medium">{session.user.email}</Typography>
          </div>

          {/* Self-service invite code entry */}
          <div className="text-left space-y-3">
            <Typography variant="label" className="block text-gray-700 dark:text-gray-300">
              Have an invite code?
            </Typography>
            <Input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setApplyError(null); }}
              placeholder="Enter invite code"
              disabled={applying}
            />
            <Button
              title="Apply Code"
              onClick={handleApply}
              disabled={applying || !code.trim()}
              loading={applying}
              fullWidth
            />
            {applyError && (
              <Typography variant="bodySmall" className="text-red-600 dark:text-red-400">
                {applyError}
              </Typography>
            )}
          </div>

          <Button
            title="Sign Out"
            onClick={() => supabase.auth.signOut()}
            fullWidth
            variant="secondary"
          />
        </div>
      </div>
    );
  }

  // Check if user needs onboarding (only redirect if not loading)
  const isOnboardingRoute = location.pathname.startsWith('/dashboard/onboarding');
  if (needsOnboarding && !isOnboardingRoute && !onboardingLoading) {
    return <Navigate to="/dashboard/onboarding/goals" replace />;
  }

  return <Outlet />;
}
