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
  status          text default 'new'
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
  status         text default 'lead'
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
drop policy if exists "anon insert leads" on public.leads;
create policy "anon insert leads"
  on public.leads for insert to anon with check (true);

drop policy if exists "anon insert partners" on public.partners;
create policy "anon insert partners"
  on public.partners for insert to anon with check (true);

drop policy if exists "anon insert events" on public.events;
create policy "anon insert events"
  on public.events for insert to anon with check (true);

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
