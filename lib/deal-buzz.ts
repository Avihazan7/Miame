// lib/deal-buzz.ts — single source of truth for the MiaMe "Deal Buzz" layer.
//
// Honest urgency ONLY. Every line here is a real, verifiable value proposition or
// a genuine launch fact — never manufactured scarcity. The urgency comes from a
// real launch offer + honest "subject to availability" stock language, not from
// fake timers, fake stock counters, or fake "N people watching" widgets.
//
// FORBIDDEN_BUZZ_PATTERNS is the machine-checkable contract (see
// test/dealBuzz.test.ts): the rendered buzz copy must match NONE of them, so a
// future edit that sneaks in a fake countdown / fake stock number / "guaranteed
// approval" claim fails CI instead of shipping. Public copy also passes through
// the brand voice implicitly (short, direct, trustworthy, premium-but-calm).

/** What a buzz CTA does. "sim" scrolls to the simulator; "wa" opens WhatsApp. */
import type { LexName } from "@/components/LexIcon";

export type BuzzAction = "sim" | "wa";

export interface BuzzItem {
  id: string;
  /** Brand-lexicon icon name (aria-hidden in the UI). */
  icon: LexName;
  title: string;
  text: string;
  cta: string;
  action: BuzzAction;
  /** Prefilled WhatsApp message when action === "wa". */
  waMessage?: string;
}

export interface TrustSignal {
  /** Optional brand-lexicon icon name. */
  icon?: LexName;
  label: string;
}

// ── Launch offer (top strip) ────────────────────────────────────────────────
// "מבצע השקה" is a real launch promotion; "מלאי מוגבל לפי זמינות" is honest
// availability language (not a fabricated countdown or a fake unit counter).
export const LAUNCH_OFFER = {
  kicker: "מבצע השקה",
  title: "מבצע השקה, מיה פור",
  text: "בדיקת התאמה מהירה והצעה מותאמת לפי דגם, ישירות בוואטסאפ. מלאי מוגבל לפי זמינות.",
  cta: "לבדיקת התאמה מהירה",
} as const;

// ── Trust signals (compact bar, before fatigue) ─────────────────────────────
// Each is a real, checkable fact grounded in the site's own content
// (LegalStatus, seo-pages, models) — not a marketing superlative.
export const TRUST_SIGNALS: TrustSignal[] = [
  { icon: "shield", label: "יבואן רשמי · MEU" },
  { icon: "wrench", label: "אחריות ושירות 12 חודשים" },
  { icon: "percent", label: "מימון 0% ריבית*" },
  { icon: "check", label: "תקן קלנועית EN17128" },
  { icon: "chat", label: "שירות אישי בעברית" },
];

// ── Deal buzz cards (conversion nudges, after the simulator) ────────────────
// All four map to an Allowed action from the task's honest-urgency list.
export const DEAL_BUZZ_CARDS: BuzzItem[] = [
  {
    id: "match",
    icon: "search",
    title: "בדיקת התאמה מהירה",
    text: "נאתר איתך את הדגם והמסלול שמתאימים לך, לפי שימוש, טווח ותקציב.",
    cta: "התחלת בדיקה",
    action: "sim",
  },
  {
    id: "offer",
    icon: "receipt",
    title: "הצעה מותאמת לפי דגם",
    text: "בונים הצעת תשלום מותאמת תוך דקה ומקבלים אותה ישירות לוואטסאפ.",
    cta: "בניית הצעה",
    action: "sim",
  },
  {
    id: "eligibility",
    icon: "clipboard",
    title: "בדיקת זכאות למסלול",
    text: "נבדוק יחד איזה מסלול תשלומים פתוח עבורך, פרטי, עסקי או שותף. בכפוף לאישור עסקה.",
    cta: "בדיקת זכאות",
    action: "wa",
    waMessage: "היי MiaMe, אשמח לבדיקת זכאות למסלול תשלומים על מיה פור 🙂",
  },
  {
    id: "consult",
    icon: "chat",
    title: "שיחת ייעוץ ב-WhatsApp",
    text: "מעדיפים לדבר? נציג אמיתי יחזור אליך עם כל הפרטים על הדגמים והזמינות.",
    cta: "הזמנת בדיקה / תיאום שיחה",
    action: "wa",
    waMessage: "היי MiaMe, אשמח לשיחת ייעוץ ולתיאום בדיקת התאמה על מיה פור 🙂",
  },
];

// ── Required launch disclaimer (rendered wherever urgency appears) ───────────
// The exact wording concept mandated for go-live: pairs the launch/urgency
// messaging with an honest "subject to company/importer approval" caveat.
export const BUZZ_DISCLAIMER =
  "המחירים, המלאי והתנאים כפופים לעדכון ולאישור החברה/היבואן. השימוש באתר אינו מהווה התחייבות לאישור מימון או זמינות מלאי.";

// ── The no-fake-scarcity contract (enforced by test/dealBuzz.test.ts) ───────
// The concatenated buzz copy must match NONE of these. Kept deliberately narrow
// so honest copy ("מלאי מוגבל לפי זמינות", "0% ריבית*", "12 חודשים") never trips
// a false positive, while any fabricated counter/timer/guarantee does.
export const FORBIDDEN_BUZZ_PATTERNS: RegExp[] = [
  // fake "N people watching / viewing right now"
  /\d+\s*(אנשים|גולשים|צופים|מתעניינים|משתמשים|לקוחות)\s*(צופים|צפו|מתעניינים|קנו|רכשו|כרגע|עכשיו|באתר)/,
  // fake remaining-stock counter ("נשארו 3", "נותרו 2 יחידות")
  /(נשארו|נותרו|נותרה|נשאר)\s*\d+/,
  /\d+\s*(יחידות|כלים|פריטים)\s*(במלאי|אחרונים|בלבד|נותרו|נשארו)/,
  // fake countdown timer (HH:MM:SS) or "ends in N minutes/hours"
  /\b\d{1,2}:\d{2}(:\d{2})?\b/,
  /(מסתיים|נגמר|פג|תוקף)\s*(בעוד|תוך|בעוד עוד)?\s*\d+\s*(דקות|שעות|שניות)/,
  // false hard deadline
  /(רק\s*היום\s*בלבד|המבצע\s*מסתיים\s*היום|24\s*שעות\s*בלבד)/,
  // guaranteed approval / fake certainty on finance
  /(אישור\s*מובטח|מימון\s*מובטח|זכאות\s*מובטחת|מאושר\s*מיידית|מובטח\s*100)/,
];
