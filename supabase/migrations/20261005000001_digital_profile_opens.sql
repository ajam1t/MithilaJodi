-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261005000001 — Digital Profile link activity
--
-- profile_shares already counts opens (view_count, last_viewed_at). This adds
-- one row per counted open so a member can see WHEN their link was opened and
-- roughly how many different people opened it.
--
-- What is stored, deliberately little:
--   • share_id and the time of the open;
--   • `visitor` — a random UUID the visitor's own browser generated and kept in
--     its local storage. It is not derived from IP, user agent or anything
--     about the person, and identifies nothing outside this table. It exists
--     only to tell "opened again" from "opened by someone else".
-- No IP address, no user agent, no location. Rows older than a year are
-- dropped as new opens arrive.
--
-- Counting rules live in the function so concurrent opens stay atomic:
--   • only live links (not revoked, not expired) count;
--   • the same browser re-opening within 30 minutes is not a new open
--     (reloads, tab restores, back-and-forth from WhatsApp).
-- The owner's own visits and link-preview crawlers are excluded before the
-- call — the page's beacon never fires for them.
--
-- Additive only: profile_shares is unchanged, record_share_view is kept.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_share_opens (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  share_id   uuid NOT NULL REFERENCES profile_shares(id) ON DELETE CASCADE,
  opened_at  timestamptz NOT NULL DEFAULT now(),
  visitor    uuid
);

CREATE INDEX IF NOT EXISTS profile_share_opens_share_idx
  ON profile_share_opens (share_id, opened_at DESC);

-- Same model as profile_shares: RLS on, no policy, service role only.
ALTER TABLE profile_share_opens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON profile_share_opens FROM anon, authenticated;

CREATE OR REPLACE FUNCTION record_share_open(p_token text, p_visitor uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share uuid;
BEGIN
  SELECT id INTO v_share
    FROM profile_shares
   WHERE token = p_token
     AND revoked_at IS NULL
     AND expires_at > now();
  IF v_share IS NULL THEN
    RETURN false;
  END IF;

  IF p_visitor IS NOT NULL AND EXISTS (
    SELECT 1 FROM profile_share_opens
     WHERE share_id = v_share
       AND visitor = p_visitor
       AND opened_at > now() - interval '30 minutes'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO profile_share_opens (share_id, visitor) VALUES (v_share, p_visitor);

  UPDATE profile_shares
     SET view_count     = view_count + 1,
         last_viewed_at = now()
   WHERE id = v_share;

  DELETE FROM profile_share_opens
   WHERE share_id = v_share
     AND opened_at < now() - interval '365 days';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION record_share_open(text, uuid) FROM PUBLIC, anon, authenticated;
