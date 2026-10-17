# Deployment steps required after this change

Code changes are done and verified. These steps need a human because they touch
the live database or the Vercel environment.

## 1. Run the pending SQL migrations (in order)

Paste the **contents** of each file into the Supabase SQL editor — not the path.
Both are written with plain statements only (no dollar-quoting), because the
Supabase SQL editor in this project mis-parses dollar-quoted blocks.

| Order | File | What it does |
|---|---|---|
| 1 | `supabase/migrations/20260826000003_whatsapp_requests.sql` | WhatsApp connect requests table |
| 2 | `supabase/migrations/20260826000004_enable_missing_rls.sql` | **Security.** Enables RLS + revokes `anon` on 13 tables that never had it, and re-revokes `anon` on 21 member-data tables |
| 3 | `supabase/migrations/20260826000005_search_indexes_and_report_fk.sql` | `pg_trgm` search indexes, partial sort indexes, and fixes the unsatisfiable `reports` FK |
| 4 | `supabase/migrations/20261017000001_wedding_invite_photos.sql` | Optional bride/groom photos on premium invitations (`wedding_invites.photos`, `photos_consent_at`). Until it runs, invitations keep working but adding photos shows "Photos cannot be saved just yet". |
| 5 | `supabase/migrations/20261017000002_admin_active_members.sql` | Admin → Members → Active members lists only members who have a profile. Until it runs, the app hides "No profile yet" rows itself, but the page count can be slightly off. |

Migration 2 is the important one. Until it runs, those 13 tables are reachable
with the `anon` key.

## 2. Vercel environment variables

**Confirm set correctly:**

- `NEXT_PUBLIC_SITE_URL=https://mithilajodi.com` — this is now baked into
  statically prerendered canonicals and `sitemap.xml`. If it is wrong or missing
  at build time, every canonical URL and sitemap entry is wrong. (The code
  falls back to `https://mithilajodi.com`, so unset is safe; a stale localhost
  value is not.)
- `DEV_OTP_ENABLED` — should be absent or `false`. It is now hard-gated on
  `NODE_ENV=production` in code as well, so it cannot grant access in
  production either way.

**Remove (no longer read by any code):**

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `FREE_ACCESS_MODE` (retired; the flag is `PAID_MEMBERSHIPS_ENABLED`)

**Rotate:** the Razorpay key secret, since it was present in the environment
while the now-removed payment endpoints were deployed.

## 3. Optional data seeds

- `node scripts/seed-blog-articles.js` — blog content
- `node scripts/seed-demo-profiles.js` — demo profiles

Run these from `apps/web` (or set `NODE_PATH` to `apps/web/node_modules`);
`node_modules` does not exist at the repo root.

Note: demo profiles are deliberately **excluded** from `/`, `/explore` and
`sitemap.xml` (`is_demo = false` filter in `lib/publicProfiles.ts`), so seeding
them will not make the public homepage look busier. That is intentional — they
must not be indexed as real people.
