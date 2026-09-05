-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260826000004 — Enable RLS on tables that never had it
--
-- Migration 010 enabled RLS on the profile/messaging tables, and 015 revoked
-- anon SELECT on three of them after discovering that Supabase's default
-- `GRANT ... TO anon, authenticated` on schema public makes every table
-- reachable through the public PostgREST endpoint with the (public) anon key.
--
-- That reasoning was never applied to the tables below. Several are sensitive:
--   plan_config       pricing; a writable row could set price_paise = 0
--   admin_audit_logs  HAS a policy (migration 010) but RLS was never enabled,
--                     so the policy is inert. Holds admin actions, IPs, user
--                     agents and before/after payloads.
--   math_challenges   answer_hash + session_key (the bot gate)
--   moderation_flags  un-actioned abuse signals tied to profiles/accounts
--   duplicate_flags   account-pair similarity scores
--   public_showcase   writable => inject any profile onto the public page
--   blog_*            writable => publish arbitrary content on the site
--
-- All of these are read by the app through the service-role client, which
-- bypasses RLS entirely. Enabling RLS with NO permissive policy therefore
-- changes nothing for the application and closes the hole for anon — the same
-- deny-all pattern already used for otp_challenges.
--
-- No dollar-quoting is used anywhere in this file (the Supabase SQL editor has
-- mis-parsed it in this project). ENABLE ROW LEVEL SECURITY and REVOKE are both
-- idempotent, so this migration is safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tables that never had RLS enabled ──────────────────────────────────────
ALTER TABLE plan_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_flags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_flags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_challenges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_showcase     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE biodata_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_masters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_levels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE professions         ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON plan_config       FROM anon, authenticated;
REVOKE ALL ON admin_audit_logs  FROM anon, authenticated;
REVOKE ALL ON moderation_flags  FROM anon, authenticated;
REVOKE ALL ON duplicate_flags   FROM anon, authenticated;
REVOKE ALL ON math_challenges   FROM anon, authenticated;
REVOKE ALL ON public_showcase   FROM anon, authenticated;
REVOKE ALL ON blog_posts        FROM anon, authenticated;
REVOKE ALL ON blog_categories   FROM anon, authenticated;
REVOKE ALL ON biodata_templates FROM anon, authenticated;
REVOKE ALL ON india_locations   FROM anon, authenticated;
REVOKE ALL ON community_masters FROM anon, authenticated;
REVOKE ALL ON education_levels  FROM anon, authenticated;
REVOKE ALL ON professions       FROM anon, authenticated;

-- ── Re-assert deny-all on the member data surface ──────────────────────────
-- Creating a table re-applies the schema default grants, so tables added after
-- migration 015 may have handed anon access back. Cheap to re-revoke.
REVOKE ALL ON profiles              FROM anon, authenticated;
REVOKE ALL ON profile_photos        FROM anon, authenticated;
REVOKE ALL ON profile_private       FROM anon, authenticated;
REVOKE ALL ON profile_preferences   FROM anon, authenticated;
REVOKE ALL ON profile_discoverable  FROM anon, authenticated;
REVOKE ALL ON accounts              FROM anon, authenticated;
REVOKE ALL ON account_sessions      FROM anon, authenticated;
REVOKE ALL ON otp_challenges        FROM anon, authenticated;
REVOKE ALL ON interests             FROM anon, authenticated;
REVOKE ALL ON shortlists            FROM anon, authenticated;
REVOKE ALL ON blocks                FROM anon, authenticated;
REVOKE ALL ON conversations         FROM anon, authenticated;
REVOKE ALL ON messages              FROM anon, authenticated;
REVOKE ALL ON notifications         FROM anon, authenticated;
REVOKE ALL ON reports               FROM anon, authenticated;
REVOKE ALL ON verifications         FROM anon, authenticated;
REVOKE ALL ON memberships           FROM anon, authenticated;
REVOKE ALL ON payments              FROM anon, authenticated;
REVOKE ALL ON legal_consents        FROM anon, authenticated;
REVOKE ALL ON biodata_generations   FROM anon, authenticated;
REVOKE ALL ON family_permissions    FROM anon, authenticated;

-- contact_submissions was missed by the original list. It holds contact-form
-- data — names, emails, phone numbers and message bodies — and was live-readable
-- with the public anon key (verified: HTTP 200 before, 401 after). RLS was
-- already on, so a permissive policy must have been allowing it; revoking the
-- grants closes it regardless. REVOKE is idempotent, so re-running is safe.
REVOKE ALL ON contact_submissions FROM anon, authenticated;
