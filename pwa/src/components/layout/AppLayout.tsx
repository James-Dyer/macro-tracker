import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * AppLayout - Main app shell with bottom navigation
 *
 * Wraps all authenticated pages with bottom tab navigation
 */

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
      <BottomNav />
    </div>
  );
}
