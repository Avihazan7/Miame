// test/mobileTouchTargets.test.ts — every control a thumb can hit is big enough
// to hit, and the mobile bar never sits on top of the button it duplicates.
//
// Measured on a local production build at 390×844 (iPhone 14/15 logical size) on
// 2026-09-08, before any of this existed. Two defects, one of them a blocker:
//
//   • THE HERO'S PRIMARY CTA WAS UNREACHABLE AT REST. `.hero-v2-primary` painted
//     at y=785..837; the fixed `.sticky-cta` covers 768..844. The button the page
//     is built around was fully behind the bar from first paint. The Hero CSS
//     even carries a comment promising "the primary action is still in the first
//     view" — it was in the first view and under an opaque bar.
//   • 24 targets under 44×44 across seven routes, and eight of them under the
//     24×24 that WCAG 2.2 AA (2.5.8) treats as the floor: the "בית" crumb at
//     20×22, every footer link at 21–22, the eligibility links at 19.
//
// This file is a source gate, not a screenshot: it reads the declared sizes out
// of the three stylesheets and fails when one drops back under its tier. Two
// tiers, chosen by what a control IS rather than what it measures:
//   44px — reads as a button, or is the only control in its box (WCAG 2.5.5).
//   28px — a link in a row of links: crumbs, footer (2.5.8 asks 24; 28 leaves
//          room for the sub-pixel rounding that had these landing at 21–22).
// A link inside a sentence keeps its size: WCAG exempts it by name, and padding
// it would break the line it lives in.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ");

const globals = strip(read("app/globals.css"));
const ultra = strip(read("app/miame-ultra.css"));
const heroCss = strip(read("app/miame-hero-v2.css"));
const sticky = read("components/StickyCta.tsx");
const hero = read("components/Hero.tsx");

/** The body of the first rule whose selector list contains `selector` exactly. */
function rule(css: string, selector: string): string {
  const bodies: string[] = [];
  const rules = css.match(/[^{}]+\{[^{}]*\}/g) ?? [];
  for (const r of rules) {
    const [head, body] = [r.slice(0, r.indexOf("{")), r.slice(r.indexOf("{") + 1, -1)];
    if (head.split(",").some((s) => s.trim() === selector || s.trim().endsWith(" " + selector))) {
      bodies.push(body);
    }
  }
  expect(bodies.length, `no rule for ${selector}`).toBeGreaterThan(0);
  return bodies.join(";");
}

