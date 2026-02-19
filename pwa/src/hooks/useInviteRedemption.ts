import { useState } from 'react';
import { supabase } from '../services/supabase';

interface UseInviteRedemptionResult {
  redeemInvite: (code: string, userId: string) => Promise<string | null>;
  validateInvite: (code: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for redeeming invite codes
 * Calls Postgres RPC function that atomically validates + assigns tier
 */
export function useInviteRedemption(): UseInviteRedemptionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-signup validation: checks code validity WITHOUT consuming it.
  // Returns null if valid, or an error string if invalid.
  // Callable by anon users (before account creation).
  const validateInvite = async (code: string): Promise<string | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invite', {
        p_code: code,
      });

      if (rpcError) {
        console.error('[useInviteRedemption] validate_invite RPC error:', rpcError);
        return 'Failed to validate invite code';
      }

      // RPC returns null if valid, error string if invalid
      return data as string | null;
    } catch (err) {
      console.error('[useInviteRedemption] validateInvite unexpected error:', err);
      return 'Failed to validate invite code';
    }
  };

  const redeemInvite = async (code: string, userId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('redeem_invite', {
        p_code: code,
        p_user_id: userId,
      });

      if (rpcError) {
        console.error('[useInviteRedemption] RPC error:', rpcError);

        // Parse error message for user-friendly display
        let errorMessage = 'Failed to redeem invite code';
        if (rpcError.message.includes('Invalid or disabled')) {
          errorMessage = 'Invalid or disabled invite code';
        } else if (rpcError.message.includes('expired')) {
          errorMessage = 'Invite code has expired';
        } else if (rpcError.message.includes('max uses reached')) {
          errorMessage = 'Invite code has reached maximum uses';
        } else if (rpcError.message.includes('already redeemed')) {
          errorMessage = 'You have already redeemed an invite code';
        }

        setError(errorMessage);
        return null;
      }

      // RPC returns array with single row containing tier
      const tier = data?.[0]?.tier || null;
      return tier;
    } catch (err) {
      console.error('[useInviteRedemption] Unexpected error:', err);
      setError('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    redeemInvite,
    validateInvite,
    loading,
    error,
  };
}
