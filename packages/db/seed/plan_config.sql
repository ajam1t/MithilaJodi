-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: Plan Configuration
-- ₹151 / 1 year — stored here, NOT hardcoded in application code
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO plan_config (plan, price_paise, duration_days, grace_days, expiring_soon_days, label_en, label_hi, label_mai, active)
VALUES (
  'standard',
  15100,                       -- ₹151.00
  365,                         -- 1 year
  7,                           -- 7-day grace period after expiry
  30,                          -- show "expiring soon" 30 days before
  'Mithila Jodi Standard — 1 Year',
  'मिथिला जोड़ी स्टैंडर्ड — 1 वर्ष',
  'मिथिला जोड़ी मानक — १ वर्ष',
  true
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: Biodata Templates
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO biodata_templates (slug, label_en, label_hi, label_mai, renderer, sort_order) VALUES
  ('classic',         'Classic',          'क्लासिक',     'क्लासिक',     'react-pdf',  1),
  ('elegant',         'Elegant',          'एलिगेंट',     'एलिगेंट',     'react-pdf',  2),
  ('mithila',         'Mithila',          'मिथिला',      'मिथिला',      'puppeteer',  3),
  ('modern',          'Modern',           'मॉडर्न',      'आधुनिक',      'react-pdf',  4),
  ('premium_wedding', 'Premium Wedding',  'प्रीमियम',    'प्रीमियम',    'puppeteer',  5);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: Education Levels
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO education_levels (label_en, label_hi, label_mai, sort_order) VALUES
  ('High School',            'हाई स्कूल',       'हाई स्कूल',     1),
  ('Intermediate / 12th',    'इंटर / 12वीं',    'इंटर / 12म',     2),
  ('Diploma',                'डिप्लोमा',        'डिप्लोमा',       3),
  ('Bachelor''s Degree',     'स्नातक',          'स्नातक',         4),
  ('Master''s Degree',       'स्नातकोत्तर',     'स्नातकोत्तर',    5),
  ('MBA',                    'एमबीए',           'एमबीए',          6),
  ('Doctorate / PhD',        'पीएचडी',          'पीएचडी',         7),
  ('Medical (MBBS/MD)',      'एमबीबीएस/एमडी',   'एमबीबीएस/एमडी',  8),
  ('Engineering (B.Tech)',   'बी.टेक',          'बी.टेक',         9),
  ('CA / CS / CMA',         'सीए/सीएस',        'सीए/सीएस',       10),
  ('Law (LLB)',              'एलएलबी',          'एलएलबी',         11),
  ('Other',                  'अन्य',            'अन्य',           99);
