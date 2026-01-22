import { NavLink } from 'react-router-dom';

/**
 * BottomNav - Redesigned with refined iOS aesthetic
 *
 * Features:
 * - Active state with subtle scale + color change
 * - Backdrop blur for modern iOS feel
 * - Refined icon spacing
 */

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; isActive: boolean }>;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Today', icon: HomeIcon },
  { to: '/log', label: 'Log', icon: CameraIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 safe-area-pb z-50">
      <div className="flex items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => (
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
                    isActive ? 'text-primary' : 'text-gray-400'
                  }`}
                  isActive={isActive}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
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

function CameraIcon({ className, isActive }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isActive ? 2.5 : 2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <circle cx="12" cy="13" r="3" strokeWidth={isActive ? 2.5 : 2} />
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

function SettingsIcon({ className, isActive }: { className?: string; isActive: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isActive ? 2.5 : 2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth={isActive ? 2.5 : 2} />
    </svg>
  );
}
