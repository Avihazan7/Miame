-- ULease / MiaMe Ultra Vehicle Media Layer
-- Public marketplace media: 4K gallery, 360 frames, GLB/USDZ 3D assets, and interaction analytics.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-media',
  'vehicle-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'model/gltf-binary',
    'model/vnd.usdz+zip',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.vehicle_media_assets (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  brand text not null default 'ulease' check (brand in ('ulease', 'miame')),
  make text not null,
  model text not null,
  trim text,
  model_year integer,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  cover_path text not null,
  gallery_paths text[] not null default '{}',
  spin360_paths text[] not null default '{}',
  glb_path text,
  usdz_path text,
  alt_text text,
  quality_tier text not null default 'ultra' check (quality_tier in ('standard', 'premium', 'ultra')),
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_media_assets_vehicle_id_idx
  on public.vehicle_media_assets (vehicle_id);

create index if not exists vehicle_media_assets_published_idx
  on public.vehicle_media_assets (status, brand, is_primary desc, sort_order);

create table if not exists public.vehicle_media_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  event_type text not null check (
    event_type in ('gallery_view', 'spin360_view', 'model3d_view', 'cta_click')
  ),
  source text not null default 'web',
  session_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.vehicle_media_assets enable row level security;
alter table public.vehicle_media_events enable row level security;

drop policy if exists "public can read published vehicle media" on public.vehicle_media_assets;
create policy "public can read published vehicle media"
on public.vehicle_media_assets
for select
using (status = 'published');

drop policy if exists "service can manage vehicle media" on public.vehicle_media_assets;
create policy "service can manage vehicle media"
on public.vehicle_media_assets
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "public can insert media events" on public.vehicle_media_events;
create policy "public can insert media events"
on public.vehicle_media_events
for insert
with check (true);

drop policy if exists "service can read media events" on public.vehicle_media_events;
create policy "service can read media events"
on public.vehicle_media_events
for select
using (auth.role() = 'service_role');

drop policy if exists "public read vehicle media bucket" on storage.objects;
create policy "public read vehicle media bucket"
on storage.objects
for select
using (bucket_id = 'vehicle-media');

drop policy if exists "service manage vehicle media bucket" on storage.objects;
create policy "service manage vehicle media bucket"
on storage.objects
for all
using (bucket_id = 'vehicle-media' and auth.role() = 'service_role')
with check (bucket_id = 'vehicle-media' and auth.role() = 'service_role');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vehicle_media_assets_updated_at on public.vehicle_media_assets;
create trigger trg_vehicle_media_assets_updated_at
before update on public.vehicle_media_assets
for each row execute function public.set_updated_at();
