import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Typography, Button } from '../ui';
import { supabase } from '../../services/supabase';

export function ProtectedRoute() {
  const { session, loading: authLoading, needsOnboarding, onboardingLoading, tier, tierLoading } = useAuth();
  const location = useLocation();

  const loading = authLoading || onboardingLoading || tierLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <Typography variant="body" color="secondary">
            Loading...
          </Typography>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Block free-tier users during closed beta
  if (tier === 'free') {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-light flex items-center justify-center">
            <span className="text-3xl">🥗</span>
          </div>
          <div className="space-y-2">
            <Typography variant="h2">Invite Only</Typography>
            <Typography variant="body" color="secondary">
              MacroTracker is currently in closed beta. You'll need an invite code to access the app.
            </Typography>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-1">
            <Typography variant="bodySmall" color="secondary">Signed in as</Typography>
            <Typography variant="body" className="font-medium">{session.user.email}</Typography>
          </div>
          <Typography variant="bodySmall" color="secondary">
            Have an invite link? Sign out and use it to create a new account, or contact us to have your existing account upgraded.
          </Typography>
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
