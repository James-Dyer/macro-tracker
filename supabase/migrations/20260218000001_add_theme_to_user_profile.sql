-- =====================================================================
-- Add theme preference to user_profile
-- =====================================================================
-- Stores per-user theme so it syncs across devices.
-- Defaults to 'light' (new app default).

ALTER TABLE user_profile
  ADD COLUMN theme TEXT NOT NULL DEFAULT 'light'
  CHECK (theme IN ('light', 'dark'));

-- Allow users to update their own theme preference
CREATE POLICY "Users can update their own theme"
  ON user_profile
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Column-level grant: authenticated users may only UPDATE the theme column.
-- This prevents self-promotion of the tier column even with the UPDATE policy above.
GRANT UPDATE (theme) ON public.user_profile TO authenticated;
