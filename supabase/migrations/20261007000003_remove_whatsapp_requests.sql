-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261007000003 — remove the WhatsApp contact-request system
--
-- The product no longer exchanges phone numbers between members (owner's
-- decision, 2026-10-07). Members connect through interests and in-platform
-- messaging. Sharing a Digital Profile LINK on WhatsApp is a separate feature
-- and is unaffected — it never touched these objects.
--
-- Removes only what existed exclusively for that system (migrations
-- 20260826000003 and 20260906000002):
--   • table whatsapp_requests — with its indexes and its updated_at trigger,
--     which go with the table. It had RLS on and no policies (deny-all), so
--     there are no policies to drop. Nothing references it: no foreign keys,
--     views or functions (checked before writing this).
--   • column accounts.whatsapp_opt_in — read and written only by the removed
--     /api/whatsapp routes.
-- The shared update_updated_at() function is used by other tables and stays.
--
-- Irreversible: deletes the request rows (at the time of writing, 4 approved
-- requests) and every account's opt-in flag (31 set). The application stopped
-- reading both before this ran, so no number is revealed in the meantime.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS whatsapp_requests;

ALTER TABLE accounts DROP COLUMN IF EXISTS whatsapp_opt_in;
