-- Rollback for 20260723115108_media_rls_hardening.sql
--
-- ⚠ This removes the ONLY write policy on public.vehicle_media_assets. With RLS
-- enabled and no write policy, the media enrichment jobs go back to failing
-- silently — which is the outage this migration fixed. Run it only to unwind a
-- bad apply, never as routine cleanup.

drop policy if exists "service_role_manage_vehicle_media" on public.vehicle_media_assets;
drop policy if exists "public_read_published_vehicle_media" on public.vehicle_media_assets;
drop policy if exists "service_role_read_media_events" on public.vehicle_media_events;
drop policy if exists "service_role_manage_vehicle_media_bucket" on storage.objects;
