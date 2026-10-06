-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261007000002 — Member notification centre
--
-- Extends the EXISTING notifications table (migration 006) rather than adding
-- a second one. Rows written before this keep working: the app renders a row
-- from its own title/message when present, and falls back to type + payload
-- for older rows.
--
--   • notifications: + title, message, icon, cta_label, cta_url, source,
--     dedupe_key, campaign_id, expires_at, read_at. `payload` stays the
--     metadata column.
--   • (notification_type values are added by 20261007000001, applied first:
--     a new enum value cannot be used in the transaction that adds it.)
--   • notification_campaigns (new): admin-created announcements, fanned out
--     into notifications for the chosen audience.
--   • notification_sync_state (new): when each member's automatic
--     notifications were last computed, so that work is throttled.
--
-- Access model is unchanged from the rest of the schema: the app talks to the
-- database only through the service role and scopes every query to the
-- session's account; RLS is on and anon/authenticated have no grants, so no
-- client can read anyone's notifications directly. The existing
-- notifications_own policy (account_id = auth.uid()) is kept.
--
-- Additive only. Nothing is dropped, renamed or rewritten.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Admin campaigns ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  message         text NOT NULL CHECK (length(message) BETWEEN 1 AND 500),
  type            notification_type NOT NULL DEFAULT 'announcement',
  cta_label       text CHECK (cta_label IS NULL OR length(cta_label) BETWEEN 1 AND 40),
  -- Internal paths only ("/search", "/profile/edit"): an announcement can never
  -- send members off-site.
  cta_url         text CHECK (cta_url IS NULL OR cta_url ~ '^/[A-Za-z0-9]'),
  audience        text NOT NULL CHECK (audience IN ('all', 'male', 'female', 'incomplete', 'condition', 'specific')),
  audience_filter jsonb NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,
  delivered_count integer NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON notification_campaigns FROM anon, authenticated;

-- ── New columns on notifications ───────────────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS message     text,
  ADD COLUMN IF NOT EXISTS icon        text,
  ADD COLUMN IF NOT EXISTS cta_label   text,
  ADD COLUMN IF NOT EXISTS cta_url     text,
  ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS dedupe_key  text,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS read_at     timestamptz;

DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT notifications_source_check CHECK (source IN ('system', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Dedupe lookups: "is there already one of these for this member?"
CREATE INDEX IF NOT EXISTS notifications_dedupe_idx
  ON notifications (account_id, dedupe_key, created_at DESC)
  WHERE dedupe_key IS NOT NULL;

-- One delivery per member per campaign, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_campaign_once_idx
  ON notifications (campaign_id, account_id)
  WHERE campaign_id IS NOT NULL;

-- ── Sync throttle ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_sync_state (
  account_id     uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_sync_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON notification_sync_state FROM anon, authenticated;

-- Re-assert for the extended table (creating tables re-applies default grants).
REVOKE ALL ON notifications FROM anon, authenticated;
