-- =====================================================================
-- TESTING SCRIPT: ENTITLEMENT SYSTEM
-- =====================================================================
-- Run these queries in Supabase SQL Editor to verify the system works
-- DO NOT run in production - this is for testing/development only

-- =====================================================================
-- SETUP: CREATE TEST DATA
-- =====================================================================

-- Create test invite codes
INSERT INTO invite_code (code, tier, max_uses, expires_at, status) VALUES
  ('TEST-VALID01', 'beta', 1, NOW() + INTERVAL '30 days', 'active'),
  ('TEST-VALID02', 'beta', 5, NOW() + INTERVAL '30 days', 'active'),
  ('TEST-EXPIRED', 'beta', 1, NOW() - INTERVAL '1 day', 'active'),
  ('TEST-DISABLD', 'beta', 1, NOW() + INTERVAL '30 days', 'disabled'),
  ('TEST-MAXUSED', 'beta', 1, NOW() + INTERVAL '30 days', 'active');

-- Note: To properly test, you'll need real user IDs from auth.users
-- Replace 'USER_ID_HERE' with actual UUIDs from your test users

-- =====================================================================
-- TEST 1: VALID REDEMPTION
-- =====================================================================
-- Expected: Success, returns tier='beta'

SELECT * FROM redeem_invite('TEST-VALID01', 'USER_ID_HERE');

-- Verify redemption record created
SELECT
  ic.code,
  ir.redeemed_at,
  up.tier
FROM invite_redemption ir
JOIN invite_code ic ON ic.id = ir.invite_code_id
JOIN user_profile up ON up.user_id = ir.user_id
WHERE ir.user_id = 'USER_ID_HERE';

-- =====================================================================
-- TEST 2: IDEMPOTENCY (SAME USER, SAME CODE)
-- =====================================================================
-- Expected: Success, returns tier='beta' (no error, no duplicate)

SELECT * FROM redeem_invite('TEST-VALID01', 'USER_ID_HERE');

-- Verify only ONE redemption record exists
SELECT COUNT(*) as redemption_count
FROM invite_redemption
WHERE user_id = 'USER_ID_HERE'
  AND invite_code_id = (SELECT id FROM invite_code WHERE code = 'TEST-VALID01');
-- Should return: 1

-- =====================================================================
-- TEST 3: MULTI-USE CODE
-- =====================================================================
-- Expected: Success for multiple users (up to 5)

SELECT * FROM redeem_invite('TEST-VALID02', 'USER_ID_1');
SELECT * FROM redeem_invite('TEST-VALID02', 'USER_ID_2');
SELECT * FROM redeem_invite('TEST-VALID02', 'USER_ID_3');

-- Check current uses
SELECT
  ic.code,
  ic.max_uses,
  COUNT(ir.id) as current_uses,
  ic.max_uses - COUNT(ir.id) as remaining_uses
FROM invite_code ic
LEFT JOIN invite_redemption ir ON ir.invite_code_id = ic.id
WHERE ic.code = 'TEST-VALID02'
GROUP BY ic.id;
-- Should show: 3 uses, 2 remaining

-- =====================================================================
-- TEST 4: EXPIRED CODE
-- =====================================================================
-- Expected: Exception "Invite code expired"

SELECT * FROM redeem_invite('TEST-EXPIRED', 'USER_ID_HERE');
-- Should raise: "Invite code expired"

-- =====================================================================
-- TEST 5: DISABLED CODE
-- =====================================================================
-- Expected: Exception "Invalid or disabled invite code"

SELECT * FROM redeem_invite('TEST-DISABLD', 'USER_ID_HERE');
-- Should raise: "Invalid or disabled invite code"

-- =====================================================================
-- TEST 6: MAX USES REACHED
-- =====================================================================
-- Expected: First redemption succeeds, second fails

-- Redeem with first user
SELECT * FROM redeem_invite('TEST-MAXUSED', 'USER_ID_1');
-- Should succeed

-- Try with second user
SELECT * FROM redeem_invite('TEST-MAXUSED', 'USER_ID_2');
-- Should raise: "Invite code max uses reached"

-- =====================================================================
-- TEST 7: USER ALREADY REDEEMED DIFFERENT CODE
-- =====================================================================
-- Expected: Exception "User already redeemed a different invite code"

-- User already redeemed TEST-VALID01 in TEST 1
SELECT * FROM redeem_invite('TEST-VALID02', 'USER_ID_FROM_TEST_1');
-- Should raise: "User already redeemed a different invite code"

-- =====================================================================
-- TEST 8: INVALID CODE
-- =====================================================================
-- Expected: Exception "Invalid or disabled invite code"

SELECT * FROM redeem_invite('INVALID-CODE', 'USER_ID_HERE');
-- Should raise: "Invalid or disabled invite code"

