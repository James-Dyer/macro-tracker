import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Typography, Button, Input, Card } from '../components/ui';

type AuthMode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check for mode query parameter (e.g., ?mode=signup)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  // Handle email confirmation callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    };
    handleAuthCallback();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        setMessage('Check your email to confirm your account!');
        setEmail('');
        setPassword('');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Navigation handled by auth state change
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary shadow-lg flex items-center justify-center">
            <span className="text-3xl">🥗</span>
          </div>
          <Typography variant="h1" className="text-gray-900 mb-2">
            MacroTracker
          </Typography>
          <Typography variant="body" color="secondary">
            Track your nutrition with AI
          </Typography>
        </div>

        <Card variant="elevated" padding="lg">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`
                flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`
                flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success Message */}
            {message && (
              <Card variant="filled" padding="md" className="bg-primary/10 border border-primary/20">
                <Typography variant="bodySmall" className="text-primary-dark">
                  {message}
                </Typography>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card variant="filled" padding="md" className="bg-red-50 border border-red-200">
                <Typography variant="bodySmall" className="text-red-700">
                  {error}
                </Typography>
              </Card>
            )}

            {/* Email Input */}
            <div>
              <Typography variant="label" className="mb-2 block text-gray-700">
                Email
              </Typography>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <Typography variant="label" className="mb-2 block text-gray-700">
                Password
              </Typography>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              title={mode === 'signup' ? 'Create Account' : 'Log In'}
              loading={loading}
              disabled={loading}
              size="lg"
              fullWidth
            />
          </form>

          {/* Additional Info for Signup */}
          {mode === 'signup' && (
            <Typography variant="caption" color="tertiary" className="mt-4 text-center block">
              By signing up, you'll receive a confirmation email to verify your account
            </Typography>
          )}
        </Card>

        {/* Footer */}
        <Typography variant="caption" color="tertiary" className="mt-6 text-center block">
          Powered by Supabase • Built with React
        </Typography>
      </div>
    </div>
  );
}
