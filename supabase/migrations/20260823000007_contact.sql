-- contact_submissions: stores messages sent via the /contact form.
-- All reads and writes are done via the service-role admin client (no RLS policies needed).

create table if not exists contact_submissions (
  id          uuid        primary key default gen_random_uuid(),
  full_name   text        not null check (char_length(full_name) between 2 and 100),
  email       text        not null,
  mobile      text,
  reason      text        not null,
  message     text        not null check (char_length(message) between 10 and 2000),
  ip_address  text,
  created_at  timestamptz not null default now()
);

alter table contact_submissions enable row level security;
-- No public policies: the table is only accessible via the service-role admin client.
