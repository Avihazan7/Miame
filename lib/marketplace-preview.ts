// M31 — Advanced Calm Marketplace UX: pure, presentation-agnostic data + copy for the
// demo-safe marketplace preview. Data ONLY — NO network, NO provider, NO Supabase write,
// NO 3D runtime. Every user-facing string lives here (rendered via {curly} interpolation)
// so the JSX stays quote-safe for `next lint` and the copy is unit-testable in node.

export type LeadFieldType = "radio" | "select" | "text" | "tel";

export interface LeadFieldOption {
  value: string;
  label: string;
}

export interface LeadField {
  name: string;
  /** Always a visible label — never placeholder-only. */
  label: string;
  type: LeadFieldType;
  required: boolean;
  /** Optional hint only; never the sole label. */
  placeholder?: string;
  options?: LeadFieldOption[];
}

export interface LeadStage {
  id: string;
  /** 1-based stage number shown in the stepper. */
  index: number;
  title: string;
  subtitle: string;
  fields: LeadField[];
}

// ── Stage 1: customer type + usage intent ──────────────────────────────────────
// ── Stage 2: route / budget / preferred vehicle ────────────────────────────────
// ── Stage 3: contact details (consent lives separately, see CONSENT) ───────────
export const LEAD_STAGES: LeadStage[] = [
  {
    id: "profile",
    index: 1,
    title: "מי אתם, ולמה",
    subtitle: "שני פרטים בלבד — כדי להבין את נקודת ההתחלה.",
    fields: [
      {
        name: "customer_type",
        label: "סוג לקוח",
        type: "radio",
        required: true,
        options: [
          { value: "private", label: "פרטי" },
          { value: "business", label: "עסק או צי" },
          { value: "hub", label: "שותף MiaMe Hub" },
        ],
      },
      {
        name: "usage_intent",
        label: "מטרת השימוש",
        type: "select",
        required: true,
        options: [
          { value: "city", label: "עירוני יומיומי" },
          { value: "field", label: "שטח וחוץ-עירוני" },
          { value: "fleet", label: "צי או השכרה" },
        ],
      },
    ],
  },
  {
    id: "match",
    index: 2,
    title: "מה מתאים לכם",
    subtitle: "כמה מסלולים — כדי לכוון את ההשוואה. הכול אופציונלי.",
    fields: [
      {
        name: "route",
        label: "מסלול טיפוסי",
        type: "select",
        required: false,
        options: [
          { value: "short", label: "קצר, בתוך העיר" },
          { value: "mixed", label: "מעורב, עיר ופרברים" },
          { value: "long", label: "ארוך, בין-עירוני" },
        ],
      },
      {
        name: "budget",
        label: "תקציב חודשי מבוקש",
        type: "select",
        required: false,
        options: [
          { value: "low", label: "עד 700 ש\"ח" },
          { value: "mid", label: "700 עד 1200 ש\"ח" },
          { value: "high", label: "מעל 1200 ש\"ח" },
        ],
      },
      {
        name: "preferred_vehicle",
        label: "רכב מועדף",
        type: "select",
        required: false,
        options: [
          { value: "undecided", label: "עוד לא החלטתי" },
          { value: "mia_four", label: "Mia FOUR" },
          { value: "compare", label: "רוצה להשוות כמה" },
        ],
      },
    ],
  },
  {
    id: "contact",
    index: 3,
    title: "איך נחזור אליכם",
    subtitle: "פרטי קשר — לשמירה על המכשיר בלבד בתצוגה זו.",
    fields: [
      {
        name: "full_name",
        label: "שם מלא",
        type: "text",
        required: true,
        placeholder: "לדוגמה: דנה כהן",
      },
      {
        name: "phone",
        label: "טלפון",
        type: "tel",
        required: true,
        placeholder: "לדוגמה: 050-0000000",
      },
    ],
  },
];

