-- Migration: Master-data expansion (V10)
-- Adds activate/deactivate + audit columns to master tables and seeds the
-- additional selectable categories used across the V10 profile. All additive
-- and idempotent — existing rows/values are never modified or removed.

-- 1. Activate/deactivate + created_at on all master tables
ALTER TABLE community_masters ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE community_masters ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE education_levels  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE professions       ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Seed new selectable categories into the generic community_masters table.
--    Only inserts a (type, value) pair when it does not already exist.
INSERT INTO community_masters (type, value, label_en, sort_order, is_mithila, is_active)
SELECT v.type, v.value, v.label_en, v.sort_order, false, true
FROM (VALUES
  -- Religion
  ('religion','hindu','Hindu',1),
  ('religion','muslim','Muslim',2),
  ('religion','christian','Christian',3),
  ('religion','sikh','Sikh',4),
  ('religion','buddhist','Buddhist',5),
  ('religion','jain','Jain',6),
  ('religion','other','Other',7),
  -- Mother tongue (Mithila-first)
  ('mother_tongue','maithili','Maithili',1),
  ('mother_tongue','hindi','Hindi',2),
  ('mother_tongue','bhojpuri','Bhojpuri',3),
  ('mother_tongue','angika','Angika',4),
  ('mother_tongue','bajjika','Bajjika',5),
  ('mother_tongue','bengali','Bengali',6),
  ('mother_tongue','urdu','Urdu',7),
  ('mother_tongue','english','English',8),
  ('mother_tongue','other','Other',9),
  -- Marital status
  ('marital_status','never_married','Never Married',1),
  ('marital_status','divorced','Divorced',2),
  ('marital_status','widowed','Widowed',3),
  ('marital_status','awaiting_divorce','Awaiting Divorce',4),
  -- Industry
  ('industry','it_software','IT / Software',1),
  ('industry','government_psu','Government / PSU',2),
  ('industry','banking_finance','Banking / Finance',3),
  ('industry','education','Education',4),
  ('industry','healthcare','Healthcare',5),
  ('industry','engineering','Engineering / Manufacturing',6),
  ('industry','business','Business / Self-employed',7),
  ('industry','agriculture','Agriculture',8),
  ('industry','legal','Legal',9),
  ('industry','media','Media / Creative',10),
  ('industry','civil_services','Civil Services / Defence',11),
  ('industry','other','Other',12),
  -- Employment type
  ('employment_type','government','Government',1),
  ('employment_type','private','Private',2),
  ('employment_type','business','Business',3),
  ('employment_type','self_employed','Self-employed',4),
  ('employment_type','not_working','Not Working',5),
  ('employment_type','student','Student',6),
  -- Work type
  ('work_type','full_time','Full-time',1),
  ('work_type','part_time','Part-time',2),
  ('work_type','remote','Remote',3),
  ('work_type','hybrid','Hybrid',4),
  ('work_type','contract','Contract',5),
  -- Food / diet
  ('diet','vegetarian','Vegetarian',1),
  ('diet','non_vegetarian','Non-Vegetarian',2),
  ('diet','eggetarian','Eggetarian',3),
  ('diet','vegan','Vegan',4),
  -- Family type
  ('family_type','nuclear','Nuclear Family',1),
  ('family_type','joint','Joint Family',2),
  -- Family values
  ('family_values','traditional','Traditional',1),
  ('family_values','moderate','Moderate',2),
  ('family_values','liberal','Liberal',3),
  -- Profile managed by
  ('managed_by','self','Self',1),
  ('managed_by','parent','Parent',2),
  ('managed_by','sibling','Sibling',3),
  ('managed_by','relative','Relative',4),
  ('managed_by','guardian','Guardian',5),
  -- Manglik
  ('manglik','no','No',1),
  ('manglik','yes','Yes',2),
  ('manglik','anshik','Anshik (Partial)',3),
  ('manglik','unknown','Don''t Know',4),
  -- Rashi (moon sign)
  ('rashi','mesh','Mesh (Aries)',1),
  ('rashi','vrishabh','Vrishabh (Taurus)',2),
  ('rashi','mithun','Mithun (Gemini)',3),
  ('rashi','kark','Kark (Cancer)',4),
  ('rashi','simha','Simha (Leo)',5),
  ('rashi','kanya','Kanya (Virgo)',6),
  ('rashi','tula','Tula (Libra)',7),
  ('rashi','vrishchik','Vrishchik (Scorpio)',8),
  ('rashi','dhanu','Dhanu (Sagittarius)',9),
  ('rashi','makar','Makar (Capricorn)',10),
  ('rashi','kumbh','Kumbh (Aquarius)',11),
  ('rashi','meen','Meen (Pisces)',12),
  -- Nakshatra (27)
  ('nakshatra','ashwini','Ashwini',1),
  ('nakshatra','bharani','Bharani',2),
  ('nakshatra','krittika','Krittika',3),
  ('nakshatra','rohini','Rohini',4),
  ('nakshatra','mrigashira','Mrigashira',5),
  ('nakshatra','ardra','Ardra',6),
  ('nakshatra','punarvasu','Punarvasu',7),
  ('nakshatra','pushya','Pushya',8),
  ('nakshatra','ashlesha','Ashlesha',9),
  ('nakshatra','magha','Magha',10),
  ('nakshatra','purva_phalguni','Purva Phalguni',11),
  ('nakshatra','uttara_phalguni','Uttara Phalguni',12),
  ('nakshatra','hasta','Hasta',13),
  ('nakshatra','chitra','Chitra',14),
  ('nakshatra','swati','Swati',15),
  ('nakshatra','vishakha','Vishakha',16),
  ('nakshatra','anuradha','Anuradha',17),
  ('nakshatra','jyeshtha','Jyeshtha',18),
  ('nakshatra','mula','Mula',19),
  ('nakshatra','purva_ashadha','Purva Ashadha',20),
  ('nakshatra','uttara_ashadha','Uttara Ashadha',21),
  ('nakshatra','shravana','Shravana',22),
  ('nakshatra','dhanishta','Dhanishta',23),
  ('nakshatra','shatabhisha','Shatabhisha',24),
  ('nakshatra','purva_bhadrapada','Purva Bhadrapada',25),
  ('nakshatra','uttara_bhadrapada','Uttara Bhadrapada',26),
  ('nakshatra','revati','Revati',27),
  -- Income range (annual, LPA)
  ('income_range','below_3','Below ₹3 LPA',1),
  ('income_range','3_5','₹3–5 LPA',2),
  ('income_range','5_10','₹5–10 LPA',3),
  ('income_range','10_15','₹10–15 LPA',4),
  ('income_range','15_25','₹15–25 LPA',5),
  ('income_range','25_50','₹25–50 LPA',6),
  ('income_range','50_plus','₹50 LPA+',7)
) AS v(type, value, label_en, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM community_masters cm WHERE cm.type = v.type AND cm.value = v.value
);
