-- ============================================================================
-- MiaMe Rental Fleet OS · v1 — Eilat / Green Extreme (additive migration)
-- ============================================================================
-- Realizes docs/rental-fleet-schema-proposal.sql as four ADDITIVE tables. Nothing
-- here alters existing tables. Apply through the normal migration flow AFTER
-- business sign-off — do not run against production ad-hoc.
--
-- Conventions mirror the existing lead schema (0001_crm.sql / 20260704_lead_utm.sql):
--   * anon may INSERT a bounded rental inquiry (rental_leads), but may NOT SELECT.
--   * roster / branches / events are service-role only — no anon policy at all, so
--     with RLS enabled the public anon key can neither read nor write them.
--   * the client insert (lib/supabase.ts → saveRentalLead) is schema-lenient and
--     already fails quietly until this runs, so nothing breaks before or after.
-- ============================================================================

-- ---- rental_branches (physical hubs) · service-role only --------------------
create table if not exists public.rental_branches (
  code       text primary key,               -- e.g. GREEN-EXTREME-EIL
  name       text not null,
  zone       text not null default 'eilat',
  address    text,
  waze_url   text,
  lat        double precision,
  lng        double precision,
  status     text not null default 'active'
             check (status in ('active','paused','planned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_branches enable row level security;
-- No anon policy: branches are never exposed to the public anon key.

-- ---- rental_assets (fleet roster) · service-role only -----------------------
create table if not exists public.rental_assets (
  code       text primary key,               -- e.g. MIA-EIL-01
  model_id   text not null,                  -- 4x2 | 2x4lr | 4x4
  zone       text not null default 'eilat',
  branch_code text references public.rental_branches (code) on delete set null,
  hub        text not null,
  status     text not null default 'available'
             check (status in ('available','reserved','maintenance','retired')),
  -- tracker linkage — populated only once Ituran Tick Track is live (adapter-ready).
  tracker_provider text,                     -- e.g. 'ituran-tick-track'
  tracker_asset_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_assets enable row level security;
-- No anon policy: the roster is never exposed to the public anon key.

create index if not exists rental_assets_branch_idx on public.rental_assets (branch_code, status);

-- ---- rental_leads (public funnel) · anon INSERT only ------------------------
create table if not exists public.rental_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  full_name       text,
  phone           text not null,
  hub             text,
  requested_hours text,
  source          text,
  branch_code     text references public.rental_branches (code) on delete set null,
  -- first-touch attribution (same columns as public.leads / public.partners)
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
    and char_length(coalesce(utm_source,''))      <= 200
    and char_length(coalesce(utm_medium,''))      <= 200
    and char_length(coalesce(utm_campaign,''))    <= 200
    and char_length(coalesce(utm_term,''))        <= 200
    and char_length(coalesce(utm_content,''))     <= 200
    and char_length(coalesce(gclid,''))           <= 200
    and char_length(coalesce(fbclid,''))          <= 200
    and char_length(coalesce(landing_page,''))    <= 300
    and char_length(coalesce(referrer,''))        <= 300
  );

create index if not exists rental_leads_created_idx on public.rental_leads (created_at desc);

-- ---- rental_events (lifecycle / telemetry audit) · service-role only --------
-- Append-only trail for booking lifecycle transitions and (later) tracker pings.
-- Written by the server / admin only — never by the public anon key.
create table if not exists public.rental_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event_type  text not null,                 -- e.g. lead_created | reserved | checked_out | returned | tracker_ping
  asset_code  text references public.rental_assets (code) on delete set null,
  lead_id     uuid references public.rental_leads (id) on delete set null,
  branch_code text references public.rental_branches (code) on delete set null,
  payload     jsonb not null default '{}'::jsonb
);

alter table public.rental_events enable row level security;
-- No anon policy: the event log is service-role only.

create index if not exists rental_events_type_idx on public.rental_events (event_type, created_at desc);
create index if not exists rental_events_asset_idx on public.rental_events (asset_code, created_at desc);
