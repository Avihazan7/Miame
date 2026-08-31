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