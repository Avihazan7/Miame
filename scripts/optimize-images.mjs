// scripts/optimize-images.mjs — M21-A2 image budget.
//
// Converts heavy page rasters to WebP (q82, max 1600px on the long edge) so no
// image loaded on a route exceeds the 200KB budget. Originals are ARCHIVED to
// /assets-archive (never deleted) so nothing is lost. Idempotent: if the WebP is
// already newer/present and the original already lives in the archive, it re-encodes
// from the archived source.
//
// Usage: npm i -D sharp && node scripts/optimize-images.mjs
//
// `sharp` is intentionally NOT a committed dependency — this is a one-off,
// build-time image tool and the generated .webp assets are committed to /public.
// Install it on demand before running; the app itself never imports sharp, so it
// stays out of package.json and the deployed dependency tree (npm ci stays green).

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = path.join(ROOT, "public");
const ARCHIVE = path.join(ROOT, "assets-archive");

// Heavy page rasters converted to WebP (PNG/JPG → WebP). Two tiers:
//  - product/graphic shots (crisp cut-outs & the logo) → 1600px / q82
//  - lifestyle photos (dense, shown in mid-size cards) → 1100px / q74
// so the homepage image total lands under the 900KB budget. Each entry may set
// its own { maxEdge, quality }; the defaults are the product tier.
const PHOTO = { maxEdge: 1100, quality: 74 };
const TARGETS = [
  "mia-four-teal-side.png",
  "mia-four-teal-wheel.png",
  "mia-four-teal-cockpit.png",
  "mia-four-x4-pure-freedom.png",
  "mia-four-logo.png",
  { name: "mia-fold-lot.jpg", ...PHOTO },
  { name: "mia-fold-trunk.jpg", ...PHOTO },
  { name: "mia-wheel-detail.webp", ...PHOTO },
  { name: "mia-four-x4-seat.webp", ...PHOTO },
  { name: "mia-white.webp", ...PHOTO },
];

const MAX_EDGE = 1600;
const QUALITY = 82;

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

async function fileSize(p) {
  try {
    return (await stat(p)).size;
  } catch {
    return 0;
  }
}

async function main() {
  await mkdir(ARCHIVE, { recursive: true });
  let before = 0;
  let after = 0;

  for (const entry of TARGETS) {
    const name = typeof entry === "string" ? entry : entry.name;
    const maxEdge = typeof entry === "string" ? MAX_EDGE : entry.maxEdge ?? MAX_EDGE;
    const quality = typeof entry === "string" ? QUALITY : entry.quality ?? QUALITY;
    const src = path.join(PUBLIC, name);
    const archived = path.join(ARCHIVE, name);
    const webpName = name.replace(/\.(png|jpe?g)$/i, ".webp");
    const out = path.join(PUBLIC, webpName);

    // Archive the original once (move out of /public so it is not deployed).
    if (existsSync(src)) {
      if (!existsSync(archived)) {
        await rename(src, archived);
      }
    }
    if (!existsSync(archived)) {
      console.warn(`skip (no source): ${name}`);
      continue;
    }

    const input = await readFile(archived);
    before += input.length;

    const buf = await sharp(input)
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    await writeFile(out, buf);
    after += buf.length;

    const sha = createHash("sha256").update(buf).digest("hex").slice(0, 8);
    console.log(`${name}  ${kb(input.length)} → ${webpName}  ${kb(buf.length)}  (${sha})`);
  }

  console.log(`\ntotal: ${kb(before)} → ${kb(after)}  (saved ${kb(before - after)})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
