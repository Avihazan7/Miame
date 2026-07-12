// M30.1 — Marketplace Trust, Cognitive Conversion & RTL: pure, presentation-agnostic data + copy for the
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
    subtitle: "שני פרטים בלבד, כדי להבין את נקודת ההתחלה.",
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
    subtitle: "כמה מסלולים, כדי לכוון את ההשוואה. הכול אופציונלי.",
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
    subtitle: "פרטי קשר, לשמירה על המכשיר בלבד בתצוגה זו.",
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
    "אני מאשר/ת שנוכל לחזור אליי בנוגע להצעה. זו תצוגת דמו, לא נשלחת פנייה בפועל ולא מתבצעת העברה לספק.",
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
  "תצוגת דמו, לא נשלחת פנייה, לא מתבצעת קריאת רשת, ולא מתבצעת העברה לספק. הנתונים נשארים על המכשיר בלבד.";

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
    note: "ערכים להמחשה בלבד, אינם הצעה מחייבת.",
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
    note: "ערכים להמחשה בלבד, אינם הצעה מחייבת.",
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
    note: "ערכים להמחשה בלבד, אינם הצעה מחייבת.",
  },
];

// The inert, spatial-ready hero slot — layout only, no renderer, no asset, no network.
export const HERO_SLOT = {
  dataAttr: "data-future-3d-slot",
  label: "אזור שמור לתצוגת רכב עתידית",
  caption: "מקום שמור לחוויית 3D/AR עתידית, אינו פעיל בתצוגה זו.",
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

// ── M30.1 addendum — Lead orchestration & leasing education (non-live) ─────────
// Original content built from the text brief only. No external image/asset, no copied
// visual/layout/icon/color/text from any reference. Visual education only — no runtime.

export const HOW_IT_WORKS_TITLE = "איך ULease עובדת";
export const HOW_IT_WORKS_CAPTION =
  "התהליך להמחשה בלבד, בתצוגה זו אין אוטומציה חיה, אין קריאת ספק, ואין העברת פרטים בפועל.";

export interface HowItWorksStep {
  index: number;
  text: string;
  /** true = this step is illustrative/simulated in the preview (e.g. the sample comparison). */
  demo?: boolean;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  { index: 1, text: "ממלאים בקשה קצרה" },
  { index: 2, text: "המערכת מנקה ומבינה את הצורך" },
  { index: 3, text: "בוחרים מסלול: פרטי / עסקי / חברה" },
  { index: 4, text: "מקבלים השוואה לדוגמה", demo: true },
  { index: 5, text: "מאשרים אם להעביר פרטים לספק" },
  { index: 6, text: "ספק מתאים חוזר עם הצעה" },
  { index: 7, text: "ULease מלווה עד החלטה" },
];

// Trust tie-in microcopy — shown before any details are requested.
export const TRUST_TIE_IN = "אנחנו מסבירים את התהליך לפני שאנחנו מבקשים פרטים.";

export const LEASING_TERMS_TITLE = "10 מושגים שיעזרו לבחור עסקת רכב חכמה";

export interface LeasingTerm {
  term: string;
  /** Short, plain-Hebrew explanation. */
  explain: string;
  /** One practical meaning for the customer. */
  meaning: string;
  /** true = a ULease concept that is illustrative-only in this preview (e.g. Deal Score). */
  demo?: boolean;
}

export const LEASING_TERMS: LeasingTerm[] = [
  {
    term: "ליסינג תפעולי",
    explain: "שכירות רכב לתקופה קצובה כשהבעלות נשארת אצל חברת הליסינג; בסוף מחזירים את הרכב.",
    meaning: "משלמים על השימוש, לא על הבעלות, פחות התחייבות לטווח ארוך.",
  },
  {
    term: "ליסינג מימוני",
    explain: "מסלול שבו התשלומים מובילים לבעלות על הרכב בסוף התקופה, בדומה למימון רכישה.",
    meaning: "בסוף התהליך הרכב שלכם, מתאים למי שרוצה להחזיק ברכב.",
  },
  {
    term: "מקדמה",
    explain: "תשלום ראשוני בתחילת העסקה שמקטין את התשלום החודשי.",
    meaning: "מקדמה גבוהה יותר בדרך כלל מורידה את ההחזר החודשי.",
  },
  {
    term: "תשלום חודשי",
    explain: "הסכום הקבוע שמשלמים כל חודש עבור העסקה.",
    meaning: "כדאי לבדוק מה כלול בו (ביטוח, טיפולים) ולא רק את המספר עצמו.",
  },
  {
    term: "תקופת עסקה",
    explain: "משך הזמן שאליו מתחייבים בעסקה, בדרך כלל בחודשים.",
    meaning: "תקופה ארוכה יכולה להוזיל את החודשי אך מאריכה את ההתחייבות.",
  },
  {
    term: "שווי שימוש",
    explain: "סכום שמתווסף להכנסה החייבת במס כשמעסיק מעמיד רכב לעובד.",
    meaning: "משפיע על העלות נטו לעובד, חשוב בעסקאות דרך מקום העבודה.",
  },
  {
    term: "עלות כוללת / TCO",
    explain: "סך כל העלויות לאורך העסקה (Total Cost of Ownership), לא רק התשלום החודשי.",
    meaning: "המספר להשוואה אמיתית בין הצעות, כולל אנרגיה, ביטוח ותחזוקה.",
  },
  {
    term: "Deal Score",
    explain: "ציון דטרמיניסטי שמדרג עד כמה עסקה משתלמת לפי פרמטרים אחידים ושקופים.",
    meaning: "עוזר להשוות עסקאות באותה אמת-מידה. בתצוגה זו הציון הוא לדוגמה בלבד.",
    demo: true,
  },
  {
    term: "ספק מאושר",
    explain: "יבואן או חברת ליסינג שעברו בדיקת כשירות לפני שהם מציעים הצעה.",
    meaning: "ההצעות מגיעות ממקורות שנבדקו, לא מכל גורם אקראי.",
  },
  {
    term: "העברת פרטים באישור",
    explain: "הפרטים שלכם מועברים לספק רק לאחר שאתם מאשרים זאת במפורש.",
    meaning: "אתם בשליטה, אין העברה אוטומטית ללא הסכמה.",
  },
];
