-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261110000002 — Shared rate-limit counters
--
-- The burst limits in lib/edgeGuards are held in each server instance's memory;
-- on serverless a determined client is spread over many instances and each one
-- counts from zero. For the endpoints where that matters (chat messages,
-- reports, contact/photo requests, share links, exports, password and human-
-- challenge endpoints) middleware also counts here, in one place.
--
-- Fixed windows: one row per (key, window). Keys are SHA-256 hashes made in
-- middleware — no IP address, cookie or account id is stored. Rows older than
-- a day are removed as the function runs.
--
-- Until this file is run the app keeps working exactly as before: middleware
-- treats a missing function as "allowed" and falls back to the in-memory limits.
-- Idempotent; no dollar-quoting. Rollback at the bottom.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rate_limit_windows (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer     NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limit_windows_start_idx ON public.rate_limit_windows (window_start);

ALTER TABLE public.rate_limit_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_windows FROM anon, authenticated;

-- Counts one hit and answers whether the caller is still within the limit.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS '
  DELETE FROM rate_limit_windows WHERE window_start < now() - interval ''1 day'';
  INSERT INTO rate_limit_windows (key, window_start, hits)
  VALUES (
    p_key,
    to_timestamp(floor(extract(epoch FROM now()) / greatest(p_window_seconds, 1)) * greatest(p_window_seconds, 1)),
    1
  )
  ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limit_windows.hits + 1
  RETURNING hits <= p_limit;
';

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- ROLLBACK (the app falls back to in-memory limits on its own):
--   DROP FUNCTION IF EXISTS public.rate_limit_hit(text, integer, integer);
--   DROP TABLE IF EXISTS public.rate_limit_windows;
