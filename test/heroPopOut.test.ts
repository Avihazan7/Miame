// test/heroPopOut.test.ts — the threshold stage: MIA FOUR "coming out of the
// screen" from ONE still, held to the five ways such a stage quietly goes wrong.
//
// The owner asked (2026-09-08) for a 3D motion simulation in the Wax Nano Cristal
// finish, "as if it wants to come out of the screen". There is no 3D model — the
// committed GLB is a procedural placeholder that is not served — so the illusion
// is built from a pane the product overlaps (occlusion), parallax at three depths,
// a shadow that detaches on lift, and an entrance where product and pane cross.
// Every one of those can be broken by an edit that looks harmless and passes a
// visual review:
//
// 1. A SECOND FETCH. The specular sweep is masked to the product's silhouette. The
//    lazy way is url(/mia-four-x6-studio.webp) in the stylesheet — the raw 235KB
//    file, downloaded again next to the ~90KB rendition the <img> already has, on
//    the LCP of the strongest page. The mask must be the URL the <img> loaded,
//    read back at runtime. The sheet may not contain url() at all.
// 2. TOUCHING THE LCP. The <img> must stay a plain in-flow box: no opacity (Chrome
//    defers LCP for opacity:0), no transform, filter, mask or animation of its own.
//    Motion belongs to ancestors and siblings.
// 3. LAYOUT IN KEYFRAMES. One `top:` or `width:` in a keyframe and the stage
//    reflows sixty times a second. Every keyframe in the sheet is transform /
//    opacity only — checked for ALL of them, the older ones included.
// 4. AN ENTRANCE THAT IS NOT GATED. The site's intro gate (app/layout.tsx) sets
//    html.intro-full/-quick before first paint and never under reduced motion;
//    HeroIntro retires it at 4.6s. An entrance outside that selector runs for
//    no-JS and reduced-motion visitors alike, and one whose last frame is not the
//    resting value snaps when the class goes.
// 5. REDUCED MOTION THAT IS PARTIAL. New layers, new animations, new transitions —
//    each must be named in the reduce block, and Hero.tsx must return before it
//    writes a mask or subscribes to the model bus.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ");

const HERO_CSS = read("app/miame-hero-v2.css");
const hero = strip(HERO_CSS);
const tsx = read("components/Hero.tsx");
const code = tsx.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const layout = read("app/layout.tsx");

