// test/heroLight.test.ts — the Hero stands on the page's white ground, lit by the
// room, and every colour on it is MEASURED rather than remembered.
//
// V3 of the Hero (2026-07) was a dark gate with a private palette — eight hex
// values authored in app/miame-hero-v2.css against styles/tokens.miame.css's own
// first rule — and its header said "WCAG-measured": a sentence, not a
// measurement anyone could re-run. When the owner asked on 2026-09-08 for the
// launch strip's white ground carrying the adaptive ambient light, every text
// colour had to be re-chosen, and this file is where each choice is checked: it
// resolves the tokens the Hero speaks in through the token file and computes the
// WCAG 2.1 contrast against the ground they actually sit on. A token edit that
// dims --ink-muted below 4.5:1 fails HERE, by number, not in a screenshot review.
//
// Three things it holds:
// 1. GROUND. The section paints white and carries none of V3's dark hex; the
//    room's two hue variables are what tint it, so the Hero and the page can
//    never disagree about the current light.
// 2. CONTRAST. Text tokens ≥ 4.5:1 on white; the one gradient headline stop ≥ 3:1
//    (40–74px at weight 900 is large text); the lime CTA and the mint chip ≥ 4.5:1.
// 3. STAGE. The 3D presentation is inert by default — tilt vars at 0, sheen at
//    opacity 0 — written only for a fine pointer without reduced motion, and the
//    priority image's `sizes` ceiling is DERIVED from --maxw and the grid.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ");

const HERO_CSS = read("app/miame-hero-v2.css");
const hero = strip(HERO_CSS);
const tokens = strip(read("styles/tokens.miame.css"));
const globals = strip(read("app/globals.css"));
const ultra = strip(read("app/miame-ultra.css"));
const tsx = read("components/Hero.tsx");