// Explicit consent — a real, separate, opt-in checkbox (never pre-checked).
export const CONSENT = {
  name: "consent",
  label:
    "אני מאשר/ת שנוכל לחזור אליי בנוגע להצעה. זו תצוגת דמו — לא נשלחת פנייה בפועל ולא מתבצעת העברה לספק.",
  required: true,
};

// Calm agentic skeleton copy — the ONLY approved lines. Visual reassurance while the
// (demo, client-only) comparison renders. This must never trigger a live computation.
export const SKELETON_STEPS: string[] = [
  "מנוע ההשוואה בוחן מסלולים...",
  "בודק התאמה בין תקציב, שימוש ותנאי מסלול...",
  "מכין כרטיסי החלטה לדוגמה...",
];

// Game-theory trust copy — explains the model without over-promising. Exact approved text.
export const TRUST_COPY =
  "המערכת בנויה לייצר התאמה שקופה בין הצורך שלך לבין הצעות ספקים. ההכנסה שלנו נוצרת רק כאשר מתקדמת עסקה מוסכמת ושקופה.";

// Demo-safety disclosure — shown on submit so the user knows nothing left the device.
export const DEMO_NOTICE =
  "תצוגת דמו — לא נשלחת פנייה, לא מתבצעת קריאת רשת, ולא מתבצעת העברה לספק. הנתונים נשארים על המכשיר בלבד.";

export interface DemoDecisionCard {
  id: string;
  title: string;
  tagline: string;
  attributes: { label: string; value: string }[];
  /** Every card discloses that its numbers are illustrative, never a guarantee. */
  note: string;
}

// Illustrative, clearly-disclosed sample cards — NOT offers, NOT guarantees.
export const DEMO_DECISION_CARDS: DemoDecisionCard[] = [
  {
    id: "city",
    title: "מסלול עירוני",
    tagline: "התאמה לנסועה קצרה ויומיומית",
    attributes: [
      { label: "אופי", value: "עירוני" },
      { label: "טווח לדוגמה", value: "עד 100 ק\"מ" },
      { label: "טעינה", value: "סוללה נשלפת" },
    ],
    note: "ערכים להמחשה בלבד — אינם הצעה מחייבת.",
  },
  {
    id: "mixed",
    title: "מסלול מעורב",
    tagline: "איזון בין עיר לפרברים",
    attributes: [
      { label: "אופי", value: "מעורב" },
      { label: "טווח לדוגמה", value: "עיר ופרברים" },
      { label: "גמישות", value: "סוללה להחלפה" },
    ],
    note: "ערכים להמחשה בלבד — אינם הצעה מחייבת.",
  },
  {
    id: "field",
    title: "מסלול שטח",
    tagline: "שימוש חוץ-עירוני ומגוון",
    attributes: [
      { label: "אופי", value: "שטח" },
      { label: "טווח לדוגמה", value: "תלוי שימוש" },
      { label: "כוח", value: "עד 4 מנועים" },
    ],
    note: "ערכים להמחשה בלבד — אינם הצעה מחייבת.",
  },
];

// The inert, spatial-ready hero slot — layout only, no renderer, no asset, no network.
export const HERO_SLOT = {
  dataAttr: "data-future-3d-slot",
  label: "אזור שמור לתצוגת רכב עתידית",
  caption: "מקום שמור לחוויית 3D/AR עתידית — אינו פעיל בתצוגה זו.",
};

// Phrases the trust / marketing copy must NEVER contain (over-promising / undisclosed
// objective claims). Enforced by test/marketplacePreview.test.ts.
export const FORBIDDEN_TRUST_PHRASES: string[] = [
  "אנחנו מרוויחים רק כשאתה חוסך",
  "חיסכון מובטח",
  "חסכון מובטח",
  "מובטח",
  "guaranteed",
];

/** Flat list of every lead field across the stages — convenience for validation/tests. */
export const allLeadFields = (): LeadField[] => LEAD_STAGES.flatMap((s) => s.fields);
