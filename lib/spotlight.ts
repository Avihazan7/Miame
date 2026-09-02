/**
 * lib/spotlight.ts — which surfaces carry the cursor spotlight, in one place.
 *
 * The effect is the one genuinely new idea in the Matrix proposal: a soft light
 * that follows the pointer ACROSS A SINGLE CARD, rather than across the page.
 * The site already had a page-level spotlight (--mx/--my in AmbientLight); what
 * it lacked was the near-field one that makes a card feel like a physical panel
 * under a light rather than a rectangle that changes colour on hover.
 *
 * ── THREE DEPARTURES FROM THE PROPOSAL, EACH DELIBERATE ──────────────────────
 * 1. ONE LISTENER, NOT ONE PER CARD. The proposal attaches an onMouseMove
 *    handler to every card. `useMotionValue` keeps that off the render path, but
 *    it is still N listeners and N framer-motion subscriptions for an effect that
 *    can only be visible on one card at a time. This is a single delegated
 *    listener on the document, resolving the hovered surface with `closest()`.
 * 2. CSS VARIABLES, NOT A MOTION TEMPLATE. The gradient is written in the
 *    stylesheet and only two numbers cross the boundary. No component re-renders,
 *    and the effect works identically on a server-rendered card.
 * 3. THE COLOUR COMES FROM THE ROOM. The proposal hardcodes rgba(0,242,254) —
 *    and, in its own model map, a red for Pro Max. Both would be a second answer
 *    to "what colour is the site right now", which lib/model-ambience.ts already
 *    answers. The gradient is drawn in hsla(var(--amb-hue-a) …).
 *
 * The selector list lives here and the matching rules live in app/globals.css;
 * test/cardSpotlight.test.ts fails if one grows without the other, because a
 * surface listed here with no rule is a listener writing variables nobody reads.
 */

/**
 * Surfaces that light up under the pointer.
 *
 * Each one must already be `position:relative; overflow:hidden` and must have a
 * FREE `::before` — `.card`, `.feat-card` and `.life-card` are deliberately
 * absent because both of their pseudo-elements are already spoken for (the crown
 * line and the wax sweep), and stacking a third layer by wrapping them in a new
 * element would change markup for a decoration.
 */
export const SPOTLIT_SURFACES = ["card-stage", "elig-card", "tribute-calc"] as const;

/** The delegated listener's target selector. Derived — never typed twice. */
export const SPOTLIGHT_SELECTOR = SPOTLIT_SURFACES.map((c) => `.${c}`).join(",");

/** Custom properties the listener writes. Named here so the test can pin them. */
export const SPOTLIGHT_VARS = { x: "--cx", y: "--cy", on: "--spot" } as const;
