-- Education qualification ladder, plus the private-detail fields the profile
-- editor needs to replace free-text and number inputs with real choices.

BEGIN;

-- ── 1. education_levels held a mix of levels (Bachelor's) and degree types
--    (MBA, B.Tech, CA / CS). A member cannot answer "what is your level?" from
--    that list without guessing, so it is reshaped into a single ordered ladder.
--    Safe to rewrite in place: profiles.education_level_id is referenced by zero
--    rows and no form ever wrote to it. The degree name, specialisation and
--    institution stay as their own fields, which is where "MBA" belongs.
UPDATE education_levels SET label_en = 'Below Graduate',      label_hi = 'स्नातक से नीचे',  label_mai = 'स्नातक सँ नीचाँ', sort_order = 1, is_active = true WHERE id = 1;
UPDATE education_levels SET label_en = 'Diploma',             label_hi = 'डिप्लोमा',        label_mai = 'डिप्लोमा',        sort_order = 2, is_active = true WHERE id = 2;
UPDATE education_levels SET label_en = 'Graduate',            label_hi = 'स्नातक',          label_mai = 'स्नातक',          sort_order = 3, is_active = true WHERE id = 3;
UPDATE education_levels SET label_en = 'Post Graduate',       label_hi = 'स्नातकोत्तर',     label_mai = 'स्नातकोत्तर',     sort_order = 4, is_active = true WHERE id = 4;
UPDATE education_levels SET label_en = 'Doctorate / PhD',     label_hi = 'पीएचडी',          label_mai = 'पीएचडी',          sort_order = 5, is_active = true WHERE id = 5;
UPDATE education_levels SET label_en = 'Professional Degree', label_hi = 'व्यावसायिक डिग्री', label_mai = 'व्यावसायिक डिग्री', sort_order = 6, is_active = true WHERE id = 6;
UPDATE education_levels SET label_en = 'Other',               label_hi = 'अन्य',            label_mai = 'अन्य',            sort_order = 99, is_active = true WHERE id = 7;

-- The remaining rows were degree types, not levels.
UPDATE education_levels SET is_active = false WHERE id > 7;

-- ── 2. Income as a chosen band rather than two numbers. income_range is the
--    value a member picks; the existing min/max columns are kept and derived
--    from it so partner-preference matching and search keep working unchanged.
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS income_range text;

-- ── 3. Whose number this is. A matrimonial contact is very often the father's
--    or a brother's rather than the candidate's own, and members were putting
--    that in free text where nothing could read it.
ALTER TABLE profile_private ADD COLUMN IF NOT EXISTS contact_relation text;

-- ── 4. Master list for the relationship selector.
INSERT INTO community_masters (type, value, label_en, label_hi, is_mithila, sort_order, is_active) VALUES
  ('contact_relation', 'self',           'Self',            'स्वयं',        true, 1, true),
  ('contact_relation', 'father',         'Father',          'पिता',         true, 2, true),
  ('contact_relation', 'mother',         'Mother',          'माता',         true, 3, true),
  ('contact_relation', 'brother',        'Brother',         'भाई',          true, 4, true),
  ('contact_relation', 'sister',         'Sister',          'बहन',          true, 5, true),
  ('contact_relation', 'uncle',          'Uncle',           'चाचा / मामा',  true, 6, true),
  ('contact_relation', 'aunt',           'Aunt',            'चाची / मामी',  true, 7, true),
  ('contact_relation', 'guardian',       'Guardian',        'अभिभावक',      true, 8, true),
  ('contact_relation', 'other_relative', 'Other relative',  'अन्य सम्बन्धी', true, 9, true)
ON CONFLICT (type, value) DO UPDATE
  SET label_en = EXCLUDED.label_en, label_hi = EXCLUDED.label_hi,
      sort_order = EXCLUDED.sort_order, is_active = true;

-- ── 5. Partner-preference option lists that the form was rendering as free
--    text or bare selects with no source of truth.
INSERT INTO community_masters (type, value, label_en, is_mithila, sort_order, is_active) VALUES
  ('children_pref', 'no_children',        'No children',                     true, 1, true),
  ('children_pref', 'children_ok',        'Children are fine',               true, 2, true),
  ('children_pref', 'no_preference',      'No preference',                   true, 3, true),

  ('living_arrangement', 'with_family',   'With family',                     true, 1, true),
  ('living_arrangement', 'nuclear',       'Separate / nuclear household',    true, 2, true),
  ('living_arrangement', 'flexible',      'Flexible',                        true, 3, true),

  ('career_pref', 'working',              'Should be working',               true, 1, true),
  ('career_pref', 'not_working',          'Prefer not working',              true, 2, true),
  ('career_pref', 'either',               'Either is fine',                  true, 3, true),

  ('marriage_timeline', 'within_6_months', 'Within 6 months',                true, 1, true),
  ('marriage_timeline', 'within_1_year',   'Within a year',                  true, 2, true),
  ('marriage_timeline', 'in_1_2_years',    '1 to 2 years',                   true, 3, true),
  ('marriage_timeline', 'after_2_years',   'After 2 years',                  true, 4, true),
  ('marriage_timeline', 'open',            'Open to discussion',             true, 5, true),

  ('manglik_pref', 'manglik_only',        'Manglik only',                    true, 1, true),
  ('manglik_pref', 'non_manglik_only',    'Non-manglik only',                true, 2, true),
  ('manglik_pref', 'no_preference',       'Does not matter',                 true, 3, true)
ON CONFLICT (type, value) DO UPDATE
  SET label_en = EXCLUDED.label_en, sort_order = EXCLUDED.sort_order, is_active = true;

COMMIT;