/** The largest declared value of `prop` (px) across every rule for `selector`. */
function px(css: string, selector: string, prop: string): number {
  const body = rule(css, selector);
  const found = [...body.matchAll(new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([\\d.]+)px`, "g"))]
    .map((m) => Number(m[1]));
  expect(found.length, `${selector} declares no ${prop}`).toBeGreaterThan(0);
  return Math.max(...found);
}

describe("a thumb can hit every control", () => {
  const BUTTON = 44;
  const LINK_ROW = 28;

  it("button-shaped controls clear 44px", () => {
    // .btn-sm is the header's WhatsApp and the launch strip's CTA — it measured
    // 42, two pixels under, on both.
    expect(px(ultra, ".btn-sm", "min-height")).toBeGreaterThanOrEqual(BUTTON);
    // the 360° arrows on the Hero stage measured 40×40
    expect(px(heroCss, ".hero-v2-turn-btn", "width")).toBeGreaterThanOrEqual(BUTTON);
    expect(px(heroCss, ".hero-v2-turn-btn", "height")).toBeGreaterThanOrEqual(BUTTON);
    // "תצוגת 3D" over the product stage measured 94×42
    expect(px(ultra, ".p360-btn", "min-height")).toBeGreaterThanOrEqual(BUTTON);
    // the brain's suggestion chips measured 39 tall
    expect(px(globals, ".chat3d-chip", "min-height")).toBeGreaterThanOrEqual(BUTTON);
    // the header logo is the one control in its corner — 124×40 measured
    expect(px(globals, ".brand", "min-height")).toBeGreaterThanOrEqual(BUTTON);
    // the lone back-link at the top of every legal page — 103×23 measured
    expect(px(globals, ".legal-back", "min-height")).toBeGreaterThanOrEqual(BUTTON);
  });

  it("rows of links clear the 24px AA floor with room to spare", () => {
    expect(px(globals, ".foot-links a", "min-height")).toBeGreaterThanOrEqual(LINK_ROW);
    expect(px(globals, ".seo-crumbs a", "min-height")).toBeGreaterThanOrEqual(LINK_ROW);
    // "בית" was 20px WIDE as well as short — one Hebrew word is not a target
    expect(px(globals, ".seo-crumbs a", "min-width")).toBeGreaterThanOrEqual(24);
    expect(px(globals, ".elig-link", "min-height")).toBeGreaterThanOrEqual(LINK_ROW);
    // the "further reading" list at the foot of every SEO page landed at exactly
    // 24 — passing, but with nothing left for a rounding error to eat
    expect(px(globals, ".seo-related a", "min-height")).toBeGreaterThanOrEqual(LINK_ROW);
    // the one link out of the tribute block, alone on its own line
    expect(px(globals, ".tribute-more a", "min-height")).toBeGreaterThanOrEqual(LINK_ROW);
  });

  it("a min-height only becomes a target if the box can grow to it", () => {
    // min-height on an inline box is ignored — these were all plain <a>.
    for (const sel of [".foot-links a", ".seo-crumbs a", ".elig-link", ".chat3d-chip",
                       ".seo-related a", ".tribute-more a"]) {
      expect(rule(globals, sel), `${sel} sets min-height on an inline box`).toMatch(
        /display\s*:\s*(inline-)?flex/,
      );
    }
  });

  it("the slider's box holds its thumb, and only where a thumb is used", () => {
    // The track is 9px, so the ELEMENT was 9px and the 28px thumb overflowed it.
    // Padding on the content box grows the target without moving a painted pixel;
    // it is scoped to pointer:coarse because a mouse does not need the room.
    const coarse = globals.match(/@media\(pointer:coarse\)\{([\s\S]*?)\}\}/);
    expect(coarse, "no coarse-pointer block for .rng").toBeTruthy();
    expect(coarse![1]).toContain(".rng");
    expect(coarse![1]).toMatch(/box-sizing\s*:\s*content-box/);
    expect(coarse![1]).toMatch(/background-clip\s*:\s*content-box/);
    const pad = Number(coarse![1].match(/padding-block\s*:\s*([\d.]+)px/)![1]);
    expect(px(ultra, ".rng", "height") + pad * 2).toBeGreaterThanOrEqual(BUTTON);
  });

  it("no interactive text is set below 12px", () => {
    // the consent line under the simulator carried a live link at 11.5px
    expect(px(globals, ".lead-consent", "font-size")).toBeGreaterThanOrEqual(12);
  });
});

describe("the mobile bar waits for the Hero to finish", () => {
  it("the Hero's action row is addressable, by id", () => {
    expect(hero).toMatch(/className="hero-v2-actions" id="hero-cta"/);
  });

  it("StickyCta hides itself while that row is on screen", () => {
    expect(sticky).toContain('document.getElementById("hero-cta")');
    expect(sticky).toContain("new IntersectionObserver");
    expect(sticky).toMatch(/setHidden\(entry\.isIntersecting\)/);
    // hidden is the FIRST state: it is what scroll 0 looks like, so the server
    // HTML and the first client paint agree and the bar never flashes over the
    // Hero CTA before the observer's first callback lands.
    expect(sticky).toMatch(/useState\(true\)/);
    expect(sticky).toMatch(/data-hidden=\{hidden \? "true" : undefined\}/);
  });

  it("a page with no Hero, or no observer, still gets the bar", () => {
    expect(sticky).toMatch(/if \(!heroCta \|\| typeof IntersectionObserver !== "function"\) \{\s*setHidden\(false\);/);
  });

  it("hiding it takes it out of the tab order, and it slides rather than vanishes", () => {
    const hidden = rule(globals, '.sticky-cta[data-hidden="true"]');
    expect(hidden).toMatch(/visibility\s*:\s*hidden/);
    expect(hidden).toMatch(/pointer-events\s*:\s*none/);
    expect(hidden).toMatch(/transform\s*:\s*translateY/);
    // display:none would make the return a jump-cut and kill the transition
    expect(hidden).not.toMatch(/display\s*:\s*none/);
    // the visibility flip is delayed to the end of the slide, or there is no slide
    expect(hidden).toMatch(/visibility\s+0s\s+linear\s+\.28s/);
  });

  it("the slide is off for a visitor who asked for no motion", () => {
    const reduce = globals.match(/@media\(prefers-reduced-motion:reduce\)\{([^}]*\.sticky-cta[^}]*)\}/);
    expect(reduce, "the bar's transition is not covered by reduced motion").toBeTruthy();
    expect(reduce![1]).toMatch(/transition\s*:\s*none/);
  });
});
