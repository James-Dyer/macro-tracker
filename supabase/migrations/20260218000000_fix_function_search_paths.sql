-- =====================================================================
-- Fix mutable search_path on SECURITY DEFINER functions
-- =====================================================================
-- SECURITY DEFINER functions with a mutable search_path can be exploited
-- by callers who set search_path to a schema containing shadow tables.
-- Pinning search_path ensures all object resolution uses the real schemas.

-- =====================================================================
-- 1. TRIGGER FUNCTION: create_user_profile
-- =====================================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (user_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_catalog;

-- =====================================================================
-- 2. RPC FUNCTION: redeem_invite
-- =====================================================================
CREATE OR REPLACE FUNCTION redeem_invite(
  p_code TEXT,
  p_user_id UUID
)
RETURNS TABLE(tier TEXT) AS $$
DECLARE
  code_record RECORD;
  redemption_count INTEGER;
BEGIN
  -- Lock the invite_code row to prevent race conditions
  SELECT * INTO code_record
  FROM invite_code
  WHERE code = p_code
    AND status = 'active'
  FOR UPDATE;

  -- Validate code exists and is active
  IF code_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or disabled invite code';
  END IF;

  -- Check expiry
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invite code expired';
  END IF;

  -- Count current redemptions (computed, not stored)
  SELECT COUNT(*) INTO redemption_count
  FROM invite_redemption
  WHERE invite_code_id = code_record.id;

  -- Check max uses
  IF redemption_count >= code_record.max_uses THEN
    RAISE EXCEPTION 'Invite code max uses reached';
  END IF;

  -- Check if user already redeemed THIS SPECIFIC code (idempotent - allow retries)
  IF EXISTS (
    SELECT 1 FROM invite_redemption
    WHERE user_id = p_user_id
      AND invite_code_id = code_record.id
  ) THEN
    -- Already redeemed this code - return success (idempotent)
    RETURN QUERY
      SELECT user_profile.tier
      FROM user_profile
      WHERE user_profile.user_id = p_user_id;
    RETURN;
  END IF;

  -- Check if user already redeemed A DIFFERENT code
  IF EXISTS (
    SELECT 1 FROM invite_redemption
    WHERE user_id = p_user_id
      AND invite_code_id != code_record.id
  ) THEN
    RAISE EXCEPTION 'User already redeemed a different invite code';
  END IF;

  -- Update user tier (bypasses RLS due to SECURITY DEFINER)
  UPDATE user_profile
  SET tier = code_record.tier,
      updated_at = NOW()
  WHERE user_profile.user_id = p_user_id;

  -- Record redemption for audit trail
  INSERT INTO invite_redemption (invite_code_id, user_id)
  VALUES (code_record.id, p_user_id);

  -- Return the new tier
  RETURN QUERY
    SELECT user_profile.tier
    FROM user_profile
    WHERE user_profile.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_catalog;
