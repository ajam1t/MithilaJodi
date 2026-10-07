-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261008000002 — Journal "Updated" only moves on real edits
--
-- The site shows "Updated <date>" (and emits dateModified) when updated_at is
-- more than a day after published_at. The old trigger stamped updated_at on
-- ANY update — toggling Featured, changing status or the publish date — so a
-- housekeeping click made an article look revised. Now updated_at moves only
-- when what a reader reads changes: title, excerpt, body or cover image.
--
-- Revert: point the trigger back at update_updated_at().
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION blog_posts_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.title, NEW.excerpt, NEW.content, NEW.cover_url)
     IS DISTINCT FROM (OLD.title, OLD.excerpt, OLD.content, OLD.cover_url) THEN
    NEW.updated_at := now();
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_posts_touch_updated_at();

COMMIT;
