// test/cardSpotlight.test.ts — the near-field light, held to the two ways it
// silently becomes nothing.
//
// 1. A LISTENER WRITING VARIABLES NOBODY READS. The selector list lives in
//    lib/spotlight.ts and the gradients live in app/globals.css. Add a surface to
//    one and not the other and there is no error, no warning and no light — just
//    a delegated listener doing measurable work (a getBoundingClientRect per
//    frame) for a card that never lights up. Both directions are checked.
//
// 2. AN EFFECT THAT IS NOT INERT BY DEFAULT. `--spot` starts unset, so every
//    surface must render its gradient at opacity 0 until the listener writes to
//    it. If a rule ever defaults it on, a touch device and a reduced-motion
//    visitor get a light frozen in the middle of the card — the one place it
//    looks like a rendering fault rather than a design.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SPOTLIT_SURFACES, SPOTLIGHT_SELECTOR, SPOTLIGHT_VARS } from "../lib/spotlight";

const css = readFileSync("app/globals.css", "utf8");
const listener = readFileSync("components/CardSpotlight.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
/** Source with comments stripped — a guard that counts CALLS must not count the
 *  sentence explaining them. This assertion first passed on its own prose. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** The one rule that paints the light, isolated so the assertions are about it. */
const RULE = css.match(/\.card-stage::before[^{]*\{[^}]*\}/)?.[0] ?? "";

describe("the list of lit surfaces and the rules that light them agree", () => {
  it("has surfaces to check", () => {
    expect(SPOTLIT_SURFACES.length).toBeGreaterThan(1);
    expect(RULE, "the spotlight rule is not in the stylesheet").not.toBe("");
  });

  it("every listed surface has a ::before that draws the light", () => {
    for (const c of SPOTLIT_SURFACES) {
      expect(RULE, `.${c} is in SPOTLIT_SURFACES with no rule to light it`).toContain(`.${c}::before`);
    }
  });

  it("the rule lights nothing that is not on the list", () => {
    // The other direction: a class styled here but absent from the list is a
    // surface the listener will never write to, so it can only ever sit dark.
    const styled = [...RULE.matchAll(/\.([a-z-]+)::before/g)].map((m) => m[1]);
    expect(styled.sort(), "a surface is styled but not listed").toEqual([...SPOTLIT_SURFACES].sort());
  });

  it("the listener targets the derived selector, never a typed one", () => {
    expect(listener).toContain("SPOTLIGHT_SELECTOR");
    expect(SPOTLIGHT_SELECTOR).toBe(SPOTLIT_SURFACES.map((c) => `.${c}`).join(","));
    // A literal class inside the component would be a third place the list lives.
    for (const c of SPOTLIT_SURFACES) {
      expect(listener, `${c} is hardcoded in the component`).not.toContain(`.${c}`);
    }
  });

  it("is mounted once, beside the page-level light it complements", () => {
    expect(layout).toContain("<CardSpotlight />");
    expect((layout.match(/<CardSpotlight \/>/g) ?? []).length).toBe(1);
  });
});

describe("the light is inert until something turns it on", () => {
  it("defaults to fully transparent", () => {
    // `var(--spot,0)` is the whole contract: unset means invisible.
    expect(RULE, "the spotlight does not default to off").toContain(`opacity:var(${SPOTLIGHT_VARS.on},0)`);
  });

  it("defaults its position to the centre rather than the origin", () => {
    // A 0,0 default would park the light in the top-left corner for the first
    // frame after the listener writes opacity but before it writes coordinates.
    expect(RULE).toContain(`var(${SPOTLIGHT_VARS.x},50%)`);
    expect(RULE).toContain(`var(${SPOTLIGHT_VARS.y},50%)`);
  });

  it("never intercepts a click", () => {
    expect(RULE).toContain("pointer-events:none");
  });

  it("takes its colour from the room, not from a fixed accent", () => {
    expect(RULE).toContain("hsla(var(--amb-hue-a)");
    expect(RULE, "a fixed accent colour is painted into the spotlight").not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe("it backs off exactly where the page-level light does", () => {
  it("the listener refuses coarse pointers and reduced motion", () => {
    expect(listener).toContain('matchMedia("(pointer: fine)")');
    expect(listener).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
  });

  it("the stylesheet says the same thing, so a stale value cannot linger", () => {
    const reduce = css.slice(css.indexOf("prefers-reduced-motion: reduce", css.indexOf("WAX NANO CRISTAL")));
    expect(reduce).toContain(".card-stage::before");
  });

  it("reads layout once per frame, not once per event", () => {
    // pointermove outruns the compositor; a getBoundingClientRect per event is
    // the standard way this effect becomes a scroll-jank bug.
    expect(listener).toContain("requestAnimationFrame");
    // And it must sit in paint(), which runs once a frame — not in the handler.
    expect(code(listener).indexOf("getBoundingClientRect")).toBeLessThan(code(listener).indexOf("const onMove"));
    expect((code(listener).match(/getBoundingClientRect/g) ?? []).length).toBe(1);
  });

  it("releases the surface it lit when the pointer leaves it", () => {
    // Without this every card the cursor ever crossed stays lit.
    expect(listener).toContain("lit.style.setProperty");
  });
});
