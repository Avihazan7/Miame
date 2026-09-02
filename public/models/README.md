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

### ⚠ The public site does NOT serve this file — read this before wiring it up

This line used to say the committed GLB is served by default. It is not, and has
not been since launch. `lib/content.ts` resolves the 3D source from
`NEXT_PUBLIC_MIA_GLB_URL` **and deliberately does not fall back** to this file or
to the bucket copy: both are procedural placeholders authored by
`scripts/build-glb.mjs`, and a stand-in next to the 4K studio stills looked worse
than no 3D tab at all. With the variable unset, `Product360Stage` hides the tab
and the photography leads.

So the asset below is a pipeline artefact and a container test — not the model of
the vehicle. Turning the tab on means pointing the variable at a GENUINE MIA FOUR
GLB:

```
NEXT_PUBLIC_MIA_GLB_URL=<public bucket url>
```

Serve it from a host the CSP already allows — the Supabase bucket
(`npm run publish:glb`) or a same-origin `/models` path. `connect-src` does not
allow a third-party CDN, so a model hosted elsewhere never arrives and fails
silently.

The asset row is registered in `vehicle_media_assets` by
`supabase/migrations/20260629_vehicle_media_glb.sql` (idempotent).

### Verification

`scripts/build-glb.mjs` self-validates the GLB container (magic / length /
chunk types / accessor bounds) before writing. The artifact additionally parses
cleanly through the real `three.js` `GLTFLoader` (34 nodes · 10 meshes ·
7 PBR materials · 2,508 triangles · ~12 KB).
