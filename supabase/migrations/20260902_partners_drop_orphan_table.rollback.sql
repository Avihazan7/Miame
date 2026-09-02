-- 20260902_partners_drop_orphan_table.rollback.sql
--
-- ⚠️ THIS RESTORES A SHAPE, NOT DATA. public.partners held 0 rows when it was
--    dropped, so nothing was lost and nothing comes back. What returns is the
--    table, its primary key, its index, RLS, the one INSERT policy and the four
--    role grants — including `anon`'s SELECT/UPDATE/DELETE/TRUNCATE, which are the
--    reason the drop was worth doing. Run it only to undo the migration.
--
-- Every line below was captured from the LIVE definition on 2026-09-02, BEFORE the
-- forward migration ran — column order and types from information_schema.columns,
-- the policy's CHECK from pg_policies.with_check verbatim, the index from
-- pg_indexes.indexdef, the grants from role_table_grants. It is a transcription,
-- not a reconstruction from memory.

create table if not exists public.partners (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  business_name text,
  contact_name  text,
  phone         text,
  city          text,
  planned_assets integer,
  status        text default 'lead'::text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_term      text,
  utm_content   text,
  gclid         text,
  fbclid        text,
  landing_page  text,
  referrer      text
);

create index if not exists partners_created_idx on public.partners using btree (created_at desc);

alter table public.partners enable row level security;

drop policy if exists "anon insert partners" on public.partners;
create policy "anon insert partners" on public.partners
  for insert to anon
  with check (
    char_length(coalesce(business_name, ''::text)) <= 200
    and char_length(coalesce(contact_name, ''::text)) <= 200
    and char_length(coalesce(phone, ''::text)) <= 40
    and char_length(coalesce(city, ''::text)) <= 120
    and char_length(coalesce(utm_source, ''::text)) <= 200
    and char_length(coalesce(utm_medium, ''::text)) <= 200
    and char_length(coalesce(utm_campaign, ''::text)) <= 200
    and char_length(coalesce(utm_term, ''::text)) <= 200
    and char_length(coalesce(utm_content, ''::text)) <= 200
    and char_length(coalesce(gclid, ''::text)) <= 200
    and char_length(coalesce(fbclid, ''::text)) <= 200
    and char_length(coalesce(landing_page, ''::text)) <= 300
    and char_length(coalesce(referrer, ''::text)) <= 300
  );

grant select, insert, update, delete, truncate, references, trigger on public.partners to anon;
grant select, insert, update, delete, truncate, references, trigger on public.partners to authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.partners to postgres;
grant select, insert, update, delete, truncate, references, trigger on public.partners to service_role;
