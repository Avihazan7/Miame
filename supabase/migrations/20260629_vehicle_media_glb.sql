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

-- Refresh asset paths/metadata for the existing row (idempotent re-run).
update public.vehicle_media_assets
set glb_path = 'mia-four-x4/mia-four-x4.glb',
    quality_tier = 'ultra',
    status = 'published',
    updated_at = now()
where vehicle_id = 'mia-four-x4' and brand = 'miame';
