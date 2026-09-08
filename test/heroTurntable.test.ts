// test/heroTurntable.test.ts — the six-angle turntable, held to what a visual
// review cannot see.
//
// The owner supplied six 3840×3840 renders (2026-09-08), sixty degrees apart —
// the only genuine 3D source the repo has. They became six 1800×1994 frames cut
// with ONE crop from the shared canvas (lib/turntable.ts records the one
// exception: frame 1 was rescaled to its mirror twin). The Hero crossfades them
// in yaw order: an idle spin, a drag, or the arrow keys.
//
// Four ways this quietly breaks:
// 1. A FRAME THAT DOES NOT MATCH THE BOX. Every frame is an absolute twin of the
//    base image; one exported at a different size stretches, and the crossfade
//    "breathes". Each file's header is held to TURNTABLE_W × TURNTABLE_H.
// 2. THE OTHER FIVE COMPETING WITH THE LCP. They must mount only after the hero
//    frame has landed and the browser is idle, at low fetch priority, and never
//    as priority images.
// 3. A CROSSFADE THAT GHOSTS. Two half-transparent overlays over the base show
//    the hero angle through both. The outgoing frame must stay opaque until the
//    incoming one is fully in, then drop in zero time.
// 4. A SPIN NOBODY ASKED FOR. The idle spin needs the stage on screen, no drag
//    in progress, a rest after the visitor's own turn — and it never runs for
//    reduced motion. A visitor's own turn still turns, as a cut.
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { intrinsicSize } from "./helpers/intrinsicSize";
import {
  TURNTABLE_FRAMES,
  TURNTABLE_H,
  TURNTABLE_IDLE_MS,
  TURNTABLE_REST_AFTER_INPUT_MS,
  TURNTABLE_STEP_PX,
  TURNTABLE_W,
  wrapFrame,
} from "../lib/turntable";

const read = (p: string) => readFileSync(p, "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ");
const hero = strip(read("app/miame-hero-v2.css"));
const tsx = read("components/Hero.tsx");
const code = tsx.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const RULES = [...hero.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const);
function rule(sel: string): string {
  const hit = RULES.find(([s]) => s === sel);
  if (!hit) throw new Error(`rule not found: ${sel}`);
  return hit[1];
}

describe("the manifest is the ring it claims to be", () => {
  it("has six angles on the sixty-degree lattice, in yaw order, hero angle first", () => {
    expect(TURNTABLE_FRAMES.length).toBe(6);
    for (let i = 0; i < TURNTABLE_FRAMES.length; i++) {
      expect(TURNTABLE_FRAMES[i].yaw).toBe(30 + 60 * i);
      expect(TURNTABLE_FRAMES[i].src).toBe(`/mia-four-360-${i + 1}.webp`);
      expect(TURNTABLE_FRAMES[i].label.length).toBeGreaterThan(2);
    }
  });

  it("wraps both ways", () => {
    expect(wrapFrame(6)).toBe(0);
    expect(wrapFrame(-1)).toBe(5);
    expect(wrapFrame(3)).toBe(3);
  });

  it.each(TURNTABLE_FRAMES.map((f) => [f.src] as const))("%s exists and is exactly the frame box on disk", (src) => {
    const path = `public${src}`;
    expect(existsSync(path), `${src} is not in public/`).toBe(true);
    const real = intrinsicSize(path);
    expect(real, `${src} is not a readable WebP/PNG/JPEG`).toBeTruthy();
    expect({ w: real!.width, h: real!.height }).toEqual({ w: TURNTABLE_W, h: TURNTABLE_H });
  });

  it("keeps the 4K originals losslessly, one per angle, per the optimize-images convention", () => {
    for (let i = 1; i <= 6; i++) {
      const hits = [1].filter(() => ["front-right", "side-right", "rear-right", "rear-left", "side-left", "front-left"]
        .some((n) => existsSync(`assets-archive/mia-four-360-src-${i}-${n}.webp`)));
      expect(hits.length, `no archived original for frame ${i}`).toBe(1);
    }
  });

  it("the pacing constants are what the comments say", () => {
    expect(TURNTABLE_IDLE_MS).toBeGreaterThanOrEqual(1500);
    expect(TURNTABLE_REST_AFTER_INPUT_MS).toBeGreaterThanOrEqual(3000);
    expect(TURNTABLE_STEP_PX).toBeGreaterThanOrEqual(40);
  });
});

