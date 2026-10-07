-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261008000001 — Admin console: analytics, settings, aggregates
--
-- Additive only: three new tables and read-only aggregation functions. No
-- existing table or row is changed.
--
--   site_events      First-party, privacy-conscious event log for the public
--                    site (page views and feature use). A random per-browser
--                    id stands in for "a visitor"; no IP, no user agent, no
--                    account id, no free text. Paths are normalised by the
--                    collector so member ids and share tokens never land here.
--   member_activity  Per-member daily counters for actions that only exist
--                    for signed-in members (search, opening a profile). Used
--                    for the conversion funnel and the member detail page.
--   site_settings    Centralised, admin-editable configuration (WhatsApp
--                    community link, official social links, plan limits the
--                    admin enters for the Supabase usage page).
--
-- It also makes admin_audit_logs append-only with a trigger.
--
-- All three have RLS on and no policies: only the service role (the server)
-- can read or write them. Every function below is SECURITY DEFINER, read-only
-- (except bump_member_activity), and executable by service_role only.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── site_events ─────────────────────────────────────────────────────────────
CREATE TABLE site_events (
  id           bigserial PRIMARY KEY,
  at           timestamptz NOT NULL DEFAULT now(),
  name         text NOT NULL CHECK (name ~ '^[a-z_]{2,40}$'),
  path         text CHECK (char_length(path) <= 200),
  visitor      uuid,
  new_visitor  boolean NOT NULL DEFAULT false,
  landing      boolean NOT NULL DEFAULT false,
  device       text CHECK (device IN ('mobile', 'tablet', 'desktop')),
  ref_host     text CHECK (char_length(ref_host) <= 100),
  -- One optional dimension (tool slug, festival slug, song id …) and, for
  -- web vitals, a number. Kept tiny on purpose.
  k            text CHECK (char_length(k) <= 120),
  v            double precision
);
CREATE INDEX site_events_at_idx      ON site_events (at);
CREATE INDEX site_events_name_at_idx ON site_events (name, at);
ALTER TABLE site_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON site_events FROM anon, authenticated;

-- ── member_activity ─────────────────────────────────────────────────────────
CREATE TABLE member_activity (
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind ~ '^[a-z_]{2,40}$'),
  day         date NOT NULL,
  n           integer NOT NULL DEFAULT 1,
  PRIMARY KEY (account_id, kind, day)
);
CREATE INDEX member_activity_kind_day_idx ON member_activity (kind, day);
ALTER TABLE member_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON member_activity FROM anon, authenticated;

