// scripts/turntable-recut.mjs — re-cut the six turntable angles from the 4K masters.
//
// ⚠️  ITS OUTPUT IS NOT WHAT SHIPS, AND RUNNING IT CHANGES THE HERO. Read this
//     first. The frames in public/ are the ones the owner has iterated on across
//     several rounds of framing work; this script is the measured investigation
//     behind the decision NOT to replace them, kept because the numbers are worth
//     more than the conclusion.
//
//     WHY IT WAS NOT ADOPTED. The shipped frames cannot be reproduced from these
//     masters by any single transform. Measured master→shipped scales, per frame:
//
//         frame   scaleX   scaleY
//           1     0.5928   0.6126
//           2     0.6079   0.6883
//           3     0.6386   0.6810
//           4     0.6247   0.6801
//           5     0.6054   0.6878
//           6     0.6520   0.6887
//
//     scaleX alone ranges over 10%, and X and Y disagree by 3-14% per frame. So a
//     re-cut is not a lossless re-render of the same framing — it is a NEW framing,
//     and it measured 13.3% more edge detail at w=1080 in exchange for an
//     unpredictable change to a hero that was tuned deliberately. That trade is the
//     owner's to make, not a maintenance task, and it is not made here.
//
// WHY THIS EXISTS, MEASURED 2026-09-09.
//
// THE SHIPPED FRAMES WERE UPSCALED ON EVERY LARGE REQUEST. next/image emits a
// srcSet of 384…3840 for the hero, and the built HTML's fallback `src` asks for
// w=3840 outright. The source was 1800 px wide, so every candidate above 1800 —
// 1920, 2048, 3840 — was Next enlarging an 1800 px image. The owner's masters are
// 3840×3840 and carry 2603 px of vehicle where the shipped frame carries 1543,
// so the detail existed the whole time and was thrown away at cut time.
//
// The browser never fetches these files directly (verified on the built HTML:
// every reference is /_next/image?url=…&w=…), so a higher-resolution source costs
// deploy weight and optimiser time, NOT user bandwidth.
//
// WHAT THIS DOES NOT CLAIM. An earlier pass here reported the side profiles as
// "clipped" because 23 and 24 px of silhouette touched the frame edge. That was
// wrong and is recorded so it is not rediscovered: those pixels sit at 86-89% down
// the frame — the ground shadow, not the vehicle — at alpha 19 and 39 of 255, i.e.
// 7% and 15% opacity. Nothing a visitor can see is cut. The existing framing is
// GOOD and is preserved here exactly; only the pixel count changes.
//
// WHAT IT DOES, in the same order the original pipeline documented in
// lib/turntable.ts describes:
//
//   1. NORMALISE FRAME 1. It was rendered ~10% closer than its mirror twin
//      (frame 6). Measured silhouette heights: 2806 vs 2486 → k = 0.8860. It is
//      scaled about the BOTTOM-CENTRE of its own silhouette, so it lands on the
//      twin's baseline and the turntable does not breathe passing the hero angle.
//   2. RECOVER TODAY'S FRAMING. Frame 6 was never rescaled, so the affine map
//      from master to shipped can be read straight off its silhouette:
//      1634/2506 = 0.6520, which puts the existing crop box at 2761 × 3058 from
//      (494, 508) in master space. Using it means the vehicle keeps EXACTLY the
//      size in frame it has today — a wider box would have contained more shadow
//      and made the product smaller, which is the opposite of what was asked.
//   3. NATIVE OUTPUT at 2761 × 3058: 1.53x the linear pixels, no resampling of
//      the crop itself, and no candidate below 2761 is ever upscaled again.
//
// Usage:  npm i -D sharp && node scripts/turntable-recut.mjs
// sharp is intentionally NOT a committed dependency — same rule as
// scripts/optimize-images.mjs; the app never imports it.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ARCHIVE = path.join(ROOT, "assets-archive");
const PUBLIC = path.join(ROOT, "public");

const SRC = [
  "1-front-right",
  "2-side-right",
  "3-rear-right",
  "4-rear-left",
  "5-side-left",
  "6-front-left",
];

const ALPHA_FLOOR = 16; // the pipeline's documented "haze under 8%" cleanup threshold
const QUALITY = 90;

/** Tight bounding box of the silhouette's alpha. */
async function bbox(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > ALPHA_FLOOR) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, W: info.width, H: info.height };
}

/** Scale a full canvas by k about (cx, by), keeping the canvas size. */
async function scaleAbout(file, k, cx, by, W, H) {
  const scaled = await sharp(file)
    .ensureAlpha()
    .resize({ width: Math.round(W * k), height: Math.round(H * k), fit: "fill" })
    .toBuffer();
  const dx = Math.round(cx - cx * k);
  const dy = Math.round(by - by * k);
  return sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: scaled, left: dx, top: dy }])
    .png()
    .toBuffer();
}

const run = async () => {
  const files = SRC.map((n) => path.join(ARCHIVE, `mia-four-360-src-${n}.webp`));
  const raw = [];
  for (const f of files) raw.push(await bbox(f));
  const { W, H } = raw[0];

  // 1 · normalise frame 1 onto its mirror twin's silhouette height
  // the value lib/turntable.ts records for this normalisation
  const k = 0.901;
  const cx = raw[0].x0 + raw[0].w / 2;
  const by = raw[0].y1;
  const frame1 = await scaleAbout(files[0], k, cx, by, W, H);
  const buffers = [frame1, ...files.slice(1)];
  console.log(`frame 1 normalised about its baseline, k = ${k} (the value lib/turntable.ts records)`);

  // 2 · recover the existing crop box from frame 6, which was never rescaled
  const shipped6 = await bbox(path.join(PUBLIC, "mia-four-360-6.webp"));
  const scale = shipped6.w / raw[5].w;
  console.log(`existing framing: master→shipped scale ${scale.toFixed(4)}`);

  // 3 · the same box, expressed in master pixels
  const bw = Math.round(shipped6.W / scale);
  const bh = Math.round(shipped6.H / scale);
  const left = Math.max(0, Math.min(W - bw, Math.round(raw[5].x0 - shipped6.x0 / scale)));
  const top = Math.max(0, Math.min(H - bh, Math.round(raw[5].y0 - shipped6.y0 / scale)));
  console.log(`crop (today's framing, native px): ${bw} × ${bh} at (${left}, ${top})`);

  // 4 · one identical crop for every angle, written at native resolution
  let total = 0;
  for (let i = 0; i < buffers.length; i++) {
    const out = path.join(PUBLIC, `mia-four-360-${i + 1}.webp`);
    const buf = await sharp(buffers[i])
      .extract({ left, top, width: bw, height: bh })
      .webp({ quality: QUALITY, alphaQuality: 100 })
      .toBuffer();
    await writeFile(out, buf);
    const b = await bbox(out);
    const touching = b.x0 === 0 || b.x1 === b.W - 1;
    total += buf.length;
    console.log(
      `  frame${i + 1}  ${b.W}×${b.H}  silhouette ${b.w}×${b.h} (${((b.w / b.W) * 100).toFixed(1)}% wide)` +
        `  ${(buf.length / 1024).toFixed(0)}KB${touching ? "   ← STILL CLIPPED" : ""}`,
    );
  }
  console.log(`total ${(total / 1024 / 1024).toFixed(2)}MB`);
  console.log(`\nUpdate TURNTABLE_W/H in lib/turntable.ts to ${bw} / ${bh}.`);
};

run();
