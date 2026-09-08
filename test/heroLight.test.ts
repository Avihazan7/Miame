// test/heroLight.test.ts — Hero light + stage contract after six-source 360 integration.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ");

const HERO_CSS = read("app/miame-hero-v2.css");
const hero = strip(HERO_CSS);
const tokens = strip(read("styles/tokens.miame.css"));
const globals = strip(read("app/globals.css"));
const ultra = strip(read("app/miame-ultra.css"));
const heroTsx = read("components/Hero.tsx");
const turntableTsx = read("components/HeroTurntable.tsx");

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
function token(css: string, name: string): string {
  const m = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  expect(m, `${name} is not declared`).toBeTruthy();
  return m![1].trim();
}
function hexOf(value: string): string {
  let v = value;
  for (let i = 0; i < 6 && /^var\(/.test(v); i++) v = token(tokens, v.slice(4, -1));
  expect(v, `${value} does not resolve to a hex through styles/tokens.miame.css`).toMatch(/^#[0-9a-f]{6}$/i);
  return v.toUpperCase();
}
function rule(sel: string): string {
  for (const m of hero.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].trim() === sel) return m[2];
  }
  throw new Error(`rule not found: ${sel}`);
}

describe("ground — white, and lit by the room", () => {
  const section = rule(".hero-v2");
  it("paints the ground white", () => {
    expect(token(hero, "--hero-ground")).toBe("#FFFFFF");
    expect(section).toContain("var(--hero-ground)");
  });
  it("carries no retired dark-gate palette", () => {
    for (const dark of ["#03151B", "#071F2F", "#020B10", "#B9C8D4", "#8FA6B5"]) {
      expect(hero.toUpperCase()).not.toContain(dark);
    }
  });
  it.each([".hero-v2", ".hero-v2-energy-a", ".hero-v2-energy-b", ".hero-v2-orbit", ".hero-v2-sheen", ".hero-v2-ground::after", ".hero-v2-product", ".hero-v2-secondary:hover"])("%s follows ambient hue", (sel) => {
    const d = rule(sel);
    const lit = /hsla\(var\(--amb-hue-[ab]\)/.test(d) || /var\(--hero-rim(?:-strong)?\)/.test(d) || d.includes("var(--glow-room)");
    expect(lit).toBe(true);
  });
  it("dims with ambient intensity", () => {
    expect(section).toContain("var(--amb-intensity)");
    expect(rule(".hero-v2-energy")).toContain("var(--amb-intensity)");
  });
});

describe("contrast — computed against white", () => {
  const ink = hexOf(token(hero, "--hero-ink"));
  const accent = hexOf(token(hero, "--hero-accent"));
  const muted = hexOf(token(hero, "--hero-muted"));
  it.each([["ink", ink], ["accent", accent], ["muted", muted]])("%s is AA on white", (_label, hex) => {
    expect(contrast(hex, WHITE)).toBeGreaterThanOrEqual(4.5);
  });
  it("headline gradient has a solid accessible fallback", () => {
    const strong = rule(".hero-v2-title strong");
    expect(strong).toContain("var(--grad-teal-text)");
    expect(strong.replace(/\s+/g, "")).toContain("color:var(--hero-accent)");
    const grad = token(ultra, "--grad-teal-text");
    const stops = [...grad.matchAll(/#[0-9a-f]{6}|var\(--[\w-]+\)/gi)].map((m) => hexOf(m[0]));
    for (const s of stops) expect(contrast(s, WHITE)).toBeGreaterThanOrEqual(3);
  });
});

describe("stage — pointer depth is inert by default", () => {
  it("starts at rest", () => {
    const stage = rule(".hero-v2-product-stage");
    expect(stage).toMatch(/--tilt-x:\s*0deg/);
    expect(stage).toMatch(/--tilt-y:\s*0deg/);
    expect(stage).toMatch(/--sheen:\s*0\b/);
  });
  it("product transform reads tilt vars", () => {
    const product = rule(".hero-v2-product");
    expect(product).toContain("rotateY(var(--tilt-x))");
    expect(product).toContain("rotateX(var(--tilt-y))");
    expect(product).toContain("perspective(");
  });
  it("Hero writes tilt only for fine pointer without reduced motion", () => {
    const code = heroTsx.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(code).toContain('matchMedia("(pointer: fine)")');
    expect(code).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(code).toMatch(/if \(!fine \|\| reduce\) return;/);
    expect(code).toMatch(/"pointerleave"/);
  });
  it("reduced motion stops ambient motion and product tilt", () => {
    const reduce = hero.slice(hero.lastIndexOf("prefers-reduced-motion:reduce"));
    expect(reduce).toMatch(/\.hero-v2-product\s*\{\s*transform:none/);
    expect(reduce).toMatch(/\.hero-v2-sheen\s*\{\s*display:none/);
    expect(reduce).toContain(".hero-v2-product{animation:none;transition:none}");
  });
});

describe("turntable LCP and slot contract", () => {
  const maxw = Number(globals.match(/--maxw:(\d+)px/)?.[1]);
  const tag = turntableTsx.match(/<Image\b[\s\S]*?\/>/)?.[0] ?? "";
  it("keeps the same two-column geometry", () => {
    expect(maxw).toBe(1120);
    const grid = rule(".hero-v2-grid").replace(/\s+/g, "");
    expect(grid).toContain("grid-template-columns:minmax(0,1fr)minmax(380px,1.04fr)");
    expect(grid).toContain("gap:clamp(34px,5vw,82px)");
  });
  it("fetches for the actual visual slot", () => {
    const content = maxw - 44;
    const gap = Math.min(82, Math.max(34, 0.05 * maxw));
    const ceiling = Math.floor(((content - gap) * 1.04) / 2.04);
    expect(ceiling).toBe(520);
    expect(tag).toMatch(new RegExp(`sizes="[^"]*,\\s*${ceiling}px"`));
    expect(tag).toContain("(max-width: 1120px) 48vw");
  });
  it("first turntable frame is the LCP candidate", () => {
    expect(tag).toContain('priority={frame === 0}');
    expect(tag).toContain('fetchPriority={frame === 0 ? "high" : "auto"}');
    const q = Number(tag.match(/quality=\{(\d+)\}/)?.[1]);
    expect(q).toBeGreaterThanOrEqual(85);
  });
});
