-- Cache for Indian PIN code lookups.
--
-- The profile editor lets a member type a PIN code instead of hunting for their
-- district or ancestral village by name. Resolving a PIN needs India Post data
-- that this database does not hold, so the first lookup for a PIN goes out to
-- the public India Post API and the answer is kept here.
--
-- Caching is the point, not an optimisation: without it every keystroke in a
-- location box could become an outbound request to a third party, and a PIN
-- code's district does not change.

BEGIN;

CREATE TABLE IF NOT EXISTS pincode_lookups (
  pincode     text PRIMARY KEY CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  state       text,
  district    text,
  -- Post office / village names served by this PIN. This is what makes the
  -- Gram (ancestral village) field answerable: a member knows their PIN and
  -- recognises their village in the list.
  places      text[] NOT NULL DEFAULT '{}',
  -- The india_locations row this PIN resolved to, when one matched by name.
  -- NULL means "we know the district but have no row for it yet", which the
  -- editor reports rather than guessing.
  location_id bigint REFERENCES india_locations(id),
  -- 'ok' = resolved from the API. 'not_found' = the API has no such PIN; cached
  -- so a typo is not retried against a third party on every keystroke.
  status      text NOT NULL DEFAULT 'ok',
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pincode_lookups ENABLE ROW LEVEL SECURITY;

-- Every read and write goes through the service-role client in the API route,
-- which is the only authorisation layer this app has; no policy is granted to
-- anon or authenticated on purpose.

CREATE INDEX IF NOT EXISTS pincode_lookups_district_idx ON pincode_lookups (district);

COMMIT;
