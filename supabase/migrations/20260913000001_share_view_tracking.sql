-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260913000001 — Count opens of a shared profile link
--
-- profile_shares has carried view_count and last_viewed_at since 20260906000003,
-- but nothing ever wrote to them, so every link read zero. This adds the write
-- path and an index for the admin roll-up.
--
-- A function rather than an UPDATE from the API, because the increment has to
-- read and write the same row: two people opening a link in the same moment
-- would each write "the value I read, plus one" and the second would silently
-- discard the first. `view_count + 1` evaluated inside the statement is atomic
-- under Postgres row locking, and the supabase-js client cannot express a
-- column-referencing update.
--
-- SECURITY DEFINER with a pinned search_path: the page that calls this serves
-- anonymous visitors, so the function must not be hijackable by a search_path
-- shadowing a table name. EXECUTE stays revoked from anon and authenticated —
-- the call comes from the service-role client, like every other write here.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION record_share_view(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profile_shares
     SET view_count     = view_count + 1,
         last_viewed_at = now()
   WHERE token = p_token
     AND revoked_at IS NULL
     AND expires_at > now();
$$;

REVOKE ALL ON FUNCTION record_share_view(text) FROM PUBLIC, anon, authenticated;

-- The admin list rolls these up per profile for a page of profiles at a time.
CREATE INDEX IF NOT EXISTS profile_shares_profile_views_idx
  ON profile_shares (profile_id, view_count DESC);
