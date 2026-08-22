-- Migration 017: Add marriage_timeline field to profiles
-- Captures how soon the candidate is looking to get married

CREATE TYPE marriage_timeline AS ENUM (
  'within_3_months',
  'within_6_months',
  'within_1_year',
  'within_2_years',
  'no_rush'
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marriage_timeline marriage_timeline;

-- Add to search_projection view rebuild flag (search_needs_rebuild already exists)
-- No view change needed; marriage_timeline is filterable via profiles directly
