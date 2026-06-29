#!/usr/bin/env node
/**
 * scripts/publish-glb-to-bucket.mjs — publish the MIA FOUR X4 GLB to Supabase.
 *
 * Uploads public/models/mia-four-x4.glb to the public `vehicle-media` bucket at
 * `mia-four-x4/mia-four-x4.glb` (the path the seed row in
 * supabase/migrations/20260629_vehicle_media_glb.sql points at) and prints the
 * public URL. Run AFTER `node scripts/build-glb.mjs`.
 *
 * Env (never hard-coded — service role bypasses RLS, keep it server-side only):
 *   NEXT_PUBLIC_SUPABASE_URL   — project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key (write access to storage)
 *
 * After publishing, point the site at the CDN copy by setting
 *   NEXT_PUBLIC_MIA_GLB_URL=<public url>
 * (otherwise the site serves the committed /models/mia-four-x4.glb — also fine).
 *
 * Usage:  node scripts/publish-glb-to-bucket.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "..", "public", "models", "mia-four-x4.glb");
const BUCKET = "vehicle-media";
const OBJECT_PATH = "mia-four-x4/mia-four-x4.glb";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✗ Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then re-run."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const body = readFileSync(FILE);

const { error } = await supabase.storage.from(BUCKET).upload(OBJECT_PATH, body, {
  contentType: "model/gltf-binary",
  upsert: true,
  cacheControl: "31536000",
});

if (error) {
  console.error("✗ Upload failed:", error.message);
  process.exit(1);
}

const { data } = supabase.storage.from(BUCKET).getPublicUrl(OBJECT_PATH);
console.log(`✅ Published ${(body.length / 1024).toFixed(1)} KB → ${BUCKET}/${OBJECT_PATH}`);
console.log(`   Public URL: ${data.publicUrl}`);
console.log(`   → set NEXT_PUBLIC_MIA_GLB_URL=${data.publicUrl}`);
