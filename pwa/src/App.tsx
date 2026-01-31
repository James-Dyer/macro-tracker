import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { LogMealPage } from './pages/LogMealPage';
import { ConfirmMealPage } from './pages/ConfirmMealPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * App - Main application component
 *
 * Public routes:
 * - /login : LoginPage (authentication)
 *
 * Protected routes (require auth):
 * - / : HomePage (daily summary)
 * - /log : LogMealPage (camera/photo capture)
 * - /confirm : ConfirmMealPage (review AI results - new meal)
 * - /confirm/:mealId : ConfirmMealPage (edit existing meal)
 * - /history : HistoryPage (past meals)
 * - /settings : SettingsPage (goals, account)
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
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/log" element={<LogMealPage />} />
              <Route path="/confirm/:mealId?" element={<ConfirmMealPage />} />
              <Route path="/history" element={<HistoryPage />} />
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
