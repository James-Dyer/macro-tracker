import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { Typography } from '../ui';

export function ProtectedRoute() {
  const { session, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboarding();
  const location = useLocation();

  const loading = authLoading || onboardingLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

  // Check if user needs onboarding
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding/goals" replace />;
  }

  return <Outlet />;
}
