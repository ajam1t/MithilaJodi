-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261005000002 — Short links for wedding invitations
--
-- Until now an invitation lived entirely in its URL (/wedding/<names>?d=…) and
-- nothing was stored. That stays true for the invitation itself; this table
-- only gives an invitation a short public address:
--
--   /Invitation/Muskan-Jha-Rahul-Kumar-15122026
--
-- One row = the invitation's compact code (the same `d` payload, 1–3 KB) under
-- a unique slug. Rows are deleted 180 days after they are created (the user
-- chose bounded storage; edits do not extend it), after which the short link
-- stops working. The long self-contained link keeps working regardless.
--
-- There are no accounts here. Ownership is a random edit key handed to the
-- couple once, in their private edit link; only its SHA-256 is stored. The
-- slug identifies, it never authorises.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wedding_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- lower-case, for case-insensitive lookup and uniqueness…
  slug          text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 120),
  -- …and the same slug as it should be shown: Muskan-Jha-Rahul-Kumar-15122026
  display_slug  text NOT NULL CHECK (lower(display_slug) = slug),
  payload       text NOT NULL CHECK (length(payload) <= 8000),
  -- Lets an old long link find its short link: sha256 of the payload.
  payload_hash  text NOT NULL,
  edit_key_hash text NOT NULL,
  wedding_date  date,
  -- created_at + 180 days; set by the API, not moved by edits.
  delete_after  date NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wedding_invites_payload_hash_idx ON wedding_invites (payload_hash);
CREATE INDEX IF NOT EXISTS wedding_invites_delete_after_idx ON wedding_invites (delete_after);

DROP TRIGGER IF EXISTS wedding_invites_updated_at ON wedding_invites;
CREATE TRIGGER wedding_invites_updated_at
  BEFORE UPDATE ON wedding_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Service role only, like every other table here.
ALTER TABLE wedding_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wedding_invites FROM anon, authenticated;
