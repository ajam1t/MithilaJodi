-- ═══════════════════════════════════════════════════════════════════════════
-- Pricing v2: three-tier model (Free / Mithila Member / Mithila Premium)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add feature-gate columns to plan_config
ALTER TABLE plan_config
  ADD COLUMN IF NOT EXISTS can_send_interest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_message       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interest_limit    integer;  -- NULL = unlimited; integer = yearly cap

-- 2. Add interest counter to memberships (resets to 0 for each new membership period)
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS interests_sent integer NOT NULL DEFAULT 0;

-- 3. Backfill legacy 'standard' plan so existing active members keep equivalent access
UPDATE plan_config SET
  can_send_interest = true,
  can_message       = true,
  interest_limit    = 151,   -- grandfathered as member-equivalent
  active            = false  -- no longer purchasable; existing rows continue to work
WHERE plan = 'standard';

-- 4. Upsert the two new purchasable plans
INSERT INTO plan_config (
  plan, price_paise, duration_days, grace_days, expiring_soon_days,
  label_en, can_send_interest, can_message, interest_limit, active
) VALUES
  ('member',  15100, 365, 7, 30, 'Mithila Member',  true, true, 151,  true),
  ('premium', 49900, 365, 7, 30, 'Mithila Premium', true, true, NULL, true)
ON CONFLICT (plan) DO UPDATE SET
  price_paise        = EXCLUDED.price_paise,
  duration_days      = EXCLUDED.duration_days,
  grace_days         = EXCLUDED.grace_days,
  expiring_soon_days = EXCLUDED.expiring_soon_days,
  label_en           = EXCLUDED.label_en,
  can_send_interest  = EXCLUDED.can_send_interest,
  can_message        = EXCLUDED.can_message,
  interest_limit     = EXCLUDED.interest_limit,
  active             = EXCLUDED.active,
  updated_at         = now();
