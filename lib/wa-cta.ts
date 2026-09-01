// lib/wa-cta.ts — the site's WhatsApp call-to-action vocabulary.
//
// The campaign has ONE contact route: MiaMe's WhatsApp line. Every section that
// can produce a lead offers it, with a message prefilled for THAT section — so
// the rep opens the chat already knowing what the person was looking at.
//
// Two intents, used consistently:
//   · בירור  — a question ("is this right for me / is it available")
//   · הזמנה  — intent to buy or reserve
//
// Pure string builders: no I/O, no clock. Safe to unit-test.

import { buildWhatsAppUrl } from "./whatsapp";
import { SPYQE, SPYQE_TOTAL, ils } from "./spyqe";

export type WaIntent = "inquiry" | "order";

export interface WaCta {
  /** Button label shown to the visitor. */
  label: string;
  /** Prefilled WhatsApp message. */
  message: string;
  intent: WaIntent;
}

/** Every WhatsApp entry point on the site, keyed by the section it lives in. */
export const WA_CTA = {
  // Same story as `models` below: the floating button and the sticky bar were
  // hand-rolling "אשמח לפרטים ולהצעת תשלום" while this entry — same intent, other
  // words — sat unused. The entry now carries the wording that has ACTUALLY been in
  // production, verbatim, so wiring both CTAs to the registry changes nothing the
  // rep reads. Unifying the two wordings is a copy decision and belongs to the
  // owner; removing the duplicate does not.
  hero: {
    intent: "inquiry",
    label: "בירור מהיר בוואטסאפ",
    message: "היי MiaMe, אשמח לפרטים ולהצעת תשלום 🦋",
  },
  // The header's WhatsApp button IS this section's entry point, and it was
  // hand-rolling its own wording while this entry sat unused — two vocabularies
  // for one funnel. The entry now carries the message that has ACTUALLY been in
  // production, verbatim, so wiring the header to the registry changes nothing the
  // rep reads. Two reasons the previous wording did not survive the merge, both
  // measured rather than preferred: the header is GLOBAL — it renders on /partners,
  // /eligibility and /rent-eilat, where "choosing between the models" is not why the
  // visitor is there — and "שלושת הדגמים" wrote the model count into prose while
  // lib/models.ts derives it, so a fourth model would have made the message false.
  // Changing the wording is a product decision and belongs to the owner, not to a
  // refactor that was only meant to remove a duplicate.
  // The link-in-bio hub. Its own entry rather than a reuse of `hero`, because the
  // whole reason the hub exists is to tell the networks apart: a WhatsApp click that
  // reports itself as `hero` merges social traffic back into the homepage's funnel
  // and undoes the attribution the UTM tagging was built for.
  "social-hub": {
    intent: "inquiry",
    label: "דברו איתי בוואטסאפ",
    message: "היי MiaMe, הגעתי מהרשתות ואשמח לפרטים על מיה פור 🦋",
  },
  models: {
    intent: "inquiry",
    label: "בירור על הדגמים",
    message: "היי MiaMe, אשמח לפרטים על הדגמים 🦋",
  },
  specs: {
    intent: "inquiry",
    label: "שאלה על המפרט",
    message: "היי MiaMe, יש לי שאלה על המפרט הטכני של מיה פור 🦋",
  },
  engineering: {
    intent: "inquiry",
    label: "בירור על השלדה והבטיחות",
    message: "היי MiaMe, אשמח לפרטים על השלדה, המתלים והבלימה של מיה פור 🦋",
  },
  legal: {
    intent: "inquiry",
    label: "בירור על המעמד החוקי",
    message: "היי MiaMe, יש לי שאלה על המעמד החוקי של קלנועית ועל התקנות 🦋",
  },
  delivery: {
    intent: "inquiry",
    label: "בירור זמינות ומסירה",
    message: "היי MiaMe, אשמח לבדוק זמינות ומסירה של מיה פור באזור שלי 🦋",
  },
  eligibility: {
    intent: "order",
    label: "בדיקת זכאות ורכישה דרך MiaMe",
    message: "היי, אשמח לבדוק זכאות לרכישת מיה פור דרך משרד הביטחון 🇮🇱",
  },
  order: {
    intent: "order",
    label: "הזמנה בוואטסאפ",
    message: "היי MiaMe, אני רוצה להזמין מיה פור. אשמח שתחזרו אליי לסגירת הפרטים 🦋",
  },
  faq: {
    intent: "inquiry",
    label: "לא מצאתם תשובה? דברו איתי",
    message: "היי MiaMe, יש לי שאלה שלא מצאתי עליה תשובה באתר 🦋",
  },
  // The old message said we would update the buyer "when ordering opens".
  // Ordering IS open, on stated terms — so the message now carries the exact
  // offer the sender is accepting. The agent on the other end should never have
  // to re-quote the price, the term or the delivery estimate.
  spyqe: {
    intent: "order",
    label: "הרשמה והזמנה מוקדמת",
    message:
      `היי MiaMe, אשמח להירשם להזמנה מוקדמת של ${SPYQE.name} — ` +
      `${ils(SPYQE.deposit)} מקדמה ועוד ${ils(SPYQE.monthlyPayment)} × ${SPYQE.months} תשלומים ` +
      `(${ils(SPYQE_TOTAL)} במקום ${ils(SPYQE.listPrice)}), ` +
      `במסגרת ${SPYQE.slots} הזוכים הראשונים 🦋`,
  },
} as const satisfies Record<string, WaCta>;

export type WaCtaKey = keyof typeof WA_CTA;

/** Resolve a CTA to its live wa.me URL. */
export function waHref(key: WaCtaKey): string {
  return buildWhatsAppUrl(WA_CTA[key].message);
}
