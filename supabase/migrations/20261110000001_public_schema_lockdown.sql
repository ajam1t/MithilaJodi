-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261110000001 — Lock the public schema down, in one pass
--
-- WHY. The app reads and writes every table through the service-role key on the
-- server; nothing in it uses the anon key against a table (lib/supabase/client
-- and createClient() are never called for data). So the correct state is: RLS on
-- for every table, and the `anon` and `authenticated` roles holding no grant on
-- any table, sequence or function. Earlier migrations do this table by table
-- (010, 015, 20260826000004, 20261008000003 …). This file asserts the same end
-- state for all of them at once, so it no longer matters whether one of those
-- was skipped, and it stops NEW tables from being handed to anon by default.
--
-- SAFE TO RUN: every statement is idempotent; no row, column, table or policy
-- is dropped or changed; service_role (the app) is re-granted everything first.
-- No dollar-quoting is used. Run the whole file at once in the SQL editor.
--
-- ROLLBACK is at the bottom, commented out.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. The app's own access, re-asserted first so nothing below can remove it.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 2. Row Level Security on every table. With RLS on, a role that is not
--    service_role sees only what a policy allows; most tables have none.
ALTER TABLE IF EXISTS public.account_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.biodata_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.biodata_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.duplicate_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.family_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.india_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kundli_match_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maithil_mool_gotra ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.math_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.member_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pincode_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_discoverable ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_share_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.public_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wedding_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_requests ENABLE ROW LEVEL SECURITY;

-- 3. No grants for the public API roles — tables, sequences, functions.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- 4. Tables, sequences and functions created from now on start closed too.
--    (Supabase's default is to grant them to anon and authenticated.)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK — only if something stops working, which it should not: the app
-- does not use these roles. This restores Supabase's defaults for the grants;
-- it deliberately does NOT turn RLS off (that would expose member data).
--
--   GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
--   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
--   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC, anon, authenticated;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO PUBLIC, anon, authenticated;
-- ═══════════════════════════════════════════════════════════════════════════
