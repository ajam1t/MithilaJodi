-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261022000001 — Photos on request, and contact details on request
--
-- photo_requests    A member asks to see the photographs of someone whose
--                   photo visibility is 'on_request'. The owner approves,
--                   declines, or later revokes. An approved row is what
--                   lib/photoAccess.ts re-admits the requester on.
-- contact_requests  Between two matched members (an accepted interest), one
--                   asks for the other's contact number. Approved → the
--                   requester can read the owner's contact projection
--                   (number, whose number, email, how they like to be
--                   contacted). Never the address.
--
-- One row per (requester, owner) pair: a re-request after a decline reuses the
-- row (the app enforces a 30-day wait). A cancelled request is deleted.
--
-- Both are read and written only by the app through the service-role client,
-- which bypasses RLS. RLS is enabled with NO policy and anon/authenticated
-- lose every grant — the same deny-all pattern as migration 20260826000004.
--
-- Until this runs the app hides the request buttons and the Inbox "Requests"
-- tab, the APIs answer 503 "This feature is not switched on yet.", and an
-- 'on_request' photo setting behaves exactly like 'connected' (matches only).
--
-- No dollar-quoting. Every statement is idempotent, so it is safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS photo_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_profile     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'declined', 'revoked')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  decided_at        timestamptz,
  CONSTRAINT photo_requests_pair_unique UNIQUE (requester_profile, owner_profile),
  CONSTRAINT photo_requests_not_self CHECK (requester_profile <> owner_profile)
);

CREATE INDEX IF NOT EXISTS photo_requests_owner_status_idx     ON photo_requests (owner_profile, status);
CREATE INDEX IF NOT EXISTS photo_requests_requester_status_idx ON photo_requests (requester_profile, status);

CREATE TABLE IF NOT EXISTS contact_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_profile     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'declined', 'revoked')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  decided_at        timestamptz,
  CONSTRAINT contact_requests_pair_unique UNIQUE (requester_profile, owner_profile),
  CONSTRAINT contact_requests_not_self CHECK (requester_profile <> owner_profile)
);

CREATE INDEX IF NOT EXISTS contact_requests_owner_status_idx     ON contact_requests (owner_profile, status);
CREATE INDEX IF NOT EXISTS contact_requests_requester_status_idx ON contact_requests (requester_profile, status);

-- ── Service role only ──────────────────────────────────────────────────────
ALTER TABLE photo_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON photo_requests   FROM anon, authenticated;
REVOKE ALL ON contact_requests FROM anon, authenticated;
