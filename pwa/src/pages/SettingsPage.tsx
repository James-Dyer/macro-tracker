import { Typography, Card, Button } from '../components/ui';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { getCacheStats, clearUserCaches } from '../utils/cacheManager';
import { useAuth } from '../contexts/AuthContext';

/**
 * SettingsPage - Account management and app info
 *
 * Features:
 * - Account management
 * - App information
 * - Staggered card animations
 */

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, tier } = useAuth();
  const [userEmail, setUserEmail] = useState<string>('');
  const [cacheStats, setCacheStats] = useState({ totalCaches: 0, expiredCaches: 0, cacheSizeBytes: 0 });
  const [isClearing, setIsClearing] = useState(false);

  // Fetch user email and cache stats
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || 'Not signed in');
    };
    fetchUser();

    // Update cache stats
    const stats = getCacheStats();
    setCacheStats(stats);
  }, []);

  // Clear all caches for current user
  const handleClearCache = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      clearUserCaches(user.id);

      // Update stats
      const stats = getCacheStats();
      setCacheStats(stats);

      // Show success feedback
      if (import.meta.env.DEV) {
        console.log('[SettingsPage] Cache cleared successfully');
      }
    } catch (err) {
      console.error('[SettingsPage] Error clearing cache:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to sign out:', err);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-header backdrop-blur-sm border-b border-themed sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2">
          Settings
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Manage your account and preferences
        </Typography>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Appearance */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-1">
          <Typography variant="h3" className="mb-5 pb-4 border-b border-themed">
            Appearance
          </Typography>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body" className="font-semibold mb-1">
                  Dark Mode
                </Typography>
                <Typography variant="bodySmall" color="secondary">
                  {theme === 'dark' ? 'Dark theme active' : 'Light theme active'}
                </Typography>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={toggleTheme}
                className={`
                  relative w-14 h-8 rounded-full transition-colors duration-300
                  ${theme === 'dark' ? 'bg-primary-light' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300
                    ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
                  `}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {theme === 'dark' ? '🌙' : '☀️'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Account */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-2">
          <Typography variant="h3" className="mb-5 pb-4 border-b border-themed">
            Account
          </Typography>

          <div className="space-y-5">
            <div>
              <Typography variant="label" color="secondary" className="mb-2 block">
                Email Address
              </Typography>
              <Typography variant="body" className="font-mono">
                {userEmail}
              </Typography>
            </div>

            <div>
              <Typography variant="label" color="secondary" className="mb-2 block">
                Account Status
              </Typography>
              <Typography variant="body" className="capitalize">
                {tier}
              </Typography>
            </div>

            <Button
              title="Sign Out"
              variant="secondary"
              onClick={handleSignOut}
              size="lg"
              fullWidth
            />
          </div>
        </Card>

        {/* Cache Management */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-3">
          <Typography variant="h3" className="mb-5 pb-4 border-b border-themed">
            Cache
          </Typography>

          <div className="space-y-5">
            <div>
              <Typography variant="body" className="font-semibold mb-3">
                Cache Statistics
              </Typography>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Typography variant="bodySmall" color="tertiary">
                    Total Caches
                  </Typography>
                  <Typography variant="bodySmall" color="secondary" className="font-mono tabular-nums">
                    {cacheStats.totalCaches}
                  </Typography>
                </div>
                <div className="flex items-center justify-between">
                  <Typography variant="bodySmall" color="tertiary">
                    Cache Size
                  </Typography>
                  <Typography variant="bodySmall" color="secondary" className="font-mono tabular-nums">
                    {(cacheStats.cacheSizeBytes / 1024).toFixed(1)} KB
                  </Typography>
                </div>
                {cacheStats.expiredCaches > 0 && (
                  <div className="flex items-center justify-between">
                    <Typography variant="bodySmall" color="tertiary">
                      Expired Caches
                    </Typography>
                    <Typography variant="bodySmall" className="font-mono tabular-nums text-yellow-600 dark:text-yellow-400">
                      {cacheStats.expiredCaches}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Typography variant="bodySmall" color="tertiary" className="mb-3 block">
                Clear cached data to free up storage or force a refresh. Your data on the server is safe.
              </Typography>
              <Button
                title={isClearing ? 'Clearing...' : 'Clear Cache'}
                variant="secondary"
                onClick={handleClearCache}
                loading={isClearing}
                disabled={isClearing || cacheStats.totalCaches === 0}
                size="md"
                fullWidth
              />
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card variant="filled" padding="lg" className="animate-slide-up stagger-4">
          <Typography variant="label" color="secondary" className="mb-3 block">
            About
          </Typography>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Typography variant="bodySmall" color="tertiary">
                Version
              </Typography>
              <Typography variant="bodySmall" color="secondary" className="font-mono">
                1.0.0
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="bodySmall" color="tertiary">
                Stack
              </Typography>
              <Typography variant="bodySmall" color="secondary" className="font-mono">
                React + Vite + Supabase
              </Typography>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
