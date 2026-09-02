// test/manufacturerPhotos.test.ts — the manufacturer's photography, and the three
// ways an image upgrade quietly rolls back.
//
// The owner supplied these on 2026-09-02 as MIA Dynamics originals. Each one
// REPLACED something measurably worse, and each replacement is the kind that a
// later edit undoes without anyone noticing the page got softer:
//
//   Specs        900×880  →  1066×1141  (a slot that needs 968px at 2× DPR)
//   Features     554×554  →  1000×1000  AND a raw <img> → next/image
//   Engineering  (nothing) →  1000×1000  the first cockpit close-up on the site
//
// WHAT THIS FILE ENFORCES, AND WHY EACH IS A REAL FAILURE MODE:
//   1. The files exist and carry the dimensions the components declare. A `width`
//      prop that disagrees with the file is how next/image ends up reserving the
//      wrong box and shifting the layout.
//   2. Every one goes through next/image. Features' tile was a raw <img> for its
//      whole life — no AVIF, no WebP, no srcset, the committed bytes shipped as-is.
//      That is invisible in review and costly on every load.
//   3. `sizes` caps at the container. --maxw is 1120px; a bare `45vw` quotes 648px
//      on a 1440 screen for a slot that is 484px.
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(p, "utf8");
const css = read("app/globals.css");
const MAXW = Number(css.match(/--maxw:(\d+)px/)?.[1]);

/** Intrinsic size from the file's own header. No decoding, no dependency. */
function dims(file: string): { w: number; h: number; bytes: number; palette: boolean } {
  const b = readFileSync(join("public", file));
  if (b.readUInt32BE(0) === 0x89504e47) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length, palette: b[25] === 3 };
  }
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc9, 0xca].includes(m)) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), bytes: b.length, palette: false };
    }
    i += 2 + len;
  }
  throw new Error(`${file}: no frame header`);
}

/**
 * The exact <Image …/> element that renders `file` — not a slice around it.
 *
 * The first draft took src.slice(index ± 600) and read the FIRST width/quality/sizes
 * it found there. In both Features.tsx and Engineering.tsx the preceding image sits
 * inside that window, so the assertions were reading its attributes: Features
 * reported width 1100 (mia-fold-trunk's) and Engineering 934 (the rear shot's). A
 * guard that reads the neighbour is not a weaker guard, it is a guard on the wrong
 * element — and it would have passed a genuinely broken width just as happily.
 */
function element(source: string, file: string): string {
  const at = source.indexOf(file);
  expect(at, `${file} is not rendered here at all`).toBeGreaterThan(-1);
  const open = source.lastIndexOf("<Image", at);
  expect(open, `${file} is not inside an <Image> element`).toBeGreaterThan(-1);
  const close = source.indexOf("/>", at);
  return source.slice(open, close + 2);
}

const SHOTS = [
  { file: "mia-four-x4-hero-cutout.png", w: 1066, h: 1141, host: "components/Specs.tsx", floor: 900 },
  { file: "mia-four-x4-side-standing.jpg", w: 1000, h: 1000, host: "components/Features.tsx", floor: 554 },
  { file: "mia-four-x4-brake-detail.jpg", w: 1000, h: 1000, host: "components/Engineering.tsx", floor: 0 },
] as const;

describe("the manufacturer's photography is present and measured", () => {
  it("the container token this file computes against has not moved", () => {
    expect(MAXW, "--maxw changed — every sizes value below was derived from it").toBe(1120);
  });

  it.each(SHOTS)("$file is on disk at the size its component declares", (shot) => {
    expect(existsSync(join("public", shot.file)), `${shot.file} is missing`).toBe(true);
    const d = dims(shot.file);
    expect(d.w).toBe(shot.w);
    expect(d.h).toBe(shot.h);

    const src = read(shot.host);
    expect(src, `${shot.host} no longer renders ${shot.file}`).toContain(shot.file);

    // READ BACK FROM THE COMPONENT, not from the constant above. The first draft
    // compared the file against a number written in this file, so editing
    // `width={1066}` to `width={900}` in Specs.tsx changed nothing here — the
    // mutation that proved it is the reason this reads the JSX. A declared width
    // that disagrees with the file makes next/image reserve the wrong box, which
    // is a layout shift nobody attributes to the image.
    const el = element(src, shot.file);
    const declaredW = Number(el.match(/width=\{(\d+)\}/)?.[1]);
    const declaredH = Number(el.match(/height=\{(\d+)\}/)?.[1]);
    expect(declaredW, `${shot.host} declares width ${declaredW}, the file is ${d.w}px`).toBe(d.w);
    expect(declaredH, `${shot.host} declares height ${declaredH}, the file is ${d.h}px`).toBe(d.h);
  });

  it.each(SHOTS.filter((s) => s.floor > 0))("$file is not smaller than what it replaced", (shot) => {
    // The regression this catches is a well-meaning "optimisation" that swaps in a
    // smaller file. Softer is not cheaper when the browser upscales it anyway.
    expect(dims(shot.file).w).toBeGreaterThan(shot.floor);
  });
});

