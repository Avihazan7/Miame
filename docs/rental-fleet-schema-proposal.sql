-- ============================================================================
-- MiaMe Rental Fleet OS · v1 — Supabase SCHEMA PROPOSAL (NOT APPLIED)
-- ============================================================================
-- This file is a PROPOSAL for review, deliberately placed under docs/ and NOT in
-- supabase/migrations/, so nothing here runs automatically. Apply it only after
-- business sign-off, by copying it into a dated migration and running the normal
-- migration flow.
--
-- Design goals (mirrors the existing lead schema conventions):
--   * anon may INSERT a rental inquiry (bounded), but may NOT SELECT.
--   * fleet roster is admin/service-role only (never anon-readable).
--   * client insert stays schema-lenient — saveRentalLead() already fails quietly
--     until this is applied, so nothing breaks before or after.
-- ============================================================================

-- ---- rental inquiries (public funnel) --------------------------------------
create table if not exists public.rental_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  full_name       text,
  phone           text not null,
  hub             text,
  requested_hours text,
  source          text,
  -- first-touch attribution (same columns as public.leads)
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_term     text,
  utm_content  text,
  gclid        text,
  fbclid       text,
  landing_page text,
  referrer     text
);

alter table public.rental_leads enable row level security;

-- anon may insert a bounded rental inquiry; anon may NOT read.
drop policy if exists "anon insert rental_leads" on public.rental_leads;
create policy "anon insert rental_leads"
  on public.rental_leads for insert to anon
  with check (
    phone is not null
    and char_length(phone) between 6 and 40
    and char_length(coalesce(full_name,''))       <= 200
    and char_length(coalesce(hub,''))             <= 120
    and char_length(coalesce(requested_hours,'')) <= 60
    and char_length(coalesce(source,''))          <= 300
  );

-- ---- fleet roster (admin / service-role only) ------------------------------
create table if not exists public.rental_assets (
  code       text primary key,             -- e.g. MIA-EIL-01
  model_id   text not null,                -- 4x2 | 2x4lr | 4x4
  zone       text not null default 'eilat',
  hub        text not null,
  status     text not null default 'available'
             check (status in ('available','reserved','maintenance')),
  -- tracker linkage — populated only once Ituran Tick Track is live
  tracker_provider text,                   -- e.g. 'ituran-tick-track'
  tracker_asset_id text,
  updated_at timestamptz not null default now()
);

alter table public.rental_assets enable row level security;
-- No anon policy: the roster is never exposed to the public anon key. Reads/writes
-- go through the service role (admin dashboard / server), added on approval.