/** All rules as [selector, body], including those nested in @media / @supports. */
const RULES = [...hero.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const);
/** The declaration body of the FIRST rule whose selector list is exactly `sel`. */
function rule(sel: string): string {
  const hit = RULES.find(([s]) => s === sel);
  if (!hit) throw new Error(`rule not found: ${sel}`);
  return hit[1];
}
/** Every rule whose selector is exactly `sel`, in source order (base + media). */
const rulesFor = (sel: string) => RULES.filter(([s]) => s === sel).map(([, b]) => b);
/** The slice of the sheet inside a given @media / @supports query, up to the next at-rule. */
function block(query: string): string {
  const at = hero.indexOf(query);
  expect(at, `${query} is not in the sheet`).toBeGreaterThanOrEqual(0);
  const rest = hero.slice(at + query.length);
  const next = rest.search(/\n@(media|supports|keyframes)/);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("one fetch — the mask is the image the <img> already loaded", () => {
  it("the stylesheet contains no url() at all", () => {
    expect(hero, "a url() in the Hero sheet is a second download of the product").not.toMatch(/url\(/i);
  });

  it("the mask reads a runtime variable with a transparent default", () => {
    const gloss = rule(".hero-v2-gloss");
    expect(gloss).toMatch(/mask-image:\s*var\(--product-src,\s*none\)/);
    expect(gloss).toMatch(/-webkit-mask-image:\s*var\(--product-src,\s*none\)/);
    expect(gloss, "the gloss must be invisible until the stage says the mask exists").toMatch(/opacity:\s*0\s*;/);
    const ready = RULES.find(([s]) => s.includes('[data-material="ready"]') && s.includes(".hero-v2-gloss"));
    expect(ready, "no rule reveals the gloss once the mask is ready").toBeTruthy();
    expect(ready![1]).toMatch(/opacity:\s*1/);
  });

  it("Hero.tsx writes the variable from img.currentSrc, on load, onto the stage", () => {
    expect(code).toContain("img.currentSrc");
    expect(code).toContain('"--product-src"');
    expect(code).toMatch(/addEventListener\("load",\s*sync\)/);
    expect(code).toContain('dataset.material = "ready"');
    // The hero angle's file path may appear exactly once — as the base <Image src>;
    // every other angle comes from lib/turntable.ts. A second literal mention is a
    // hand-built mask URL.
    expect(tsx.match(/mia-four-360-1\.webp/g)?.length).toBe(1);
    expect(tsx, "a frame path is typed in the component instead of read from the manifest").not.toMatch(/mia-four-360-[2-6]/);
    expect(code, "the variable is written on the stage, never on <html>").not.toMatch(/documentElement\.style/);
  });

  it("an engine without masks never sees a bare white bar", () => {
    const sup = block("@supports not ((mask-image: none) or (-webkit-mask-image: none))");
    expect(sup).toMatch(/\.hero-v2-gloss\s*\{\s*display:\s*none/);
  });
});

describe("the LCP stays a plain box", () => {
  it("the <img> rule is width/height/display/object-fit and nothing else", () => {
    const img = rule(".hero-v2-product-img");
    expect(img).toMatch(/width:\s*100%/);
    expect(img).toMatch(/height:\s*auto/);
    expect(img, "the LCP element must not carry motion or paint effects").not.toMatch(/opacity|animation|transform|filter|mask|will-change|transition/);
  });

  it("no rule anywhere targets the image class with an effect", () => {
    for (const [sel, body] of RULES) {
      if (!sel.includes("hero-v2-product-img")) continue;
      expect(body, `${sel} touches the LCP with an effect`).not.toMatch(/opacity|animation|transform|filter|mask/);
    }
  });

  it("the nesting is stage › body › rig › product › img, so the reserved box is the image's own", () => {
    expect(code).toMatch(
      /<div className="hero-v2-body">[\s\S]*?<div className="hero-v2-rig">\s*<div className="hero-v2-product">\s*<Image[\s\S]*?className="hero-v2-product-img"/,
    );
    // Every sibling of the <img> inside the product node is absolutely positioned,
    // otherwise it would add height to the box the browser reserved.
    expect(rule(".hero-v2-gloss")).toMatch(/position:\s*absolute/);
    expect(rule(".hero-v2-body")).toMatch(/width:\s*min\(100%,\s*760px\)/);
  });

  it("the entrance never animates opacity on the product's ancestors", () => {
    for (const name of ["hero-emerge", "hero-emerge-quick", "hero-float"]) {
      const kf = hero.match(new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\}\\s*\\}`))?.[1] ?? "";
      expect(kf, `@keyframes ${name} is missing`).not.toBe("");
      expect(kf, `${name} animates opacity above the LCP`).not.toContain("opacity");
    }
  });
});

describe("compositor-only motion", () => {
  const KEYFRAMES = [...hero.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)];

  it("finds the keyframes it is about to judge", () => {
    const names = KEYFRAMES.map((m) => m[1]);
    for (const n of ["hero-emerge", "hero-plane-settle", "hero-shadow-land", "hero-glint", "hero-float", "hero-ground-breathe", "hero-glint-loop", "hero-yaw"]) {
      expect(names, `${n} is not declared`).toContain(n);
    }
  });

  it.each(KEYFRAMES.map((m) => [m[1], m[2]] as const))("@keyframes %s declares only transform / opacity", (_name, body) => {
    const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
    expect(props.length).toBeGreaterThan(0);
    for (const p of props) expect(["transform", "opacity"], `keyframe property ${p}`).toContain(p);
  });

  it("parallax rides the individual `translate` property, so it composes with every transform", () => {
    for (const sel of [".hero-v2-far", ".hero-v2-plane", ".hero-v2-ground", ".hero-v2-rig"]) {
      expect(rule(sel), `${sel} has no parallax translate`).toMatch(/translate:\s*calc\(.*var\(--par-x\)/);
    }
    // and the vars start at rest
    const stage = rule(".hero-v2-product-stage");
    expect(stage).toMatch(/--par-x:\s*0\s*;/);
    expect(stage).toMatch(/--par-y:\s*0\s*;/);
    expect(stage).toMatch(/--lift:\s*0px/);
  });

  it("the contact shadow is centred by translate, so a transform reset cannot un-centre it", () => {
    const g = rule(".hero-v2-ground");
    expect(g).toMatch(/left:\s*50%/);
    expect(g).toMatch(/translate:\s*calc\(-50%/);
    expect(g).not.toContain("translateX(-50%)");
  });

  it("nothing new blurs, backdrop-filters or will-changes", () => {
    for (const sel of [".hero-v2-plane", ".hero-v2-plane::before", ".hero-v2-gloss", ".hero-v2-gloss-band", ".hero-v2-rig", ".hero-v2-product", ".hero-v2-far", ".hero-v2-ground"]) {
      const b = rule(sel);
      expect(b, `${sel} carries a per-frame filter cost`).not.toMatch(/backdrop-filter|blur\(|will-change/);
    }
    // the product's rim is ONE small-kernel drop-shadow, not the old 26/34px blurs
    const shadows = [...rule(".hero-v2-product").matchAll(/drop-shadow\(0 0 ([\d.]+)px/g)];
    expect(shadows.length).toBe(1);
    expect(Number(shadows[0][1])).toBeLessThanOrEqual(2);
  });
});

describe("the entrance is gated, and lands on rest", () => {
  it("every entrance animation lives under html.intro-full or html.intro-quick", () => {
    for (const [sel, body] of RULES) {
      if (!/hero-emerge|hero-plane-settle|hero-shadow-land|animation:\s*hero-glint\s/.test(body)) continue;
      expect(sel, `entrance outside the intro gate: ${sel}`).toMatch(/^html\.intro-(full|quick)\b/);
    }
  });

  it("the gate never sets the class under reduced motion (the site's own contract)", () => {
    const gate = layout.slice(layout.indexOf("const INTRO_GATE"), layout.indexOf("`;", layout.indexOf("const INTRO_GATE")));
    expect(gate).toContain("prefers-reduced-motion: reduce");
    expect(gate).toContain("intro-full");
    expect(read("components/HeroIntro.tsx")).toMatch(/4600/);
  });

  it("every entrance ends on its resting value, so retiring the class snaps nothing", () => {
    expect(hero).toMatch(/@keyframes hero-emerge\s*\{[^}]*\}\s*to\s*\{\s*transform:\s*none;\s*\}/);
    expect(hero).toMatch(/@keyframes hero-emerge-quick\s*\{[^}]*\}\s*to\s*\{\s*transform:\s*none;\s*\}/);
    expect(hero).toMatch(/@keyframes hero-shadow-land\s*\{[^}]*\}\s*to\s*\{\s*transform:\s*none;\s*opacity:\s*1;\s*\}/);
    // the pane's landing frame equals its resting transform (par = 0)
    const rest = rule(".hero-v2-plane").match(/transform:\s*([^;]+);/)?.[1] ?? "";
    expect(rest).toContain("rotateX(calc(6deg");
    expect(hero).toMatch(/@keyframes hero-plane-settle[\s\S]*?to\s*\{\s*transform:\s*perspective\(1400px\)\s*rotateX\(6deg\)\s*translateZ\(-40px\);\s*opacity:\s*1;/);
  });

  it("every entrance is over before HeroIntro retires the class", () => {
    const dur = (name: string) => {
      const m = hero.match(new RegExp(`animation:\\s*${name}\\s+(\\d+)ms[^;]*?(?:\\s(\\d+)ms)?[^;]*;`));
      expect(m, `${name} has no duration`).toBeTruthy();
      return Number(m![1]) + Number(m![2] ?? 0);
    };
    for (const n of ["hero-emerge", "hero-plane-settle", "hero-shadow-land", "hero-glint"]) expect(dur(n)).toBeLessThanOrEqual(2300);
    expect(dur("hero-emerge-quick")).toBeLessThanOrEqual(1500);
  });
});

describe("pointer economics", () => {
  it("idle float, breathing shadow, glint loop and hover lift exist only for a fine pointer", () => {
    const fine = block("@media (hover: hover) and (pointer: fine)");
    for (const s of ["animation: hero-float", "animation: hero-ground-breathe", "animation: hero-glint-loop", "--lift: 44px"]) {
      expect(fine, `${s} is not in the fine-pointer block`).toContain(s);
    }
    // and nowhere else
    const outside = hero.replace(fine, "");
    for (const s of ["animation: hero-float", "animation: hero-ground-breathe", "animation: hero-glint-loop", "--lift: 44px"]) {
      expect(outside, `${s} leaks outside the fine-pointer block`).not.toContain(s);
    }
    expect(block("@media (hover: none)")).not.toContain("hero-glint-loop");
  });

  it("Hero.tsx writes the parallax beside the tilt and resets all of it on leave", () => {
    const write = code.slice(code.indexOf("const write = "), code.indexOf("const onMove"));
    const leave = code.slice(code.indexOf("const onLeave = "), code.indexOf("el.addEventListener(\"pointermove\""));
    for (const v of ["--par-x", "--par-y", "--tilt-x", "--tilt-y", "--sheen-x", "--sheen-y"]) {
      expect(write, `${v} is not written per frame`).toContain(`"${v}"`);
      expect(leave, `${v} is not reset on pointerleave`).toContain(`"${v}"`);
    }
    expect(leave).toContain('"--sheen", "0"');
  });

  it("the model-change glint is transform-only, on the ambience bus, without a library", () => {
    expect(code).toContain('import { onAmbienceTilt } from "@/lib/ambience"');
    expect(code).toContain("onAmbienceTilt(");
    const frames = code.match(/animate\(\s*\[([\s\S]*?)\]/)?.[1] ?? "";
    expect(frames).not.toBe("");
    for (const key of [...frames.matchAll(/\{\s*([a-zA-Z]+):/g)].map((m) => m[1])) expect(key).toBe("transform");
    expect(code).not.toMatch(/from "framer-motion"|from "three"|@react-three/);
  });
});

describe("reduced motion is total", () => {
  const reduce = hero.slice(hero.lastIndexOf("prefers-reduced-motion: reduce"));

  it("names every moving layer with animation: none and transition: none", () => {
    const list = reduce.match(/([^{}]*)\{\s*animation:\s*none;\s*transition:\s*none;\s*\}/)?.[1] ?? "";
    for (const sel of [".hero-v2-rig", ".hero-v2-plane", ".hero-v2-ground", ".hero-v2-far", ".hero-v2-gloss-band", ".hero-v2-product", ".hero-v2-orbit"]) {
      expect(list, `${sel} keeps moving under reduced motion`).toContain(sel);
    }
  });

  it("parks the parallax and hides the sweep", () => {
    expect(reduce).toMatch(/\.hero-v2-rig,\s*\.hero-v2-plane,\s*\.hero-v2-ground,\s*\.hero-v2-far\s*\{\s*translate:\s*none/);
    expect(reduce).toMatch(/\.hero-v2-gloss\s*\{\s*display:\s*none/);
    expect(reduce).toMatch(/\.hero-v2-product\s*\{\s*transform:\s*none/);
  });

  it("Hero.tsx returns before the mask, the glint and the bus subscription", () => {
    const material = code.slice(code.indexOf('querySelector<HTMLImageElement>'));
    const effect = code.slice(code.lastIndexOf("useEffect(", code.indexOf("img.hero-v2-product-img")));
    const gate = effect.indexOf('matchMedia("(prefers-reduced-motion: reduce)").matches) return;');
    expect(gate, "the material effect has no reduced-motion gate").toBeGreaterThanOrEqual(0);
    expect(gate).toBeLessThan(effect.indexOf("onAmbienceTilt("));
    expect(gate).toBeLessThan(effect.indexOf('"--product-src"'));
    expect(material).toContain("removeEventListener");
  });
});

describe("the screen the product steps out of", () => {
  it("is sized so the measured silhouette crosses its top and bottom rims", () => {
    // Measured on the still (1400×1498, 2026-09-08): handlebar + mirror occupy rows
    // 0–10% (x 46–78%), the chassis is 9→95% wide in rows 60–88%, and nothing solid
    // sits below row 96%. A pane whose top is ≥ 8% down and whose bottom is ≥ 24%
    // up is therefore crossed on both rims at rest — the cue that needs no motion.
    const p = rule(".hero-v2-plane");
    const top = Number(p.match(/top:\s*(\d+)%/)?.[1]);
    const bottom = Number(p.match(/bottom:\s*(\d+)%/)?.[1]);
    expect(top).toBeGreaterThanOrEqual(8);
    expect(top).toBeLessThanOrEqual(16);
    expect(bottom).toBeGreaterThanOrEqual(24);
    expect(bottom).toBeLessThanOrEqual(36);
    // physical offsets — the still does not mirror in RTL
    expect(p).toMatch(/left:\s*\d+%/);
    expect(p).toMatch(/right:\s*\d+%/);
    expect(p).not.toMatch(/inset-inline/);
  });

  it.each([
    [".hero-v2-plane", "the pane"],
    [".hero-v2-plane::before", "the room-lit bloom on the glass"],
    [".hero-v2-plane::after", "the lit bottom rim"],
    [".hero-v2-gloss-band", "the specular sweep"],
    [".hero-v2-ground", "the contact shadow's penumbra"],
    [".hero-v2-product", "the crystalline rim"],
  ])("%s is lit by the room (%s)", (sel) => {
    const b = rule(sel);
    expect(/hsla\(var\(--amb-hue-[ab]\)/.test(b) || /var\(--hero-rim(-strong)?\)/.test(b) || b.includes("var(--glow-room)"), `${sel} is not lit by --amb-hue-*`).toBe(true);
  });

  it("authors no new hex — white is the material, ink-navy is the shadow", () => {
    for (const sel of [".hero-v2-plane", ".hero-v2-plane::before", ".hero-v2-plane::after", ".hero-v2-gloss", ".hero-v2-gloss-band", ".hero-v2-ground", ".hero-v2-rig", ".hero-v2-product", ".hero-v2-far"]) {
      const b = rule(sel);
      expect(b, `${sel} authors a hex colour`).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      const rgbas = [...b.matchAll(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+)/g)].map((m) => m.slice(1, 4).join(","));
      for (const c of rgbas) expect(["255,255,255", "4,18,31", "0,0,0"], `${sel} uses a fixed colour ${c}`).toContain(c);
    }
  });
});
