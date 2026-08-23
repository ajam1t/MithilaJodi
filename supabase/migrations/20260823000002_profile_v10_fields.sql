-- Migration: V10 profile field expansion
-- All columns are additive and nullable — existing profiles/rows are untouched
-- and continue to work. New fields store text values chosen from community_masters
-- (master-data driven) or free text; no enums so admin-managed options never
-- collide with a fixed type.

-- ── profiles: identity / education / career / family ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_tongue        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS degree               text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passing_year         integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry             text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title            text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years     integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_type            text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_type          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS managed_by           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_values        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parents_info         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siblings_info        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_expectations  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_introduction  text;

-- ── profile_private: horoscope + private contact/visibility ──
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS birth_time          text;
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS birth_place         text;
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS kundli_url          text;
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_visibility  text;  -- e.g. mutual | connected | none
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS photo_visibility    text;  -- e.g. all | connected | on_request

-- ── profile_preferences: complete V10 marriage preferences ──
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_profession        text[];
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_marital_status    text[];
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_children          text;
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_living_arrangement text;
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_career            text;
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_marriage_timeline text;
ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS pref_manglik           text;
