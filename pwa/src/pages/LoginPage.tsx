import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Typography, Button, Input, Card } from '../components/ui';
import { useInviteRedemption } from '../hooks/useInviteRedemption';

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
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { redeemInvite, validateInvite, error: redemptionError } = useInviteRedemption();

  // Check for invite code and mode query parameters
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const inviteParam = searchParams.get('invite');

    if (modeParam === 'signup') {
      setMode('signup');
    }

    // Handle invite code
    if (inviteParam) {
      setInviteCode(inviteParam);
      setMode('signup'); // Auto-switch to signup mode
      localStorage.setItem('pendingInviteCode', inviteParam); // Persist for resilience
      setMessage(`You're invited to MacroTracker! Sign up to join.`);
    } else {
      // Check if there's a pending code from previous visit
      const pendingCode = localStorage.getItem('pendingInviteCode');
      if (pendingCode) {
        setInviteCode(pendingCode);
      }
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
        // Step 1: Pre-validate invite code before creating the account.
        // This prevents the account from being created with an invalid code,
        // which would leave the user stuck on the free tier with no clear path forward.
        if (inviteCode) {
          const validationError = await validateInvite(inviteCode);
          if (validationError) {
            setError(validationError);
            return;
          }
        }

        // Step 2: Create user account (Supabase handles auth)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // Supabase doesn't return an error for duplicate emails — instead it
        // returns a user with an empty identities array and sends no email.
        if (signUpData.user?.identities?.length === 0) {
          setError('An account with this email already exists. Try logging in instead.');
          return;
        }

        const userId = signUpData.user?.id;
        // When email verification is disabled, Supabase returns a session immediately.
        // When it's enabled, session is null and the user must confirm via email first.
        const sessionCreated = !!signUpData.session;

        // Step 2: If invite code present, attempt redemption
        if (inviteCode && userId) {
          console.log('[LoginPage] Attempting invite redemption for:', inviteCode);

          const tier = await redeemInvite(inviteCode, userId);

          if (tier) {
            localStorage.removeItem('pendingInviteCode');
            if (sessionCreated) {
              // Already logged in — navigate straight to the app
              navigate('/dashboard', { replace: true });
              return;
            }
            setMessage(`Account created! You now have ${tier === 'beta' ? 'Beta' : 'Premium'} access. Check your email to confirm.`);
          } else {
            if (sessionCreated) {
              navigate('/dashboard', { replace: true });
              return;
            }
            setMessage('Account created! Check your email to confirm, then enter your invite code when you log in.');
          }
        } else if (sessionCreated) {
          // No invite code, but already logged in — go straight to the app
          navigate('/dashboard', { replace: true });
          return;
        } else {
          setMessage('Check your email to confirm your account!');
        }

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-5">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-light shadow-lg dark:shadow-primary-light/30 flex items-center justify-center">
            <span className="text-3xl">🥗</span>
          </div>
          <Typography variant="h1" className="mb-2">
            MacroTracker
          </Typography>
          <Typography variant="body" color="secondary">
            Track your nutrition with AI
          </Typography>
        </div>

        <Card variant="elevated" padding="lg">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`
                flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${mode === 'login'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success Message */}
            {message && (
              <Card variant="filled" padding="md" className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
                <Typography variant="bodySmall" className="text-primary-dark dark:text-primary-light">
                  {message}
                </Typography>
              </Card>
            )}

            {/* Error Message */}
            {(error || redemptionError) && (
              <Card variant="filled" padding="md" className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <Typography variant="bodySmall" className="text-red-700 dark:text-red-400">
                  {error || redemptionError}
                </Typography>
              </Card>
            )}

            {/* Invite Code Display */}
            {inviteCode && mode === 'signup' && (
              <div>
                <Typography variant="label" className="mb-2 block text-gray-700 dark:text-gray-300">
                  Invite Code
                </Typography>
                <Input
                  type="text"
                  value={inviteCode}
                  readOnly
                  disabled
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <Typography variant="label" className="mb-2 block text-gray-700 dark:text-gray-300">
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
              <Typography variant="label" className="mb-2 block text-gray-700 dark:text-gray-300">
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

        </Card>

        {/* Footer */}
        <Typography variant="caption" color="tertiary" className="mt-6 text-center block">
          Powered by Supabase • Built with React
        </Typography>
      </div>
    </div>
  );
}
