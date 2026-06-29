# render-spin — GLB → 360° frame set

Takes **one GLB** and renders **N transparent PNG frames** evenly spaced around a
full 360° Y-rotation. The frames drop straight into the Supabase `vehicle-media`
bucket and feed the in-app 360°/3D viewer (`spin360_paths`).

Rendered with `three@0.160.1` (the same version the app uses) in headless
Chromium via Playwright, so the spin looks identical to the live 3D viewer.

## One-time setup

```bash
npm i -D playwright   # Chromium is already on disk here — no browser download
```

## Run

```bash
node scripts/render-spin/render-spin.mjs \
  --model ./mia-four-x4.glb \
  --out ./out/mia-four-x4 \
  --frames 36 \
  --size 1600
```

| flag | meaning | default |
| --- | --- | --- |
| `--model` | GLB/GLTF file to spin (**required**) | — |
| `--out` | output directory for frames | `./out/spin` |
| `--frames` | frames around 360° (36 → one per 10°) | `36` |
| `--size` | square frame size in px | `1600` |

Output: `00.png … 35.png`, transparent background.

## Wiring the frames into the catalog

1. Upload the frames to the `vehicle-media` bucket, e.g.
   `miame/mia-four-x4/360/00.png … 35.png`.
2. Update the vehicle's row in `vehicle_media_assets`:

   ```sql
   update public.vehicle_media_assets
      set spin360_paths = array[
        'miame/mia-four-x4/360/00.png',
        -- … through …
        'miame/mia-four-x4/360/35.png'
      ],
      glb_path = 'miame/mia-four-x4/model.glb'   -- if you also upload the GLB
    where vehicle_id = 'mia-four-x4' and brand = 'miame';
   ```

The API already maps `spin360_paths`/`glb_path` to render-transformed WebP URLs
(`src/media/curatedMedia.ts`), so no code change is needed — the 360°/3D viewer
lights up as soon as the row points at real frames.

## Notes

- PNG (not WebP) on purpose — Supabase's image render transform serves WebP on the
  fly, so the source stays lossless.
- Metal/paint read like a product shot thanks to a built-in studio environment
  (`RoomEnvironment`) — no HDR file required.
- A GLB with a single self-contained `.glb` is simplest. For `.gltf` + external
  `.bin`/textures, keep them alongside and serve from the same folder.