-- =====================================================================
-- TEST 9: ROW-LEVEL LOCKING (RACE CONDITION PREVENTION)
-- =====================================================================
-- Cannot test via SQL Editor (need concurrent transactions)
-- Test this via frontend by having two users redeem same code simultaneously

-- Verification query (run after concurrent test):
SELECT
  ic.code,
  ic.max_uses,
  COUNT(ir.id) as actual_redemptions
FROM invite_code ic
LEFT JOIN invite_redemption ir ON ir.invite_code_id = ic.id
WHERE ic.code = 'TEST-RACE-CONDITION'
GROUP BY ic.id;
-- Should never exceed max_uses, even with concurrent requests

-- =====================================================================
-- TEST 10: USER CANNOT SELF-PROMOTE
-- =====================================================================
-- Expected: Permission denied error

-- Try to update tier directly (should fail)
UPDATE user_profile
SET tier = 'paid'
WHERE user_id = auth.uid();
-- Should raise: "new row violates row-level security policy"

-- =====================================================================
-- TEST 11: TRIGGER AUTO-CREATES PROFILE
-- =====================================================================
-- Expected: New user automatically gets profile with tier='free'

-- After creating a new user via supabase.auth.signUp():
SELECT
  u.email,
  up.tier,
  up.created_at
FROM auth.users u
JOIN user_profile up ON up.user_id = u.id
WHERE u.email = 'newuser@test.com';
-- Should show: tier='free', created_at matches user creation time

-- =====================================================================
-- TEST 12: QUERY PERFORMANCE
-- =====================================================================
-- Check that queries use indexes efficiently

EXPLAIN ANALYZE
SELECT * FROM invite_code WHERE code = 'TEST-VALID01';
-- Should use: idx_invite_code_code (Index Scan)

EXPLAIN ANALYZE
SELECT * FROM user_profile WHERE user_id = 'USER_ID_HERE';
-- Should use: idx_user_profile_user_id (Index Scan)

EXPLAIN ANALYZE
SELECT * FROM invite_redemption WHERE user_id = 'USER_ID_HERE';
-- Should use: idx_invite_redemption_user_id (Index Scan)

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- 1. All users have profiles
SELECT
  COUNT(*) as total_users,
  COUNT(up.id) as users_with_profiles
FROM auth.users u
LEFT JOIN user_profile up ON up.user_id = u.id;
-- Should be equal

-- 2. No orphaned profiles
SELECT COUNT(*) as orphaned_profiles
FROM user_profile up
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = up.user_id);
-- Should be: 0

-- 3. No orphaned redemptions
SELECT COUNT(*) as orphaned_redemptions
FROM invite_redemption ir
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ir.user_id);
-- Should be: 0

-- 4. Redemption counts match
SELECT
  ic.code,
  ic.max_uses,
  (SELECT COUNT(*) FROM invite_redemption WHERE invite_code_id = ic.id) as computed_uses
FROM invite_code ic
WHERE (SELECT COUNT(*) FROM invite_redemption WHERE invite_code_id = ic.id) > ic.max_uses;
-- Should return: 0 rows (no codes over limit)

-- 5. All active codes are valid
SELECT
  code,
  CASE
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED BUT ACTIVE'
    ELSE 'OK'
  END as validation_status
FROM invite_code
WHERE status = 'active'
  AND expires_at IS NOT NULL
  AND expires_at < NOW();
-- Should return: 0 rows (no expired active codes)

-- =====================================================================
-- CLEANUP: REMOVE TEST DATA
-- =====================================================================
-- Run this after testing to clean up

DELETE FROM invite_code WHERE code LIKE 'TEST-%';

-- Remove test redemptions (cascade will handle this automatically)
-- But if you want to be explicit:
DELETE FROM invite_redemption
WHERE invite_code_id IN (SELECT id FROM invite_code WHERE code LIKE 'TEST-%');

-- =====================================================================
-- SUMMARY
-- =====================================================================
-- Expected Results:
-- ✅ TEST 1: Valid redemption succeeds, tier updated to 'beta'
-- ✅ TEST 2: Idempotent - same call returns success, no duplicate
-- ✅ TEST 3: Multi-use code allows multiple redemptions up to max_uses
-- ✅ TEST 4: Expired code raises exception
-- ✅ TEST 5: Disabled code raises exception
-- ✅ TEST 6: Max uses exceeded raises exception
-- ✅ TEST 7: User cannot redeem second code, raises exception
-- ✅ TEST 8: Invalid code raises exception
-- ✅ TEST 9: Race conditions prevented by row locking
-- ✅ TEST 10: User cannot self-promote via UPDATE, permission denied
-- ✅ TEST 11: New users auto-get profile with tier='free'
-- ✅ TEST 12: All queries use appropriate indexes

-- If all tests pass, the system is working correctly!
