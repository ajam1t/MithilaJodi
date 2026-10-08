-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261008000004 — Registration redesign
--
-- 1. One live profile per account. Nothing enforced it, so a double-tapped
--    first save during onboarding could create two profiles for one account.
--    Checked before applying: no account currently has more than one.
-- 2. admin_registration_funnel(days): where people stop, from the database
--    (accounts and profiles — ground truth) and from the anonymous `reg_step`
--    browser events (steps before an account exists). Service-role only.
--
-- The onboarding minimum itself (lib/onboarding.ts) is enforced in the app.
-- The SQL below repeats it only to count, never to change data. Existing
-- profiles are deliberately NOT backfilled to hidden: each is re-evaluated at
-- the member's next save. See docs in lib/discoverability.ts.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_live_per_account
  ON profiles (account_id) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION admin_registration_funnel(p_days integer)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH since AS (SELECT now() - make_interval(days => greatest(p_days, 1)) AS t0),
  acc AS (
    SELECT a.id
    FROM accounts a, since
    WHERE a.created_at >= since.t0 AND a.role = 'user' AND a.mobile <> '0000000000' AND a.deleted_at IS NULL
  ),
  p AS (
    SELECT acc.id AS account_id, pr.id AS profile_id,
      (coalesce(trim(pr.first_name), '') <> '' AND pr.gender IS NOT NULL AND pr.dob IS NOT NULL
        AND coalesce(trim(pr.marital_status), '') <> ''
        AND EXISTS (SELECT 1 FROM profile_preferences pp WHERE pp.profile_id = pr.id AND pp.pref_gender IS NOT NULL)) AS about_done,
      (pr.current_loc_id IS NOT NULL AND coalesce(trim(pr.caste), '') <> '' AND coalesce(trim(pr.self_gotra), '') <> '') AS mithila_done,
      EXISTS (SELECT 1 FROM profile_photos ph WHERE ph.profile_id = pr.id AND ph.status IN ('approved', 'pending_moderation')) AS photo_done,
      coalesce(pr.profile_complete, 0) AS strength
    FROM acc LEFT JOIN profiles pr ON pr.account_id = acc.id AND pr.deleted_at IS NULL AND NOT pr.is_demo
  )
  SELECT json_build_object(
    'days', p_days,
    'accounts', (SELECT count(*) FROM p),
    'about_done', (SELECT count(*) FROM p WHERE about_done),
    'mithila_done', (SELECT count(*) FROM p WHERE about_done AND mithila_done),
    'photo_done', (SELECT count(*) FROM p WHERE about_done AND mithila_done AND photo_done),
    'strength_75', (SELECT count(*) FROM p WHERE about_done AND mithila_done AND photo_done AND strength >= 75),
    'steps', (
      SELECT coalesce(json_object_agg(k, visitors), '{}'::json) FROM (
        SELECT e.k, count(DISTINCT e.visitor) AS visitors
        FROM site_events e, since
        WHERE e.name = 'reg_step' AND e.at >= since.t0 AND e.k IS NOT NULL
        GROUP BY e.k
      ) s
    ),
    'steps_since', (SELECT min(at) FROM site_events WHERE name = 'reg_step')
  );
$$;

REVOKE ALL ON FUNCTION admin_registration_funnel(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_registration_funnel(integer) TO service_role;

COMMIT;
