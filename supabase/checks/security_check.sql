-- READ-ONLY CHECK. Run before and after 20261110000001_public_schema_lockdown.sql.
-- It changes nothing. After the migration every query below should return 0 rows.

-- A. Tables in public with Row Level Security OFF.
SELECT c.relname AS table_without_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
ORDER BY 1;

-- B. Any table privilege still held by the public API roles.
SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')
GROUP BY 1, 2 ORDER BY 1, 2;

-- C. Functions the public API roles can still call.
SELECT p.proname AS function_name, r.rolname AS callable_by
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')) r
WHERE n.nspname = 'public' AND has_function_privilege(r.oid, p.oid, 'EXECUTE')
ORDER BY 1, 2;

-- D. Policies that let anon or everyone in (review each; none are needed by the app).
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND (roles && ARRAY['anon', 'public']::name[])
ORDER BY 1, 2;

-- E. Storage: buckets that are public. profile-photos must be private.
SELECT id AS public_bucket FROM storage.buckets WHERE public;
