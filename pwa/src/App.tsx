import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
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

/**
 * App - Main application component
 *
 * Public routes:
 * - /login : LoginPage (authentication)
 *
 * Protected routes (require auth):
 * - /onboarding/goals : OnboardingGoalsPage (required - no bottom nav)
 * - /onboarding/how-it-works : OnboardingHowItWorksPage (optional - with bottom nav)
 * - /onboarding/first-meal : OnboardingFirstMealPage (optional - with bottom nav)
 * - / : HomePage (daily summary)
 * - /log : LogMealPage (camera/photo capture)
 * - /confirm : ConfirmMealPage (review AI results - new meal)
 * - /confirm/:mealId : ConfirmMealPage (edit existing meal)
 * - /history : HistoryPage (past meals)
 * - /goals : GoalsPage (daily macro goals)
 * - /settings : SettingsPage (account management)
 */

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Required onboarding step - no AppLayout (no bottom nav) */}
            <Route path="/onboarding/goals" element={<OnboardingGoalsPage />} />

            {/* Main app routes - with AppLayout (bottom nav) */}
            <Route element={<AppLayout />}>
              {/* Optional onboarding steps */}
              <Route path="/onboarding/how-it-works" element={<OnboardingHowItWorksPage />} />
              <Route path="/onboarding/first-meal" element={<OnboardingFirstMealPage />} />

              {/* Main app pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/log" element={<LogMealPage />} />
              <Route path="/confirm/:mealId?" element={<ConfirmMealPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
