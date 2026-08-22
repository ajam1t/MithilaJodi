-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005 — Search Projection
-- Denormalised table for fast search queries.
-- Contains ONLY intentionally searchable/public fields.
-- Sensitive data from profile_private NEVER appears here.
-- Rebuilt via trigger on profile update.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE profile_discoverable (
  profile_id          uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Searchable dimensions (public-safe)
  gender              profile_gender NOT NULL,
  age                 integer NOT NULL,             -- recomputed from dob
  caste               text,
  sub_caste           text,
  self_gotra          text,
  maternal_gotra      text,
  mool                text,
  education_level_id  integer,
  profession_id       integer,
  diet                text,

  -- Location IDs for filter queries
  native_state_id     integer,
  native_district_id  integer,
  current_state_id    integer,
  current_district_id integer,
  job_state_id        integer,

  -- Membership / discovery gate
  membership_active   boolean NOT NULL DEFAULT false,
  verified            boolean NOT NULL DEFAULT false,
  last_active         timestamptz,

  -- Full-text search vector (name + about, redacted for privacy)
  search_vector       tsvector,

  -- Meta
  rebuilt_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common search patterns
CREATE INDEX pd_gender_age_idx    ON profile_discoverable (gender, age);
CREATE INDEX pd_caste_idx         ON profile_discoverable (caste, sub_caste);
CREATE INDEX pd_gotra_idx         ON profile_discoverable (self_gotra);
CREATE INDEX pd_mool_idx          ON profile_discoverable (mool);
CREATE INDEX pd_native_state_idx  ON profile_discoverable (native_state_id);
CREATE INDEX pd_current_state_idx ON profile_discoverable (current_state_id);
CREATE INDEX pd_last_active_idx   ON profile_discoverable (last_active DESC);
CREATE INDEX pd_membership_idx    ON profile_discoverable (membership_active);
CREATE INDEX pd_fts_idx           ON profile_discoverable USING gin(search_vector);

-- Rebuild function (called from trigger + nightly job)
CREATE OR REPLACE FUNCTION rebuild_profile_discoverable(p_profile_id uuid)
RETURNS void AS $$
DECLARE
  p profiles%ROWTYPE;
  native_state_id  integer;
  native_dist_id   integer;
  current_state_id integer;
  current_dist_id  integer;
  job_state_id     integer;
  has_membership   boolean;
  is_verified      boolean;
  computed_age     integer;
BEGIN
  SELECT * INTO p FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND OR p.profile_status != 'active' THEN
    DELETE FROM profile_discoverable WHERE profile_id = p_profile_id;
    RETURN;
  END IF;

  -- Resolve location hierarchy (walk up to state/district)
  SELECT parent_id INTO native_dist_id FROM india_locations WHERE id = p.native_place_id;
  SELECT parent_id INTO native_state_id FROM india_locations WHERE id = native_dist_id;
  SELECT parent_id INTO current_dist_id FROM india_locations WHERE id = p.current_loc_id;
  SELECT parent_id INTO current_state_id FROM india_locations WHERE id = current_dist_id;
  SELECT il.parent_id INTO job_state_id
    FROM india_locations il
    JOIN india_locations d ON d.id = p.job_loc_id
    WHERE il.id = d.parent_id
    LIMIT 1;

  -- Age
  computed_age := DATE_PART('year', AGE(p.dob))::integer;

  -- Membership status
  SELECT EXISTS(
    SELECT 1 FROM memberships WHERE account_id = p.account_id AND status IN ('active', 'expiring_soon', 'grace')
  ) INTO has_membership;

  -- Verification status
  SELECT EXISTS(
    SELECT 1 FROM verifications WHERE profile_id = p_profile_id AND status = 'verified'
  ) INTO is_verified;

  INSERT INTO profile_discoverable (
    profile_id, gender, age, caste, sub_caste, self_gotra, maternal_gotra, mool,
    education_level_id, profession_id, diet,
    native_state_id, native_district_id, current_state_id, current_district_id, job_state_id,
    membership_active, verified, last_active, search_vector, rebuilt_at
  )
  VALUES (
    p_profile_id, p.gender, computed_age, p.caste, p.sub_caste, p.self_gotra, p.maternal_gotra, p.mool,
    p.education_level_id, p.profession_id, p.diet,
    native_state_id::integer, native_dist_id::integer, current_state_id::integer, current_dist_id::integer, job_state_id::integer,
    has_membership, is_verified, now(),
    to_tsvector('simple', COALESCE(p.caste,'') || ' ' || COALESCE(p.mool,'') || ' ' || COALESCE(p.gram,'')),
    now()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    gender = EXCLUDED.gender, age = EXCLUDED.age, caste = EXCLUDED.caste,
    sub_caste = EXCLUDED.sub_caste, self_gotra = EXCLUDED.self_gotra,
    maternal_gotra = EXCLUDED.maternal_gotra, mool = EXCLUDED.mool,
    education_level_id = EXCLUDED.education_level_id, profession_id = EXCLUDED.profession_id,
    diet = EXCLUDED.diet, native_state_id = EXCLUDED.native_state_id,
    native_district_id = EXCLUDED.native_district_id, current_state_id = EXCLUDED.current_state_id,
    current_district_id = EXCLUDED.current_district_id, job_state_id = EXCLUDED.job_state_id,
    membership_active = EXCLUDED.membership_active, verified = EXCLUDED.verified,
    last_active = EXCLUDED.last_active, search_vector = EXCLUDED.search_vector,
    rebuilt_at = now();

  UPDATE profiles SET search_needs_rebuild = false WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-rebuild on profile update
CREATE OR REPLACE FUNCTION trigger_rebuild_discoverable()
RETURNS TRIGGER AS $$
BEGIN
  -- Only rebuild if status-relevant fields changed
  IF NEW.profile_status != OLD.profile_status
    OR NEW.discoverable != OLD.discoverable
    OR NEW.caste IS DISTINCT FROM OLD.caste
    OR NEW.self_gotra IS DISTINCT FROM OLD.self_gotra
    OR NEW.current_loc_id IS DISTINCT FROM OLD.current_loc_id
    OR NEW.dob IS DISTINCT FROM OLD.dob
  THEN
    PERFORM rebuild_profile_discoverable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_rebuild_discoverable
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_rebuild_discoverable();