CREATE OR REPLACE FUNCTION bump_member_activity(p_account uuid, p_kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO member_activity (account_id, kind, day, n)
  VALUES (p_account, p_kind, (now() AT TIME ZONE 'Asia/Kolkata')::date, 1)
  ON CONFLICT (account_id, kind, day) DO UPDATE SET n = member_activity.n + 1;
$$;

-- ── site_settings ───────────────────────────────────────────────────────────
CREATE TABLE site_settings (
  key         text PRIMARY KEY CHECK (key ~ '^[a-z_]{2,40}$'),
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES accounts(id) ON DELETE SET NULL
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON site_settings FROM anon, authenticated;

-- Seeded with the values the code used until now, so nothing changes on deploy.
INSERT INTO site_settings (key, value) VALUES
  ('whatsapp_community', jsonb_build_object('url', 'https://chat.whatsapp.com/BoiwAQZf5VMKEKtSXFfpe0?s=hd&p=i&mlu=4&ilr=4', 'enabled', true)),
  ('social_links', jsonb_build_object(
     'instagram', 'https://www.instagram.com/MithilaJodiOfficial/',
     'youtube', 'https://youtube.com/@mithilajodiofficial?si=BB2-kjGVc2qqHYEF'))
ON CONFLICT (key) DO NOTHING;

-- ── Audit log is append-only ────────────────────────────────────────────────
-- Not even the server can rewrite history. The single permitted update is the
-- foreign key's own ON DELETE SET NULL (an account row hard-deleted), which
-- touches actor_id and nothing else.
CREATE OR REPLACE FUNCTION admin_audit_logs_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.actor_id IS NULL
     AND NEW.id = OLD.id AND NEW.action = OLD.action
     AND NEW.target_type IS NOT DISTINCT FROM OLD.target_type
     AND NEW.target_id IS NOT DISTINCT FROM OLD.target_id
     AND NEW.payload IS NOT DISTINCT FROM OLD.payload
     AND NEW.created_at = OLD.created_at THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'admin_audit_logs is append-only';
END $$;
DROP TRIGGER IF EXISTS admin_audit_logs_append_only ON admin_audit_logs;
CREATE TRIGGER admin_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION admin_audit_logs_append_only();

-- ── The official system account ────────────────────────────────────────────
-- Admin "official messages" come from a system account (mobile 0000000000,
-- see lib/systemProfile.ts). It is not a member, and its conversations are not
-- matches, so every metric below leaves it out.
CREATE OR REPLACE FUNCTION admin_system_profile()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM profiles p JOIN accounts a ON a.id = p.account_id WHERE a.mobile = '0000000000' LIMIT 1;
$$;

-- Conversations between two members (system conversations excluded).
CREATE OR REPLACE FUNCTION admin_member_conversations()
RETURNS SETOF conversations LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.* FROM conversations c
  WHERE c.profile_a IS DISTINCT FROM admin_system_profile() AND c.profile_b IS DISTINCT FROM admin_system_profile();
$$;

-- ── Period helper: the windows every admin table uses (IST days) ───────────
-- today = since IST midnight; d7/d30/d90/d365 = that many days incl. today.
CREATE OR REPLACE FUNCTION admin_windows()
RETURNS TABLE (w text, t0 timestamptz, t1 timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH b AS (SELECT (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata')) AT TIME ZONE 'Asia/Kolkata' AS d0,
                    (date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')) AT TIME ZONE 'Asia/Kolkata' AS m0)
  SELECT * FROM (VALUES
    ('today',     (SELECT d0 FROM b),                       now()),
    ('yesterday', (SELECT d0 - interval '1 day' FROM b),    (SELECT d0 FROM b)),
    ('d7',        (SELECT d0 - interval '6 days' FROM b),   now()),
    ('mtd',       (SELECT m0 FROM b),                       now()),
    ('d30',       (SELECT d0 - interval '29 days' FROM b),  now()),
    ('d90',       (SELECT d0 - interval '89 days' FROM b),  now()),
    ('d365',      (SELECT d0 - interval '364 days' FROM b), now())
  ) AS x(w, t0, t1);
$$;

-- ── Database-backed metrics by period ──────────────────────────────────────
-- Demo/showcase accounts and profiles are excluded everywhere.
CREATE OR REPLACE FUNCTION admin_metric_periods()
RETURNS TABLE (metric text, today bigint, yesterday bigint, d7 bigint, mtd bigint, d30 bigint, d90 bigint, d365 bigint, all_time bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH w AS (SELECT
      max(t0) FILTER (WHERE w = 'today') AS today, max(t0) FILTER (WHERE w = 'yesterday') AS yest,
      max(t0) FILTER (WHERE w = 'd7') AS d7, max(t0) FILTER (WHERE w = 'mtd') AS mtd,
      max(t0) FILTER (WHERE w = 'd30') AS d30, max(t0) FILTER (WHERE w = 'd90') AS d90,
      max(t0) FILTER (WHERE w = 'd365') AS d365 FROM admin_windows()),
  ev AS (
    SELECT 'members'::text AS metric, a.created_at AS ts FROM accounts a WHERE a.role = 'user' AND a.deleted_at IS NULL AND NOT a.is_demo AND a.mobile <> '0000000000'
    UNION ALL SELECT 'profiles_created', p.created_at FROM profiles p WHERE p.deleted_at IS NULL AND NOT p.is_demo AND p.id IS DISTINCT FROM admin_system_profile()
    UNION ALL SELECT 'interests', i.sent_at FROM interests i
    UNION ALL SELECT 'interests_accepted', i.responded_at FROM interests i WHERE i.status = 'accepted' AND i.responded_at IS NOT NULL
    UNION ALL SELECT 'matches', c.created_at FROM admin_member_conversations() c
    UNION ALL SELECT 'messages', m.sent_at FROM messages m JOIN admin_member_conversations() c ON c.id = m.conversation_id WHERE m.deleted_at IS NULL
    UNION ALL SELECT 'shortlists', s.saved_at FROM shortlists s
    UNION ALL SELECT 'dp_views', o.opened_at FROM profile_share_opens o
    UNION ALL SELECT 'dp_links_created', s.created_at FROM profile_shares s
    UNION ALL SELECT 'member_biodata', g.generated_at FROM biodata_generations g
    UNION ALL SELECT 'premium_invites', wi.created_at FROM wedding_invites wi
    UNION ALL SELECT 'kundli_shares', k.created_at FROM kundli_match_shares k
    -- member_activity is a per-day counter: expand each day's n into n rows
    -- stamped at IST midday so it lands in the right day window.
    UNION ALL SELECT 'member_' || ma.kind || 's', ((ma.day + time '12:00') AT TIME ZONE 'Asia/Kolkata')
      FROM member_activity ma, generate_series(1, ma.n)
  )
  SELECT ev.metric,
    count(*) FILTER (WHERE ts >= w.today),
    count(*) FILTER (WHERE ts >= w.yest AND ts < w.today),
    count(*) FILTER (WHERE ts >= w.d7),
    count(*) FILTER (WHERE ts >= w.mtd),
    count(*) FILTER (WHERE ts >= w.d30),
    count(*) FILTER (WHERE ts >= w.d90),
    count(*) FILTER (WHERE ts >= w.d365),
    count(*)
  FROM ev CROSS JOIN w GROUP BY ev.metric;
$$;

-- Distinct counts that are not simple row counts: unique Digital Profile
-- visitors, profiles that were opened, and links that were shared and opened.
CREATE OR REPLACE FUNCTION admin_dp_periods()
RETURNS TABLE (w text, views bigint, unique_visitors bigint, profiles_viewed bigint, links_opened bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT x.w,
         count(o.id),
         count(DISTINCT o.visitor),
         count(DISTINCT s.profile_id),
         count(DISTINCT o.share_id)
  FROM (SELECT w, t0, t1 FROM admin_windows() UNION ALL SELECT 'all', '-infinity'::timestamptz, now()) x
  LEFT JOIN profile_share_opens o ON o.opened_at >= x.t0 AND o.opened_at < x.t1
  LEFT JOIN profile_shares s ON s.id = o.share_id
  GROUP BY x.w;
$$;

-- Most-opened Digital Profiles over the last p_days. Names are shortened to a
-- first name and initial; the member id is only for the admin's own link.
CREATE OR REPLACE FUNCTION admin_top_dp(p_days integer)
RETURNS TABLE (account_id uuid, display text, views bigint, visitors bigint, links bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.account_id,
         trim(p.first_name || ' ' || coalesce(left(p.last_name, 1) || '.', '')),
         count(o.id), count(DISTINCT o.visitor), count(DISTINCT o.share_id)
  FROM profile_share_opens o
  JOIN profile_shares s ON s.id = o.share_id
  JOIN profiles p ON p.id = s.profile_id
  WHERE o.opened_at >= now() - make_interval(days => least(greatest(p_days, 1), 400))
  GROUP BY p.account_id, p.first_name, p.last_name
  ORDER BY 3 DESC LIMIT 10;
$$;

-- ── Site events by period, per (event, dimension) ───────────────────────────
CREATE OR REPLACE FUNCTION admin_event_periods()
RETURNS TABLE (name text, k text, is_total boolean, w text, n bigint, visitors bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- is_total marks the per-event total (all dimensions together), so it can
  -- never be confused with a row whose dimension happens to be empty.
  SELECT e.name, e.k, GROUPING(e.k) = 1, x.w, count(*), count(DISTINCT e.visitor)
  FROM (SELECT w, t0, t1 FROM admin_windows() UNION ALL SELECT 'all', '-infinity'::timestamptz, now()) x
  JOIN site_events e ON e.at >= x.t0 AND e.at < x.t1
  WHERE e.name <> 'web_vital'
  GROUP BY GROUPING SETS ((e.name, x.w), (e.name, e.k, x.w));
$$;

-- Unique visitors by period, split new vs returning, from page views only.
CREATE OR REPLACE FUNCTION admin_visitor_periods()
RETURNS TABLE (w text, page_views bigint, visitors bigint, new_visitors bigint, returning_visitors bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT x.w, count(e.id), count(DISTINCT e.visitor),
         count(DISTINCT e.visitor) FILTER (WHERE e.new_visitor),
         count(DISTINCT e.visitor) - count(DISTINCT e.visitor) FILTER (WHERE e.new_visitor)
  FROM (SELECT w, t0, t1 FROM admin_windows() UNION ALL SELECT 'all', '-infinity'::timestamptz, now()) x
  LEFT JOIN site_events e ON e.name = 'page_view' AND e.at >= x.t0 AND e.at < x.t1
  GROUP BY x.w;
$$;

-- Page views and unique visitors by site section, by period.
CREATE OR REPLACE FUNCTION admin_section_periods()
RETURNS TABLE (section text, w text, views bigint, visitors bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH e AS (
    SELECT at, visitor, CASE
      WHEN path = '/' THEN 'home'
      WHEN path LIKE '/blogs%' THEN 'journal'
      WHEN path LIKE '/festival-songs%' THEN 'festival_songs'
      WHEN path LIKE '/festivals%' THEN 'festivals'
      WHEN path LIKE '/astrology%' THEN 'astrology'
      WHEN path LIKE '/marriage-biodata%' THEN 'biodata'
      WHEN path LIKE '/marriage-invitation%' OR path LIKE '/Invitation/%' OR path LIKE '/wedding/%' THEN 'invitation'
      WHEN path LIKE '/digital-profile%' THEN 'digital_profile'
      WHEN path LIKE '/p/%' THEN 'digital_profile_open'
      WHEN path LIKE '/explore%' THEN 'explore'
      WHEN path LIKE '/search%' THEN 'search'
      WHEN path LIKE '/inbox%' OR path LIKE '/messages%' OR path LIKE '/interests%' THEN 'inbox'
      WHEN path LIKE '/register%' OR path LIKE '/login%' THEN 'join'
      ELSE 'other' END AS section
    FROM site_events WHERE name = 'page_view'
  )
  SELECT e.section, x.w, count(*), count(DISTINCT e.visitor)
  FROM (SELECT w, t0, t1 FROM admin_windows() UNION ALL SELECT 'all', '-infinity'::timestamptz, now()) x
  JOIN e ON e.at >= x.t0 AND e.at < x.t1
  GROUP BY e.section, x.w;
$$;

-- ── Daily series for charts (IST days, zero-filled) ─────────────────────────
CREATE OR REPLACE FUNCTION admin_daily(p_days integer)
RETURNS TABLE (day date, metric text, n bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH days AS (
    SELECT generate_series(((now() AT TIME ZONE 'Asia/Kolkata')::date - (least(greatest(p_days, 1), 400) - 1))::timestamp,
                           ((now() AT TIME ZONE 'Asia/Kolkata')::date)::timestamp, interval '1 day')::date AS day
  ),
  since AS (SELECT (min(day)::timestamp AT TIME ZONE 'Asia/Kolkata') AS t0 FROM days),
  ev AS (
    SELECT 'members'::text AS metric, (a.created_at AT TIME ZONE 'Asia/Kolkata')::date AS day, count(*) AS n
      FROM accounts a, since WHERE a.role = 'user' AND a.deleted_at IS NULL AND NOT a.is_demo AND a.mobile <> '0000000000' AND a.created_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'profiles_created', (p.created_at AT TIME ZONE 'Asia/Kolkata')::date, count(*)
      FROM profiles p, since WHERE p.deleted_at IS NULL AND NOT p.is_demo AND p.id IS DISTINCT FROM admin_system_profile() AND p.created_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'interests', (i.sent_at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM interests i, since WHERE i.sent_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'matches', (c.created_at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM admin_member_conversations() c, since WHERE c.created_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'messages', (m.sent_at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM messages m JOIN admin_member_conversations() c ON c.id = m.conversation_id, since WHERE m.deleted_at IS NULL AND m.sent_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'dp_views', (o.opened_at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM profile_share_opens o, since WHERE o.opened_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'dp_visitors', (o.opened_at AT TIME ZONE 'Asia/Kolkata')::date, count(DISTINCT o.visitor) FROM profile_share_opens o, since WHERE o.opened_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'dp_links_created', (s.created_at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM profile_shares s, since WHERE s.created_at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'page_views', (e.at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM site_events e, since WHERE e.name = 'page_view' AND e.at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'visitors', (e.at AT TIME ZONE 'Asia/Kolkata')::date, count(DISTINCT e.visitor) FROM site_events e, since WHERE e.name = 'page_view' AND e.at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'new_visitors', (e.at AT TIME ZONE 'Asia/Kolkata')::date, count(DISTINCT e.visitor) FROM site_events e, since WHERE e.name = 'page_view' AND e.new_visitor AND e.at >= since.t0 GROUP BY 2
    UNION ALL SELECT 'ev:' || e.name, (e.at AT TIME ZONE 'Asia/Kolkata')::date, count(*) FROM site_events e, since WHERE e.name NOT IN ('page_view', 'web_vital') AND e.at >= since.t0 GROUP BY 1, 2
  ),
  metrics AS (SELECT DISTINCT metric FROM ev UNION SELECT unnest(ARRAY['members','profiles_created','interests','matches','messages','dp_views','dp_visitors','dp_links_created','page_views','visitors','new_visitors']))
  SELECT d.day, m.metric, coalesce(ev.n, 0)
  FROM days d CROSS JOIN metrics m
  LEFT JOIN ev ON ev.day = d.day AND ev.metric = m.metric
  ORDER BY d.day, m.metric;
$$;

-- ── Traffic breakdowns over the last p_days ─────────────────────────────────
CREATE OR REPLACE FUNCTION admin_traffic(p_days integer)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH e AS (
    SELECT * FROM site_events
    WHERE name = 'page_view'
      AND at >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - (least(greatest(p_days, 1), 400) - 1))::timestamp AT TIME ZONE 'Asia/Kolkata'
  )
  SELECT jsonb_build_object(
    'top_pages', coalesce((SELECT jsonb_agg(t) FROM (SELECT path, count(*) AS views, count(DISTINCT visitor) AS visitors FROM e GROUP BY path ORDER BY 2 DESC LIMIT 25) t), '[]'),
    'landing_pages', coalesce((SELECT jsonb_agg(t) FROM (SELECT path, count(*) AS entries FROM e WHERE landing GROUP BY path ORDER BY 2 DESC LIMIT 15) t), '[]'),
    'devices', coalesce((SELECT jsonb_agg(t) FROM (SELECT coalesce(device, 'unknown') AS device, count(DISTINCT visitor) AS visitors FROM e GROUP BY 1 ORDER BY 2 DESC) t), '[]'),
    'referrers', coalesce((SELECT jsonb_agg(t) FROM (SELECT coalesce(ref_host, 'Direct / none') AS source, count(*) AS entries FROM e WHERE landing GROUP BY 1 ORDER BY 2 DESC LIMIT 12) t), '[]'),
    'first_event', (SELECT min(at) FROM site_events)
  );
$$;

-- Core Web Vitals (p75) per metric over the last p_days, from the RUM beacon.
CREATE OR REPLACE FUNCTION admin_web_vitals(p_days integer)
RETURNS TABLE (metric text, p75 double precision, samples bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT k, percentile_cont(0.75) WITHIN GROUP (ORDER BY v), count(*)
  FROM site_events
  WHERE name = 'web_vital' AND v IS NOT NULL AND at >= now() - make_interval(days => least(greatest(p_days, 1), 400))
  GROUP BY k;
$$;

-- Member base snapshot: totals, how many were active recently, completion.
-- "Active" = any signed-in activity (a session seen) in the window.
CREATE OR REPLACE FUNCTION admin_member_snapshot()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH acc AS (SELECT id, account_status FROM accounts WHERE role = 'user' AND NOT is_demo AND mobile <> '0000000000' AND deleted_at IS NULL),
       seen AS (SELECT s.account_id, max(coalesce(s.last_seen, s.created_at)) AS at FROM account_sessions s JOIN acc ON acc.id = s.account_id GROUP BY s.account_id),
       prof AS (SELECT p.profile_complete, p.discoverable, p.profile_status FROM profiles p JOIN acc ON acc.id = p.account_id WHERE p.deleted_at IS NULL AND NOT p.is_demo),
       w AS (SELECT max(t0) FILTER (WHERE w = 'today') AS today, max(t0) FILTER (WHERE w = 'd7') AS d7, max(t0) FILTER (WHERE w = 'd30') AS d30 FROM admin_windows())
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM acc),
    'suspended', (SELECT count(*) FROM acc WHERE account_status IN ('suspended', 'banned')),
    'active_today', (SELECT count(*) FROM seen, w WHERE seen.at >= w.today),
    'active_7d', (SELECT count(*) FROM seen, w WHERE seen.at >= w.d7),
    'active_30d', (SELECT count(*) FROM seen, w WHERE seen.at >= w.d30),
    'profiles', (SELECT count(*) FROM prof),
    'completed', (SELECT count(*) FROM prof WHERE profile_complete >= 100),
    'avg_completion', (SELECT round(avg(profile_complete)::numeric, 1) FROM prof),
    'discoverable', (SELECT count(*) FROM prof WHERE discoverable AND profile_status = 'active')
  );
$$;

-- ── Member geography: aggregated by state, never below city ────────────────
CREATE OR REPLACE FUNCTION admin_member_geo()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE up AS (
    SELECT l.id AS origin, l.id, l.parent_id, l.level, l.name_en, l.state_code FROM india_locations l
    UNION ALL
    SELECT up.origin, p.id, p.parent_id, p.level, p.name_en, p.state_code FROM up JOIN india_locations p ON p.id = up.parent_id
    WHERE up.level <> 'state'
  ),
  st AS (SELECT origin, name_en AS state, state_code FROM up WHERE level = 'state'),
  active AS (SELECT account_id FROM account_sessions GROUP BY account_id HAVING max(coalesce(last_seen, created_at)) >= now() - interval '30 days'),
  m AS (
    SELECT p.gender, p.created_at, a.id AS account_id, st.state, st.state_code, l.name_en AS place, l.level
    FROM profiles p
    JOIN accounts a ON a.id = p.account_id
    LEFT JOIN india_locations l ON l.id = p.current_loc_id
    LEFT JOIN st ON st.origin = p.current_loc_id
    WHERE p.deleted_at IS NULL AND NOT p.is_demo AND a.deleted_at IS NULL AND NOT a.is_demo AND a.mobile <> '0000000000'
  )
  SELECT jsonb_build_object(
    'states', coalesce((SELECT jsonb_agg(t ORDER BY t.total DESC) FROM (
      SELECT state, max(state_code) AS code, count(*) AS total,
             count(*) FILTER (WHERE gender = 'male') AS male,
             count(*) FILTER (WHERE gender = 'female') AS female,
             count(*) FILTER (WHERE created_at >= now() - interval '30 days') AS new_30d,
             count(*) FILTER (WHERE account_id IN (SELECT account_id FROM active)) AS active_30d,
             (SELECT jsonb_agg(c) FROM (SELECT place AS city, count(*) AS n FROM m m2 WHERE m2.state = m.state AND m2.level <> 'state' GROUP BY place ORDER BY 2 DESC LIMIT 5) c) AS cities
      FROM m WHERE state IS NOT NULL GROUP BY state) t), '[]'),
    'no_location', (SELECT count(*) FROM m WHERE state IS NULL),
    'total', (SELECT count(*) FROM m)
  );
$$;

-- ── Conversion funnel (distinct members; demo excluded) ────────────────────
CREATE OR REPLACE FUNCTION admin_funnel()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH acc AS (SELECT id FROM accounts WHERE role = 'user' AND NOT is_demo AND mobile <> '0000000000'),
       prof AS (SELECT p.id, p.account_id, p.profile_complete FROM profiles p JOIN acc ON acc.id = p.account_id WHERE NOT p.is_demo)
  SELECT jsonb_build_object(
    'visitors', (SELECT count(DISTINCT visitor) FROM site_events WHERE name = 'page_view'),
    'visitors_since', (SELECT min(at) FROM site_events),
    'signups', (SELECT count(*) FROM acc),
    'profile_created', (SELECT count(*) FROM prof),
    'profile_completed', (SELECT count(*) FROM prof WHERE profile_complete >= 100),
    'searched', (SELECT count(DISTINCT account_id) FROM member_activity WHERE kind = 'search' AND account_id IN (SELECT id FROM acc)),
    'viewed_profile', (SELECT count(DISTINCT account_id) FROM member_activity WHERE kind = 'profile_view' AND account_id IN (SELECT id FROM acc)),
    'activity_since', (SELECT min(day) FROM member_activity),
    'interest_sent', (SELECT count(DISTINCT i.from_profile) FROM interests i JOIN prof ON prof.id = i.from_profile),
    'interest_accepted', (SELECT count(DISTINCT i.from_profile) FROM interests i JOIN prof ON prof.id = i.from_profile WHERE i.status = 'accepted'),
    'matched', (SELECT count(DISTINCT x) FROM (SELECT profile_a AS x FROM admin_member_conversations() UNION SELECT profile_b FROM admin_member_conversations()) c JOIN prof ON prof.id = c.x),
    'messaged', (SELECT count(DISTINCT m.sender_id) FROM messages m JOIN admin_member_conversations() c ON c.id = m.conversation_id JOIN prof ON prof.id = m.sender_id WHERE m.deleted_at IS NULL)
  );
$$;

-- ── Member directory (server-side search, filter, sort, paginate) ──────────
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
           a.created_at AS registered_at, ls.last_active, right(a.mobile, 4) AS mobile_last4, a.role::text AS role
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
           (p_q ~ '^[0-9]{4}$' AND mobile_last4 = p_q))
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

-- ── Database and storage usage ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_db_usage()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'tables', coalesce((SELECT jsonb_agg(t) FROM (
       SELECT c.relname AS name, pg_total_relation_size(c.oid) AS bytes, greatest(c.reltuples, 0)::bigint AS approx_rows
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 2 DESC LIMIT 15) t), '[]'),
    'buckets', coalesce((SELECT jsonb_agg(t) FROM (
       SELECT b.id AS bucket, b.public, count(o.id) AS files, coalesce(sum((o.metadata->>'size')::bigint), 0) AS bytes
       FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id = b.id
       GROUP BY b.id, b.public ORDER BY 4 DESC) t), '[]'),
    'largest', coalesce((SELECT jsonb_agg(t) FROM (
       SELECT bucket_id AS bucket, name, (metadata->>'size')::bigint AS bytes, created_at
       FROM storage.objects ORDER BY (metadata->>'size')::bigint DESC NULLS LAST LIMIT 15) t), '[]'),
    -- Profile photo files that no profile_photos row points at (any status).
    'orphans', coalesce((SELECT jsonb_agg(t) FROM (
       SELECT o.name, (o.metadata->>'size')::bigint AS bytes, o.created_at
       FROM storage.objects o
       WHERE o.bucket_id = 'profile-photos'
         AND NOT EXISTS (SELECT 1 FROM profile_photos pp WHERE pp.storage_path = o.name)
       ORDER BY o.created_at LIMIT 200) t), '[]')
  );
$$;

-- Slowest statements by mean time (pg_stat_statements). Query text is
-- normalised by Postgres (constants become $1), and truncated here.
CREATE OR REPLACE FUNCTION admin_slow_queries()
RETURNS TABLE (query text, calls bigint, mean_ms double precision, total_ms double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT left(regexp_replace(s.query, '\s+', ' ', 'g'), 180), s.calls, round(s.mean_exec_time::numeric, 2)::double precision,
         round(s.total_exec_time::numeric, 1)::double precision
  FROM extensions.pg_stat_statements s
  WHERE s.calls >= 5 AND s.query NOT ILIKE '%pg_stat_statements%'
  ORDER BY s.mean_exec_time DESC LIMIT 12;
$$;

-- Only the server (service role) may call any of these.
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'bump_member_activity(uuid, text)', 'admin_system_profile()', 'admin_member_conversations()', 'admin_windows()', 'admin_metric_periods()', 'admin_dp_periods()', 'admin_top_dp(integer)',
    'admin_event_periods()', 'admin_visitor_periods()', 'admin_section_periods()', 'admin_daily(integer)', 'admin_traffic(integer)',
    'admin_web_vitals(integer)', 'admin_member_snapshot()', 'admin_member_geo()', 'admin_funnel()',
    'admin_members(text, text, text, text, integer, integer)', 'admin_db_usage()', 'admin_slow_queries()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

COMMIT;
