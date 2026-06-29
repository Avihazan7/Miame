# MiaMe · 3D models (GLB) — OS U.M.M Marketplace

Professional GLB assets for the Ultra Vehicle Vision **3D Pro** tab
(`components/vehicle-media/VehicleModelStage.tsx` → `useGLTF`).

## `mia-four-x4.glb`

A deterministic, PBR-shaded MIA FOUR X4 — authored **in code** (no DCC tool, no
binary blob to trust). Matte nano-crystal black body, alloy rims, MIA-teal hubs +
suspension springs, off-road tires, folding stem, quick-release seat.

### Pipeline

```bash
npm run build:glb     # scripts/build-glb.mjs  → public/models/mia-four-x4.glb
npm run publish:glb   # scripts/publish-glb-to-bucket.mjs → Supabase vehicle-media bucket
                      #   needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

The site serves the committed `/models/mia-four-x4.glb` by default (Vercel CDN).
Once published to the bucket, point the site at the CDN copy:

```
NEXT_PUBLIC_MIA_GLB_URL=<public bucket url>
```

The asset row is registered in `vehicle_media_assets` by
`supabase/migrations/20260629_vehicle_media_glb.sql` (idempotent).

### Verification

`scripts/build-glb.mjs` self-validates the GLB container (magic / length /
chunk types / accessor bounds) before writing. The artifact additionally parses
cleanly through the real `three.js` `GLTFLoader` (34 nodes · 10 meshes ·
7 PBR materials · 2,508 triangles · ~12 KB).
