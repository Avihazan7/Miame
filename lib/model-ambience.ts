/**
 * lib/model-ambience.ts — the FOURTH axis of the site's ambient light: the model
 * the visitor is looking at.
 *
 * components/AmbientLight.tsx already adapts the room on three axes — time of
 * day, cursor and scroll — by writing two numbers, `--amb-hue-a` and
 * `--amb-hue-b`, which app/globals.css reads in twelve places (aurora, blobs,
 * spotlight, sweep, mark field). Picking a model in the configurator now tilts
 * those same two numbers, so choosing 4×4 Pro Max does not recolour a chip: it
 * changes the light in the whole room.
 *
 * ── WHY A TILT AND NOT A PALETTE ─────────────────────────────────────────────
 * The proposal this grew out of shipped three ABSOLUTE colour sets, one per
 * model. Absolute values would have overwritten the time-of-day adaptation: the
 * site would look identical at 03:00 and at noon the moment anyone touched a
 * model card, and the axis that makes the site feel alive at any hour would be
 * silently dead. A SIGNED SHIFT composes instead of replacing — dusk stays dusk,
 * and Pro Max is dusk leaning deeper.
 *
 * ── AND WHY IT STAYS INSIDE THE BRAND LADDER ─────────────────────────────────
 * The proposal's Pro Max theme was #FF416C — red. The site's palette is the
 * תכלת ladder (--sky-50 … --sky-700) and nothing on it is red; an accent from
 * outside the ladder reads as an error state, not as power. Both shifts below
 * stay inside hues the ambience ALREADY paints on its own: the night setting is
 * 205/250, so Pro Max at 208/222 is a colour this site shows every evening.
 */
import { MODELS } from "./models";

export interface ModelAmbience {
  /** Degrees added to BOTH ambient hues. Signed; 0 is the base atmosphere. */
  hueShift: number;
  /** Why this model reads the way it does. Documentation, never rendered. */
  note: string;
}

/**
 * One entry per model in lib/models.ts — enforced by test/modelAmbience.test.ts,
 * which fails both ways: a model with no entry, and an entry for no model. A
 * missing entry would not crash, it would silently fall back to the base
 * atmosphere, and "the light stopped responding" is not a defect anyone reports.
 */
export const MODEL_AMBIENCE: Record<string, ModelAmbience> = {
  // 2×4 City — the base. The room as the site paints it by default.
  "4x2": { hueShift: 0, note: "העירוני — תכלת הבית, בלי הטיה" },
  // 2×4 City Long Range — toward teal/green. Range reads as distance and calm,
  // and teal is the direction the brand's own --glow-teal already sits in.
  "2x4lr": { hueShift: -16, note: "הטווח המורחב — נטייה לטורקיז" },
  // 4×4 Pro Max — toward deep azure. Power reads as depth, not as heat.
  "4x4": { hueShift: 22, note: "הכוח — נטייה לאזור עמוק" },
};

/** No model chosen, or a model with no entry: the base atmosphere. */
export const AMBIENCE_BASE_TILT = 0;

/**
 * The widest tilt the ambience will accept, in degrees.
 *
 * A guard rail, not a preference: the hue vars feed twelve gradients, and a
 * three-digit shift typed by mistake would swing the whole site to magenta with
 * nothing failing. The test pins every entry inside this band.
 */
export const AMBIENCE_MAX_TILT = 30;

/** The tilt for a model id. Unknown id → base, never a throw: the ambience is
 *  decoration, and decoration must not be able to take the page down. */
export function hueShiftFor(modelId: string): number {
  return MODEL_AMBIENCE[modelId]?.hueShift ?? AMBIENCE_BASE_TILT;
}

/** Model ids the map is expected to cover. Derived, so the test cannot drift. */
export const AMBIENCE_MODEL_IDS = MODELS.map((m) => m.id);

// ─── the time-of-day base, and the band both axes are held inside ───────────

export interface Ambient {
  hueA: number;
  hueB: number;
  intensity: number;
}

/**
 * The base atmosphere for the visitor's local hour. It used to live inside
 * components/AmbientLight.tsx; it moved here so the two tables that decide the
 * page's colour — hours and models — can be read side by side and, more to the
 * point, CROSS-CHECKED by a test without importing React.
 */
export function ambientForHour(hour: number): Ambient {
  // Hours are local to the visitor — the atmosphere matches their sky.
  if (hour >= 5 && hour < 9) return { hueA: 190, hueB: 208, intensity: 0.82 }; // dawn
  if (hour >= 9 && hour < 17) return { hueA: 186, hueB: 200, intensity: 1.0 }; // bright day
  if (hour >= 17 && hour < 21) return { hueA: 196, hueB: 230, intensity: 0.78 }; // golden dusk
  return { hueA: 205, hueB: 250, intensity: 0.56 }; // evening / night
}

/**
 * The hue band the site is allowed to paint in — the תכלת ladder, from the
 * greenest teal to the deepest azure, and not one degree past either.
 *
 * ⚠ THIS IS NOT DEFENSIVE PADDING; it closes a defect the tables really do
 *   produce. The night base already sits at hueB 250, and Pro Max asks for +22:
 *   composed naively that is 272, which is PURPLE. Nothing in the brand palette
 *   is purple, so between 21:00 and 05:00 the strongest model would have tinted
 *   the whole site a colour the design system does not contain — visible only to
 *   night visitors, which is the half of the day nobody reviews.
 *
 *   The upper bound is 255 rather than 250 so the night atmosphere still has
 *   somewhere to lean; the lower is 168 so the teal tilt is expressed in full.
 */
export const AMBIENCE_HUE_MIN = 168;
export const AMBIENCE_HUE_MAX = 255;

/**
 * Base + tilt, held inside the band. The CLAMP LIVES IN THE WRITER on purpose:
 * a tilt is a request from the configurator, and the ambience decides what it is
 * willing to paint. Enforcing it at the call site instead would mean every
 * future caller has to remember, and the one that forgets is the one that ships.
 */
export function composeHue(base: number, tilt: number): number {
  return Math.min(AMBIENCE_HUE_MAX, Math.max(AMBIENCE_HUE_MIN, base + tilt));
}
