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
  hero: {
    intent: "inquiry",
    label: "בירור מהיר בוואטסאפ",
    message: "היי MiaMe, אשמח לפרטים על מיה פור ועל מסלול התשלומים 🦋",
  },
  models: {
    intent: "inquiry",
    label: "בירור על הדגמים",
    message: "היי MiaMe, אשמח לעזרה בבחירת הדגם המתאים לי מבין שלושת הדגמים 🦋",
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
  spyqe: {
    intent: "order",
    label: "הרשמה לרכישה מוקדמת",
    message:
      "היי MiaMe, אשמח להירשם לרכישה מוקדמת של SPYQE ולקבל עדכון כשנפתחת ההזמנה 🦋",
  },
} as const satisfies Record<string, WaCta>;

export type WaCtaKey = keyof typeof WA_CTA;

/** Resolve a CTA to its live wa.me URL. */
export function waHref(key: WaCtaKey): string {
  return buildWhatsAppUrl(WA_CTA[key].message);
}
