// lib/eligibility.ts — the content model for /eligibility.
//
// WHY THIS FILE EXISTS. /eligibility was the owner's stated priority topic
// ("ניידות · משרד הביטחון · אגף שיקום") and, until 2026-09-09, it rendered nothing
// of its own: <Tribute /> + <LegalStatus />, both of which already render on the
// homepage, under an `sr-only` H1. Measured: 31 of its 33 content segments were
// verbatim identical to the homepage, its title/H1/description contained none of
// קלנועית · מיה פור · ניידות · אגף שיקום, and it was the only content page on the
// site with no FAQ — on the most question-shaped subject the site touches.
//
// ── THE RULE THIS FILE IS WRITTEN UNDER ──────────────────────────────────────
// Everything here sits at one of two levels and NEVER above them:
//     (a) "we serve this audience"  ·  (b) "this product may suit you".
// It never says (c) "you are entitled to funding" or (d) "we handle the process".
// Only משרד הביטחון — אגף השיקום / אגף משפחות והנצחה — decides (c), and MiaMe is
// not a party to it. Every passage below either states a product fact that already
// exists elsewhere in this repo, or states that the determination belongs to the
// department. That is also why the copy repeatedly names the deciding body: an
// answer engine that quotes one paragraph out of context must still carry the
// caveat, because a passage is the unit an engine lifts, not a page.
//
// The frozen figures (עד 100% · 90% · 10% · 17,988 ₪) are NOT restated here. They
// live in components/Tribute.tsx, which carries the legal review note, and this
// page renders that component. One number, one home.

export interface EligibilitySection {
  h: string;
  body: string[];
}

export interface EligibilityFaq {
  q: string;
  a: string;
}

/** The boundary sentence. Repeated deliberately in the lede, in the sections and in
 *  the FAQ, because each is a separately quotable passage. */
export const AUTHORITY_NOTE =
  "הזכאות, שיעור המימון והתנאים נקבעים על ידי משרד הביטחון בלבד — אגף השיקום או אגף משפחות והנצחה, לפי העניין — ואינם נקבעים על ידי MiaMe או על ידי היבואן.";

export const ELIGIBILITY_LEDE =
  "מיה פור היא קלנועית חשמלית על ארבעה גלגלים, והיא רלוונטית לזכאי ניידות של משרד הביטחון בשני מסלולים נפרדים: אגף השיקום לנכי צה\"ל וכוחות הביטחון, ואגף משפחות והנצחה לבני משפחות שכולות. " +
  AUTHORITY_NOTE +
  " הדף הזה מסביר מה כל מסלול הוא, לאן פונים, ומה MiaMe כן ולא עושה בדרך.";

export const ELIGIBILITY_SECTIONS: EligibilitySection[] = [
  {
    h: "שני מסלולים נפרדים, ושתי כתובות שונות",
    body: [
      "ניידות במימון משרד הביטחון אינה מסלול אחד. נכי צה\"ל וכוחות הביטחון מטופלים באגף השיקום, לפי הזכאות הרפואית והתפקודית שנקבעה בעניינם. בני משפחות שכולות מטופלים באגף משפחות והנצחה, במסלול מענק נפרד לרכישת קלנועית. שני האגפים הם גופים שונים, עם קריטריונים שונים ועם תהליך אישור נפרד — ומי שפונה לאגף הלא נכון מאבד זמן.",
      "לכן הכרטיסים שלמעלה מפרידים ביניהם ומקשרים לעמוד הזכאות הרשמי של כל אגף. מספרי הסבסוד והמענק המוצגים שם הם המספרים שהאגף עצמו מפרסם, וההכרעה בעניין אדם מסוים היא של האגף בלבד.",
      AUTHORITY_NOTE,
    ],
  },
  {
    h: "אישור עקרוני לפני הרכישה, לא אחריה",
    body: [
      "בשני המסלולים הסדר חשוב: הזכאות נבדקת ומאושרת מול האגף לפני הרכישה, לא אחריה. רכישה שנעשתה בלי אישור עקרוני עלולה שלא להיכנס למימון כלל, גם אם הזכאות עצמה קיימת.",
      "בפועל זה אומר שהצעד הראשון הוא מול משרד הביטחון ולא מולנו. אנחנו נשמח לתת לכם את מה שנדרש מהצד שלנו — מפרט הכלי, הצעת מחיר בכתב ופרטי היבואן הרשמי — כדי שתגישו לאגף מסמך מלא. את הבקשה עצמה מגיש הזכאי או מי שמלווה אותו, מול האגף.",
    ],
  },
  {
    h: "למה ארבעה גלגלים משנים דווקא כאן",
    body: [
      "קלנועית ניידות אינה גאדג'ט, היא הרגליים. מיה פור בנויה על פלטפורמת ארבעה גלגלים מוגנת פטנט, עם מתלים בכל גלגל, במקום שלושה גלגלים או קורקינט. ארבע נקודות מגע נותנות בסיס יציב יותר בפנייה, במדרכה משופעת ובאבן שפה — בדיוק המצבים שבהם ניידות אישית נבחנת.",
      "הסוללה נשלפת וניתנת להחלפה, כך שאפשר לטעון בבית בלי להעלות את הכלי במדרגות, ולהחזיק סוללה שנייה להגדלת הטווח. הכלי מסווג כקלנועית ולא כרכב: מזוהה במספר שילדה, בלי לוחית רישוי ובלי אגרת רישוי שנתית. המפרט המלא, המחירים והתנאים מופיעים בדף הבית ובעמודי הדגמים, והם נתוני יבואן הכפופים למפרט סופי, לזמינות מלאי ולתנאי עסקה.",
    ],
  },
  {
    h: "מה MiaMe עושה, ומה לא",
    body: [
      "אנחנו משווקים ומוכרים את מיה פור, מיובאת רשמית על ידי MEU · Mayer Electric Utilities ונמכרת עם אחריות יבואן רשמי. אנחנו נלווה אתכם בהתאמת הדגם, ניתן הצעת מחיר בכתב לצורך הגשה, ונתאם מסירה.",
      "אנחנו לא קובעים זכאות, לא מאשרים אותה, לא מייצגים אתכם מול משרד הביטחון ולא מבטיחים תוצאה. כל מספר שמופיע בדף הזה בהקשר של סבסוד או מענק הוא הכיסוי המרבי האפשרי לפי מה שהאגפים מפרסמים, ולא התחייבות שהוא יחול עליכם.",
    ],
  },
];