// ── WCAG 2.1 · relative luminance and contrast, from the definition ─────────
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [16, 8, 0]
    .map((s) => ((n >> s) & 255) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const WHITE = "#FFFFFF";

/** `--name: <value>` from a stylesheet — the first declaration of that name. */
function token(css: string, name: string): string {
  const m = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  expect(m, `${name} is not declared`).toBeTruthy();
  return m![1].trim();
}
/** Resolve `var(--x)` chains to a hex through the token file. */
function hexOf(value: string): string {
  let v = value;
  for (let i = 0; i < 6 && /^var\(/.test(v); i++) v = token(tokens, v.slice(4, -1));
  expect(v, `${value} does not resolve to a hex through styles/tokens.miame.css`).toMatch(/^#[0-9a-f]{6}$/i);
  return v.toUpperCase();
}
/** The declaration body of the FIRST rule whose selector list is exactly `sel`. */
function rule(sel: string): string {
  for (const m of hero.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].trim() === sel) return m[2];
  }
  throw new Error(`rule not found: ${sel}`);
}

describe("ground — white, and lit by the room", () => {
  const section = rule(".hero-v2");

  it("paints the ground white and says so in one token", () => {
    expect(token(hero, "--hero-ground")).toBe("#FFFFFF");
    expect(section).toContain("var(--hero-ground)");
  });

  it("carries none of V3's dark palette, anywhere in the sheet", () => {
    for (const dark of ["#03151B", "#071F2F", "#020B10", "#B9C8D4", "#8FA6B5"]) {
      expect(hero.toUpperCase(), `${dark} is the dark gate, and it is back`).not.toContain(dark);
    }
  });

  it.each([
    [".hero-v2", "the ground's own light pools"],
    [".hero-v2-energy-a", "the first energy field"],
    [".hero-v2-energy-b", "the second energy field"],
    [".hero-v2-orbit", "the orbit rings"],
    [".hero-v2-sheen", "the near-field sheen"],
    [".hero-v2-ground::after", "the crystalline floor-line"],
    [".hero-v2-product", "the product's rim glow"],
    [".hero-v2-secondary:hover", "the secondary button's hover"],
  ])("%s is drawn from the ambient hue (%s)", (sel) => {
    const d = rule(sel);
    const lit = /hsla\(var\(--amb-hue-[ab]\)/.test(d) || /var\(--hero-rim(?:-strong)?\)/.test(d) || d.includes("var(--glow-room)");
    expect(lit, `${sel} is not lit by --amb-hue-a/--amb-hue-b`).toBe(true);
  });

  it("the rim tokens themselves are the room's hue, so the indirection cannot hide a fixed colour", () => {
    expect(token(hero, "--hero-rim")).toContain("hsla(var(--amb-hue-a)");
    expect(token(hero, "--hero-rim-strong")).toContain("hsla(var(--amb-hue-a)");
  });

  it("keeps none of V3's fixed cyan / blue accents", () => {
    // rgba(40,199,232) was --hero-cyan, rgba(74,168,255) was --hero-blue.
    expect(hero.replace(/\s+/g, "")).not.toMatch(/rgba\(40,199,232|rgba\(74,168,255/);
  });

  it("dims with the room at night: the pools are scaled by --amb-intensity", () => {
    expect(section).toContain("var(--amb-intensity)");
    expect(rule(".hero-v2-energy")).toContain("var(--amb-intensity)");
  });

  it("left the antialiased dark-panel list in miame-ultra.css", () => {
    // That list thins every stroke for dark panels; on a white ground it reads
    // as soft type. The Hero was in it while it was dark.
    const list = ultra.match(/([^{}]*)\{[^{}]*-webkit-font-smoothing\s*:\s*antialiased[^{}]*\}/g) ?? [];
    for (const l of list) expect(l, "the Hero is still antialiased like a dark panel").not.toContain(".hero-v2");
  });
});

describe("contrast — computed against the white ground", () => {
  const ink = hexOf(token(hero, "--hero-ink"));
  const accent = hexOf(token(hero, "--hero-accent"));
  const muted = hexOf(token(hero, "--hero-muted"));

  it("the three text tokens resolve through the token file, not to local hex", () => {
    for (const name of ["--hero-ink", "--hero-accent", "--hero-muted"]) {
      expect(token(hero, name), `${name} authors a colour instead of naming a token`).toMatch(/^var\(--ink-/);
    }
  });

  it.each([
    ["--hero-ink (headline, finance, power chip)", ink],
    ["--hero-accent (eyebrow, naming line, secondary CTA)", accent],
    ["--hero-muted (sub, trust, legal, scroll cue)", muted],
  ])("%s reads at ≥ 4.5:1 on white", (_label, hex) => {
    expect(contrast(hex, WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("the H1 is ink on white, at the one scale the sheet declares", () => {
    // The gradient poetry line was struck on 2026-09-08; what is left is the
    // naming line, and it is plain ink — so its contrast is the --hero-ink pair
    // measured above (18.3:1), with nothing clipped to a background.
    const title = rule(".hero-v2-title");
    expect(title).toContain("color: var(--hero-ink)");
    expect(title, "the H1 clips text to a gradient again").not.toContain("background-clip");
    expect(title).toMatch(/font-size:\s*clamp\(/);
    expect(contrast(ink, WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("the lime CTA and the mint chip keep their ink legible", () => {
    const inkOnEnergy = hexOf(token(tokens, "--mint-zero-ink"));
    const primary = rule(".hero-v2-primary");
    expect(primary).toContain("var(--mint-zero-ink)");
    const limeMid = primary.match(/(#[0-9A-F]{6}) 48%/i)?.[1];
    expect(limeMid, "the lime gradient's mid stop is not where this test expects it").toBeTruthy();
    expect(contrast(inkOnEnergy, limeMid!)).toBeGreaterThanOrEqual(4.5);
    const chip = rule(".hero-v2-free-chip");
    expect(chip).toContain("var(--mint-zero-ink)");
    expect(chip).toContain("var(--mint-zero)");
    expect(contrast(inkOnEnergy, hexOf("var(--mint-zero)"))).toBeGreaterThanOrEqual(4.5);
  });

  it("no dark-only token is used as text on the light ground", () => {
    // --glow-teal is "dark only" by the token file's own note (11:1 on Abyss,
    // ~1.6:1 on white). It must not be a text colour here.
    expect(hero).not.toMatch(/color:\s*var\(--glow-teal\)/);
    expect(hero).not.toMatch(/color:\s*var\(--cyan\)/);
  });
});

describe("stage — 3D that is inert by default and honest about its gates", () => {
  it("the tilt and sheen variables start at rest on the stage", () => {
    const stage = rule(".hero-v2-product-stage");
    expect(stage).toMatch(/--tilt-x:\s*0deg/);
    expect(stage).toMatch(/--tilt-y:\s*0deg/);
    expect(stage).toMatch(/--sheen:\s*0\b/);
    expect(rule(".hero-v2-sheen")).toMatch(/opacity:\s*var\(--sheen,\s*0\)/);
  });

  it("the product's transform reads those variables — a variable nobody reads is a listener doing nothing", () => {
    const product = rule(".hero-v2-product");
    expect(product).toContain("rotateY(var(--tilt-x))");
    expect(product).toContain("rotateX(var(--tilt-y))");
    expect(product, "perspective belongs in the transform; the stage stays a flat, cheap context").toContain("perspective(");
  });

  it("Hero.tsx writes the tilt only for a fine pointer without reduced motion", () => {
    const code = tsx.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(code).toContain('matchMedia("(pointer: fine)")');
    expect(code).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(code).toMatch(/if \(!fine \|\| reduce\) return;/);
    for (const v of ["--tilt-x", "--tilt-y", "--sheen-x", "--sheen-y", "--sheen"]) {
      expect(code, `${v} is read by the stylesheet and never written`).toContain(`"${v}"`);
    }
    // Written on the STAGE element, never on <html>: --mx/--my belong to AmbientLight.
    expect(code).not.toMatch(/documentElement\.style\.setProperty/);
    // Leaving the stage puts it back to rest — otherwise the last tilt is frozen.
    expect(code).toMatch(/"pointerleave"/);
  });

  it("reduced motion stops the product, the turn and the sheen", () => {
    const reduce = hero.slice(hero.lastIndexOf("prefers-reduced-motion: reduce"));
    // WAS: /\.hero-v2-product\s*\{\s*transform:\s*none/ — a literal match on the
    // implementation rather than on the rule. The rule is "no tilt, no turn, no
    // parallax", and `transform: none` happened to express it until the product
    // gained a magnification (--zoom-hero, app/globals.css). `none` would have
    // dropped that too, so a visitor who asked for less motion would have been
    // served a SMALLER vehicle than everyone else: a size is not a motion, and
    // reduced-motion is not reduced-product.
    //
    // This asserts the intent instead, and is STRICTER than the string it
    // replaces: whatever the declaration is, it may not contain a rotation, a
    // perspective, a translation or a skew. A future edit that reintroduces the
    // tilt fails here — and so does one that expresses the tilt some other way,
    // which the literal would have waved through.
    const productReduced = reduce.match(/\.hero-v2-product\s*\{\s*transform:\s*([^;}]+)/)?.[1] ?? "";
    expect(productReduced, "reduced motion leaves .hero-v2-product with no transform rule").not.toBe("");
    expect(
      productReduced,
      `reduced motion still applies a motion transform: "${productReduced}". Only a ` +
        `static scale belongs here — rotate/perspective/translate/skew ARE the tilt, ` +
        `the turn and the parallax this block exists to switch off.`,
    ).not.toMatch(/rotate|perspective|translate|skew|matrix/);
    expect(reduce).toMatch(/\.hero-v2-sheen\s*\{\s*display:\s*none/);
    expect(reduce).toContain(".hero-v2-product { animation: none");
  });

  // Added 2026-09-09 on the owner's call — "give the vehicle light, a little
  // around the wheels". The trap this guards is the one the layer map warns
  // about: a light that is NOT masked stops being light ON the product and
  // becomes a glow BEHIND it, which is the contact shadow's job and reads as
  // fog. And a light that animates puts a second continuously-composited layer
  // on the element holding the LCP — the exact cost the yaw gate just removed.
  it("the wheel light falls on the product, adds light, and never moves", () => {
    const ul = rule(".hero-v2-underlight");
    // masked to the silhouette by the same URL the <img> already loaded
    expect(ul).toMatch(/mask-image:\s*var\(--product-src, none\)/);
    // screen adds light; multiply would darken, which is the shadow's job
    expect(ul).toContain("mix-blend-mode: screen");
    // static — no animation, no transform, nothing the compositor re-rasterises
    expect(ul).not.toMatch(/animation\s*:/);
    expect(ul).not.toMatch(/transform\s*:/);
    // EVERY colour comes from the room, like every other highlight on this stage.
    // Not "at least one" — the first version of this assertion only checked that
    // the room's hue appeared somewhere, and a mutation that hard-coded one of
    // the three gradients to rgba(120,220,255,.34) sailed through it. So: count
    // the colour stops, and require that every one of them is a room variable.
    const stops = [...ul.matchAll(/\b(?:rgba?|hsla?)\(/g)].length;
    const roomStops = [...ul.matchAll(/hsla\(var\(--amb-hue-[ab]\)/g)].length;
    expect(stops, "the wheel light declares no colour at all").toBeGreaterThanOrEqual(3);
    expect(roomStops, `${stops - roomStops} colour stop(s) in .hero-v2-underlight are not the room's light`).toBe(stops);
    expect(ul).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    // it may not paint before Hero.tsx has written the mask, or it would flash
    // as a full rectangle over the stage
    expect(hero).toContain('.hero-v2-product-stage[data-material="ready"] .hero-v2-underlight { opacity: 1; }');
    expect(ul).toMatch(/opacity:\s*0/);
    // and it is gone where masks are not supported, exactly like the gloss
    expect(hero).toMatch(/@supports not \(\(mask-image: none\) or \(-webkit-mask-image: none\)\) \{\s*\.hero-v2-underlight \{ display: none; \}/);
    // it is inside the product node, before the gloss
    expect(tsx.indexOf('className="hero-v2-underlight"')).toBeGreaterThan(0);
    expect(tsx.indexOf('className="hero-v2-underlight"')).toBeLessThan(tsx.indexOf('className="hero-v2-gloss"'));
  });

  it("the idle turn exists only where there is no pointer to follow, and only until the real one can run", () => {
    const hoverNone = hero.slice(hero.indexOf("@media (hover: none)"));
    expect(hoverNone).toContain(".hero-v2-product { animation: hero-yaw");
    // and not outside it: on a fine pointer the tilt owns the transform.
    expect(rule(".hero-v2-product")).not.toContain("animation:");
    // THE GATE. A continuously-animated fractional rotateY makes the compositor
    // resample the layer holding the LCP on every frame, forever: measured
    // 2026-09-08 at 390×844 DPR3 over three alternating repeats (within-group
    // spread 0.3%), turning it off raised the product's mean gradient magnitude
    // 16.104 → 19.452 (+20.8%) and its p99 edge contrast 127.4 → 179.1 (+40.6%).
    // The stage does the same thing for real once its six angles have loaded, so
    // the fake yaw may only cover the window BEFORE that — hence the
    // :not([data-spin]) qualifier, which Hero.tsx sets when the turntable arms.
    expect(hoverNone).toContain(".hero-v2-product-stage:not([data-spin]) .hero-v2-product { animation: hero-yaw");
  });
});

describe("the priority image fetches for the slot the grid gives it", () => {
  const maxw = Number(globals.match(/--maxw:(\d+)px/)?.[1]);
  const tag = tsx.match(/<Image\b[\s\S]*?\/>/)?.[0] ?? "";

  it("the container cap and the grid are where this test thinks they are", () => {
    expect(maxw).toBe(1120);
    const grid = rule(".hero-v2-grid");
    expect(grid).toContain("grid-template-columns: minmax(0, 1fr) minmax(380px, 1.04fr)");
    expect(grid).toContain("gap: clamp(34px, 5vw, 82px)");
  });

  it("the sizes ceiling is the visual column at the container cap, derived — not typed", () => {
    // .wrap pads 22px each side; at the 1120px cap the gap clamp resolves to 5vw
    // = 56px; the visual column takes 1.04 of 2.04 shares of what is left.
    const content = maxw - 44;
    const gap = Math.min(82, Math.max(34, 0.05 * maxw));
    const ceiling = Math.floor(((content - gap) * 1.04) / 2.04);
    expect(ceiling).toBe(520);
    expect(tag).toMatch(new RegExp(`sizes="[^"]*,\\s*${ceiling}px"`));
    // and the two-column band is not under-declared (48vw covers the 46.4vw peak).
    expect(tag).toContain("(max-width: 1120px) 48vw");
  });

  // Added 2026-09-08. On a phone the product box was capped BELOW the stage that
  // holds it — 300px inside 354px — so the browser downscaled the rendition it had
  // already fetched: 1080 real pixels squeezed into 900 device pixels, a 1.20
  // ratio, which the encode measurements showed is where ~29% of the source's edge
  // energy goes. Filling the stage instead puts 1080 onto 1062 (ratio 1.02): the
  // same bytes, no resampling, and a vehicle 18% larger. So the cap is DERIVED
  // from the stage's own width, never typed — if .wrap's padding changes, this
  // moves with it or fails.
  it("the product fills the box the stage gives it, so the fetched rendition is not downscaled", () => {
    const pad = ultra.match(/\.wrap\{[^}]*padding-inline:\s*clamp\((\d+)px/)?.[1];
    expect(pad, ".wrap's padding-inline clamp is not where this test thinks it is").toBeTruthy();
    // 390px is the reference phone the Hero's mobile branch is measured on; at that
    // width 4vw = 15.6px, so the clamp floor wins on both sides.
    const stage = 390 - 2 * Number(pad);
    expect(stage).toBe(354);
    const mobile = hero.slice(hero.indexOf("@media (max-width: 900px)"));
    const cap = Number(mobile.match(/\.hero-v2-body\s*\{\s*width:\s*min\(100%,\s*(\d+)px\)/)?.[1]);
    expect(cap, ".hero-v2-body declares no mobile width cap").toBeTruthy();
    expect(cap, `the product is capped at ${cap}px inside a ${stage}px stage — the browser ` +
      "will downscale the rendition it already paid for").toBeGreaterThanOrEqual(stage);
  });

  it("is the LCP: priority, high fetch priority, and a quality that keeps the cut-out's edge", () => {
    expect(tag).toMatch(/\bpriority\b/);
    expect(tag).toContain('fetchPriority="high"');
    const q = Number(tag.match(/quality=\{(\d+)\}/)?.[1]);
    // A RATCHET: this floor only ever climbs. Raised 85 -> 92 on 2026-09-09,
    // after measuring the AVIF ladder on ALL SIX frames at w=1080, each against
    // its own source in CIELAB, counting pixels with a visible colour shift
    // (delta-chroma > 2). The LCP is a cut-out against white, which is exactly
    // where AVIF fringes.
    //
    // Measured TWICE that day, because the Next 15 upgrade landed between them
    // and the encoder is not the same one:
    //   next@14.2.35 — q90 2.17% / 79.9 KB · q92 1.76% / 84.4 KB · q95 1.83% ·
    //                  q98 1.65% · q100 1.70%.  q92 was the knee.
    //   next@15.5.25 — q90 0.64% / 41.6 KB · q92 0.66% / 43.5 KB · q95 0.62% ·
    //                  q98 0.59% · q100 0.56%.
    // Next 15 re-tuned its AVIF encoder: at the SAME quality number it ships
    // roughly half the bytes AND a third of the colour error. The first read of
    // that (bytes fell 47%) looked like a silent quality cut and was wrong --
    // measuring it is what showed the curve had moved down, not the quality.
    // The practical consequence: on 15 the knob barely matters (q90 -> q100 buys
    // 0.64% -> 0.56%), so 92 is kept because a ratchet does not descend, not
    // because the extra 1.9 KB is doing work.
    expect(q, "quality is unset — the default 75 rings on the product's edges").toBeGreaterThanOrEqual(92);
  });
});
