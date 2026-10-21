-- How a member's family would like to be contacted, shown on the Contact tab
-- of a Digital Profile link that shares contact details (and nowhere else).
-- All optional; private like the rest of profile_private.
BEGIN;

ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_via text
  CHECK (contact_via IS NULL OR contact_via IN ('call', 'whatsapp', 'either'));
-- Days they prefer to be called: any of mon, tue, wed, thu, fri, sat, sun.
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_days text[]
  CHECK (contact_days IS NULL OR contact_days <@ ARRAY['mon','tue','wed','thu','fri','sat','sun']::text[]);
-- A window in India time, "HH:MM" 24-hour.
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_time_from text
  CHECK (contact_time_from IS NULL OR contact_time_from ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_time_to text
  CHECK (contact_time_to IS NULL OR contact_time_to ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
-- "Please connect only if": age / location / community (read against their
-- partner preferences) and interest_first (send an interest on Mithila Jodi).
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_rules text[]
  CHECK (contact_rules IS NULL OR contact_rules <@ ARRAY['age','location','community','interest_first']::text[]);
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_note text
  CHECK (contact_note IS NULL OR char_length(contact_note) <= 280);

COMMIT;
