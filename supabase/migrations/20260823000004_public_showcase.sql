-- Migration: admin-curated public showcase for non-member Search Profiles (V10 Task D)
-- Only profiles explicitly added here (and active) are shown to logged-out visitors.
-- Never auto-exposes registered profiles.
CREATE TABLE IF NOT EXISTS public_showcase (
  profile_id  uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  added_by    uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_public_showcase_active_order ON public_showcase (is_active, sort_order);
