// test/firstAndUnique.test.ts — the 4×4 statement band.
//
// The owner supplied the photograph and the headline on 2026-09-09. Three things
// about this section are load-bearing and none of them is visible in review:
//
//   1. THE DECLARED SIZE MUST EQUAL THE FILE. next/image reserves its box from
//      width/height; a pair that disagrees with the encoded file reserves the
//      wrong box and shifts the layout on decode. The repo already paid for this
//      once — see the header of test/manufacturerPhotos.test.ts.
//   2. IT MUST NOT BECOME A CLIENT COMPONENT. The 2026-09-09 audit confirmed that
//      lib/analytics.ts statically imports @supabase/supabase-js (238KB raw), and
//      that 13 client components already pull it into the initial bundle. The
//      cheapest way to undo that measurement is for someone to add tracking to a
//      banner. This band is static and must stay static.
//   3. IT MUST NOT INVENT A SPECIFICATION. The numbers are read from
//      lib/models.ts. Retyping them is how two surfaces end up disagreeing.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MODELS } from "../lib/models";

const raw = readFileSync("components/FirstAndUnique.tsx", "utf8");
const src = raw;

/** Source with comments removed — same shape as test/commercialTruth.test.ts:37,
 *  because a claim written in a comment is not a claim published to a visitor
 *  (and this file's own comments name the very words it forbids). */
const code = raw
  .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, " ")
  .split("\n")
  .filter((l) => !l.trimStart().startsWith("//"))
  .join("\n");
const css = readFileSync("app/miame-ultra.css", "utf8");
const page = readFileSync("app/page.tsx", "utf8");

/** Intrinsic size straight from the WebP header. No decoding, no dependency. */
function webpSize(file: string): { w: number; h: number } {
  const b = readFileSync(file);
  // RIFF....WEBP, then a chunk: VP8X (extended), VP8L (lossless) or VP8 (lossy).
  const tag = b.toString("ascii", 12, 16);
  if (tag === "VP8X") return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (tag === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  const bits = b.readUInt32LE(21);
  return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
}

describe("the 4×4 statement band", () => {
  it("declares exactly the size the encoded file carries", () => {
    const { w, h } = webpSize("public/mia-four-x4-arena.webp");
    expect(src).toContain(`width={${w}}`);
    expect(src).toContain(`height={${h}}`);
    // 16:9 is what .first-frame reserves; a different ratio would letterbox.
    expect(w / h).toBeCloseTo(16 / 9, 2);
  });

  it("stays a server component — no hydration, and no analytics import", () => {
    expect(src, 'the band became a client component').not.toMatch(/^\s*"use client"/m);
    expect(src, "importing `track` drags the 238KB Supabase SDK into the bundle").not.toMatch(
      /from\s+"@\/lib\/analytics"/,
    );
    expect(src).not.toMatch(/\buseState\b|\buseEffect\b/);
  });

  it("reads its specifications from lib/models.ts instead of retyping them", () => {
    const proMax = MODELS.find((m) => m.id === "4x4")!;
    expect(src).toMatch(/getModel\("4x4"\)/);
    // No field the component renders may appear as a literal — highlights, and
    // ALSO name and tagline. The first version of this test checked highlights
    // only, and a mutation that replaced {PRO_MAX.tagline} with the literal
    // "הכוח לכל מסלול" passed it. A gate that covers two of three fields is a
    // gate that lets the third drift.
    for (const value of [...proMax.highlights, proMax.name, proMax.tagline]) {
      expect(code, `"${value}" is retyped instead of read from lib/models.ts`).not.toContain(value);
    }
  });

  it("goes through next/image, never a raw <img>", () => {
    expect(src).toMatch(/from\s+"next\/image"/);
    expect(src).not.toMatch(/<img\b/);
  });

  it("caps `sizes` at the frame rather than quoting a bare vw", () => {
    // .first-frame is min(100%,980px); a bare "100vw" would ask for 1440 on a
    // desktop for a slot that is 980.
    const sizes = src.match(/sizes="([^"]+)"/)?.[1];
    expect(sizes, "no sizes attribute").toBeTruthy();
    const bare = sizes!.match(/(?:^|,\s*)(\d+)vw\s*$/);
    expect(bare, `sizes ends in a bare vw ("${sizes}") — it must end in a fixed px cap`).toBeNull();
    expect(sizes).toMatch(/980px\s*$/);
  });

  it("reserves its box in CSS as well, so nothing reflows on decode", () => {
    const frame = css.slice(css.indexOf(".first-frame{"));
    expect(frame.slice(0, frame.indexOf("}"))).toMatch(/aspect-ratio:\s*16\/9/);
  });

  it("sits immediately above CinematicVideo, so the dark blocks read as one passage", () => {
    const first = page.indexOf("<FirstAndUnique />");
    const patents = page.indexOf("<Patents />");
    const cinema = page.indexOf("<CinematicVideo />");
    expect(first).toBeGreaterThan(patents);
    expect(first).toBeLessThan(cinema);
  });

  it("adds no price, no availability and no regulatory claim", () => {
    expect(code).not.toMatch(/₪|\bprice\b|מחיר|במלאי|רישוי|ביטוח|אחריות/);
  });
});
