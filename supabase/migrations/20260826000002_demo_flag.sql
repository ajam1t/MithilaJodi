-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260826000002 — Demo profile flag
--
-- Adds an `is_demo` marker to accounts and profiles so the 20 synthetic
-- testing profiles can be identified and removed cleanly before/at real-user
-- launch. Real users always have is_demo = false (the default).
--
-- Removal when real users arrive (order matters — profiles FK is ON DELETE
-- RESTRICT against accounts):
--   DELETE FROM profiles  WHERE is_demo = true;   -- cascades prefs/photos
--   DELETE FROM accounts  WHERE is_demo = true;
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Partial index — cheap, only indexes the handful of demo rows.
CREATE INDEX IF NOT EXISTS profiles_is_demo_idx ON profiles (is_demo) WHERE is_demo = true;

COMMENT ON COLUMN profiles.is_demo IS 'Synthetic demo/test profile — not a real user. Remove before/at real-user launch.';
COMMENT ON COLUMN accounts.is_demo IS 'Synthetic demo/test account — not a real user. Remove before/at real-user launch.';