describe("the base image is the hero angle, and the only priority image", () => {
  const base = tsx.match(/<Image\b[\s\S]*?className="hero-v2-product-img"[\s\S]*?\/>/)?.[0] ?? "";

  it("declares the manifest's first frame and the frame box", () => {
    expect(base).toContain(`src="${TURNTABLE_FRAMES[0].src}"`);
    expect(base).toContain(`width={${TURNTABLE_W}}`);
    expect(base).toContain(`height={${TURNTABLE_H}}`);
    expect(base).toMatch(/\bpriority\b/);
    expect(base).toContain('fetchPriority="high"');
  });

  it("the other angles mount only after the LCP, at low priority, hidden from assistive tech", () => {
    expect(code).toMatch(/\{spin && TURNTABLE_FRAMES\.map\(/);
    const overlay = tsx.match(/\{spin && TURNTABLE_FRAMES\.map\([\s\S]*?\/>\s*\)\)\}/)?.[0] ?? "";
    expect(overlay).not.toBe("");
    expect(overlay).not.toMatch(/\bpriority\b/);
    expect(overlay).toContain('fetchPriority="low"');
    expect(overlay).toContain('alt=""');
    expect(overlay).toContain('aria-hidden="true"');
    expect(overlay).toContain("width={TURNTABLE_W}");
    expect(overlay).toContain("height={TURNTABLE_H}");
    expect(overlay).toContain('className="hero-v2-frame"');
    // and the switch is armed from the base image's load, on idle — never eagerly
    const arm = code.slice(code.indexOf("const arm = "), code.indexOf("}, []);", code.indexOf("const arm = ")));
    expect(arm).toContain("requestIdleCallback");
    expect(code).toMatch(/img\.addEventListener\("load", arm/);
  });

  it("a frame is only stepped onto once its bytes have arrived", () => {
    expect(code).toMatch(/onLoad=\{\(\) => \{ loaded\.current\.add\(i\); \}\}/);
    expect(code).toMatch(/return loaded\.current\.has\(n\) \? n : f;/);
  });
});

describe("the crossfade cannot ghost", () => {
  it("frames are absolute twins of the base box, invisible by default", () => {
    const f = rule(".hero-v2-frame");
    expect(f).toMatch(/position:\s*absolute/);
    expect(f).toMatch(/inset:\s*0/);
    expect(f).toMatch(/width:\s*100%/);
    expect(f).toMatch(/opacity:\s*0\s*;/);
    expect(f).toMatch(/pointer-events:\s*none/);
    expect(f, "the frame overlays must not animate on their own").not.toContain("animation");
  });

  it("the outgoing frame holds until the incoming one is fully in, then drops in zero time", () => {
    const off = rule(".hero-v2-frame").match(/transition:\s*opacity\s+0s\s+linear\s+([\d.]+)s/);
    const on = rule('.hero-v2-frame[data-active="true"]').match(/transition:\s*opacity\s+([\d.]+)s\s+ease/);
    expect(off, "the off transition is not a delayed cut").toBeTruthy();
    expect(on, "the on transition is not a fade").toBeTruthy();
    expect(Number(off![1])).toBe(Number(on![1]));
    expect(rule('.hero-v2-frame[data-active="true"]')).toMatch(/opacity:\s*1/);
  });

  it("the base image never changes opacity — the LCP stays a plain box", () => {
    expect(rule(".hero-v2-product-img")).not.toMatch(/opacity|transition/);
  });

  it("the base leaves the stage while another angle shows — with the fade's own delay, by visibility", () => {
    // The frames are cut-outs. An opaque base under a different angle shows
    // through that angle's transparent pixels: measured live on 2026-09-08 as two
    // vehicles at once. So the base hides — by visibility, never opacity, it is
    // the LCP — exactly when the incoming frame has finished fading in.
    const covered = rule('.hero-v2-product-img[data-covered="true"]');
    expect(covered).toMatch(/visibility:\s*hidden/);
    const delay = covered.match(/transition:\s*visibility\s+0s\s+linear\s+([\d.]+)s/)?.[1];
    const fade = rule('.hero-v2-frame[data-active="true"]').match(/transition:\s*opacity\s+([\d.]+)s/)?.[1];
    expect(delay, "the base has no delayed visibility transition").toBeTruthy();
    expect(Number(delay)).toBe(Number(fade));
    expect(covered).not.toMatch(/opacity/);
    expect(tsx).toMatch(/data-covered=\{frame !== 0 \? "true" : undefined\}/);
  });

  it("reduced motion turns the fade into a cut", () => {
    const reduce = hero.slice(hero.lastIndexOf("prefers-reduced-motion: reduce"));
    expect(reduce).toMatch(/\.hero-v2-frame\s*\{\s*transition:\s*none/);
  });
});

describe("who turns it, and when", () => {
  it("the idle spin needs the stage on screen, no drag, a rest after input, and no reduced motion", () => {
    const spinEffect = code.slice(code.indexOf("new IntersectionObserver"), code.indexOf("}, [spin, step]);"));
    expect(spinEffect).toContain("TURNTABLE_IDLE_MS");
    expect(spinEffect).toMatch(/if \(!onScreen \|\| document\.hidden\) return;/);
    expect(spinEffect).toMatch(/is-dragging/);
    expect(spinEffect).toContain("TURNTABLE_REST_AFTER_INPUT_MS");
    const gate = code.indexOf('matchMedia("(prefers-reduced-motion: reduce)").matches) return;', code.indexOf("if (!el || !spin) return;"));
    expect(gate, "the idle spin has no reduced-motion gate").toBeGreaterThan(0);
    expect(gate).toBeLessThan(code.indexOf("new IntersectionObserver"));
  });

  it("a drag turns it, with pointer capture, and the page keeps vertical panning", () => {
    expect(code).toContain("setPointerCapture(e.pointerId)");
    expect(code).toContain("releasePointerCapture(e.pointerId)");
    expect(code).toContain("TURNTABLE_STEP_PX");
    expect(rule(".hero-v2-product-stage")).toMatch(/touch-action:\s*pan-y/);
    expect(rule(".hero-v2-product-stage")).toMatch(/user-select:\s*none/);
    expect(hero).toMatch(/\.hero-v2-product-stage\[data-spin\]\s*\{\s*cursor:\s*grab/);
    expect(hero).toMatch(/\.hero-v2-product-stage\[data-spin\]\.is-dragging\s*\{\s*cursor:\s*grabbing/);
    // native image drag would hijack the gesture
    expect((tsx.match(/draggable=\{false\}/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("the overlays fetch for the same slot as the base image", () => {
    const literal = tsx.match(/className="hero-v2-product-img"[\s\S]{0,400}/) ? tsx.match(/sizes="([^"]+)"\s*\n\s*draggable=\{false\}\s*\n\s*className="hero-v2-product-img"/)?.[1] : undefined;
    const constant = tsx.match(/const HERO_SIZES = "([^"]+)"/)?.[1];
    expect(literal, "the base image no longer declares sizes literally").toBeTruthy();
    expect(constant).toBe(literal);
    expect(tsx.match(/sizes=\{HERO_SIZES\}/g)?.length).toBe(1);
  });

  it("has visible handles that appear with the frames and never start a drag", () => {
    expect(tsx).toMatch(/<div className="hero-v2-turn" hidden=\{!spin\}>/);
    expect(tsx).toContain('aria-label="זווית קודמת"');
    expect(tsx).toContain('aria-label="זווית הבאה"');
    expect(tsx).toMatch(/aria-live="polite">\{showing\.label\}/);
    expect(code).toContain('closest("button")) return;');
    expect(code).toContain('e.key === "Home"');
    expect(code).toContain('e.key === "End"');
  });

  it("the keyboard turns it, and the stage says which angle is showing", () => {
    expect(code).toContain('e.key === "ArrowRight"');
    expect(code).toContain('e.key === "ArrowLeft"');
    expect(tsx).toMatch(/role="group"/);
    expect(tsx).toMatch(/tabIndex=\{0\}/);
    expect(tsx).toMatch(/aria-label=\{`מיה פור בסיבוב 360°, \$\{showing\.label\}/);
    expect(hero).toMatch(/\.hero-v2-product-stage:focus-visible\s*\{\s*outline:\s*3px solid var\(--hero-accent\)/);
  });

  it("the specular mask follows the showing angle, still from a loaded <img>'s own URL", () => {
    const follow = code.slice(code.indexOf("The mask follows the angle") >= 0 ? code.indexOf("The mask follows the angle") : code.indexOf("}, [frame]);") - 600, code.indexOf("}, [frame]);"));
    expect(follow).toContain("img.hero-v2-frame");
    expect(follow).toMatch(/currentSrc/);
    expect(follow).toMatch(/img\.complete/);
    expect(follow).toContain('"--product-src"');
  });
});
