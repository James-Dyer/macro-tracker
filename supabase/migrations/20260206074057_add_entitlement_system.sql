-- =====================================================================
-- Entitlement Tier System Migration
-- =====================================================================
-- Creates three-tier system (free/beta/paid) with invite redemption
-- All existing users will be backfilled to 'beta' tier

-- =====================================================================
-- 1. USER_PROFILE TABLE
-- =====================================================================
-- Stores tier assignment per user (one-to-one with auth.users)
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'beta', 'paid')) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_user_profile_user_id ON user_profile(user_id);

-- RLS Policies: Users can only SELECT (read-only, no self-promotion to paid)
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profile
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No UPDATE policy - tier changes only via RPC with SECURITY DEFINER

-- =====================================================================
-- 2. INVITE_CODE TABLE
-- =====================================================================
-- Manages invite codes for closed beta distribution
CREATE TABLE invite_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('beta', 'paid')),
  max_uses INTEGER NOT NULL CHECK (max_uses > 0),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX idx_invite_code_code ON invite_code(code);
CREATE INDEX idx_invite_code_status ON invite_code(status) WHERE status = 'active';

-- RLS: Service role access only (no user policies)
ALTER TABLE invite_code ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. INVITE_REDEMPTION TABLE
-- =====================================================================
-- Audit trail of code redemptions (used to compute current_uses)
CREATE TABLE invite_redemption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_code(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One redemption per user (prevents double-dipping)
);

-- Indexes for fast queries
CREATE INDEX idx_invite_redemption_invite_code ON invite_redemption(invite_code_id);
CREATE INDEX idx_invite_redemption_user_id ON invite_redemption(user_id);

-- RLS: Users can view their own redemptions
ALTER TABLE invite_redemption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON invite_redemption
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================================
-- 4. DATABASE TRIGGER - AUTO-CREATE USER PROFILE
-- =====================================================================
-- Ensures every new signup gets a profile with tier='free' by default
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (user_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- =====================================================================
-- 5. POSTGRES RPC - REDEEM_INVITE
-- =====================================================================
-- Atomic invite redemption with row-level locking (prevents race conditions)
-- SECURITY DEFINER allows tier updates (bypasses RLS)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 6. BACKFILL EXISTING USERS
-- =====================================================================
-- All current users are beta testers (closed beta period)
INSERT INTO user_profile (user_id, tier)
SELECT id, 'beta'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
-- Next steps:
-- 1. Run generate_invites.sql to create codes
-- 2. Update frontend AuthContext to fetch tier
-- 3. Update LoginPage to handle ?invite={code} param
