-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260906000003 — Shareable profile links
--
-- A member can mint a link to their own profile and send it on WhatsApp. The
-- recipient opens it without an account.
--
-- The token is a fresh random string, NOT the profile id. Reusing the profile
-- id would make the link permanent and unrevocable — killing it would mean
-- changing the profile's primary key. A separate token means a member can hand
-- out several links, label them, and kill one without touching the others.
--
-- Treat these as UNLISTED, not private. A WhatsApp link gets forwarded,
-- screenshotted and pasted into family groups, so the design assumes the URL
-- will travel further than intended:
--   • `fields` is an allowlist — the owner chooses what a link exposes;
--   • contact details are off unless explicitly included on that link;
--   • every link expires, and can be revoked instantly;
--   • view_count exists so an owner can notice a link that has escaped.
-- The page itself is noindex and /p/ is disallowed in robots.txt.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_shares (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 22-char base64url of 16 random bytes, generated in the API.
  token        text NOT NULL UNIQUE,

  -- The owner's own note: "For the Sharma family". Never shown to the viewer.
  label        text,

  -- Allowlist of sections this link may render. 'basic' is always present —
  -- a share with nothing on it would be a blank page.
  fields       jsonb NOT NULL DEFAULT '["basic","photos","community","location","education","career","lifestyle","family","about"]'::jsonb,

  -- Default one year, and the owner can set any date or revoke immediately.
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  revoked_at   timestamptz,

  view_count     integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- The lookup on every visit: by token, live only.
CREATE INDEX IF NOT EXISTS profile_shares_token_idx ON profile_shares (token);
CREATE INDEX IF NOT EXISTS profile_shares_profile_idx ON profile_shares (profile_id, created_at DESC);

DROP TRIGGER IF EXISTS profile_shares_updated_at ON profile_shares;
CREATE TRIGGER profile_shares_updated_at
  BEFORE UPDATE ON profile_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS on with NO policy = deny-all to anon and authenticated. Every read goes
-- through the service-role client with the token check in the API, matching
-- whatsapp_requests and otp_challenges. Critically, this keeps `anon` from
-- enumerating tokens — which would defeat the whole scheme.
ALTER TABLE profile_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON profile_shares FROM anon, authenticated;
