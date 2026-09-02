/**
 * lib/ambience.ts — the one channel between the configurator and the light.
 *
 * components/Configurator.tsx knows which model is selected. components/
 * AmbientLight.tsx owns the two CSS variables that colour the whole page. They
 * sit in different subtrees, and the light is mounted in app/layout.tsx while the
 * configurator lives on the homepage only, so React state cannot carry the value
 * between them.
 *
 * ── WHY NOT CONTEXT ──────────────────────────────────────────────────────────
 * A provider around the layout would re-render every consumer on every model
 * click. AmbientLight deliberately renders ONCE and then writes CSS custom
 * properties from an effect — that is the reason the cursor spotlight can run at
 * 60fps without React in the loop. Putting the model on context would put React
 * back in a path that was measured out of it.
 *
 * ── AND WHY NOT A DOM ATTRIBUTE ──────────────────────────────────────────────
 * Writing `data-model` on <html> from the configurator and reading it back with
 * a MutationObserver would work, and would make the DOM the source of truth for
 * a value neither component renders. This module is 20 lines and says exactly
 * what it is: one number, one setter, one subscription.
 *
 * A SINGLE WRITER. Nothing here touches the DOM. The tilt is published; only
 * AmbientLight composes it with the time-of-day base and writes the result. That
 * is what stops the two axes from overwriting each other — the failure the
 * five-minute time-of-day clock would otherwise cause every five minutes.
 */
import { AMBIENCE_BASE_TILT } from "./model-ambience";

type Listener = (tilt: number) => void;

let currentTilt: number = AMBIENCE_BASE_TILT;
const listeners = new Set<Listener>();

/** The tilt in effect right now, in degrees. */
export function ambienceTilt(): number {
  return currentTilt;
}

/** Publish a new tilt. A no-op when unchanged, so a re-render cannot restyle. */
export function setAmbienceTilt(tilt: number): void {
  if (tilt === currentTilt) return;
  currentTilt = tilt;
  for (const listen of listeners) listen(currentTilt);
}

/** Subscribe. Returns the unsubscribe, for an effect cleanup. */
export function onAmbienceTilt(listen: Listener): () => void {
  listeners.add(listen);
  return () => {
    listeners.delete(listen);
  };
}

/** Test-only reset. The module is a singleton, so a spec that publishes a tilt
 *  would otherwise leak it into the next spec in the same file. */
export function resetAmbienceForTest(): void {
  currentTilt = AMBIENCE_BASE_TILT;
  listeners.clear();
}
