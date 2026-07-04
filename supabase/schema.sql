-- MiaMe.co.il · Supabase schema
-- Run this once in the Supabase project: SQL Editor > New query > Run.
-- Architecture is client-side (anon key), so anon may INSERT only. Reading is
-- restricted to the project owner via the dashboard / service role.

-- gen_random_uuid() is available natively on Supabase (Postgres 13+).
create extension if not exists pgcrypto;

-- ============ leads ============
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  full_name       text,
  phone           text not null,
  customer_type   text,
  model_name      text,
  base_price      numeric,
  down_payment    numeric,
  balloon         numeric,
  months          int,
  monthly_payment numeric,
  source          text,
  status          text default 'new',
  -- campaign attribution (first-touch, captured client-side; see lib/utm.ts)
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  gclid           text,
  fbclid          text,
  landing_page    text,
  referrer        text
);

-- ============ partners ============
create table if not exists public.partners (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  business_name  text,
  contact_name   text,
  phone          text,
  city           text,
  planned_assets int,
  status         text default 'lead',
  -- campaign attribution (first-touch, captured client-side; see lib/utm.ts)
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_term       text,
  utm_content    text,
  gclid          text,
  fbclid         text,
  landing_page   text,
  referrer       text
);

-- ============ events ============
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  event_name text not null,
  payload    jsonb
);

-- ============ Row Level Security ============
alter table public.leads    enable row level security;
alter table public.partners enable row level security;
alter table public.events   enable row level security;

-- Allow anonymous (anon) INSERT only. No SELECT policy => public cannot read.
-- WITH CHECK uses bounded input (not `true`) as defense-in-depth: legitimate
-- leads pass, oversized/empty abuse is rejected, and the public has zero read access.
drop policy if exists "anon insert leads" on public.leads;
create policy "anon insert leads"
  on public.leads for insert to anon
  with check (
    phone is not null
    and char_length(phone) between 6 and 40
    and char_length(coalesce(full_name,''))     <= 200
    and char_length(coalesce(customer_type,'')) <= 60
    and char_length(coalesce(model_name,''))    <= 80
    and char_length(coalesce(source,''))        <= 300
    and char_length(coalesce(utm_source,''))    <= 200
    and char_length(coalesce(utm_medium,''))    <= 200
    and char_length(coalesce(utm_campaign,''))  <= 200
    and char_length(coalesce(utm_term,''))      <= 200
    and char_length(coalesce(utm_content,''))   <= 200
    and char_length(coalesce(gclid,''))         <= 200
    and char_length(coalesce(fbclid,''))        <= 200
    and char_length(coalesce(landing_page,''))  <= 300
    and char_length(coalesce(referrer,''))      <= 300
  );

drop policy if exists "anon insert partners" on public.partners;
create policy "anon insert partners"
  on public.partners for insert to anon
  with check (
    char_length(coalesce(business_name,'')) <= 200
    and char_length(coalesce(contact_name,'')) <= 200
    and char_length(coalesce(phone,''))        <= 40
    and char_length(coalesce(city,''))         <= 120
    and char_length(coalesce(utm_source,''))   <= 200
    and char_length(coalesce(utm_medium,''))   <= 200
    and char_length(coalesce(utm_campaign,'')) <= 200
    and char_length(coalesce(utm_term,''))     <= 200
    and char_length(coalesce(utm_content,''))  <= 200
    and char_length(coalesce(gclid,''))        <= 200
    and char_length(coalesce(fbclid,''))       <= 200
    and char_length(coalesce(landing_page,'')) <= 300
    and char_length(coalesce(referrer,''))     <= 300
  );

drop policy if exists "anon insert events" on public.events;
create policy "anon insert events"
  on public.events for insert to anon
  with check (
    char_length(coalesce(event_name,'')) between 1 and 100
    and (payload is null or char_length(payload::text) <= 8000)
  );

-- Helpful indexes
create index if not exists leads_created_idx    on public.leads (created_at desc);
create index if not exists partners_created_idx on public.partners (created_at desc);
create index if not exists events_name_idx      on public.events (event_name, created_at desc);

-- ============ Optional / future (not used by the MVP) ============
-- A static catalog and a per-simulation log can be added later:
--
-- create table if not exists public.models (
--   id uuid primary key default gen_random_uuid(),
--   slug text unique, name text, base_price numeric, active boolean default true
-- );
--
-- create table if not exists public.simulations (
--   id uuid primary key default gen_random_uuid(),
--   created_at timestamptz default now(),
--   model_name text, customer_type text, down_payment numeric,
--   balloon numeric, months int, monthly_payment numeric
-- );
