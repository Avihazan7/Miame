// lib/seo-pages.ts — content model + data for the standalone SEO landing pages
// (MIA-081). These are keyword-focused entry points ("קלנועית 4 גלגלים",
// "קלנועית מתקפלת", "קלנועית שטח") that funnel back to the homepage simulator
// and the WhatsApp sales flow. All product claims are grounded in the importer
// data in lib/models.ts / lib/content.ts and phrased with the launch caution
// rules (no absolute promises; specs are importer data, subject to final spec,
// stock and deal terms).

import { MODELS } from "./models";

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoSection {
  h: string;
  body: string[];
}

export interface SeoRelated {
  href: string;
  label: string;
}

export interface SeoPage {
  slug: string;
  kicker: string;
  h1: string;
  title: string;
  description: string;
  lede: string;
  /** w/h are the file's REAL intrinsic pixels, verified by test/seoHeroIntrinsic.test.ts.
   *  The hero is the LCP element and renders first on mobile (order:-1), so a declared
   *  ratio that contradicts the file shifts the entire page when the image decodes —
   *  all four heroes shipped as 720×540 while none of the files is 4:3 (audit 31.08.26). */
  hero: { image: string; alt: string; w: number; h: number };
  sections: SeoSection[];
  specs?: { k: string; v: string }[];
  faq: SeoFaq[];
  related: SeoRelated[];
  breadcrumbName: string;
  /** Optional real-time 3D model (GLB), served from /public or a full URL. When
   *  set, the product stage offers a lazy, dynamic-imported 3D view. */
  /** Root-relative path to a GLB whose SUBJECT IS THIS PAGE'S VEHICLE. Set it only
   *  where the model and the page are the same machine: a 4×4 model on the folding
   *  page would be the "one photo, three alts" defect in three dimensions.
   *  Unset ⇒ Product360Stage renders the poster with no 3D control, by design. */
  glb?: string;
  /** Optional YouTube id for a lazy "how it works / unboxing" section. */
  howToVideoId?: string;
}

const CTA_NOTE =
  "המחירים, המפרטים והטווח מוצגים כנתוני יבואן/יצרן לצורך התרשמות, וכפופים לתנאי עסקה, זמינות מלאי ומפרט סופי. אינם מהווים הבטחה מוחלטת.";

const COMMON_SPECS: { k: string; v: string }[] = [
  { k: "פלטפורמה", v: "4 גלגלים מוגנת פטנט" },
  { k: "סוללה", v: "ליתיום נשלפת 60V" },
  { k: "מנוע", v: "עד 4 מנועים · 1,800W" },
  { k: "טווח שימוש ריאלי", v: 'עד 100 ק"מ (נתון יצרן עד 120)' },
  { k: "יבואן ואחריות", v: "MEU · Mayer Electric Utilities" },
  { k: "מחיר", v: "החל מ-19,900 ₪" }
];

/**
 * The model whose price each landing page quotes as its "from" price.
 *
 * WHY THIS EXISTS. The Product/Offer node for these pages used to take the
 * cheapest model in the whole catalogue, so every page advertised 19,900 ₪ —
 * including the off-road page, whose spec row, body copy, FAQ and meta
 * description all say 27,900 ₪ and which does not sell the city model at all.
 * A rich result quoting a price the page never offers is worse than no rich
 * result: the click lands on a number that disagrees with the SERP.
 *
 * It is keyed by slug rather than written into each entry so the whole set reads
 * at once, and test/seoSurfaceTruth.test.ts fails if any line here disagrees
 * with the cheapest price the page's own copy puts in front of a buyer — so it
 * cannot drift away from the pages it describes.
 */
/**
 * Which catalogue model each landing page quotes. Exported so a test can assert that
 * every id here names a real model: the map is the only place this pairing exists,
 * and a typo in it is invisible at runtime — see seoPageFromPrice below.
 */
export const FROM_MODEL_BY_SLUG: Record<string, string> = {
  "mia-four": "4x2",
  "klnoit-4-galgalim": "4x2",
  "klnoit-mitkapelet": "4x2",
  "klnoit-shetach": "4x4"
};

