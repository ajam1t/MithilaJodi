# packages/

No shared packages at present.

## Note on the removed `packages/db/`

This directory previously held `db/schema/` (migrations 001–014) and
`db/seed/`. Both were **duplicates** and have been removed:

- `db/schema/` was an unrunnable, divergent copy of the real migrations — it had
  filename collisions (two `002_*` and two `003_*` files creating the same
  tables), an older buggy `search_projection` job-state lookup, and it stopped
  at 014, so it was **missing the anon-access security fix** applied in
  `supabase/migrations/20260822000015_drop_anon_public_read.sql`. Anyone
  bootstrapping a database from it would have reopened that PII hole.
- `db/seed/` was superseded by `supabase/seeds/`.

**The single source of truth for the database schema is
`supabase/migrations/`, and for seed data `supabase/seeds/`.**
