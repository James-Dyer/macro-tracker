import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for checking user entitlements based on tier
 * Currently all tiers have unlimited access (beta/paid identical)
 * This provides foundation for future free tier restrictions
 */
export function useEntitlement() {
  const { tier } = useAuth();

  /**
   * Check if user can access a specific feature
   * @param feature - Feature identifier (e.g., 'unlimited_scans', 'export_data')
   * @returns Whether user has access to the feature
   */
  const canAccessFeature = (feature: string): boolean => {
    // For now, beta and paid have full access
    // Free tier will have restrictions in the future
    switch (feature) {
      case 'unlimited_scans':
        // Future: Free tier might be limited to 10 scans/day
        return tier === 'beta' || tier === 'paid' || tier === 'free';

      case 'export_data':
        // Future: Free tier might not have export capability
        return tier === 'beta' || tier === 'paid' || tier === 'free';

      case 'advanced_analytics':
        // Future: Free tier might have basic analytics only
        return tier === 'beta' || tier === 'paid' || tier === 'free';

      default:
        // Unknown features default to allowed
        return true;
    }
  };

  /**
   * Get feature limit for specific feature
   * @param feature - Feature identifier
   * @returns Limit number or null for unlimited
   */
  const getFeatureLimit = (feature: string): number | null => {
    if (tier === 'beta' || tier === 'paid') {
      return null; // Unlimited
    }

    // Future free tier limits
    switch (feature) {
      case 'daily_scans':
        return null; // Currently unlimited, will become 10 for free tier
      default:
        return null;
    }
  };

  return {
    tier,
    canAccessFeature,
    getFeatureLimit,
  };
}
