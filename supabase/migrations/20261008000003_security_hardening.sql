-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261008000003 — Security hardening (audit 2026-10-08)
--
-- 1. Atomic OTP attempt counting. verify() used to read `attempts` and write
--    back attempts + 1, so a burst of parallel guesses all passed the 5-try
--    limit — a 4-digit code could be brute-forced. otp_consume_attempt()
--    increments and checks in one statement.
-- 2. Atomic failed-password counting, for the same reason (lockout bypass).
-- 3. profiles.admin_hidden: an admin's "hide from search" now survives the
--    member's next profile save (which recomputed `discoverable` and undid it).
-- 4. Least privilege: two lookup tables still granted anon/authenticated
--    every privilege (TRUNCATE ignores RLS); app functions callable by anon.
-- 5. Indexes for real query patterns; drop one duplicate index.
--
-- All additive or privilege-reducing. No data is changed.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1 ── OTP ────────────────────────────────────────────────────────────────────
-- Returns the challenge row's hash only if this call took an attempt slot;
-- NULL means: no live challenge, expired, used, or out of attempts.
CREATE OR REPLACE FUNCTION otp_consume_attempt(p_mobile text, p_max integer)
RETURNS TABLE (id uuid, otp_hash text, attempts integer)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE otp_challenges c
     SET attempts = c.attempts + 1
   WHERE c.id = (
           SELECT x.id FROM otp_challenges x
            WHERE x.mobile = p_mobile AND x.used = false AND x.expires_at > now()
            ORDER BY x.created_at DESC LIMIT 1
         )
     AND c.attempts < p_max
     AND c.used = false
  RETURNING c.id, c.otp_hash, c.attempts;
$$;

-- 2 ── Password lockout ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION register_failed_login(p_account uuid, p_max integer, p_lock_minutes integer)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE accounts
     SET failed_login_attempts = coalesce(failed_login_attempts, 0) + 1,
         locked_until = CASE WHEN coalesce(failed_login_attempts, 0) + 1 >= p_max
                             THEN now() + make_interval(mins => p_lock_minutes) ELSE locked_until END
   WHERE id = p_account
  RETURNING failed_login_attempts;
$$;

-- 3 ── Admin hide ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_hidden boolean NOT NULL DEFAULT false;

-- 4 ── Least privilege ────────────────────────────────────────────────────────
REVOKE ALL ON maithil_mool_gotra FROM anon, authenticated;
REVOKE ALL ON pincode_lookups FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION current_account_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_admin_or_moderator() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION refresh_membership_statuses() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION rebuild_profile_discoverable(uuid) FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION can_access_profile(uuid, text) FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN undefined_function THEN NULL; END $$;
-- The server (service_role) and triggers keep using them.
GRANT EXECUTE ON FUNCTION current_account_id(), is_admin_or_moderator(), refresh_membership_statuses(),
  rebuild_profile_discoverable(uuid), can_access_profile(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION otp_consume_attempt(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION register_failed_login(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION otp_consume_attempt(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION register_failed_login(uuid, integer, integer) TO service_role;

-- 5 ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS shortlists_saved_idx ON shortlists (saved_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages (sender_id);
CREATE INDEX IF NOT EXISTS reports_reporter_reported_idx ON reports (reporter_id, reported_id);
CREATE INDEX IF NOT EXISTS moderation_flags_profile_idx ON moderation_flags (profile_id);
CREATE INDEX IF NOT EXISTS otp_challenges_mobile_live_idx ON otp_challenges (mobile, created_at DESC) WHERE used = false;
DROP INDEX IF EXISTS profile_shares_token_idx; -- duplicate of the unique profile_shares_token_key

COMMIT;
