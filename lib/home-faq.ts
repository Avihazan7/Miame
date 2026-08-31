// lib/home-faq.ts — the homepage FAQ, single source of truth for BOTH the visible
// <FaqHome> accordion and the FAQPage JSON-LD (they can never drift; the verify
// gate asserts the schema answers appear verbatim in the visible HTML).

import { SPYQE, SPYQE_TOTAL, SPYQE_BALANCE } from "@/lib/spyqe";
import { MIA_FOUR_DELIVERY_DAYS } from "@/lib/content";

export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "האם המימון ב-0% ריבית?",
    a: "כן, מסלולי התשלום הם ב-0% ריבית, בכפוף לאישור עסקה ולתנאי הספק.",
  },
  {
    q: "מה זמן האספקה?",
    a: `מיה פור נמצאת במלאי והאספקה אליכם עד ${MIA_FOUR_DELIVERY_DAYS} ימי עסקים, בכפוף לזמינות מלאי. ${SPYQE.name} הוא דגם בהזמנה מוקדמת ולכן זמן האספקה שלו שונה.`,
  },
  {
    q: "מהו טווח הנסיעה של מיה פור?",
    a: "טווח שימוש ריאלי עד 100 ק״מ; נתון יצרן עד 120 ק״מ. הסוללה נשלפת וניתנת להחלפה להגדלת הטווח.",
  },
  {
    q: "מה ההצעה על SPYQE ולמי היא?",
    a: `הזמנה מוקדמת של ${SPYQE.name}: מקדמה ${SPYQE.deposit.toLocaleString("he-IL")} ₪ ליבואן בהרשמה, והיתרה ${SPYQE_BALANCE.toLocaleString("he-IL")} ₪ ב-${SPYQE.months} תשלומים של ${SPYQE.monthlyPayment} ₪ שמתחילים עם הגעת המשלוח למחסני היבואן. סה״כ ${SPYQE_TOTAL.toLocaleString("he-IL")} ₪ במקום מחיר יבואן ${SPYQE.listPrice.toLocaleString("he-IL")} ₪, ללא ריבית והצמדה. ההטבה ל-${SPYQE.slots} הזוכים הראשונים.`,
  },
  {
    q: "מתי SPYQE יגיע, והאם ההרשמה מחייבת?",
    a: `אספקה משוערת עד ${SPYQE.deliveryBusinessDays} ימי עסקים מהמשלוח הראשון — הערכה ולא התחייבות. ההרשמה שומרת מקום במשלוח ואינה מחייבת ברכישה; הכמות, המחיר ומועד האספקה כפופים לעדכון ולאישור החברה/היבואן.`,
  },
  {
    q: "איך הופכים ל-MiaMe Hub?",
    a: "מודל שותפות רזה: אתם מחזיקים את הצי, MiaMe מביאה את הביקוש, ומשלמים 13% Success Fee מהפניות בלבד.",
  },
];

export function buildHomeFaqJsonLd(id: string) {
  return {
    "@type": "FAQPage",
    "@id": id,
    mainEntity: HOME_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