export const ELIGIBILITY_FAQ: EligibilityFaq[] = [
  {
    q: "האם קלנועית נכללת בניידות של אגף השיקום?",
    a:
      "אגף השיקום במשרד הביטחון מפרסם מסלול לאמצעי ניידות לזכאיו, וקלנועית היא אחד מסוגי האמצעים שנדונים בו. האם היא מאושרת במקרה מסוים, ובאיזה היקף, נקבע לפי הזכאות הרפואית והתפקודית של אותו אדם. " +
      AUTHORITY_NOTE +
      " הקישור לעמוד הזכאות הרשמי מופיע בדף הזה.",
  },
  {
    q: "מי מחליט על הזכאות ועל שיעור המימון?",
    a:
      "משרד הביטחון בלבד — אגף השיקום לנכי צה\"ל וכוחות הביטחון, אגף משפחות והנצחה לבני משפחות שכולות. MiaMe אינה קובעת זכאות, אינה מאשרת אותה ואינה צד להליך. כל מספר שמוצג באתר בהקשר זה הוא הכיסוי המרבי האפשרי לפי פרסומי האגפים, ולא הבטחה אישית.",
  },
  {
    q: "צריך אישור לפני הרכישה או אפשר לקנות ולהגיש בדיעבד?",
    a:
      "לפני. הזכאות נבדקת ומאושרת מול האגף באישור עקרוני לפני הרכישה. רכישה שנעשתה בלי אישור מוקדם עלולה שלא להיכנס למימון כלל, גם כאשר הזכאות קיימת. זהו הצעד הראשון, והוא מול משרד הביטחון ולא מול MiaMe.",
  },
  {
    q: "מה ההבדל בין אגף השיקום לאגף משפחות והנצחה?",
    a:
      "שני אגפים שונים במשרד הביטחון, עם קהלים ותהליכים נפרדים. אגף השיקום מטפל בנכי צה\"ל ובנפגעי כוחות הביטחון לפי זכאות רפואית ותפקודית. אגף משפחות והנצחה מטפל בבני משפחות שכולות, ומפרסם מסלול מענק נפרד לרכישת קלנועית. פנייה לאגף הלא נכון מעכבת את התהליך.",
  },
  {
    q: "מהו מענק ההוקרה של MEU, והאם הוא חלק מהמימון הממשלתי?",
    a:
      "לא. מענק המתנה וההוקרה של MEU · Mayer Electric Utilities הוא הטבת רשות של היבואן, נפרדת לחלוטין מהמימון של משרד הביטחון ואינה חלק ממנו. הוא ניתן בכפוף לאישור זכאות, למלאי ולתנאי המבצע, וניתן לשינוי או להפסקה בכל עת.",
  },
  {
    // The question stops at the site's own legal-status copy and goes no further.
    // An earlier draft asked whether a driving licence or compulsory insurance is
    // needed; test/commercialTruth.test.ts rejected it, correctly. Those are
    // assertion shapes about a regulatory exemption that no page on this site
    // makes and no lawyer here has cleared — and this is the one page where a
    // reader is most likely to act on the answer. The guard is right; the copy moved.
    q: "מיה פור נחשבת רכב?",
    a:
      "מיה פור מסווגת כקלנועית ואינה רכב. כל כלי מזוהה במספר שילדה ייחודי, בלי לוחית רישוי, ואין אגרת רישוי או עלויות רישוי שנתיות. הכלי תואם תקן EN17128 ומותאם לתקנות הקלנועית בישראל. המידע כללי ואינו ייעוץ משפטי; השימוש כפוף לדין, לתקנות הקלנועית ולהוראות הרשויות, ולכן כדאי לוודא את התנאים החלים עליכם מול הגורם המוסמך.",
  },
  {
    q: "מה בעצם עולה לי בסוף?",
    a:
      "זה תלוי במסלול ובהחלטת האגף, ולכן אין לזה מספר אחד. גיליון החישוב בדף הזה מראה את הכיסוי המרבי האפשרי — סבסוד מוכר של עד 90% ממחיר הקלנועית בתוספת מענק ההוקרה של MEU בשיעור 10% — ומסומן בכוכבית מסיבה זו. " +
      AUTHORITY_NOTE +
      " בדיקת התאמה ראשונית בוואטסאפ היא ללא עלות וללא התחייבות.",
  },
];

/** FAQPage node, rendered beside the accordion that shows the same answers.
 *  The two read this one array, so markup and visible content cannot drift —
 *  the mismatch Google's FAQ guidance treats as disqualifying. */
export function eligibilityFaqJsonLd(siteUrl: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/eligibility#faq`,
    mainEntity: ELIGIBILITY_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
}
