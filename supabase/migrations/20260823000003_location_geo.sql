-- Migration: geo coordinates on india_locations for distance-based matching (V10 Phase 3)
-- Additive/nullable. Coordinates are populated later from a pincode dataset;
-- until then distance search falls back to hierarchy (state/district/city) matching.
ALTER TABLE india_locations ADD COLUMN IF NOT EXISTS latitude  double precision;
ALTER TABLE india_locations ADD COLUMN IF NOT EXISTS longitude double precision;

-- Speed up PIN and name lookups used by the profile location pickers.
CREATE INDEX IF NOT EXISTS idx_india_locations_pincode ON india_locations (pincode) WHERE pincode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_india_locations_name_en ON india_locations (lower(name_en));
