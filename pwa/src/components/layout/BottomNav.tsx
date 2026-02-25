import { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

/**
 * BottomNav - Redesigned with 5 items and centered Log button
 *
 * Features:
 * - 5-item layout: Home, History, Log (center), Goals, More
 * - Center Log button with special styling (green circle)
 * - Tapping the FAB opens a small menu: "Photo" or "Quick Add"
 * - Active state with subtle scale + color change for standard items
 * - Backdrop blur for modern iOS feel
 */

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; isActive: boolean }>;
  type: 'standard' | 'center-action';
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon, type: 'standard' },
  { to: '/dashboard/history', label: 'History', icon: HistoryIcon, type: 'standard' },
  { to: '/dashboard/log', label: 'Log', icon: PlusIcon, type: 'center-action' },
  { to: '/dashboard/goals', label: 'Goals', icon: GoalsIcon, type: 'standard' },
  { to: '/dashboard/settings', label: 'More', icon: MoreIcon, type: 'standard' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCameraSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      navigate('/dashboard/log', {
        state: { selectedFile: file }
      });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-elevated/95 backdrop-blur-xl border-t border-themed safe-area-pb z-50">
      {/* Hidden file input for camera button */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraSelect}
        className="hidden"
      />

      {/* FAB popup menu */}
      {isMenuOpen && (
        <>
          {/* Invisible backdrop — closes menu on outside tap */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Menu popup — floats above the FAB */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50
                          bg-elevated rounded-2xl shadow-xl border border-themed
                          overflow-hidden min-w-[160px] animate-scale-in">
            {/* Photo option */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                         hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100
                         border-b border-themed"
              onClick={() => {
                setIsMenuOpen(false);
                cameraInputRef.current?.click();
              }}
            >
              <CameraMenuIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-themed">Photo</span>
            </button>
            {/* Quick Add option */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                         hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/dashboard/confirm', { state: { mode: 'quick-add' } });
              }}
            >
              <BoltIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-themed">Quick Add</span>
            </button>
          </div>
        </>
      )}

      <div className="flex items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => {
          if (item.type === 'center-action') {
            return (
              <div key={item.to} className="flex-1 flex justify-center">
                <button
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="w-14 h-14 rounded-full bg-primary-light shadow-lg dark:shadow-primary-light/30 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <item.icon className="w-7 h-7 text-white" isActive={false} />
                </button>
              </div>
            );
          }

          // Standard nav item
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-200 ${
                  isActive ? 'scale-105' : 'scale-100 active:scale-95'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-primary-light' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    isActive={isActive}
                  />
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isActive ? 'text-primary-light' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className, isActive }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isActive ? 0 : 2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}

function HistoryIcon({ className, isActive }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isActive ? 2.5 : 2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function GoalsIcon({ className, isActive }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} />
      <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CameraMenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <circle cx="12" cy="13" r="3" strokeWidth={2} />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}
