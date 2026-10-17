-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261017000001 — Optional bride and groom photos on invitations
--
-- The couple may add a photo of the bride and/or the groom. The invitation
-- itself still travels as its compact code in `payload`; the photos are kept
-- beside it, never inside it, so the code stays small enough for a link.
--
--   photos             {"bride": "data:image/webp;base64,…", "groom": …}
--                      Each is shrunk in the browser to 480×600 (~30–60 KB)
--                      and validated again by the API. NULL = no photos.
--   photos_consent_at  When the couple confirmed the photos may be shown to
--                      anyone with the link and that they have permission.
--
-- Photos go with their row: removed from the builder, they are removed here;
-- and the row is deleted 180 days after it was created, like every
-- invitation. Service-role access only (RLS on, anon revoked — unchanged).
--
-- Plain statements only: the Supabase SQL editor mis-parses dollar-quoting.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE wedding_invites ADD COLUMN IF NOT EXISTS photos jsonb;
ALTER TABLE wedding_invites ADD COLUMN IF NOT EXISTS photos_consent_at timestamptz;

ALTER TABLE wedding_invites DROP CONSTRAINT IF EXISTS wedding_invites_photos_size;
ALTER TABLE wedding_invites ADD CONSTRAINT wedding_invites_photos_size
  CHECK (photos IS NULL OR octet_length(photos::text) <= 400000);

ALTER TABLE wedding_invites DROP CONSTRAINT IF EXISTS wedding_invites_photos_consent;
ALTER TABLE wedding_invites ADD CONSTRAINT wedding_invites_photos_consent
  CHECK (photos IS NULL OR photos_consent_at IS NOT NULL);
