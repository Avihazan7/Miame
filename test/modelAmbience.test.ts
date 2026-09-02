// test/modelAmbience.test.ts — the ambient light gained a fourth axis: the model
// the visitor picked. This file holds the three things that can silently break it.
//
// 1. THE TWO TABLES MUST AGREE. Hours live in ambientForHour, models in
//    MODEL_AMBIENCE, and their SUM is what the page paints. Each is defensible on
//    its own and the pair is not: night sits at hue 250 and Pro Max asks for +22,
//    which composes to purple — a colour the תכלת ladder does not contain, shown
//    only between 21:00 and 05:00, which is the half of the day nobody reviews.
//    The cross-product below is the only place those two tables ever meet.
//
// 2. THE CLAMP MUST BIND. A guard that never fires is indistinguishable from no
//    guard, so this file also proves the UNCLAMPED sum leaves the band. If a later
//    edit tames the tilts, that assertion fails and tells the next person the
//    clamp is now decoration — rather than leaving them a rail holding nothing.
//
// 3. ONE WRITER. Time-of-day re-emits every five minutes. If the configurator
//    wrote the hue variables directly, that tick would erase the model's tilt
//    minutes after the click. The composition therefore has exactly one home, and
//    the source-level checks below keep it there.
import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { MODELS } from "../lib/models";
import {
  MODEL_AMBIENCE,
  AMBIENCE_MODEL_IDS,
  AMBIENCE_MAX_TILT,
  AMBIENCE_HUE_MIN,
  AMBIENCE_HUE_MAX,
  AMBIENCE_BASE_TILT,
  ambientForHour,
  composeHue,
  hueShiftFor,
} from "../lib/model-ambience";
import { ambienceTilt, setAmbienceTilt, onAmbienceTilt, resetAmbienceForTest } from "../lib/ambience";

