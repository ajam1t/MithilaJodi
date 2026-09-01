-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260826000003 — Privacy-first WhatsApp connection requests
--
-- Mobile numbers already live on accounts.mobile and are NEVER public. This
-- migration adds an explicit, revocable consent layer on top:
--
--   1. A member opts in to being reachable on WhatsApp (accounts.whatsapp_opt_in).
--   2. After an interest is ACCEPTED, either side may request WhatsApp contact.
--   3. The receiving member must explicitly approve.
--   4. Only then is the number revealed — to that one member, and only while
--      the approval stands. Approval can be revoked at any time.
-- ═══════════════════════════════════════════════════════════════════════════

-- Opt-in: is this account willing to share WhatsApp at all?
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN accounts.whatsapp_opt_in IS
  'Member consented to their registered mobile being shareable on WhatsApp after they approve a specific request. Never implies public exposure.';

-- `status` is text + CHECK rather than an enum, so this migration contains no
-- dollar-quoted DO block (the Supabase SQL editor has mis-parsed those in this
-- project). The API validates the same four values with zod.
CREATE TABLE IF NOT EXISTS whatsapp_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- who is asking to see the number
  requester_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- whose number is being requested (the approver)
  owner_profile_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'declined', 'revoked')),
  requested_at      timestamptz NOT NULL DEFAULT now(),
  responded_at      timestamptz,
  revoked_at        timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_requests_not_self CHECK (requester_profile_id <> owner_profile_id)
);

-- One live request per direction; re-requesting updates the existing row.
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_requests_pair_idx
  ON whatsapp_requests (requester_profile_id, owner_profile_id);

CREATE INDEX IF NOT EXISTS whatsapp_requests_owner_idx
  ON whatsapp_requests (owner_profile_id, status);
CREATE INDEX IF NOT EXISTS whatsapp_requests_requester_idx
  ON whatsapp_requests (requester_profile_id, status);

DROP TRIGGER IF EXISTS whatsapp_requests_updated_at ON whatsapp_requests;
CREATE TRIGGER whatsapp_requests_updated_at
  BEFORE UPDATE ON whatsapp_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS on with NO policy = deny-all to anon/authenticated. All access goes
-- through the service-role client with authorization enforced in the API,
-- matching the otp_challenges pattern in migration 010.
ALTER TABLE whatsapp_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON whatsapp_requests FROM anon, authenticated;
