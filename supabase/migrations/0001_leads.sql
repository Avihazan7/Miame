-- MiaMe · leads capture (lead -> follow-up -> human close)
-- Optional `tenant` column scopes rows by brand/site.
-- RLS ON with no public policy: only the service_role (server-side /api/lead) may
-- read/write. anon/auth clients get nothing. No payment/clearing data is stored here.

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  tenant      text not null default 'miame',
  name        text not null,
  phone       text not null,
  model       text,
  model_name  text,
  note        text,
  track       text default 'private',
  source      text default 'miame.co.il',
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);

create index if not exists leads_tenant_created_idx on public.leads (tenant, created_at desc);

alter table public.leads enable row level security;

-- Intentionally no anon/authenticated policies. service_role bypasses RLS.
-- (If a tenant dashboard is added later, add tenant-scoped SELECT policies here.)

comment on table public.leads is 'MiaMe storefront leads. service_role-only via /api/lead. No payment/clearing data.';
