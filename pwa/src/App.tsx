import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LogMealPage } from './pages/LogMealPage';
import { ConfirmMealPage } from './pages/ConfirmMealPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * App - Main application component
 *
 * Routes:
 * - / : HomePage (daily summary)
 * - /log : LogMealPage (camera/photo capture)
 * - /confirm : ConfirmMealPage (review AI results)
 * - /history : HistoryPage (past meals)
 * - /settings : SettingsPage (goals, account)
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/log" element={<LogMealPage />} />
          <Route path="/confirm" element={<ConfirmMealPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
