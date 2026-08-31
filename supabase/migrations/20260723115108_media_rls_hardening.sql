-- 20260723115108_media_rls_hardening.sql
-- MiaMe.co.il · RECOVERED FROM PRODUCTION — this DDL existed only in the live
-- database and could not be reproduced from git.
--
-- PROVENANCE
--   Live ledger row supabase_migrations.schema_migrations
--   version 20260723115108, name "miame_media_rls_hardening_20260723".
--   Verbatim text preserved (byte-identical, md5 ee91a73ed0566e698990ad3d66f10369,
--   1300 bytes) at docs/evidence/out-of-band-2026-07-23/.
--
-- WHY IT MATTERS
--   These are the WRITE policies for vehicle_media_assets. Before them the table
--   had RLS enabled and no write policy at all, so the media enrichment jobs
--   failed silently — the classic "a background job that fails quietly is an
--   invisible outage". Losing this file to a restore point would reopen that.
--
-- IDEMPOTENT: every policy is dropped-if-exists before being created, so a
-- replay converges rather than erroring. Safe on production (where it is
-- already applied) and on an empty database.
--
-- ROLLBACK: 20260723115108_media_rls_hardening.rollback.sql

drop policy if exists "service can manage vehicle media" on public.vehicle_media_assets;
drop policy if exists "service_role_manage_vehicle_media" on public.vehicle_media_assets;
create policy "service_role_manage_vehicle_media" on public.vehicle_media_assets
  for all to service_role using (true) with check (true);

drop policy if exists "public can read published vehicle media" on public.vehicle_media_assets;
drop policy if exists "public_read_published_vehicle_media" on public.vehicle_media_assets;
create policy "public_read_published_vehicle_media" on public.vehicle_media_assets
  for select to anon, authenticated using (status = 'published');

drop policy if exists "service can read media events" on public.vehicle_media_events;
drop policy if exists "service_role_read_media_events" on public.vehicle_media_events;
create policy "service_role_read_media_events" on public.vehicle_media_events
  for select to service_role using (true);

drop policy if exists "service manage vehicle media bucket" on storage.objects;
drop policy if exists "service_role_manage_vehicle_media_bucket" on storage.objects;
create policy "service_role_manage_vehicle_media_bucket" on storage.objects
  for all to service_role
  using (bucket_id = 'vehicle-media')
  with check (bucket_id = 'vehicle-media');
