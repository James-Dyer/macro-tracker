# Entitlement System Migration Guide

This guide walks through deploying the three-tier entitlement system (free/beta/paid) with invite code redemption.

## Overview

The entitlement system provides:
- **Three tiers:** free (default), beta (invited), paid (future)
- **Invite redemption:** Closed beta distribution via invite links
- **Resilient flow:** Survives browser close, network errors, page refresh
- **Auto-recovery:** Automatically retries failed redemptions on next login
- **Atomic operations:** Postgres RPC with row-level locking prevents race conditions

## Prerequisites

- Access to Supabase Dashboard (SQL Editor)
- Project admin permissions

## Step 1: Apply Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the entire contents of `supabase/migrations/00004_add_entitlement_system.sql`
4. Run the query

**What this creates:**
- `user_profile` table (stores tier per user)
- `invite_code` table (manages invite codes)
- `invite_redemption` table (audit trail)
- Database trigger (auto-creates profile on signup)
- Postgres RPC function `redeem_invite()` (atomic redemption logic)
- Backfills all existing users to 'beta' tier

**Verification:**
```sql
-- Check tables exist
SELECT * FROM user_profile LIMIT 5;
SELECT * FROM invite_code LIMIT 5;
SELECT * FROM invite_redemption LIMIT 5;

-- Verify existing users have 'beta' tier
SELECT tier, COUNT(*) FROM user_profile GROUP BY tier;
```

## Step 2: Generate Invite Codes

1. Open `supabase/scripts/generate_invites.sql`
2. Edit the CONFIGURATION section:
   ```sql
   batch_size INTEGER := 10;           -- Number of codes to generate
   code_tier TEXT := 'beta';           -- 'beta' or 'paid'
   code_max_uses INTEGER := 1;         -- Uses per code (1 = single-use)
   code_expires_days INTEGER := 30;    -- Days until expiration (NULL = never)
   code_prefix TEXT := 'BETA';         -- Prefix for readability
   ```
3. Run the DO block in Supabase SQL Editor
4. Copy the "LIST UNUSED CODES" query and run it to see generated codes

**Example output:**
```
code              | tier | max_uses | current_uses | remaining_uses | expires_at | status | created_at
------------------|------|----------|--------------|----------------|------------|--------|------------
BETA-abc12345     | beta | 1        | 0            | 1              | 2026-03-07 | active | 2026-02-05
BETA-def67890     | beta | 1        | 0            | 1              | 2026-03-07 | active | 2026-02-05
```

## Step 3: Deploy Frontend Changes

The frontend changes are already implemented:

**Files Updated:**
- `pwa/src/contexts/AuthContext.tsx` - Added tier fetching + auto-redemption
- `pwa/src/pages/LoginPage.tsx` - Invite code handling
- `pwa/src/hooks/useInviteRedemption.ts` - Redemption hook (new)
- `pwa/src/hooks/useEntitlement.ts` - Entitlement checking (new)

**Build and deploy:**
```bash
cd pwa
npm run build
# Deploy dist/ folder to your hosting provider
```

## Step 4: Test the System

### Test 1: Invite Code Redemption (Happy Path)
1. Generate a test invite code (e.g., `BETA-test123`)
2. Visit: `https://your-app.com/login?invite=BETA-test123`
3. Sign up with new email + password
4. Verify success message shows "Beta access"
5. Check database:
   ```sql
   SELECT up.tier, ir.redeemed_at
   FROM user_profile up
   JOIN invite_redemption ir ON ir.user_id = up.user_id
   WHERE up.user_id = '...' -- Replace with actual user_id
   ```

### Test 2: Resilient Redemption (Browser Close)
1. Visit invite link, start signup
2. Close browser immediately after submitting (before redemption completes)
3. Open app again, log in
4. Check console logs for "Auto-redemption successful"
5. Verify tier changed to 'beta' in database

### Test 3: Invalid Invite Code
1. Visit: `https://your-app.com/login?invite=invalid-code`
2. Verify error: "Invalid or disabled invite code"
3. Invite code field should disappear

### Test 4: Expired Code
1. Create code with past expiration:
   ```sql
   INSERT INTO invite_code (code, tier, max_uses, expires_at, status)
   VALUES ('BETA-expired', 'beta', 1, NOW() - INTERVAL '1 day', 'active');
   ```
2. Visit invite link with expired code
3. Verify error: "Invite code has expired"

### Test 5: Max Uses Reached
1. Create single-use code
2. Redeem with first user (should succeed)
3. Try to redeem with second user (should fail)
4. Verify error: "Invite code max uses reached"

### Test 6: Double Redemption Prevention
1. Redeem code successfully with user A
2. Try to redeem different code with same user A
3. Verify error: "You have already redeemed an invite code"

### Test 7: Normal Signup (No Invite)
1. Visit `/login` (no invite param)
2. Sign up normally
3. Verify tier defaults to 'free' in database

