-- 20260629_vehicle_media_ultra_glb.sql
-- ⚠ RENAMED from 20260629_vehicle_media_glb.sql. Filename order IS apply order,
--   and the old name sorted BEFORE 20260629_vehicle_media_ultra.sql — the file that
--   CREATES public.vehicle_media_assets. On an empty database the very first
--   statement here aborted the whole replay. The "_ultra_" infix pins this file
--   after its dependency; scripts/check-migrations.mjs now fails the build if a
--   migration references a table a later-sorting file creates.
--
-- MiaMe.co.il · register the MIA FOUR X4 Professional GLB in the Ultra media layer
-- ---------------------------------------------------------------------------
-- Adds the published 3D asset row that the storefront's Ultra Vehicle Vision
-- reads. The binary itself is uploaded to the public `vehicle-media` bucket by
-- scripts/publish-glb-to-bucket.mjs at path mia-four-x4/mia-four-x4.glb (the
-- GLB is authored deterministically by scripts/build-glb.mjs). Idempotent: the
-- guarded insert is a no-op if the row already exists; re-running only refreshes
-- the asset paths/metadata.

insert into public.vehicle_media_assets
  (vehicle_id, brand, make, model, trim, model_year, status,
   cover_path, gallery_paths, glb_path, alt_text, quality_tier, is_primary, metadata)
select
  'mia-four-x4', 'miame', 'Mia FOUR', 'X4', '4x4', 2026, 'published',
  'mia-four-x4/cover.webp',
  array[
    'mia-four-x4/night-rear.jpg',
    'mia-four-x4/night-front.jpg',
    'mia-four-x4/seat.webp',
    'mia-four-x4/pure-freedom.png'
  ],
  'mia-four-x4/mia-four-x4.glb',
  'מיה פור X4 · מודל תלת-ממד מקצועי (GLB) · גוף שחור ננו-קריסטל, מתלים בטורקיז MIA',
  'ultra', true,
  jsonb_build_object(
    'generator', 'OS U.M.M · build-glb.mjs',
    'format', 'glb',
    'pbr', true,
    'source', 'procedural',
    'palette', jsonb_build_object('body', 'nano-crystal-black', 'accent', 'mia-teal')
  )
where not exists (
  select 1 from public.vehicle_media_assets
  where vehicle_id = 'mia-four-x4' and brand = 'miame'
);

-- Refresh the asset PATH for the existing row.
--
-- ⚠ `status` is deliberately NOT written here any more. This used to set
--    status = 'published' unconditionally, so re-applying the migration silently
--    resurrected an asset an operator had archived or drafted — a data act wearing
--    a registration's clothes. Publication state belongs to whoever curates media,
--    not to a replayable migration. The row is only touched while it is still in
--    the state this migration originally created it in.
update public.vehicle_media_assets
set glb_path = 'mia-four-x4/mia-four-x4.glb',
    quality_tier = 'ultra',
    updated_at = now()
where vehicle_id = 'mia-four-x4'
  and brand = 'miame'
  and status = 'published'
  and glb_path is distinct from 'mia-four-x4/mia-four-x4.glb';
