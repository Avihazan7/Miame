// brain/max.ts — Max workers: fast, cheap, single-purpose (Haiku tier).
// They execute; they do not deliberate (ULEASE_SPEC §7 — Max layer).
import { router } from "./router";
import type { Segment } from "./types";

/** Score a lead 0..100 by purchase-intent strength. Clamped; 0 on parse failure. */
export async function leadScorer(signals: Record<string, unknown>): Promise<number> {
  const system =
    "אתה Max-Scorer של MiaMe. דרג כוונת רכישה של ליד בסקאלה 0-100 לפי האותות. " +
    "החזר אך ורק מספר שלם, בלי טקסט.";
  const { text: out } = await router.generate({ task: "fast", system, user: JSON.stringify(signals), maxTokens: 8 });
  const n = parseInt(out.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

/** Classify a free-text message into a customer segment. */
export async function intentRouter(message: string): Promise<Segment> {
  const system =
    "סווג הודעה לאחד מ: commuter (קונה פרטי), fleet (מפעיל צי 5+), partner (שותף Hub), unknown. " +
    "החזר מילה אחת בלבד.";
  const { text } = await router.generate({ task: "fast", system, user: message, maxTokens: 4 });
  const out = text.toLowerCase();
  if (out.includes("fleet")) return "fleet";
  if (out.includes("partner")) return "partner";
  if (out.includes("commuter")) return "commuter";
  return "unknown";
}
