-- Trim blog SEO titles and descriptions to what Google actually renders.
--
-- Google shows roughly 60 characters of title and ~155-160 of description. Of
-- the 25 published posts, 12 had SEO titles of 67-77 characters and 3 had
-- descriptions of 164-171, so the tail of each was truncated in the SERP.
--
-- Only `seo_title` / `seo_description` are touched. `title` — the editorial
-- heading rendered as the article's H1 — is deliberately left alone, so nothing
-- changes on the page itself. The primary question phrase stays at the front of
-- every title because that is the phrase people actually search, and the
-- "| Mithila Jodi" suffix is kept so the rendered format is unchanged.
--
-- The 13 posts whose titles already fit are not modified.

BEGIN;

-- ── Titles: 67-77 chars -> 54-60 chars. The enumerated tail is dropped; the
--    head phrase and the primary keyword are preserved verbatim.
UPDATE blog_posts SET seo_title = 'Gotra and Marriage Compatibility in Mithila | Mithila Jodi' WHERE slug = 'gotra-marriage-compatibility';
UPDATE blog_posts SET seo_title = 'What Is Gotra? Meaning and Role in Marriage | Mithila Jodi'  WHERE slug = 'what-is-gotra';
UPDATE blog_posts SET seo_title = 'Common Matrimonial Biodata Mistakes to Avoid | Mithila Jodi' WHERE slug = 'matrimonial-biodata-mistakes';
UPDATE blog_posts SET seo_title = 'Questions Families Should Ask Before Marriage | Mithila Jodi' WHERE slug = 'family-questions-before-marriage';
UPDATE blog_posts SET seo_title = 'Mithila Heritage: History, Art and Traditions | Mithila Jodi' WHERE slug = 'mithila-heritage';
UPDATE blog_posts SET seo_title = 'Gotra, Mool and Gram in Mithila Lineage | Mithila Jodi'      WHERE slug = 'mithila-family-lineage';
UPDATE blog_posts SET seo_title = 'What Is Nakshatra? Birth Stars in Marriage | Mithila Jodi'   WHERE slug = 'what-is-nakshatra';
UPDATE blog_posts SET seo_title = 'What Is Rashi? Moon Signs in Matchmaking | Mithila Jodi'     WHERE slug = 'what-is-rashi';
UPDATE blog_posts SET seo_title = 'What Is Manglik? Mangal Dosha Explained | Mithila Jodi'      WHERE slug = 'what-is-manglik';
UPDATE blog_posts SET seo_title = 'Same Gotra Marriage in Mithila Tradition | Mithila Jodi'     WHERE slug = 'same-gotra-marriage';
UPDATE blog_posts SET seo_title = 'What Is Mithila Culture? Art and Traditions | Mithila Jodi'  WHERE slug = 'what-is-mithila-culture';
UPDATE blog_posts SET seo_title = 'What Is Mool in Mithila? Origins Explained | Mithila Jodi'   WHERE slug = 'what-is-mool-in-mithila';

-- ── Descriptions: 164-171 chars -> under 160, keeping the specific terms
--    (Ashtakoota, gotra, lineage) that make each snippet worth clicking.
UPDATE blog_posts SET seo_description =
  'A beginner''s guide to kundli matching (kundali milan) — the Ashtakoota system, its eight compatibility factors, and how families read the score.'
  WHERE slug = 'kundli-matching-explained';

UPDATE blog_posts SET seo_description =
  'What to include in a matrimonial profile for the Mithila community — from gotra and lineage to education and personal details.'
  WHERE slug = 'matrimonial-profile-information';

UPDATE blog_posts SET seo_description =
  'The conversations families should have before finalising a match — lineage, living arrangements, finances and values.'
  WHERE slug = 'family-questions-before-marriage';

-- One blog *category* title was also over the display limit (64 chars). Dropping
-- the redundant "Families" leaves the keyword phrase intact at 55.
UPDATE blog_categories
   SET seo_title = 'Matrimonial & Marriage Guide for Mithila | Mithila Jodi'
 WHERE slug = 'matrimonial-marriage-guide';

COMMIT;