/**
 * The "from" price a landing page quotes, in ₪ — the only number its Offer node
 * may carry. Derived from lib/models.ts, the same single source the copy is
 * written against. An unmapped slug returns null on purpose: a page with no
 * declared model must publish NO price rather than fall back to one it does not
 * offer, which is precisely how the defect above arose.
 */
export function seoPageFromPrice(page: SeoPage): number | null {
  const modelId = FROM_MODEL_BY_SLUG[page.slug];
  if (!modelId) return null;
  // getModel() FAILS OPEN — `MODELS.find(...) ?? MODELS[0]` — so a typo in the map
  // above would hand back the 19,900 city model and publish it as this page's price:
  // the exact defect this function exists to end, re-entering through the back door.
  // Resolve against MODELS directly and return null when the id is not there.
  const model = MODELS.find((m) => m.id === modelId);
  return model ? model.price : null;
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "mia-four",
    kicker: "MIA FOUR",
    h1: "מיה פור (MIA FOUR), ניידות חשמלית פרימיום על 4 גלגלים",
    title: "מיה פור MIA FOUR, קלנועית חשמלית פרימיום על 4 גלגלים",
    description:
      "כל מה שצריך לדעת על מיה פור (MIA FOUR): פלטפורמת 4 גלגלים מוגנת פטנט, סוללת ליתיום נשלפת 60V, עד 4 מנועים, שלושה דגמים והחל מ-19,900 ₪. בנו הצעת תשלום תוך דקה.",
    lede: "מיה פור היא קלנועית חשמלית פרימיום על פלטפורמת ארבעה גלגלים מוגנת פטנט, יציבה, נשלטת וחכמה. כאן ריכזנו את כל המידע: הדגמים, הסוללה, הטווח, האחריות ומסלולי התשלום, כדי שתוכלו לבחור נכון ולהתקדם לעסקה במיידי.",
    hero: {
      image: "/mia-four-x6-studio.webp",
      w: 1400,
      h: 1498,
      alt: "מיה פור X6, קלנועית חשמלית פרימיום על 4 גלגלים, צילום סטודיו"
    },
    // The MIA FOUR hub: the X4 is a legitimate representative of the platform this
    // page is about, and the viewer's own title names which model it is showing.
    glb: "/models/mia-four-x4.glb",
    sections: [
      {
        h: "מה זה מיה פור?",
        body: [
          "מיה פור (MIA FOUR) היא קלנועית חשמלית מסוג מיקרו-מוביליטי על ארבעה גלגלים. בשונה מקלנועית תלת-גלגלית או מקורקינט, הפלטפורמה בת ארבעת הגלגלים, המוגנת בפטנט, מעניקה בסיס רחב ויציב שמפחית תחושת התהפכות בפניות, בעליות ובתוואי לא אחיד. התוצאה היא חוויית נהיגה בטוחה ונינוחה יותר, גם למי שמחפש ניידות יומיומית וגם למי שרוצה קלנועית לפנאי ולשטח קל.",
          "הקלנועית מיועדת למגוון רחב של רוכבים: תושבי עיר שרוצים חלופה חכמה לרכב לנסיעות קצרות, מבוגרים שמחפשים עצמאות ותנועה בטוחה, אנשי עסקים שמפעילים צי השכרה, וגופים שזקוקים לפתרון ניידות בשטח מתוחם. מיה פור משווקת בישראל דרך יבואן רשמי (MEU · Mayer Electric Utilities), עם אחריות יבואן רשמי, חלפים מקוריים ומסירה מתואמת בכל אזורי הארץ."
        ]
      },
      {
        h: "שלושת הדגמים",
        body: [
          "קו מיה פור כולל שלושה דגמים שנבדלים בעיקר בהנעה ובטווח. דגם 2×4 City הוא העירוני החכם, קל, זריז ומתאים לנסיעות יומיומיות בעיר, החל מ-19,900 ₪. דגם 2×4 City Long Range מביא סוללה בקיבולת מוגברת (35Ah) לטווח מורחב, למי שעושה קילומטראז' יומי גבוה, החל מ-21,900 ₪.",
          "דגם 4×4 Pro Max הוא הבכיר: ארבעה מנועים והנעה כפולה שנותנים אחיזה וכוח בעליות ובתוואי שטח, החל מ-27,900 ₪. בכל הדגמים הסוללה נשלפת וניתנת לטעינה בבית או במשרד, כך שאפשר להחזיק סוללה נוספת ולהכפיל בפועל את הטווח היומי. את הבחירה המדויקת אפשר לחדד תוך דקה בסימולטור ההתאמה בעמוד הבית."
        ]
      },
      {
        h: "סוללה, טווח וטעינה",
        body: [
          "כל הדגמים מונעים בסוללת ליתיום נשלפת במתח 60V. טווח השימוש הריאלי מגיע עד כ-100 ק\"מ (נתון יצרן עד 120 ק\"מ), ותלוי במשקל הרוכב, בתוואי, במהירות ובתנאי מזג האוויר. היתרון המרכזי הוא הסוללה הנשלפת: אין צורך בעמדת טעינה ייעודית, שולפים, טוענים משקע ביתי רגיל, ומחזירים.",
          "מי שזקוק לטווח גדול יותר יכול להצטייד בסוללה נוספת ולהחליף אותה בשטח בתוך שניות. זהו הבדל מהותי מול כלים עם סוללה קבועה, והוא מה שהופך את מיה פור לפרקטית גם לימי עבודה ארוכים וגם לטיולים."
        ]
      },
      {
        h: "אחריות, שירות ומסלולי תשלום",
        body: [
          "מיה פור נמכרת עם אחריות יבואן רשמי (MEU · Mayer Electric Utilities), כולל שירות וחלפים מקוריים ומסירה מתואמת בכל אזורי הארץ. לפני רכישה מומלץ לתאם נסיעת מבחן כדי להתרשם מהיציבות ומהנוחות בפועל.",
          "ב-MiaMe בונים את הצעת התשלום שמתאימה לכם: מזינים מקדמה ומספר תשלומים בסימולטור ומקבלים אומדן תשלום חודשי, ואז שולחים אותו ישירות לנציג בוואטסאפ להמשך טיפול. מסלולי התשלום מוצעים ב-0% ריבית בכפוף לאישור עסקה, עד 18 תשלומים ללא ריבית והצמדה."
        ]
      }
    ],
    specs: COMMON_SPECS,
    faq: [
      {
        q: "מה ההבדל בין הדגמים של מיה פור?",
        a: "2×4 City הוא העירוני הזריז (החל מ-19,900 ₪), 2×4 City Long Range מציע טווח מורחב עם סוללת 35Ah (החל מ-21,900 ₪), ו-4×4 Pro Max הוא בעל הנעה כפולה וארבעה מנועים לשטח (החל מ-27,900 ₪)."
      },
      {
        q: "מהו טווח הנסיעה של מיה פור?",
        a: 'טווח שימוש ריאלי עד כ-100 ק"מ, נתון יצרן עד 120 ק"מ. הסוללה נשלפת וניתן להחזיק סוללה נוספת להגדלת הטווח היומי. הטווח בפועל תלוי במשקל, בתוואי ובמהירות.'
      },
      {
        q: "האם המימון ב-0% ריבית?",
        a: "כן, מסלולי התשלום מוצעים ב-0% ריבית, בכפוף לאישור עסקה ולתנאי הספק. אפשר לבנות הצעת תשלום מותאמת בסימולטור ולקבל אותה בוואטסאפ."
      },
      {
        q: "איפה מקבלים שירות ואחריות?",
        a: "מיה פור מיובאת רשמית על ידי MEU · Mayer Electric Utilities, עם אחריות יבואן רשמי, שירות וחלפים מקוריים, ומסירה מתואמת בכל אזורי הארץ."
      }
    ],
    related: [
      { href: "/klnoit-4-galgalim", label: "קלנועית 4 גלגלים, יציבות ובטיחות" },
      { href: "/klnoit-mitkapelet", label: "קלנועית מתקפלת, נכנסת לרכב" },
      { href: "/klnoit-shetach", label: "קלנועית שטח, הנעה כפולה 4×4" }
    ],
    breadcrumbName: "מיה פור",
    howToVideoId: "gbioqYddCxE"
  },
  {
    slug: "klnoit-4-galgalim",
    kicker: "קלנועית 4 גלגלים",
    h1: "קלנועית 4 גלגלים, יציבות, בטיחות וביטחון בכל נסיעה",
    title: "קלנועית 4 גלגלים חשמלית, יציבה ובטוחה",
    description:
      "למה קלנועית 4 גלגלים בטוחה ויציבה יותר מתלת-גלגלית? מיה פור על פלטפורמה מוגנת פטנט, סוללה נשלפת 60V והחל מ-19,900 ₪. בנו הצעת תשלום תוך דקה.",
    lede: "קלנועית על ארבעה גלגלים נותנת מה שהכי חשוב בניידות יומיומית, תחושת ביטחון. הבסיס הרחב של מיה פור מפזר את המשקל על ארבע נקודות אחיזה ומקטין את הסיכון להטיה בפניות ובתוואי לא אחיד.",
    // A page about FOUR wheels was fronted by a side profile, which is the one
    // angle that shows two. This is the manufacturer's head-on frame (2026-09-02):
    // both wheel pairs of both machines are countable in it, which is the page's
    // entire claim, and it is 1500px against 1000px for a slot that asks for 50vw
    // (≈1440px at 2× on a 1440 screen — the old file could not fill it).
    hero: {
      image: "/mia-four-bridge-front.jpg",
      w: 1500,
      h: 1000,
      alt: "שתי קלנועיות מיה פור במבט חזית על גשר · ארבעה גלגלים לכל אחת, בסיס רחב ויציב"
    },
    sections: [
      {
        h: "למה דווקא 4 גלגלים?",
        body: [
          "ההבדל בין שלושה גלגלים לארבעה הוא לא רק מספרי. קלנועית תלת-גלגלית נשענת על גלגל קדמי בודד, ולכן רגישה יותר להטיה בפנייה חדה, על מדרכה משופעת או כשעוברים על מכשול. פלטפורמת ארבעת הגלגלים של מיה פור, המוגנת בפטנט, יוצרת מלבן אחיזה יציב שמפזר את המשקל ומעניק תחושת קרקע איתנה, במיוחד בעצירות, בהאצות ובפניות.",
          "היציבות הזו חשובה לכל רוכב, אך במיוחד למבוגרים, למי שחזר לניידות אחרי תקופה, ולכל מי שרוצה לצאת לדרך בלי חשש. ארבעה גלגלים גם משפרים את האחיזה בכביש רטוב ואת הנוחות על תוואי לא מושלם."
        ]
      },
      {
        h: "בטיחות שמורגשת כבר בנסיעת המבחן",
        body: [
          "יציבות היא לא מפרט על הנייר, היא הרגשה. לכן אנחנו ממליצים לתאם נסיעת מבחן ולחוות את ההבדל: איך הקלנועית מתנהגת בפנייה, איך היא עוצרת, ואיך היא מרגישה בהאטה. מיה פור תוכננה כך שגם רוכב מתחיל ירגיש שליטה מלאה תוך דקות.",
          "מעבר לבסיס הרחב, הקלנועית כוללת מערכות שנועדו לנסיעה בטוחה ונשלטת. השילוב של יציבות מבנית, בלימה ומהירות מבוקרת הופך את מיה פור לבחירה שקטה ובטוחה לנסיעות עירוניות יומיומיות."
        ]
      },
      {
        h: "לאיזה שימוש זה מתאים?",
        body: [
          "קלנועית 4 גלגלים מתאימה למגוון רחב: נסיעות יומיומיות בעיר, קניות, הגעה לעבודה, טיולים בשכונה ובטיילת, וגם שימוש עסקי בצי השכרה. דגם 2×4 City העירוני הוא נקודת הכניסה הפופולרית (החל מ-19,900 ₪), ולמי שרוצה טווח גדול יותר יש את 2×4 City Long Range.",
          "הסוללה הנשלפת (60V) מאפשרת טעינה מכל שקע ביתי, כך שאין תלות בעמדת טעינה. אפשר לבנות את הצעת התשלום המתאימה בסימולטור בעמוד הבית ולקבל אותה מיד בוואטסאפ."
        ]
      }
    ],
    specs: COMMON_SPECS,
    faq: [
      {
        q: "קלנועית 4 גלגלים באמת יציבה יותר מ-3 גלגלים?",
        a: "כן. ארבע נקודות אחיזה יוצרות בסיס רחב שמפזר את המשקל ומקטין הטיה בפניות ובתוואי משופע, לעומת גלגל קדמי בודד בתלת-גלגלית. את ההבדל הכי טוב לחוות בנסיעת מבחן."
      },
      {
        q: "האם צריך רישיון לקלנועית מיה פור?",
        a: "דרישות הרישוי והשימוש כפופות לחוקי התעבורה והוראות הדין הרלוונטיות. נשמח להסביר את הפרטים בשיחה לפני הרכישה."
      },
      {
        q: "כמה עולה קלנועית 4 גלגלים של מיה פור?",
        a: "מחיר פתיחה החל מ-19,900 ₪ לדגם 2×4 City העירוני. אפשר לבנות הצעת תשלום ב-0% ריבית בסימולטור, בכפוף לאישור עסקה ולתנאי הספק."
      }
    ],
    related: [
      { href: "/mia-four", label: "מיה פור, כל הדגמים והמפרט" },
      { href: "/klnoit-mitkapelet", label: "קלנועית מתקפלת לרכב" },
      { href: "/klnoit-shetach", label: "קלנועית שטח 4×4" }
    ],
    breadcrumbName: "קלנועית 4 גלגלים"
  },
  {
    slug: "klnoit-mitkapelet",
    kicker: "קלנועית מתקפלת",
    h1: "קלנועית מתקפלת, נכנסת לרכב, יוצאת לכל מקום",
    title: "קלנועית מתקפלת חשמלית, נכנסת לתא המטען",
    description:
      "קלנועית מתקפלת עם כיסא בשחרור מהיר שנכנסת לרכב, מיה פור 2×4 City העירונית, סוללה נשלפת 60V, החל מ-19,900 ₪. בנו הצעת תשלום תוך דקה וקבלו בוואטסאפ.",
    lede: "החופש האמיתי הוא לקחת את הניידות איתך. מיה פור מתקפלת ומאפשרת שליפה מהירה של הכיסא, כדי שתוכלו להכניס אותה לרכב, לאחסן בבית או להעמיס לטיול, בלי להתפשר על יציבות של ארבעה גלגלים.",
    hero: {
      image: "/mia-fold-trunk.webp",
      w: 1100,
      h: 733,
      alt: "קלנועית מיה פור מתקפלת נכנסת לתא המטען של הרכב"
    },
    sections: [
      {
        h: "ניידות שנוסעת איתכם",
        body: [
          "אחד היתרונות הגדולים של מיה פור הוא היכולת לצמצם נפח בקלות. הכיסא ניתן לשליפה בשחרור מהיר, והמבנה מאפשר להכניס את הקלנועית לרכב פרטי מתאים או לאחסן אותה בפינה בבית. כך אפשר להגיע ברכב לחוף, לפארק או לעיר אחרת, ולהמשיך משם על מיה פור.",
          "בשונה מכלים גדולים ונוקשים, קלנועית מתקפלת מעניקה גמישות אמיתית: היא לא כובלת אתכם לרדיוס נסיעה מהבית, אלא הופכת לחלק מהרכב ומהשגרה. זה פתרון מצוין לתושבי עיר עם חניה מוגבלת, למטיילים ולכל מי שרוצה ניידות בלי כאב ראש של אחסון."
        ]
      },
      {
        h: "יציבות של 4 גלגלים, גמישות של קלנועית מתקפלת",
        body: [
          "היתרון של מיה פור הוא שלא צריך לבחור בין יציבות לניידות. גם כשהיא מתקפלת ומתאימה לרכב, הבסיס נשאר פלטפורמת ארבעת הגלגלים המוגנת פטנט, עם כל תחושת הביטחון שהיא מספקת. אתם מקבלים קלנועית בטוחה ויציבה בנסיעה, ופרקטית לאחסון ולהובלה.",
          "דגם 2×4 City העירוני הוא הבחירה הטבעית לשימוש הזה: קל, זריז ומתאים לנסיעות קצרות בעיר, החל מ-19,900 ₪. הסוללה הנשלפת (60V) מתקפלת יחד עם היתר, שולפים אותה, טוענים בבית, ומחזירים."
        ]
      },
      {
        h: "למי הקלנועית המתקפלת מתאימה?",
        body: [
          "פתרון זה מתאים במיוחד לתושבי עיר, לבעלי דירות ללא מחסן, למטיילים שאוהבים לשלב רכב וניידות חשמלית, ולמשפחות שרוצות כלי אחד שאפשר להזיז בקלות. גם עסקים שמפעילים צי השכרה מעריכים את היכולת להעמיס ולפרוק במהירות.",
          "רוצים לוודא שהקלנועית נכנסת לרכב שלכם ומתאימה לצרכים? תאמו נסיעת מבחן, ובנו בינתיים את הצעת התשלום המתאימה בסימולטור בעמוד הבית, היא תגיע ישירות לנציג בוואטסאפ."
        ]
      }
    ],
    specs: COMMON_SPECS,
    faq: [
      {
        q: "מיה פור באמת נכנסת לרכב?",
        a: "הכיסא ניתן לשליפה בשחרור מהיר והמבנה מאפשר הכנסה לרכב פרטי מתאים או אחסון ביתי. מומלץ לתאם נסיעת מבחן כדי לוודא התאמה לרכב ולצרכים שלכם."
      },
      {
        q: "האם קיפול פוגע ביציבות?",
        a: "לא. גם כקלנועית מתקפלת, הבסיס נשאר פלטפורמת ארבעת הגלגלים המוגנת פטנט, כך שתחושת הביטחון בנסיעה נשמרת."
      },
      {
        q: "כמה עולה הקלנועית המתקפלת?",
        a: "דגם 2×4 City העירוני המתאים לשימוש זה מתחיל מ-19,900 ₪. אפשר לבנות מסלול תשלום ב-0% ריבית בסימולטור, בכפוף לאישור עסקה ולתנאי הספק."
      }
    ],
    related: [
      { href: "/mia-four", label: "מיה פור, כל הדגמים והמפרט" },
      { href: "/klnoit-4-galgalim", label: "קלנועית 4 גלגלים, יציבות" },
      { href: "/klnoit-shetach", label: "קלנועית שטח 4×4" }
    ],
    breadcrumbName: "קלנועית מתקפלת"
  },
  {
    slug: "klnoit-shetach",
    kicker: "קלנועית שטח",
    h1: "קלנועית שטח, הנעה כפולה 4×4 לכל תוואי",
    title: "קלנועית שטח חשמלית 4×4, כוח ואחיזה",
    description:
      "קלנועית שטח מיה פור 4×4 Pro Max: ארבעה מנועים 1,800W, הנעה כפולה, סוללה נשלפת 60V וטווח שימוש עד 100 ק\"מ. החל מ-27,900 ₪. בנו הצעת תשלום תוך דקה.",
    lede: "כשהדרך נגמרת, מיה פור 4×4 Pro Max רק מתחילה. הנעה כפולה וארבעה מנועים נותנים אחיזה וכוח בעליות, בחול ובתוואי לא סלול, בלי לוותר על היציבות של פלטפורמת ארבעת הגלגלים.",
    // 554×554 was the smallest file on the site, and it was the LCP element AND the
    // OpenGraph card of the page whose whole subject is terrain — a studio render on
    // black, illustrating "אחיזה וכוח בעליות, בחול ובתוואי לא סלול". This is the
    // manufacturer's sand frame from the same shoot as the beach photographs
    // (2026-09-02): the tyres loaded, the coil compressed, sand thrown behind. The
    // lede above is not being illustrated any more, it is being shown.
    hero: {
      image: "/mia-four-x4-sand-traction.jpg",
      w: 1500,
      h: 1000,
      alt: "מיה פור 4×4 Pro Max בחול · צמיגי שטח, מתלה קפיצי ובלם דיסק בתנועה"
    },
    // The committed GLB IS this machine: build-glb.mjs authors a 4×4 X4 with
    // off-road tires and teal hubs, and this page's own hero photo is the X4 —
    // the fender decal reading "MIA FOUR X4" is legible in the frame itself.
    glb: "/models/mia-four-x4.glb",
    sections: [
      {
        h: "כוח ואחיזה לכל מסלול",
        body: [
          "דגם 4×4 Pro Max של מיה פור בנוי לתוואי מאתגר. ארבעה מנועים בהספק 1,800W והנעה כפולה מספקים מומנט ואחיזה שמאפשרים להתמודד עם עליות, משטחים חוליים ודרכי עפר. זו הקלנועית למי שלא מסתפק בעיר, לטיולים בטבע, לשטח חקלאי, לחופים ולכל מקום שדורש יותר מקלנועית עירונית.",
          "החוזק הזה לא בא על חשבון היציבות. הבסיס נשאר פלטפורמת ארבעת הגלגלים המוגנת פטנט, כך שגם בשטח לא אחיד הקלנועית שומרת על תחושת קרקע איתנה. השילוב של אחיזה, כוח ויציבות הוא מה שהופך את 4×4 Pro Max לבכיר הקו."
        ]
      },
      {
        h: "סוללה נשלפת וטווח לשטח",
        body: [
          "גם בשטח, הסוללה הנשלפת (60V) היא יתרון מכריע. טווח השימוש הריאלי מגיע עד כ-100 ק\"מ (נתון יצרן עד 120 ק\"מ), ומי שיוצא ליום שלם בטבע יכול להצטייד בסוללה נוספת ולהחליף אותה בשטח בתוך שניות, בלי לחפש עמדת טעינה.",
          "כך אפשר לתכנן מסלולים ארוכים בביטחון: הטווח בפועל תלוי בתוואי, במשקל ובסגנון הנהיגה, אבל היכולת להחליף סוללה מסירה את חרדת הטווח שמלווה כלים חשמליים רבים."
        ]
      },
      {
        h: "למי מתאימה קלנועית שטח?",
        body: [
          "קלנועית שטח 4×4 מתאימה לחקלאים ולבעלי משקים, לאנשי שטח ותחזוקה, למטיילים שרוצים להגיע רחוק, ולעסקים כמו אתרי תיירות, חופים ומתחמים מתוחמים שזקוקים לקלנועית אמינה. מחיר הפתיחה של 4×4 Pro Max הוא החל מ-27,900 ₪ והוא מגיע עם אחריות יבואן רשמי (MEU).",
          "לא בטוחים אם 4×4 Pro Max הוא הדגם עבורכם או שמספיק 2×4 City Long Range? בנו את הצעת התשלום בסימולטור בעמוד הבית, ותאמו נסיעת מבחן כדי להרגיש את הכוח והאחיזה בעצמכם."
        ]
      }
    ],
    specs: [
      { k: "דגם", v: "4×4 Pro Max, הבכיר" },
      { k: "הנעה", v: "כפולה · 4 מנועים 1,800W" },
      { k: "סוללה", v: "ליתיום נשלפת 60V" },
      { k: "טווח שימוש ריאלי", v: 'עד 100 ק"מ (נתון יצרן עד 120)' },
      { k: "יבואן ואחריות", v: "MEU · Mayer Electric Utilities" },
      { k: "מחיר", v: "החל מ-27,900 ₪" }
    ],
    faq: [
      {
        q: "מה מייחד את דגם 4×4 Pro Max לשטח?",
        a: "הנעה כפולה וארבעה מנועים 1,800W שמספקים כוח ואחיזה בעליות, בחול ובדרכי עפר, על בסיס פלטפורמת ארבעת הגלגלים היציבה."
      },
      {
        q: "מה הטווח בשטח?",
        a: 'טווח שימוש ריאלי עד כ-100 ק"מ (נתון יצרן עד 120), תלוי בתוואי ובנהיגה. הסוללה נשלפת וניתן להחליף סוללה נוספת בשטח להגדלת הטווח.'
      },
      {
        q: "כמה עולה קלנועית שטח מיה פור?",
        a: "דגם 4×4 Pro Max מתחיל מ-27,900 ₪ עם אחריות יבואן רשמי. אפשר לבנות מסלול תשלום ב-0% ריבית בסימולטור, בכפוף לאישור עסקה ולתנאי הספק."
      }
    ],
    related: [
      { href: "/mia-four", label: "מיה פור, כל הדגמים והמפרט" },
      { href: "/klnoit-4-galgalim", label: "קלנועית 4 גלגלים, יציבות" },
      { href: "/klnoit-mitkapelet", label: "קלנועית מתקפלת לרכב" }
    ],
    breadcrumbName: "קלנועית שטח"
  }
];

export function getSeoPage(slug: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.slug === slug);
}

export const SEO_CTA_NOTE = CTA_NOTE;
