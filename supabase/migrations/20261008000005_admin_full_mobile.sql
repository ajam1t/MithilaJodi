-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261008000005 — Admin member list shows the full mobile number
--
-- Requested by the owner (2026-10-09): admins see members' full numbers in
-- the console (moderators still see them masked — enforced in the app), and
-- search matches any 4+ digits of a number, not only the last four.
-- Same function signature; privileges (service_role only) are unchanged.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION admin_members(
  p_q text, p_gender text, p_status text, p_sort text, p_limit integer, p_offset integer
) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH last_seen AS (
    SELECT account_id, max(coalesce(last_seen, created_at)) AS last_active FROM account_sessions GROUP BY account_id
  ),
  base AS (
    SELECT a.id AS account_id, p.id AS profile_id,
           trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) AS name,
           p.gender::text AS gender, p.dob, p.caste, p.self_gotra, p.mool, p.gram,
           l.name_en AS location, p.profile_status::text AS profile_status, p.discoverable,
           a.account_status::text AS account_status, coalesce(p.profile_complete, 0) AS profile_complete,
           a.created_at AS registered_at, ls.last_active, right(a.mobile, 4) AS mobile_last4, a.mobile AS mobile, a.role::text AS role
    FROM accounts a
    LEFT JOIN profiles p ON p.account_id = a.id AND p.deleted_at IS NULL
    LEFT JOIN india_locations l ON l.id = p.current_loc_id
    LEFT JOIN last_seen ls ON ls.account_id = a.id
    WHERE NOT a.is_demo AND a.role = 'user' AND a.mobile <> '0000000000'
  ),
  f AS (
    SELECT * FROM base
    WHERE (p_q IS NULL OR p_q = '' OR
           name ILIKE '%' || p_q || '%' OR profile_id::text = p_q OR account_id::text = p_q OR
           location ILIKE '%' || p_q || '%' OR self_gotra ILIKE '%' || p_q || '%' OR mool ILIKE '%' || p_q || '%' OR
           gram ILIKE '%' || p_q || '%' OR caste ILIKE '%' || p_q || '%' OR
           (length(regexp_replace(p_q, '[^0-9]', '', 'g')) >= 4 AND p_q ~ '^[0-9 +()-]+$'
             AND mobile LIKE '%' || regexp_replace(p_q, '[^0-9]', '', 'g') || '%'))
      AND (p_gender IS NULL OR p_gender = '' OR gender = p_gender)
      AND (p_status IS NULL OR p_status = '' OR
           (p_status = 'no_profile' AND profile_id IS NULL) OR
           (p_status = 'hidden' AND profile_id IS NOT NULL AND NOT coalesce(discoverable, false)) OR
           (p_status = 'incomplete' AND profile_id IS NOT NULL AND profile_complete < 100) OR
           (p_status IN ('active', 'suspended', 'banned', 'deactivated', 'deleted', 'pending_verification') AND account_status = p_status) OR
           (p_status IN ('draft', 'pending_review') AND profile_status = p_status))
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM f),
    'rows', coalesce((SELECT jsonb_agg(r) FROM (
      SELECT * FROM f
      ORDER BY
        CASE WHEN p_sort = 'oldest' THEN registered_at END ASC,
        CASE WHEN p_sort = 'last_active' THEN last_active END DESC NULLS LAST,
        CASE WHEN p_sort = 'completion' THEN profile_complete END DESC,
        CASE WHEN p_sort = 'name' THEN lower(name) END ASC,
        registered_at DESC
      LIMIT least(greatest(p_limit, 1), 100) OFFSET greatest(p_offset, 0)) r), '[]')
  );
$$;

COMMIT;
