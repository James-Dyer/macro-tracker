import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Typography } from '../ui';

export function ProtectedRoute() {
  const { session, loading: authLoading, needsOnboarding, onboardingLoading } = useAuth();
  const location = useLocation();

  console.log('[STATE DEBUG] ProtectedRoute sees:', {
    pathname: location.pathname,
    needsOnboarding,
    onboardingLoading
  });

  const loading = authLoading || onboardingLoading;

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

  // Check if user needs onboarding (only redirect if not loading)
  const isOnboardingRoute = location.pathname.startsWith('/dashboard/onboarding');
  if (needsOnboarding && !isOnboardingRoute && !onboardingLoading) {
    return <Navigate to="/dashboard/onboarding/goals" replace />;
  }

  return <Outlet />;
}