const read = (p: string) => readFileSync(p, "utf8");
/** Source with comments removed. The guards below look for a WRITE; a doc comment
 *  that names the variable it is explaining is documentation, not a second writer
 *  — and the first draft of this file failed on its own prose. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const HOURS = Array.from({ length: 24 }, (_, h) => h);

describe("every model lights the room, and only models do", () => {
  it("has models to cover — the checks below are not vacuous", () => {
    expect(MODELS.length).toBeGreaterThan(1);
    expect(AMBIENCE_MODEL_IDS).toEqual(MODELS.map((m) => m.id));
  });

  it("covers every model, and nothing that is not a model", () => {
    const mapped = Object.keys(MODEL_AMBIENCE).sort();
    // Both directions. A missing entry does not throw — it falls back to the base
    // atmosphere, so the failure mode is "the light stopped responding for that
    // one model", which nobody reports. An orphan entry is a model that was
    // renamed or removed, leaving a rule for a card that no longer exists.
    expect(mapped, "MODEL_AMBIENCE and lib/models.ts disagree").toEqual([...AMBIENCE_MODEL_IDS].sort());
  });

  it("keeps every tilt inside the rail", () => {
    for (const [id, a] of Object.entries(MODEL_AMBIENCE)) {
      expect(Math.abs(a.hueShift), `${id}: tilt beyond ±${AMBIENCE_MAX_TILT}°`).toBeLessThanOrEqual(
        AMBIENCE_MAX_TILT,
      );
    }
  });

  it("gives each model its own tilt, and leaves the base reachable", () => {
    const tilts = Object.values(MODEL_AMBIENCE).map((a) => a.hueShift);
    // Two models on the same tilt is the axis quietly doing nothing for one of them.
    expect(new Set(tilts).size, `duplicate tilt: ${tilts.join(", ")}`).toBe(tilts.length);
    expect(tilts, "no model sits at the base atmosphere").toContain(AMBIENCE_BASE_TILT);
  });

  it("resolves an unknown model to the base instead of throwing", () => {
    // The ambience is decoration. Decoration must not be able to take a page down.
    expect(hueShiftFor("no-such-model")).toBe(AMBIENCE_BASE_TILT);
  });
});

describe("the two tables are checked against each other, not just alone", () => {
  it("never paints outside the תכלת ladder, at any hour, for any model", () => {
    for (const h of HOURS) {
      const base = ambientForHour(h);
      for (const id of AMBIENCE_MODEL_IDS) {
        const tilt = hueShiftFor(id);
        for (const [which, v] of [
          ["hueA", composeHue(base.hueA, tilt)],
          ["hueB", composeHue(base.hueB, tilt)],
        ] as const) {
          expect(v, `${h}:00 · ${id} · ${which} = ${v} is outside the ladder`).toBeGreaterThanOrEqual(
            AMBIENCE_HUE_MIN,
          );
          expect(v, `${h}:00 · ${id} · ${which} = ${v} is outside the ladder`).toBeLessThanOrEqual(
            AMBIENCE_HUE_MAX,
          );
        }
      }
    }
  });

  it("the clamp actually binds — it is a rail, not an ornament", () => {
    // If this fails, the tilts or the hours were tamed and composeHue now clamps
    // nothing. That is not automatically wrong, but it means the guard above is
    // passing on its own and no longer proves anything. Decide deliberately.
    const escapes = HOURS.flatMap((h) => {
      const base = ambientForHour(h);
      return AMBIENCE_MODEL_IDS.flatMap((id) => {
        const t = hueShiftFor(id);
        return [base.hueA + t, base.hueB + t].filter((v) => v < AMBIENCE_HUE_MIN || v > AMBIENCE_HUE_MAX);
      });
    });
    expect(escapes.length, "no unclamped sum leaves the band — the clamp is now decoration").toBeGreaterThan(0);
  });

  it("leaves the untilted atmosphere exactly as it was", () => {
    // The fourth axis must be additive. At the base tilt every hour has to emit
    // the same numbers the site painted before this feature existed.
    for (const h of HOURS) {
      const b = ambientForHour(h);
      expect(composeHue(b.hueA, AMBIENCE_BASE_TILT)).toBe(b.hueA);
      expect(composeHue(b.hueB, AMBIENCE_BASE_TILT)).toBe(b.hueB);
    }
  });
});

describe("the channel carries one number and nothing else", () => {
  beforeEach(() => resetAmbienceForTest());

  it("publishes to subscribers", () => {
    const seen: number[] = [];
    onAmbienceTilt((t) => seen.push(t));
    setAmbienceTilt(22);
    expect(seen).toEqual([22]);
    expect(ambienceTilt()).toBe(22);
  });

  it("says nothing when the value did not change", () => {
    // AmbientLight re-writes six CSS variables on every notification. A repeated
    // publish from a re-render would restyle the page for no reason.
    const seen: number[] = [];
    setAmbienceTilt(22);
    onAmbienceTilt((t) => seen.push(t));
    setAmbienceTilt(22);
    expect(seen).toEqual([]);
  });

  it("stops delivering after unsubscribe", () => {
    const seen: number[] = [];
    const off = onAmbienceTilt((t) => seen.push(t));
    off();
    setAmbienceTilt(-16);
    expect(seen).toEqual([]);
  });
});

describe("one writer owns the hue variables", () => {
  const light = read("components/AmbientLight.tsx");
  const conf = read("components/Configurator.tsx");

  it("AmbientLight composes both hues rather than writing a raw base", () => {
    expect(light).toContain('setProperty("--amb-hue-a", String(composeHue(');
    expect(light).toContain('setProperty("--amb-hue-b", String(composeHue(');
    // The tilt has to reach the DOM through the same function the clock uses.
    expect(light, "AmbientLight ignores tilt changes between clock ticks").toContain("onAmbienceTilt(");
  });

  it("nobody else writes the hue variables", () => {
    // Source-level and deliberately broad: a second writer anywhere reintroduces
    // exactly the overwrite this design exists to prevent.
    for (const f of ["components/Configurator.tsx", "lib/ambience.ts", "lib/model-ambience.ts"]) {
      expect(code(read(f)), `${f} writes an ambient hue directly`).not.toMatch(/--amb-hue-[ab]/);
    }
  });

  it("the configurator publishes the selection and releases it on the way out", () => {
    expect(conf).toContain("setAmbienceTilt(hueShiftFor(modelId))");
    // AmbientLight lives in the root layout and survives client navigation. Without
    // the release, /eligibility stays lit for a model it never shows.
    expect(conf, "the tilt is never released").toContain("setAmbienceTilt(AMBIENCE_BASE_TILT)");
  });
});

describe("the glide is registered, and it is not forced on anyone", () => {
  const css = read("app/globals.css");

  it("registers both hues as numbers so they interpolate", () => {
    // Unregistered, a custom property is a string to the animation engine and the
    // colour snaps. This registration IS the feature.
    expect(css).toMatch(/@property --amb-hue-a\{[^}]*syntax:"<number>"/);
    expect(css).toMatch(/@property --amb-hue-b\{[^}]*syntax:"<number>"/);
  });

  it("transitions them only for visitors who did not ask for less motion", () => {
    const guarded = css.match(/@media \(prefers-reduced-motion:no-preference\)\{[^@]*?--amb-hue-a[^}]*\}\s*\}/);
    expect(guarded, "the hue transition is not inside a reduced-motion guard").toBeTruthy();
    // And nowhere else: an unguarded copy would sweep the whole viewport for a
    // visitor who explicitly asked it not to.
    const all = css.match(/transition:--amb-hue-a/g) ?? [];
    expect(all.length, "more than one hue transition is declared").toBe(1);
  });
});
