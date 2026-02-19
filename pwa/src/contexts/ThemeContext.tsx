import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../services/supabase';

/**
 * ThemeContext - Manages dark/light theme state
 *
 * Priority order for theme resolution:
 * 1. localStorage (applied instantly on mount to avoid flash)
 * 2. Database (synced after mount — wins if different, keeps theme consistent across devices)
 *
 * When the user toggles, both localStorage and DB are updated.
 * DB write is fire-and-forget; localStorage keeps the UI snappy.
 */

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'macrotracker-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read from localStorage immediately to avoid any flash on load
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as Theme) || 'light'; // Default to light
  });

  // Apply theme class to document root and persist to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // On mount: sync from DB. If the user last set their theme on another device,
  // the DB value takes precedence and overwrites localStorage.
  useEffect(() => {
    const syncFromDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profile')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (data?.theme) {
        setThemeState(data.theme as Theme);
      }
    };

    void syncFromDB();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Persist to DB — fire-and-forget, localStorage handles the sync gap
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('user_profile')
        .update({ theme: newTheme })
        .eq('user_id', user.id);
    })();
  };

  const toggleTheme = () => applyTheme(theme === 'light' ? 'dark' : 'light');
  const setTheme = (newTheme: Theme) => applyTheme(newTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
