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
  tier: 'free' | 'beta' | 'paid';
  tierLoading: boolean;
  refetchTier: () => Promise<void>;
  redeemCode: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [tier, setTier] = useState<'free' | 'beta' | 'paid'>('free');
  const [tierLoading, setTierLoading] = useState(true);

  const user = session?.user ?? null;
  const userId = user?.id;

  // Fetch user tier from user_profile
  const fetchTier = useCallback(async () => {
    if (!userId) {
      setTier('free');
      setTierLoading(false);
      return;
    }

    try {
      setTierLoading(true);
      const { data, error } = await supabase
        .from('user_profile')
        .select('tier')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Error fetching tier:', error);
        setTier('free');
        return;
      }

      setTier(data?.tier || 'free');
    } catch (error) {
      console.error('[AuthContext] Unexpected error fetching tier:', error);
      setTier('free');
    } finally {
      setTierLoading(false);
    }
  }, [userId]);

  // Core invite redemption logic — call the RPC, update tier on success
  const redeemCode = useCallback(async (code: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase.rpc('redeem_invite', {
        p_code: code,
        p_user_id: userId,
      });

      if (error) {
        console.error('[AuthContext] redeemCode failed:', error);
        return false;
      }

      localStorage.removeItem('pendingInviteCode');
      await fetchTier();
      return true;
    } catch (error) {
      console.error('[AuthContext] redeemCode exception:', error);
      return false;
    }
  }, [userId, fetchTier]);

  // Auto-redemption: Check for pending invite code and redeem if present
  const tryAutoRedemption = useCallback(async () => {
    if (!userId) return;

    // Skip if already on a paid tier — any pending code in localStorage is stale
    if (tier !== 'free') {
      localStorage.removeItem('pendingInviteCode');
      return;
    }

    const pendingCode = localStorage.getItem('pendingInviteCode');
    if (!pendingCode) return;

    console.log('[AuthContext] Attempting auto-redemption for code:', pendingCode);
    const success = await redeemCode(pendingCode);
    if (success) {
      console.log('[AuthContext] Auto-redemption successful');
    } else {
      console.log('[AuthContext] Auto-redemption failed — code kept for retry');
    }
  }, [userId, tier, redeemCode]);

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

  // Check onboarding and fetch tier when userId changes
  useEffect(() => {
    if (userId) {
      checkOnboardingStatus();
      fetchTier();
      tryAutoRedemption();
    }
  }, [userId, checkOnboardingStatus, fetchTier, tryAutoRedemption]);

  const value = {
    session,
    user,
    loading: sessionLoading,
    needsOnboarding,
    onboardingLoading,
    refetchOnboarding: checkOnboardingStatus,
    tier,
    tierLoading,
    refetchTier: fetchTier,
    redeemCode,
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
