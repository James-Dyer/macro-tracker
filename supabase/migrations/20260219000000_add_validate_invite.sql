-- validate_invite: read-only check of invite code validity WITHOUT consuming it
-- Returns NULL if valid, error message string if invalid
-- SECURITY DEFINER so it can read invite_code (no user RLS policies exist)
-- Callable by anon — needed for pre-signup validation before account creation
CREATE OR REPLACE FUNCTION validate_invite(p_code TEXT)
RETURNS TEXT AS $$
DECLARE
  code_record RECORD;
  redemption_count INTEGER;
BEGIN
  SELECT * INTO code_record
  FROM invite_code
  WHERE code = p_code
    AND status = 'active';

  IF code_record IS NULL THEN
    RETURN 'Invalid or disabled invite code';
  END IF;

  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN 'Invite code has expired';
  END IF;

  SELECT COUNT(*) INTO redemption_count
  FROM invite_redemption
  WHERE invite_code_id = code_record.id;

  IF redemption_count >= code_record.max_uses THEN
    RETURN 'Invite code has reached maximum uses';
  END IF;

  RETURN NULL; -- NULL = valid
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Allow anon (pre-signup) and authenticated users to call this
GRANT EXECUTE ON FUNCTION validate_invite(TEXT) TO anon, authenticated;
