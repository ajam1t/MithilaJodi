-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261007000004 — Journal editorial publication dates
--
-- Every article carried the same published_at (2026-08-23 10:56:25 UTC, the
-- moment they were imported), which made the Journal look batch-published.
-- At the owner's request (2026-10-07) the publication dates are spread over a
-- believable editorial timeline from 1 July 2026, foundational guides first.
-- Content is not touched.
--
-- "Updated" stays honest:
--   • 14 articles were genuinely revised on 2026-09-07 21:36 UTC. Their
--     updated_at is kept, and every one of them is dated before that, so
--     "Updated 7 September" reads correctly after publication.
--   • The other 11 were never edited: updated_at is set equal to their new
--     published_at, so no "Updated" date is shown or emitted in schema.
-- The updated_at trigger is paused for this statement only, so the change
-- itself does not stamp "now" on every row.
--
-- Revert: every row's previous published_at was 2026-08-23T10:56:25.335315Z;
-- previous updated_at was that same value, except for the 14 listed in
-- group A, whose updated_at (2026-09-07T21:36:43.638523Z) is unchanged here.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE blog_posts DISABLE TRIGGER blog_posts_updated_at;

-- Group A — revised 2026-09-07; published_at only.
UPDATE blog_posts AS b SET published_at = v.d::timestamptz
FROM (VALUES
  ('what-is-mithila-culture',          '2026-07-01 10:15+05:30'),
  ('what-is-gotra',                    '2026-07-01 17:40+05:30'),
  ('mithila-family-lineage',           '2026-07-05 11:05+05:30'),
  ('what-is-mool-in-mithila',          '2026-07-09 09:50+05:30'),
  ('mithila-heritage',                 '2026-07-14 18:20+05:30'),
  ('same-gotra-marriage',              '2026-07-18 10:35+05:30'),
  ('kundli-matching-explained',        '2026-07-23 16:10+05:30'),
  ('what-is-rashi',                    '2026-07-29 12:25+05:30'),
  ('gotra-marriage-compatibility',     '2026-08-03 10:40+05:30'),
  ('what-is-nakshatra',                '2026-08-08 19:05+05:30'),
  ('matrimonial-profile-information',  '2026-08-13 11:30+05:30'),
  ('what-is-manglik',                  '2026-08-19 09:45+05:30'),
  ('matrimonial-biodata-mistakes',     '2026-08-24 10:20+05:30'),
  ('family-questions-before-marriage', '2026-08-24 18:55+05:30')
) AS v(slug, d)
WHERE b.slug = v.slug;

-- Group B — never edited; published_at and updated_at move together.
UPDATE blog_posts AS b SET published_at = v.d::timestamptz, updated_at = v.d::timestamptz
FROM (VALUES
  ('maithili-language-identity',        '2026-08-30 11:15+05:30'),
  ('what-is-gram-in-mithila',           '2026-09-04 10:05+05:30'),
  ('mithila-wedding-rituals',           '2026-09-10 17:30+05:30'),
  ('what-is-maternal-gotra',            '2026-09-16 09:40+05:30'),
  ('how-to-create-matrimonial-biodata', '2026-09-22 12:10+05:30'),
  ('gotra-vs-maternal-gotra',           '2026-09-25 18:45+05:30'),
  ('mithila-marriage-customs',          '2026-09-28 10:50+05:30'),
  ('why-gotra-matters-in-marriage',     '2026-10-01 11:20+05:30'),
  ('role-of-family-mithila-marriage',   '2026-10-03 16:35+05:30'),
  ('effective-matrimonial-profile',     '2026-10-05 10:25+05:30'),
  ('evaluate-matrimonial-profile',      '2026-10-07 09:20+05:30')
) AS v(slug, d)
WHERE b.slug = v.slug;

ALTER TABLE blog_posts ENABLE TRIGGER blog_posts_updated_at;

COMMIT;
