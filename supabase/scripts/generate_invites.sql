-- =====================================================================
-- ADMIN SCRIPT: GENERATE INVITE CODES
-- =====================================================================
-- Run in Supabase SQL Editor to create batch of invite codes
-- Customize parameters below before running

-- =====================================================================
-- CONFIGURATION
-- =====================================================================
-- Change these values as needed:
DO $$
DECLARE
  batch_size INTEGER := 10;           -- Number of codes to generate
  code_tier TEXT := 'beta';           -- 'beta' or 'paid'
  code_max_uses INTEGER := 1;         -- Uses per code (1 = single-use)
  code_expires_days INTEGER := 30;    -- Days until expiration (NULL = never)
  code_prefix TEXT := 'BETA';         -- Prefix for readability
  i INTEGER;
  random_suffix TEXT;
  full_code TEXT;
BEGIN
  FOR i IN 1..batch_size LOOP
    -- Generate random 8-character suffix (alphanumeric)
    random_suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    full_code := code_prefix || '-' || random_suffix;

    -- Insert invite code
    INSERT INTO invite_code (
      code,
      tier,
      max_uses,
      expires_at,
      status
    ) VALUES (
      full_code,
      code_tier,
      code_max_uses,
      CASE
        WHEN code_expires_days IS NOT NULL
        THEN NOW() + (code_expires_days || ' days')::INTERVAL
        ELSE NULL
      END,
      'active'
    );

    RAISE NOTICE 'Generated code: %', full_code;
  END LOOP;

  RAISE NOTICE 'Successfully generated % invite codes', batch_size;
END $$;

-- =====================================================================
-- QUERY: LIST UNUSED CODES
-- =====================================================================
-- Copy/paste this query to see codes ready for distribution
/*
SELECT
  ic.code,
  ic.tier,
  ic.max_uses,
  COUNT(ir.id) as current_uses,
  ic.max_uses - COUNT(ir.id) as remaining_uses,
  ic.expires_at,
  ic.status,
  ic.created_at
FROM invite_code ic
LEFT JOIN invite_redemption ir ON ir.invite_code_id = ic.id
WHERE ic.status = 'active'
  AND (ic.expires_at IS NULL OR ic.expires_at > NOW())
GROUP BY ic.id
HAVING COUNT(ir.id) < ic.max_uses
ORDER BY ic.created_at DESC;
*/

-- =====================================================================
-- QUERY: REDEMPTION STATISTICS
-- =====================================================================
-- View overall redemption stats
/*
SELECT
  tier,
  COUNT(*) as total_codes,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_codes,
  SUM((SELECT COUNT(*) FROM invite_redemption WHERE invite_code_id = ic.id)) as total_redemptions
FROM invite_code ic
GROUP BY tier;
*/

-- =====================================================================
-- ADMIN ACTIONS
-- =====================================================================

-- Disable a specific code (soft delete)
/*
UPDATE invite_code
SET status = 'disabled'
WHERE code = 'BETA-abc12345';
*/

-- Reactivate a disabled code
/*
UPDATE invite_code
SET status = 'active'
WHERE code = 'BETA-abc12345';
*/

-- Extend expiration date
/*
UPDATE invite_code
SET expires_at = NOW() + INTERVAL '30 days'
WHERE code = 'BETA-abc12345';
*/

-- View redemptions for specific code
/*
SELECT
  ic.code,
  ir.redeemed_at,
  up.tier as assigned_tier,
  u.email
FROM invite_code ic
JOIN invite_redemption ir ON ir.invite_code_id = ic.id
JOIN user_profile up ON up.user_id = ir.user_id
JOIN auth.users u ON u.id = ir.user_id
WHERE ic.code = 'BETA-abc12345'
ORDER BY ir.redeemed_at DESC;
*/

-- =====================================================================
-- EXAMPLE USAGE
-- =====================================================================
-- 1. Edit CONFIGURATION section above
-- 2. Run the DO block to generate codes
-- 3. Copy the LIST UNUSED CODES query to see generated codes
-- 4. Send invite links: https://macrotracker.app/login?invite={CODE}
