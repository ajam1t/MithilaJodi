-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261004000001 — Shareable Kundli Match results
--
-- Kundli Match is a public, no-login tool. Calculating stores nothing. A row is
-- written here ONLY when a visitor explicitly creates a share link.
--
-- What is stored is the COMPUTED OUTPUT projection (lib/astrology/share.ts):
-- Guna scores with their explanations, Moon rashi/nakshatra attributes, Manglik
-- status, and — only if the visitor ticks the box — the two names. Never the
-- birth date, birth time, birthplace, coordinates or planetary degrees: Sun,
-- Moon and planet longitudes together would let anyone reconstruct the birth
-- date and time.
--
-- Model follows profile_shares (20260906000003):
--   • token is a fresh random string (144 bits), not a row id;
--   • the creator receives a separate manage key and only its SHA-256 is kept,
--     so the link can be revoked from the creating device without an account;
--   • every link expires (90 days) and can be revoked instantly;
--   • RLS on with NO policies = deny-all to anon/authenticated; all access goes
--     through the service-role client in the API with the token check.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS kundli_match_shares (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token                text NOT NULL UNIQUE CHECK (char_length(token) BETWEEN 20 AND 64),
  manage_key_hash      text NOT NULL CHECK (char_length(manage_key_hash) = 64),
  summary              jsonb NOT NULL,
  methodology_version  text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  expires_at           timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  revoked_at           timestamptz,
  view_count           integer NOT NULL DEFAULT 0,
  last_viewed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS kundli_match_shares_expires_idx ON kundli_match_shares (expires_at);

ALTER TABLE kundli_match_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kundli_match_shares FROM anon, authenticated;

COMMENT ON TABLE kundli_match_shares IS
  'Explicitly shared Kundli Match results. Computed output only — never birth dates, times, places, coordinates or planetary degrees.';

-- Atomic open counter, same shape and safeguards as record_share_view().
CREATE OR REPLACE FUNCTION record_kundli_share_view(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE kundli_match_shares
     SET view_count     = view_count + 1,
         last_viewed_at = now()
   WHERE token = p_token
     AND revoked_at IS NULL
     AND expires_at > now();
$$;

REVOKE ALL ON FUNCTION record_kundli_share_view(text) FROM PUBLIC, anon, authenticated;
