-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260906000002 — WhatsApp requests allowed by default
--
-- `accounts.whatsapp_opt_in` shipped defaulting to false, which meant a member
-- could approve a WhatsApp request and the requester would still be shown
-- nothing: the reveal in GET /api/whatsapp re-checks the owner's opt-in, and it
-- was false for everybody who had never found the toggle in Settings. The
-- feature was effectively off for the whole site.
--
-- WHAT THIS FLAG ACTUALLY CONTROLS — worth being precise, because the name
-- reads more alarming than the behaviour:
--   • it does NOT publish anyone's number anywhere;
--   • it does NOT share a number automatically;
--   • it means "members I have already matched with may ASK me for WhatsApp".
-- The number is still revealed only after the owner approves that specific
-- person, and approval is revocable at any time.
--
-- The UPDATE turns it on for existing accounts too. That is deliberate and was
-- explicitly asked for, but note the trade-off: there is no
-- `whatsapp_opt_in_updated_at`, so a member who deliberately switched this off
-- is indistinguishable from one who never touched it, and this turns it back on
-- for both. Anyone who wants it off can switch it off again in Settings.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE accounts ALTER COLUMN whatsapp_opt_in SET DEFAULT true;

COMMENT ON COLUMN accounts.whatsapp_opt_in IS
  'Member is willing to RECEIVE WhatsApp requests from matched members. On by default. Never implies public exposure, and never shares the number without a per-person approval.';

UPDATE accounts SET whatsapp_opt_in = true WHERE whatsapp_opt_in = false;
