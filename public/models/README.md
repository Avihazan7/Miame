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


---

## Intake — how a real model gets onto the site

```bash
npm run glb:check -- path/to/model.glb      # 0 = fit to ship · 1 = rejected · 2 = unusable
npm run publish:glb                          # only after the check passes
# then set NEXT_PUBLIC_MIA_GLB_URL to the published URL
```

`scripts/glb-check.mjs` reads the container by hand — no dependencies, no network —
and reports weight, triangles **drawn** (not merely stored: a node tree instances a
mesh, so four wheels are one mesh referenced four times), materials, and every
embedded texture's real pixel size.

### The two rejections that exist because the failure is otherwise silent

1. **An external URI.** A GLB may reference its buffers or textures by URL instead
   of embedding them. The loader fetches those URLs, `connect-src` allows only
   `'self'` and Supabase, the fetch is blocked, and the model renders incomplete
   with **no error anyone sees**. A converter whose own preview looked correct is
   exactly how such a file arrives.
2. **A truncated or padded container.** A concatenated download leaves every chunk
   intact and only the header's declared length disagrees, so it is caught there.

`KHR_draco_mesh_compression` and `EXT_meshopt_compression` are reported as
**warnings, not rejections**: they are the right answer for the web, but drei
fetches their decoder from a third-party CDN by default and that is the same silent
CSP failure. Self-host the decoder and the file ships.

### Choosing a source format — this decides the ceiling

| Format | Carries | Verdict |
|---|---|---|
| **GLB / glTF** | geometry · PBR materials · textures · animation, in one file | **Ask the manufacturer for this.** It is the web's native format; nothing is lost |
| FBX · USDZ | geometry · materials · textures | Fine. Converts cleanly |
| OBJ + MTL | geometry · materials, **textures as separate files** | Workable — but the conversion must **embed** the textures. An OBJ converted without them produces exactly the external-URI file rejected above |
| **STL** | **geometry only** | **Not usable for a product hero.** No materials, no textures, no UVs, no colour. MIA FOUR is a matte nano-crystal black body with teal springs; an STL can only ever produce a grey shape |

### On "8K"

A texture larger than the screen buys nothing, and above **4096px** it is not
safely supported on every mobile GPU — the upload either fails or is silently
downscaled by the driver. Sharpness on a phone comes from **KTX2/Basis compression
at 2048–4096px**, not from an 8192px PNG. `glb:check` warns above 4096 for that
reason.
