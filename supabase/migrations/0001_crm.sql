-- MiaMe.co.il · CRM schema (leads / partners / events)
--
-- This migration is EQUIVALENT to ../schema.sql (the canonical copy run via the
-- Supabase SQL Editor per docs/RUNBOOK.md). Either one provisions the full CRM.
--
-- Architecture (per product audit): the storefront writes directly from the
-- browser using the public anon key, so anon may INSERT ONLY — no SELECT/UPDATE/
-- DELETE. The service_role key is NEVER shipped to the browser. Reads happen in
-- the Supabase dashboard (owner) only.
--
-- NOTE: this supersedes the earlier service_role-only `/api/lead` draft. That
-- server-side route was never implemented; the live app uses the client-side
-- anon design above. To switch to a server-side design later, add an /api route
-- with the service_role key and replace the anon INSERT policies with none.

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

-- Anon INSERT only, with bounded input (defense-in-depth; not `with check (true)`).
-- No SELECT policy => the public cannot read any row.
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
  );

drop policy if exists "anon insert partners" on public.partners;
create policy "anon insert partners"
  on public.partners for insert to anon
  with check (
    char_length(coalesce(business_name,'')) <= 200
    and char_length(coalesce(contact_name,'')) <= 200
    and char_length(coalesce(phone,''))        <= 40
    and char_length(coalesce(city,''))         <= 120
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
