import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useSession } from '../hooks/useSession';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  onboardingLoading: boolean;
  refetchOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  const user = session?.user ?? null;
  const userId = user?.id;

  // Check onboarding status
  const checkOnboardingStatus = useCallback(async () => {
    console.log('[AuthContext] Checking onboarding for user:', userId);

    if (!userId) {
      setNeedsOnboarding(true);
      setOnboardingLoading(false);
      return;
    }

    try {
      setOnboardingLoading(true);

      const { data, error } = await supabase
        .from('daily_goal')
        .select('id')
        .eq('user_id', userId)
        .single();

      // Debug logging
      if (error && error.code !== 'PGRST116') {
        console.error('[AuthContext] Query error:', error);
      }

      const hasGoal = !!data;
      const needsOnboarding = !hasGoal;

      console.log('[AuthContext] Setting needsOnboarding to:', needsOnboarding);
      setNeedsOnboarding(needsOnboarding);
    } catch (error) {
      console.error('[AuthContext] Unexpected error:', error);
      setNeedsOnboarding(true);
    } finally {
      setOnboardingLoading(false);
    }
  }, [userId]);

  // Check onboarding when userId changes (not user object)
  useEffect(() => {
    if (userId) {
      checkOnboardingStatus();
    }
  }, [userId, checkOnboardingStatus]);

  const value = {
    session,
    user,
    loading: sessionLoading,
    needsOnboarding,
    onboardingLoading,
    refetchOnboarding: checkOnboardingStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
