-- 20260826000005_search_indexes_and_report_fk.sql
--
-- Two unrelated but low-risk corrections:
--
--  1. Leading-wildcard ILIKE ('%term%') cannot use a btree index, so every
--     search filter and every location/community autocomplete keystroke was a
--     sequential scan over the whole table. pg_trgm GIN indexes make these
--     index-backed.
--
--  2. reports.reporter_id / reported_id are declared NOT NULL *and*
--     ON DELETE SET NULL. That pair is unsatisfiable: deleting a profile makes
--     Postgres try to write NULL into a NOT NULL column, so the delete aborts
--     with a not-null violation instead of clearing the reference. Dropping
--     NOT NULL makes the declared intent actually work.
--
-- NOTE: written with plain statements only — no dollar-quoting anywhere. The
-- Supabase SQL editor mis-parses dollar-quoted blocks in this project.

-- ── 1. Trigram search indexes ───────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- profiles: free-text search + the gotra/mool/gram/caste/religion filters
CREATE INDEX IF NOT EXISTS profiles_first_name_trgm
  ON profiles USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_last_name_trgm
  ON profiles USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_caste_trgm
  ON profiles USING gin (caste gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_mool_trgm
  ON profiles USING gin (mool gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_gram_trgm
  ON profiles USING gin (gram gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_self_gotra_trgm
  ON profiles USING gin (self_gotra gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_religion_trgm
  ON profiles USING gin (religion gin_trgm_ops);

-- accounts.mobile: admin lookup by partial mobile number
CREATE INDEX IF NOT EXISTS accounts_mobile_trgm
  ON accounts USING gin (mobile gin_trgm_ops);

-- autocomplete sources
CREATE INDEX IF NOT EXISTS india_locations_name_en_trgm
  ON india_locations USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS community_masters_label_en_trgm
  ON community_masters USING gin (label_en gin_trgm_ops);

-- ── 2. Sort / join indexes for the search result set ────────────────────────

-- Every search is scoped to live, active, non-demo profiles and then sorted by
-- one of these columns. Partial indexes keep them small.
CREATE INDEX IF NOT EXISTS profiles_active_created_at
  ON profiles (created_at DESC)
  WHERE deleted_at IS NULL AND profile_status = 'active';

CREATE INDEX IF NOT EXISTS profiles_active_updated_at
  ON profiles (updated_at DESC)
  WHERE deleted_at IS NULL AND profile_status = 'active';

CREATE INDEX IF NOT EXISTS profiles_active_dob
  ON profiles (dob)
  WHERE deleted_at IS NULL AND profile_status = 'active';

-- Blocks are checked in both directions on every search; only blocker_id was
-- indexed by the original schema.
CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx
  ON blocks (blocked_id);

-- Conversation list: newest-first messages per thread, skipping deleted rows.
CREATE INDEX IF NOT EXISTS messages_conversation_sent_at
  ON messages (conversation_id, sent_at DESC)
  WHERE deleted_at IS NULL;

-- Unread badge counts.
CREATE INDEX IF NOT EXISTS messages_unread_idx
  ON messages (conversation_id)
  WHERE deleted_at IS NULL AND read_at IS NULL;

-- ── 3. reports FK correction ────────────────────────────────────────────────

ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE reports ALTER COLUMN reported_id DROP NOT NULL;

-- The existing CHECK (reporter_id != reported_id) evaluates to NULL — and
-- therefore passes — once either side is NULL, which is the desired behaviour
-- for a report whose subject has since been deleted. No change needed.
