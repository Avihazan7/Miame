// lib/home-faq.ts — the homepage FAQ, single source of truth for BOTH the visible
// <FaqHome> accordion and the FAQPage JSON-LD (they can never drift; the verify
// gate asserts the schema answers appear verbatim in the visible HTML).

export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "האם המימון ב-0% ריבית?",
    a: "כן, מסלולי התשלום הם ב-0% ריבית, בכפוף לאישור עסקה ולתנאי הספק.",
  },
  {
    q: "מה זמן האספקה?",
    a: "אספקה מיידית, בכפוף לזמינות מלאי.",
  },
  {
    q: "מהו טווח הנסיעה של מיה פור?",
    a: "טווח שימוש ריאלי עד 100 ק״מ; נתון יצרן עד 120 ק״מ. הסוללה נשלפת וניתנת להחלפה להגדלת הטווח.",
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
