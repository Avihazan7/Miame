// scripts/turntable-recut.mjs — re-cut the six turntable angles from the 4K masters.
//
// WHAT THIS FIXES, MEASURED 2026-09-09 against the running production build.
//
// The shipped frames were 1800×1994, cut from the owner's six 3840×3840 renders.
// next/image emits a srcSet of 384…3840 for the hero, so any viewport needing more
// than 1800 device px was served an ENLARGED 1800px source — Next inventing pixels:
//
//     tablet 768/820/900 × DPR2   → w=1920   216KB carrying 204KB of real detail
//     900 × DPR3                  → w=3840   498KB carrying 204KB of real detail
//
// The masters hold 2299-2364 px of vehicle where the shipped frames hold 1434-1637,
// so the detail existed the whole time and was discarded at cut time. The browser
// never fetches these files directly (verified on the built HTML: every reference
// is /_next/image?url=…&w=…), so a larger source costs deploy weight and optimiser
// time, not user bandwidth.
//
// ── THE MEASUREMENT THAT MADE THIS SAFE, AND THE ONE THAT NEARLY BLOCKED IT ──
//
// A first pass rejected this work, having measured the master→shipped transform as
// inconsistent: scaleX ranging over 10% and X disagreeing with Y by 3-14% per frame.
// That was measured at alpha > 16, which includes the ground shadow — and the
// shadow's extent differs per angle and is clipped differently by the existing crop.
// It was noise, not geometry.
//
// Measured on the VEHICLE instead (alpha > 128), the pipeline is exact:
//
//     frame   scaleX   scaleY   disagreement
//       1     0.6237   0.6236      -0.0%
//       2     0.6925   0.6923      -0.0%
//       3     0.6920   0.6924       0.1%
//       4     0.6927   0.6922      -0.1%
//       5     0.6928   0.6927      -0.0%
//       6     0.6926   0.6923      -0.0%
//
// One shared scale of 0.6925 for frames 2-6, and frame 1 at 0.6237 — which is
// 0.6237 / 0.6925 = 0.9007, exactly the 0.901 normalisation lib/turntable.ts
// records for it. There is no vertical stretch and no per-frame drift. The framing
// is therefore reproducible EXACTLY, and this script reproduces it: same crop, same
// normalisation, only the output resolution changes.
//
// Usage:  npm i -D sharp && node scripts/turntable-recut.mjs
// sharp is intentionally NOT a committed dependency — same rule as
// scripts/optimize-images.mjs; the app never imports it.
import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ARCHIVE = path.join(ROOT, "assets-archive");
const PUBLIC = path.join(ROOT, "public");

const SRC = ["1-front-right", "2-side-right", "3-rear-right", "4-rear-left", "5-side-left", "6-front-left"];

/** The vehicle, not its shadow. 128 is the threshold the note above explains. */
const VEHICLE_ALPHA = 128;
const QUALITY = 90;

/** Frame 1 was rendered ~10% closer than its mirror twin; lib/turntable.ts records this. */
const FRAME1_NORMALISE = 0.901;

async function bbox(input, threshold = VEHICLE_ALPHA) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, W: info.width, H: info.height };
}

/** Scale a whole canvas by k about (cx, by), keeping the canvas size. */
async function scaleAbout(file, k, cx, by, W, H) {
  const scaled = await sharp(file)
    .ensureAlpha()
    .resize({ width: Math.round(W * k), height: Math.round(H * k), fit: "fill" })
    .toBuffer();
  return sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: scaled, left: Math.round(cx - cx * k), top: Math.round(by - by * k) }])
    .png()
    .toBuffer();
}

const run = async () => {
  const files = SRC.map((n) => path.join(ARCHIVE, `mia-four-360-src-${n}.webp`));
  const masters = [];
  for (const f of files) masters.push(await bbox(f));
  const { W, H } = masters[0];

  // 1 · frame 1 onto its twin's scale, about the bottom-centre of its silhouette
  const cx = masters[0].x0 + masters[0].w / 2;
  const by = masters[0].y1;
  const buffers = [await scaleAbout(files[0], FRAME1_NORMALISE, cx, by, W, H), ...files.slice(1)];
  console.log(`frame 1 normalised about its baseline, k = ${FRAME1_NORMALISE}`);

  // 2 · recover the existing framing from frame 6, which was never rescaled
  const shipped6 = await bbox(execSync("git show HEAD:public/mia-four-360-6.webp", { maxBuffer: 1e8 }));
  const scale = shipped6.w / masters[5].w;
  const bw = Math.round(shipped6.W / scale);
  const bh = Math.round(shipped6.H / scale);
  const left = Math.max(0, Math.min(W - bw, Math.round(masters[5].x0 - shipped6.x0 / scale)));
  const top = Math.max(0, Math.min(H - bh, Math.round(masters[5].y0 - shipped6.y0 / scale)));
  console.log(`existing framing: scale ${scale.toFixed(4)} → crop ${bw} × ${bh} at (${left}, ${top})`);
  console.log(`output is native: ${(bw / shipped6.W).toFixed(2)}× the linear pixels, same framing\n`);

  // 3 · one identical crop per angle, written at the crop's own resolution
  let total = 0;
  for (let i = 0; i < buffers.length; i++) {
    const buf = await sharp(buffers[i])
      .extract({ left, top, width: bw, height: bh })
      .webp({ quality: QUALITY, alphaQuality: 100, effort: 6 })
      .toBuffer();
    await writeFile(path.join(PUBLIC, `mia-four-360-${i + 1}.webp`), buf);
    const v = await bbox(path.join(PUBLIC, `mia-four-360-${i + 1}.webp`));
    total += buf.length;
    console.log(
      `  frame${i + 1}  ${v.W}×${v.H}  vehicle ${v.w}×${v.h}` +
        `  (${((v.w / v.W) * 100).toFixed(1)}% of frame)  ${(buf.length / 1024).toFixed(0)}KB`,
    );
  }
  console.log(`\ntotal ${(total / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Set TURNTABLE_W/H in lib/turntable.ts to ${bw} / ${bh}, and add ${bw} to deviceSizes.`);
};

run();
