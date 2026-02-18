import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { LogMealPage } from './pages/LogMealPage';
import { ConfirmMealPage } from './pages/ConfirmMealPage';
import { HistoryPage } from './pages/HistoryPage';
import { GoalsPage } from './pages/GoalsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingGoalsPage } from './pages/onboarding/OnboardingGoalsPage';
import { OnboardingHowItWorksPage } from './pages/onboarding/OnboardingHowItWorksPage';
import { OnboardingFirstMealPage } from './pages/onboarding/OnboardingFirstMealPage';
import { cleanupExpiredCaches, getCacheStats } from './utils/cacheManager';

/**
 * App - Main application component
 *
 * Public routes:
 * - / : LandingPage (marketing/home)
 * - /login : LoginPage (authentication)
 *
 * Protected routes (require auth):
 * - /dashboard/onboarding/goals : OnboardingGoalsPage (required - no bottom nav)
 * - /dashboard/onboarding/how-it-works : OnboardingHowItWorksPage (optional - with bottom nav)
 * - /dashboard/onboarding/first-meal : OnboardingFirstMealPage (optional - with bottom nav)
 * - /dashboard : HomePage (daily summary)
 * - /dashboard/log : LogMealPage (camera/photo capture)
 * - /dashboard/confirm : ConfirmMealPage (review AI results - new meal)
 * - /dashboard/confirm/:mealId : ConfirmMealPage (edit existing meal)
 * - /dashboard/history : HistoryPage (past meals)
 * - /dashboard/goals : GoalsPage (daily macro goals)
 * - /dashboard/settings : SettingsPage (account management)
 */

function App() {
  // Clean up expired caches on app initialization
  // Why: Prevents localStorage quota issues and ensures fresh data on startup
  useEffect(() => {
    cleanupExpiredCaches();

    // Log cache stats in dev mode
    if (import.meta.env.DEV) {
      const stats = getCacheStats();
      console.log('[App] Cache stats after cleanup:', {
        totalCaches: stats.totalCaches,
        expiredCaches: stats.expiredCaches,
        cacheSizeKB: (stats.cacheSizeBytes / 1024).toFixed(1),
      });
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename="/macro-tracker">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Required onboarding step - no AppLayout (no bottom nav) */}
            <Route path="/dashboard/onboarding/goals" element={<OnboardingGoalsPage />} />

            {/* Main app routes - with AppLayout (bottom nav) */}
            <Route element={<AppLayout />}>
              {/* Optional onboarding steps */}
              <Route path="/dashboard/onboarding/how-it-works" element={<OnboardingHowItWorksPage />} />
              <Route path="/dashboard/onboarding/first-meal" element={<OnboardingFirstMealPage />} />

              {/* Main app pages */}
              <Route path="/dashboard" element={<HomePage />} />
              <Route path="/dashboard/log" element={<LogMealPage />} />
              <Route path="/dashboard/confirm/:mealId?" element={<ConfirmMealPage />} />
              <Route path="/dashboard/history" element={<HistoryPage />} />
              <Route path="/dashboard/goals" element={<GoalsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
