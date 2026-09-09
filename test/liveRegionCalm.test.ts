// test/liveRegionCalm.test.ts — a live region announces RESULTS, never frames.
//
// THE DEFECT THIS CLOSES (audit, 2026-09-09). components/Configurator.tsx rendered
// `{animatedMonthly}` directly inside `<div aria-live="polite" aria-atomic="true">`.
// `animatedMonthly` comes from useCountUp — a requestAnimationFrame loop that calls
// setState on EVERY frame, ~31 of them per 520ms run. So one nudge of one slider
// queued roughly thirty announcements of a number that was still moving, and a drag
// queued hundreds. A screen-reader user could not hear the result at all, only the
// counting.
//
// WHY THIS SITE IN PARTICULAR. It sells mobility scooters, and one of its two named
// audiences is disabled veterans. Screen-reader users are a larger share of these
// buyers than of almost any other commercial site, and the payment simulator is the
// page's entire purpose. A live region that drowns them is not a minor a11y nit here.
//
// The same code was also an ungated animation: every other moving thing on the site
// sits behind `prefers-reduced-motion` — the intro gate, the aurora, the scroll
// progress, the turntable — and the count-up did not. For a visitor who asked for
// less motion it is the worst offender of the set, because it is not decoration in
// a corner; it is the price they are trying to read.
//
// Both halves are asserted, because either one alone leaves the defect: gating the
// motion without fixing the region still floods anyone who has not set the
// preference, and fixing the region without gating the motion still animates a
// number at someone who asked it not to.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("components/Configurator.tsx", "utf8");
/** Comments prove nothing — every assertion reads code the browser also runs. */
const code = src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("the simulator's live region stays calm", () => {
  it("the scan is alive", () => {
    expect(code, "Configurator.tsx no longer has a live region").toContain('aria-live="polite"');
    expect(code, "the count-up hook is gone — re-read this file before deleting it").toContain(
      "useCountUp",
    );
  });

  it("no animated value is rendered inside an aria-live region", () => {
    // Take each aria-live element's markup up to its closing tag and check that the
    // per-frame value is not inside it.
    for (const m of code.matchAll(/<(\w+)[^>]*aria-live=/g)) {
      const from = m.index!;
      const region = code.slice(from, code.indexOf(`</${m[1]}>`, from) + 1);
      expect(
        region.includes("animatedMonthly"),
        `an aria-live region renders animatedMonthly, which changes ~31 times per ` +
          `interaction. Announce quote.monthlyPayment — the settled figure — and mark ` +
          `the animating number aria-hidden.`,
      ).toBe(false);
    }
  });

  it("the settled figure is what gets announced", () => {
    expect(code, "nothing announces the settled monthly payment").toMatch(
      /aria-live="polite"[\s\S]{0,400}quote\.monthlyPayment/,
    );
  });

  it("the count-up is gated by prefers-reduced-motion", () => {
    const hook = code.slice(code.indexOf("function useCountUp"), code.indexOf("requestAnimationFrame"));
    expect(
      hook,
      "useCountUp animates a number for every visitor, including those who asked for " +
        "reduced motion. Check matchMedia('(prefers-reduced-motion: reduce)') and jump " +
        "straight to the target when it matches.",
    ).toContain("prefers-reduced-motion: reduce");
  });
});
