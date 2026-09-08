import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const tsx = readFileSync("components/HeroTurntable.tsx", "utf8");
const hero = readFileSync("components/Hero.tsx", "utf8");
const css = readFileSync("app/miame-hero-v2.css", "utf8");

describe("Hero six-source 360", () => {
  it("uses exactly six source frames", () => {
    const frames = [...tsx.matchAll(/\/360\/mia-four-360-0[1-6]\.webp/g)].map((m) => m[0]);
    expect(new Set(frames).size).toBe(6);
  });

  it("supports drag, swipe and keyboard navigation", () => {
    for (const token of ["onPointerDown", "onPointerMove", "onPointerUp", "ArrowLeft", "ArrowRight", "Home", "End"]) {
      expect(tsx).toContain(token);
    }
    expect(css).toContain("touch-action:pan-y");
  });

  it("announces frame position and exposes a focusable group", () => {
    expect(tsx).toContain('role="group"');
    expect(tsx).toContain('tabIndex={0}');
    expect(tsx).toContain('aria-live="polite"');
    expect(tsx).toContain("זווית ${frame + 1} מתוך ${FRAMES.length}");
  });

  it("is the visual rendered by the Hero", () => {
    expect(hero).toContain('import HeroTurntable from "@/components/HeroTurntable"');
    expect(hero).toContain("<HeroTurntable />");
    expect(hero).not.toContain('src="/mia-four-x6-studio.webp"');
  });

  it("keeps reduced-motion visitors free from ambient product animation", () => {
    const reduce = css.slice(css.indexOf("prefers-reduced-motion:reduce"));
    expect(reduce).toContain(".hero-v2-product{transform:none}");
    expect(reduce).toContain(".hero-v2-product{animation:none;transition:none}");
  });
});
