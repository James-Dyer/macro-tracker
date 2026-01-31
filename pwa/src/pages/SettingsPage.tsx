import { Typography, Card, Button } from '../components/ui';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

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
  const [userEmail, setUserEmail] = useState<string>('');

  // Fetch user email
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || 'Not signed in');
    };
    fetchUser();
  }, []);

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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10 animate-fade-in">
        <Typography variant="h2" className="text-gray-900">
          Settings
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Manage your account
        </Typography>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Account */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-1">
          <Typography variant="h3" className="mb-5 pb-4 border-b border-gray-200 text-gray-900">
            Account
          </Typography>

          <div className="space-y-5">
            <div>
              <Typography variant="label" color="secondary" className="mb-2 block">
                Email Address
              </Typography>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="body" className="font-mono text-sm">
                  {userEmail}
                </Typography>
              </div>
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

        {/* App Info */}
        <Card variant="filled" padding="lg" className="animate-slide-up stagger-2">
          <Typography variant="label" color="secondary" className="mb-3 block">
            About
          </Typography>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Typography variant="bodySmall" color="tertiary">
                Version
              </Typography>
              <Typography variant="bodySmall" className="font-mono text-gray-600">
                1.0.0
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="bodySmall" color="tertiary">
                Stack
              </Typography>
              <Typography variant="bodySmall" className="font-mono text-gray-600">
                React + Vite + Supabase
              </Typography>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