describe("every one of them goes through the optimizer", () => {
  it.each(SHOTS)("$file is rendered by next/image, never a raw <img>", (shot) => {
    const src = read(shot.host);
    // The exact defect found in Features.tsx: a raw <img> ships the committed bytes,
    // with no AVIF, no WebP and no srcset — and looks identical in code review.
    const raw = new RegExp(`<img[^>]*${shot.file.replace(/\./g, "\\.")}`, "s");
    expect(src, `${shot.file} is served by a raw <img> — it bypasses AVIF/WebP and srcset`).not.toMatch(raw);
    expect(src).toMatch(new RegExp(`<Image[\\s\\S]{0,400}${shot.file.replace(/\./g, "\\.")}`));
  });

  it.each(SHOTS)("$file asks for more than the default quality", (shot) => {
    // next/image defaults to q75. On a near-black body with long gradients that is
    // where banding is manufactured rather than merely inherited from the source.
    expect(element(read(shot.host), shot.file), `${shot.file} is left at the default q75`).toMatch(
      /quality=\{9\d\}/,
    );
  });

  it.each(SHOTS)("$file declares a slot capped by the container", (shot) => {
    const sizes = element(read(shot.host), shot.file).match(/sizes="([^"]+)"/)?.[1] ?? "";
    expect(sizes, `${shot.file} has no sizes at all — every viewport is quoted 100vw`).not.toBe("");
    expect(sizes, `${shot.file} ignores the ${MAXW}px container`).toContain(`(min-width: ${MAXW}px)`);
  });
});

describe("what the source cannot give us is recorded, not forgotten", () => {
  it("the hero is still a palette PNG, and the code says so", () => {
    // Not a failure — a fact with a shelf life. The palette is quantised to 256
    // colours, which on a black body means banding no downstream step can undo.
    // When a PNG-24 original arrives this assertion flips and names itself.
    const d = dims("mia-four-x4-hero-cutout.png");
    expect(d.palette, "the hero is no longer a palette PNG — update this test and drop the caveat").toBe(true);
    // SCOPED TO THE CAVEAT PARAGRAPH, not to the file. Searching the whole
    // component let a mutation gut the warning and still pass, because the word
    // "banding" also appears further down in the quality={90} rationale — a guard
    // satisfied by a sentence about something else. The caveat has to name the
    // CAUSE (a quantised palette) and the COST (banding) in one place; either
    // alone reads as trivia the next person deletes.
    const specs = read("components/Specs.tsx");
    const warn = specs.indexOf("⚠");
    expect(warn, "the palette caveat is gone from the call site").toBeGreaterThan(-1);
    const caveat = specs.slice(warn, warn + 400);
    expect(caveat, "the caveat no longer says the source is a quantised palette").toMatch(/PALETTE|palette/);
    expect(caveat, "the caveat no longer says what the palette costs").toContain("banding");
  });

  it("the paired engineering stage is one column on a phone", () => {
    // A 1000px detail shot beside a wide chassis frame on a 360px screen shows
    // neither; the pair only earns its place once there is room for it.
    expect(css).toContain(".eng-stage--pair{display:grid;grid-template-columns:1fr");
    expect(css).toMatch(/@media\(min-width:780px\)\{\.eng-stage--pair\{grid-template-columns:1\.15fr/);
  });
});
