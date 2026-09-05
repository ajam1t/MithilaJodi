-- 20260826000006_profile_visibility.sql
--
-- Three-level profile visibility, replacing the single `discoverable` boolean
-- as the member-facing control:
--
--   'public'   eligible to appear on public, no-login pages (home / explore)
--              AND in member search. Eligible is not the same as shown — the
--              public showcase is still admin-curated via public_showcase, so
--              choosing 'public' does not publish anyone by itself.
--   'members'  visible in member search to signed-in members only.
--   'private'  hidden from search and from public pages. Existing connections
--              and conversations are unaffected.
--
-- `discoverable` is KEPT and derived from this column, because several read
-- paths and the profile_discoverable projection already filter on it. Treating
-- visibility as the source of truth and discoverable as its cached boolean
-- avoids two competing flags drifting apart.
--
-- BACKFILL IS DELIBERATELY CONSERVATIVE: it preserves exactly what each member
-- has today and sets NOBODY to 'public'. Making an existing member's profile
-- world-visible without them asking would be a privacy incident, so 'public'
-- is opt-in only, from the profile editor.
--
-- NOTE: written with plain statements only — no dollar-quoting anywhere. The
-- Supabase SQL editor in this project mis-parses dollar-quoted blocks.

-- ── 1. Column ───────────────────────────────────────────────────────────────
-- text + CHECK rather than a new enum type, so this migration stays free of
-- dollar-quoted DO blocks and is trivially reversible.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'members';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_visibility_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_visibility_check
  CHECK (visibility IN ('public', 'members', 'private'));

COMMENT ON COLUMN profiles.visibility IS
  'Member-facing visibility: public (eligible for no-login pages + member search), members (member search only), private (hidden). Source of truth for profiles.discoverable.';

-- ── 2. Backfill from the existing flag ──────────────────────────────────────
-- discoverable = true  -> 'members'  (was visible to signed-in members)
-- discoverable = false -> 'private'  (was hidden)
-- Nobody becomes 'public' here.
UPDATE profiles SET visibility = 'members' WHERE discoverable = true;
UPDATE profiles SET visibility = 'private' WHERE discoverable = false;

-- ── 3. Keep discoverable consistent with visibility ─────────────────────────
UPDATE profiles SET discoverable = (visibility <> 'private');

-- ── 4. Index ────────────────────────────────────────────────────────────────
-- Public pages filter on visibility = 'public' over live profiles only.
CREATE INDEX IF NOT EXISTS profiles_visibility_active_idx
  ON profiles (visibility)
  WHERE deleted_at IS NULL AND profile_status = 'active';

-- ── 5. Retire contact_visibility ────────────────────────────────────────────
-- This was offered to members as a choice but no read path ever honoured it:
-- profile_private.contact_mobile / email / address are not exposed to other
-- members by any route, with or without it. Rather than leave a control that
-- silently does nothing, the column is retired. Contact sharing now happens
-- only through the explicit, revocable WhatsApp request flow.
--
-- Dropped rather than kept so no future code mistakes it for an enforced rule.
ALTER TABLE profile_private DROP COLUMN IF EXISTS contact_visibility;
