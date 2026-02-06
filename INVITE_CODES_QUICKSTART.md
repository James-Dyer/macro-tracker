# Invite Codes - Quick Start Guide

This is a quick reference for managing invite codes for the MacroTracker closed beta.

## Generate Invite Codes (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy this query and customize the values:

```sql
DO $$
DECLARE
  batch_size INTEGER := 10;           -- How many codes to create
  code_tier TEXT := 'beta';           -- 'beta' or 'paid'
  code_max_uses INTEGER := 1;         -- 1 = single-use
  code_expires_days INTEGER := 30;    -- Days until expiration (NULL = never)
  code_prefix TEXT := 'BETA';         -- Prefix (e.g., BETA-abc123)
  i INTEGER;
  random_suffix TEXT;
  full_code TEXT;
BEGIN
  FOR i IN 1..batch_size LOOP
    random_suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    full_code := code_prefix || '-' || random_suffix;

    INSERT INTO invite_code (code, tier, max_uses, expires_at, status)
    VALUES (
      full_code,
      code_tier,
      code_max_uses,
      CASE WHEN code_expires_days IS NOT NULL
        THEN NOW() + (code_expires_days || ' days')::INTERVAL
        ELSE NULL END,
      'active'
    );

    RAISE NOTICE 'Generated code: %', full_code;
  END LOOP;
END $$;
```

3. Run the query
4. See generated codes in the logs

## View Unused Codes

```sql
SELECT
  ic.code,
  ic.tier,
  ic.max_uses,
  COUNT(ir.id) as current_uses,
  ic.max_uses - COUNT(ir.id) as remaining_uses,
  ic.expires_at,
  ic.status
FROM invite_code ic
LEFT JOIN invite_redemption ir ON ir.invite_code_id = ic.id
WHERE ic.status = 'active'
  AND (ic.expires_at IS NULL OR ic.expires_at > NOW())
GROUP BY ic.id
HAVING COUNT(ir.id) < ic.max_uses
ORDER BY ic.created_at DESC;
```

## Share Invite Links

**Format:**
```
http://localhost:5173/login?invite=BETA-abc12345
```

**What happens when user clicks:**
1. LoginPage auto-switches to signup mode
2. Shows: "You're invited to MacroTracker Beta!"
3. Invite code displayed (read-only)
4. User signs up normally
5. Tier automatically assigned to 'beta'

## Check Redemptions

```sql
-- See who redeemed each code
SELECT
  ic.code,
  ir.redeemed_at,
  u.email,
  up.tier
FROM invite_code ic
JOIN invite_redemption ir ON ir.invite_code_id = ic.id
JOIN auth.users u ON u.id = ir.user_id
JOIN user_profile up ON up.user_id = ir.user_id
ORDER BY ir.redeemed_at DESC;
```

## Common Admin Tasks

### Disable a Code
```sql
UPDATE invite_code
SET status = 'disabled'
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
-- Get user_id first
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Then redeem code for them
SELECT * FROM redeem_invite('BETA-abc12345', 'USER_ID_HERE');
```

### Check User's Tier
```sql
SELECT
  u.email,
  up.tier,
  ir.redeemed_at,
  ic.code as invite_code_used
FROM auth.users u
JOIN user_profile up ON up.user_id = u.id
LEFT JOIN invite_redemption ir ON ir.user_id = u.id
LEFT JOIN invite_code ic ON ic.id = ir.invite_code_id
WHERE u.email = 'user@example.com';
```

## Redemption Statistics

```sql
-- Overall stats
SELECT
  tier,
  COUNT(*) as total_codes,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_codes,
  SUM((SELECT COUNT(*) FROM invite_redemption WHERE invite_code_id = ic.id)) as total_redemptions
FROM invite_code ic
GROUP BY tier;
```

## Troubleshooting

### User says invite code doesn't work

1. Check code exists and is active:
```sql
SELECT * FROM invite_code WHERE code = 'BETA-abc12345';
```

2. Check if expired:
```sql
SELECT code, expires_at, expires_at < NOW() as is_expired
FROM invite_code
WHERE code = 'BETA-abc12345';
```

3. Check if max uses reached:
```sql
SELECT
  ic.code,
  ic.max_uses,
  COUNT(ir.id) as current_uses
FROM invite_code ic
LEFT JOIN invite_redemption ir ON ir.invite_code_id = ic.id
WHERE ic.code = 'BETA-abc12345'
GROUP BY ic.id;
```

### User signed up but still on free tier

1. Check for pending redemption:
```sql
SELECT
  u.email,
  up.tier,
  ir.redeemed_at
FROM auth.users u
JOIN user_profile up ON up.user_id = u.id
LEFT JOIN invite_redemption ir ON ir.user_id = u.id
WHERE u.email = 'user@example.com';
```

2. If no redemption record, manually redeem:
```sql
SELECT * FROM redeem_invite('BETA-abc12345', 'USER_ID_HERE');
```

3. Or check browser console logs when they log in (auto-recovery will retry)

## Best Practices

✅ **Single-use codes for public distribution**
- Set `max_uses = 1`
- Each tester gets unique code
- Easy to track who invited who

✅ **Multi-use codes for team/VIPs**
- Set `max_uses = 10` (or higher)
- Share with close group
- Track redemptions by code

✅ **Expiration dates for time-limited beta**
- Set `expires_at` to beta end date
- Prevents late signups
- Clear timeline for testers

✅ **Descriptive prefixes**
- `BETA-` for closed beta
- `VIP-` for special access
- `TEAM-` for internal testing

✅ **Regular monitoring**
- Check redemption stats weekly
- Identify unused codes
- Follow up with testers

## Example: Launch Closed Beta to 50 Testers

```sql
-- Generate 50 single-use codes, expire in 60 days
DO $$
DECLARE
  batch_size INTEGER := 50;
  code_tier TEXT := 'beta';
  code_max_uses INTEGER := 1;
  code_expires_days INTEGER := 60;
  code_prefix TEXT := 'BETA';
  i INTEGER;
  random_suffix TEXT;
  full_code TEXT;
BEGIN
  FOR i IN 1..batch_size LOOP
    random_suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    full_code := code_prefix || '-' || random_suffix;
    INSERT INTO invite_code (code, tier, max_uses, expires_at, status)
    VALUES (full_code, code_tier, code_max_uses, NOW() + (code_expires_days || ' days')::INTERVAL, 'active');
    RAISE NOTICE 'Generated: %', full_code;
  END LOOP;
END $$;
```

Then:
1. Copy codes from logs
2. Send personalized emails to 50 testers
3. Monitor redemptions over first week
4. Follow up with non-redeemers after 7 days

## Quick Links

- **Full documentation:** See `ENTITLEMENT_MIGRATION.md`
- **Implementation details:** See `IMPLEMENTATION_SUMMARY.md`
- **Full admin script:** See `supabase/scripts/generate_invites.sql`
