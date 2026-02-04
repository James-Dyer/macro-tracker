import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export function useOnboarding() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('daily_goal')
          .select('id')
          .eq('user_id', user.id)
          .single();

        setNeedsOnboarding(!data);
      } catch {
        // No goal found = needs onboarding
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [user]);

  return { needsOnboarding, loading };
}