## Step 5: Distribute Invite Links

**Format:**
```
https://your-app.com/login?invite=BETA-abc12345
```

**Distribution channels:**
- Email to beta testers
- Private Slack/Discord channels
- TestFlight notes (for mobile apps)
- Personal messages to early adopters

**Tracking redemptions:**
```sql
-- View all redemptions
SELECT
  ic.code,
  COUNT(ir.id) as redemptions,
  ic.max_uses,
  ARRAY_AGG(u.email) as users
FROM invite_code ic
LEFT JOIN invite_redemption ir ON ir.invite_code_id = ic.id
LEFT JOIN auth.users u ON u.id = ir.user_id
GROUP BY ic.id
ORDER BY ic.created_at DESC;
```

## Admin Operations

### Disable a Code (Soft Delete)
```sql
UPDATE invite_code
SET status = 'disabled'
WHERE code = 'BETA-abc12345';
```

### Reactivate a Code
```sql
UPDATE invite_code
SET status = 'active'
WHERE code = 'BETA-abc12345';
```

### Extend Expiration
```sql
UPDATE invite_code
SET expires_at = NOW() + INTERVAL '30 days'
WHERE code = 'BETA-abc12345';
```

### Manually Promote User
```sql
-- Call the RPC function (same as frontend uses)
SELECT * FROM redeem_invite('BETA-abc12345', '00000000-0000-0000-0000-000000000001');
```

### View Redemption History for Code
```sql
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
```

## How Auto-Recovery Works

**Problem:** User signs up with invite code, but redemption fails (network error, browser crash, etc.)

**Solution:**
1. Invite code persists in `localStorage` as `pendingInviteCode`
2. On every session establishment, `AuthContext` checks for pending code
3. If found, automatically calls `redeem_invite()` RPC
4. Continues retrying until success
5. Once tier updated, removes pending code

**User experience:**
- Sign up succeeds even if redemption fails
- User can access app on free tier
- On next login, tier automatically upgraded to beta
- Silent background process (no user action needed)

## Idempotency

The `redeem_invite()` RPC function is idempotent - safe to call multiple times:

**Same user, same code:**
- First call: Updates tier, creates redemption record
- Subsequent calls: Returns success immediately (no error)

**Same user, different code:**
- Second call: Raises exception "User already redeemed a different invite code"

This allows unlimited retries without side effects or duplicate redemptions.

## Security Notes

**User tier self-promotion prevention:**
- `user_profile` table has SELECT-only RLS policy
- Users cannot run: `UPDATE user_profile SET tier = 'paid'`
- Postgres rejects with permission denied error
- Only RPC with SECURITY DEFINER can update tier

**Race condition prevention:**
- RPC uses `SELECT ... FOR UPDATE` for row-level locking
- If two users redeem same single-use code simultaneously:
  - First user: Locks row, validates, creates redemption, commits
  - Second user: Waits for lock, validates, sees max uses reached, raises exception
- Only first user succeeds

**Audit trail:**
- `invite_redemption` table tracks all redemptions
- Cannot be modified by users (no RLS policies)
- Soft-delete via `status` field preserves history

## Future Enhancements

**Not implemented yet, but foundation is ready:**

1. **Free tier restrictions:**
   - Daily scan limits (e.g., 10 scans/day)
   - Limited history (last 30 days)
   - No data export

2. **Paid tier features:**
   - Unlimited scans
   - Advanced analytics
   - Data export (CSV, PDF)
   - Priority support

3. **Admin UI:**
   - Dashboard for code management
   - Redemption analytics
   - User tier upgrades/downgrades

4. **Multi-use influencer codes:**
   - Codes with higher max_uses (e.g., 100)
   - Tracking redemptions per influencer
   - Revenue sharing analytics

## Troubleshooting

### Issue: "Missing required environment variables"
**Cause:** Edge Function secrets not set
**Fix:** Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set in Supabase Dashboard → Settings → Edge Functions

### Issue: User signed up but tier still 'free'
**Cause:** Redemption failed silently
**Fix:**
1. Check browser console for errors
2. Verify `pendingInviteCode` in localStorage
3. User logs in again (auto-recovery will retry)
4. Or manually promote via SQL

### Issue: "Invite code max uses reached" but code shows 0 redemptions
**Cause:** Database trigger not firing
**Fix:**
1. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Re-run trigger creation from migration

### Issue: Auto-redemption not triggering
**Cause:** `pendingInviteCode` not in localStorage
**Fix:**
1. Visit invite link again
2. Check that `localStorage.setItem()` runs on LoginPage
3. Verify `AuthContext` calls `tryAutoRedemption()` on session load

## Support

For questions or issues:
1. Check browser console logs (prefixed with `[AuthContext]` or `[LoginPage]`)
2. Query database for user's profile and redemptions
3. Check Supabase logs for RPC errors
4. Review this guide's troubleshooting section
