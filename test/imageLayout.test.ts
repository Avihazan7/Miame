/**
 * Every <img> reserves its space before the bytes arrive.
 *
 * Measured 2026-08-31, before this file existed: mobile CLS ranged 0.30–1.15
 * against Google's 0.10 "good" threshold, while desktop sat at 0.046. That gap
 * is why it went unnoticed — a desktop check says the page is fine while the
 * majority-traffic device fails by an order of magnitude.
 *
 * Two root causes, both mechanical:
 *   · eleven plain <img> with no width/height at all, so the box was 0 until load
 *   · one <img> declaring 220×50 for a file that is 1920×1080 — the browser
 *     reserved a 4.4:1 box and then collapsed it to 16:9
 *
 * A static check, not a browser run: this has to fail in CI without a server.
 */
import { describe, expect, it } from "vitest";
import { intrinsicSize } from "./helpers/intrinsicSize";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";


/**
 * Every .tsx under components/, AT ANY DEPTH.
 *
 * The flat readdirSync this replaced never opened components/seo/,
 * components/vehicle-media/ or components/marketplace/ at all — which is exactly
 * how the SEO hero shipped a 4:3 box for a 0.94:1 file while this suite stayed
 * green (test/seoHeroIntrinsic.test.ts documents that finding). A gate with a
 * blind spot is worse than no gate: it reports a confidence it does not have.
 */
function componentFiles(dir = "components"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...componentFiles(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const files = componentFiles();


/**
 * Every image tag in a component — plain <img> AND next/image <Image> — with its
 * source file for the message.
 *
 * <Image> sat outside the old scan entirely, and that was never defensible: it
 * reserves its box from width/height exactly as <img> does, so a next/image whose
 * attributes disagree with the file on disk shifts the page in the same way.
 */
function imgTags() {
  const out: { file: string; kind: string; tag: string }[] = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/<(img|Image)\b[\s\S]*?\/?>/g)) {
      out.push({ file: f, kind: m[1], tag: m[0] });
    }
  }
  return out;
}

const LOCAL_SRC = /src=["']([^"']+\.(?:webp|png|jpe?g|avif))["']/;

describe("images reserve their space", () => {
  const tags = imgTags();

  it("reaches the nested folders and both tag kinds it is meant to police", () => {
    // These assertions ARE the old blind spot, written down. The scan has to
    // descend into the nested component folders, and it has to count <Image> as
    // well as <img>. Let either go back to zero and this file is once again
    // asserting about a subset of the page while reading as if it covered all
    // of it — which is how the hero defect got through.
    expect(files.some((f) => f.includes("seo")), "components/seo/ not scanned").toBe(true);
    expect(
      files.some((f) => f.includes("vehicle-media")),
      "components/vehicle-media/ not scanned",
    ).toBe(true);
    expect(
      tags.filter((t) => t.kind === "Image").length,
      "no next/image tag scanned",
    ).toBeGreaterThan(8);
    expect(
      tags.filter((t) => t.kind === "img").length,
      "no plain <img> scanned",
    ).toBeGreaterThanOrEqual(4);
    expect(tags.length).toBeGreaterThan(24);
  });

  it("declares width and height on every <img> with a local file", () => {
    // A dynamic src (a YouTube thumbnail, a 360 frame) has no build-time size and
    // is handled by an aspect-ratio box in CSS instead — see .cinema-poster img.
    for (const { file, tag } of tags) {
      if (!LOCAL_SRC.test(tag)) continue;
      expect(/\bwidth=/.test(tag) && /\bheight=/.test(tag),
        `${file}: <img> with a local src and no width/height`).toBe(true);
    }
  });

  it("declares the file's TRUE aspect ratio, not the rendered one", () => {
    // The failure this catches is subtler than a missing attribute: attributes
    // that disagree with the file still shift, because the browser reserves the
    // declared ratio and then corrects to the real one.
    for (const { file, tag } of tags) {
      const src = tag.match(LOCAL_SRC)?.[1];
      if (!src?.startsWith("/")) continue;
      const path = `public${src}`;
      if (!existsSync(path)) continue;
      const w = Number(tag.match(/width=\{?(\d+)/)?.[1]);
      const h = Number(tag.match(/height=\{?(\d+)/)?.[1]);
      if (!w || !h) continue;
      const real = intrinsicSize(path);
      if (!real) continue;
      const declared = w / h;
      const actual = real.width / real.height;
      expect(Math.abs(declared - actual) / actual,
        `${file}: ${src} declares ${w}×${h} (${declared.toFixed(2)}:1) but the file is ` +
        `${real.width}×${real.height} (${actual.toFixed(2)}:1) — the box will collapse on load`,
      ).toBeLessThan(0.02);
    }
  });

  it("keeps an aspect-ratio box for the posters whose size is unknowable", () => {
    const css = readFileSync("app/globals.css", "utf8");
    for (const sel of [".cinema-poster img", ".spq-video-poster img"]) {
      expect(css, `${sel} has no reserved box`).toContain(sel);
    }
    expect(css).toMatch(/\.cinema-poster img[\s\S]{0,200}aspect-ratio/);
  });
});
