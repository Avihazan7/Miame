// test/retrievalRanking.test.ts — the buyer's question reaches the row that answers it.
//
// Every embedding is NULL, so retrieval IS the Hebrew keyword path. Measured against
// the live 37-row corpus on 2026-09-01, it was answering the wrong product:
//
//   "כמה עולה ספייק"      → the MIA FOUR DELIVERY row      (SPYQE's price was 2nd)
//   "מתי מגיע ספייק"      → the contact row                (spyqe-delivery absent)
//   "כמה עולה 2×4 City"   → the LONG RANGE row             (the dearer model)
//   "מה הטווח של ספייק"   → the 2×4 Long Range row
//   "מה הסוללה"           → a PRICE row
//   "כמה עולה להשכיר"     → a PURCHASE price (renting is a different product line)
//   "כמה תשלומים אפשר"    → the test-ride row
//   "איך אני מזמין"       → the row that says it comes in premium black
//
// Eight causes, every one of them found by measuring rather than by reasoning:
//
//  1. VOCABULARY. The buyer types "עולה"; the corpus writes "מחיר". That word appears
//     in no row at all, so only "ספייק" scored — and it is in eight rows, all tied at
//     1, resolved by whichever id sorted first.
//  2. THE HEBREW PREFIX. The buyer types "הטווח"; the SPYQE spec row writes "טווח".
//     Matching is a substring test, so the definite article made the one row that
//     carries SPYQE's range unmatchable. One letter decided which vehicle was quoted.
//  3. THE CONSTRUCT STATE, the same miss at the other end of the word. The buyer types
//     "סוללה"; the battery row writes "סוללת ליתיום" and is the ONLY row in the corpus
//     that never spells "סוללה" — so the question about the battery reached a price.
//  4. THE FINAL FORMS, the same miss again and the least visible of the three. Hebrew
//     writes ך ם ן ף ץ at the end of a word and כ מ נ פ צ everywhere else, so "מזמין"
//     is not a substring of "מזמינים" — one glyph, and the row that literally opens
//     "איך מזמינים מיה פור" is invisible to a buyer asking "איך אני מזמין".
//  5. CONTAINMENT. "2×4 City" is a literal substring of "2×4 City Long Range", so both
//     rows carried every query word and tied exactly.
//  6. A FILLER WORD THAT IS RARE. Inverse document frequency rewards the uncommon, and
//     a function word is not necessarily a common one: "אפשר" occurs in exactly one row
//     of the live corpus, so it drew the highest weight there is and dragged
//     "כמה תשלומים אפשר" to the test-ride row. That is what the STOP list is for.
//  7. A STEM THAT IS A FALSE FRIEND. "מזמין" (orders) strips to "זמין" (available) —
//     a different word about a different thing. Prefix stripping is a machine rule and
//     it is wrong whenever a verb pattern begins with one of its seven letters. Where
//     the lexicon has written a word down, that decision now beats the guess.
//  8. TWO GRADES OF EVIDENCE, TREATED AS ONE. A row containing the buyer's own word is
//     better evidence than a row containing the synonym WE substituted for it — and at
//     equal credit the shorter substitute-match won.
//
// And one cause was mine: the first fix scored a term's forms as separate words, so
// "הטווח" plus its stem "טווח" both matched "הטווח המורחב" and double-counted a single
// occurrence — which put the Long Range row back on top. A term is a SET of forms and
// earns its weight ONCE.
//
// ONE HYPOTHESIS WAS TESTED AND REJECTED, recorded so it is not tried again: BM25 term
// FREQUENCY, saturated, k1=1.2. It moved 8 of 25 rank-1 answers on the live corpus and
// moved them the wrong way — SPYQE questions back onto MIA FOUR rows, "מה הסוללה" back
// onto a price row. Repetition in this corpus is boilerplate ("סוללה 35Ah … סוללה
// נשלפת"), not aboutness, so counting it rewards the wordiest row rather than the
// right one. It is not in the code.
//
// The fixture below is 19 of the corpus's 37 rows: the rows these questions compete
// over, with the bodies THIS BRANCH leaves in the database — verbatim live as measured
// on 2026-09-01, with `finance` and `lead` as the phase-15 migration rewrites them
// (supabase/migrations/20260901_knowledge_zzzz_vocabulary_gaps.sql). It is not the
// whole corpus; it is the part where ranking is decided, which is what a ranking test
// should hold.
//
// Every mechanism here is pinned by mutation — twelve of them, each removed in turn and
// each making this file fail: the lexicon, the prefix strip, the construct-state rule,
// the final-form fold, IDF, length normalisation, the STOP list, the single entry
// "אפשר", the three newest lexicon entries, the synonym discount, the suppression of a
// stem where an entry exists, and the score-a-term-once rule. A test that passes with
// the code removed is worse than no test, and two of these did until the fixtures below
// were rebuilt to stop it.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

const { retrieve } = await import("../brain/knowledge");

/** Verbatim bodies from the live corpus, 2026-09-01. */
const CORPUS = [
  { id: "price-4x2", source: "MiaMe/Models", body: "מיה פור 2×4 City (העירוני החכם), הידוע גם כ-4x2 — מחיר MiaMe החל מ-19,900 ש\"ח. עירוני וזריז, מנוע 1,800W, סוללה נשלפת 60V." },
  { id: "price-2x4lr", source: "MiaMe/Models", body: "מיה פור 2×4 City Long Range (הטווח המורחב) — מחיר MiaMe החל מ-21,900 ש\"ח. סוללה 35Ah לטווח מורחב, סוללה נשלפת 60V, יציבות בכל תוואי." },
  { id: "price-4x4", source: "MiaMe/Models", body: "מיה פור 4×4 Pro Max (הכוח לכל מסלול), הידוע גם כ-4x4 — מחיר MiaMe החל מ-27,900 ש\"ח. ארבעה מנועים 1,800W, הנעה כפולה לשטח, סוללה נשלפת 60V." },
  { id: "price-spyqe", source: "MiaMe/Spyqe", body: "SPYQE (ספייק) בהזמנה מוקדמת — סה\"כ 10,990 ש\"ח במקום מחיר יבואן 11,990 ש\"ח: מקדמה 1,000 ש\"ח ליבואן בהרשמה, והיתרה 9,990 ש\"ח ב-18 תשלומים של 555 ש\"ח. ל-248 הזוכים הראשונים. זהו דגם נפרד ממיה פור, במחצית המחיר בערך." },
  { id: "spyqe-delivery", source: "MiaMe/Spyqe", body: "אספקת SPYQE (ספייק) משוערת עד 33 ימי עסקים, מהמשלוח הראשון לישראל. זו הערכה ולא התחייבות, והיא שונה מזמן האספקה של מיה פור שנמצאת במלאי." },
  { id: "spyqe-spec", source: "MiaMe/Spyqe", body: "מפרט SPYQE (ספייק) לפי היצרן: מנוע BLDC כפול מסוג גלגל, מהירות מרבית 25 קמ\"ש (תקרת הקלנועית בישראל), טווח עד 50 ק\"מ לסוללה, סוללה 20Ah נשלפת, בלמי דיסק הידראוליים כפולים, גלגלים 12 אינץ, מידות 562 על 1225 על 1248 מ\"מ, גובה מקופל 439 מ\"מ, תקן EN17128. אלה נתוני SPYQE ולא של מיה פור." },
  { id: "spyqe-register", source: "MiaMe/Spyqe", body: "הרשמה להזמנה מוקדמת של SPYQE (ספייק) נעשית בוואטסאפ דרך האתר. ההרשמה שומרת מקום במשלוח הראשון ואינה מחייבת ברכישה." },
  { id: "spyqe-what", source: "MiaMe/Spyqe", body: "SPYQE (ספייק) הוא הדגם השני על פלטפורמת MIA Dynamics, לצד מיה פור. הוא נמכר בהזמנה מוקדמת לקראת המשלוח הראשון לישראל." },
  { id: "delivery", source: "MiaMe/Service", body: "מיה פור נמצאת במלאי. האספקה אליכם עד 3 ימי עסקים, בכפוף לזמינות מלאי, בכל אזור בארץ ובמסירה מתואמת מראש. זמן האספקה של SPYQE (ספייק) שונה - הוא דגם בהזמנה מוקדמת." },
  { id: "contact", source: "MiaMe/Funnel", body: "יצירת קשר: וואטסאפ ישיר באתר (כפתור \"דברו איתי\"), או השארת פרטים בסימולטור התשלומים. אין סניפים ואין קווי טלפון נוספים — כל פנייה מגיעה לנציג MiaMe." },
  { id: "spec-range", source: "MiaMe/Specs", body: "טווח שימוש ריאלי עד 100 ק\"מ; נתון יצרן עד 120 ק\"מ (תנאי מעבדה)." },
  { id: "spec-battery", source: "MiaMe/Specs", body: "סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah, תאי LG 21700, משקל כ-6.3 ק\"ג." },
  { id: "model-choose", source: "MiaMe/Models", body: "איך לבחור דגם: 4×2 לעיר וזריזות · 2×4 Long Range לטווח מורחב (35Ah) · 4×4 לארבעה מנועים והנעה כפולה בשטח." },
  { id: "finance", source: "MiaMe/Finance", body: "מימון ומסלולי תשלום ב-0% ריבית בכפוף לאישור עסקה; עד 18 תשלומים ללא ריבית והצמדה. הסימולטור באתר בונה הצעה תוך דקה." },
  { id: "simulator-how", source: "MiaMe/Finance", body: "הסימולטור באתר מריץ מסלול אחד: בוחרים דגם, קובעים מקדמה וגוררים את מספר התשלומים (עד 18, ללא ריבית והצמדה), ומקבלים תשלום חודשי משוער מיידי." },
  { id: "lead", source: "MiaMe/Funnel", body: "איך מזמינים מיה פור: הזמנה ורכישה דרך וואטסאפ. הסימולטור שולח הצעה מלאה - דגם, מקדמה, מספר תשלומים ותשלום חודשי - ישירות לוואטסאפ." },
  { id: "testride", source: "MiaMe/Funnel", body: "אפשר לתאם נסיעת מבחן — פנו אלינו בוואטסאפ ונקבע מועד." },
  { id: "rental", source: "MiaMe/Hub", body: "השכרת מיה פור: החל מ-50 ש\"ח לשעה (50/100/180/245 ל-1/3/6/9 שעות) דרך רשת MiaMe Hub." },
  { id: "colors", source: "MiaMe/Models", body: "מיה פור זמינה בשחור פרימיום עם הדגשי תכלת." },
];

describe("a buyer's question reaches the row that answers it", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", async (u: RequestInfo | URL) => {
      if (String(u).includes("/knowledge?select=")) {
        return new Response(JSON.stringify(CORPUS), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${u}`);
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Each of these ranked WRONG before the fix. The id named is the row that answers
  // the question; anything else at rank 1 is a wrong product quoted with confidence.
  const CASES: [string, string, string][] = [
    ["כמה עולה ספייק", "price-spyqe", 'the corpus writes "מחיר", the buyer types "עולה"'],
    ["מתי מגיע ספייק", "spyqe-delivery", 'the corpus writes "אספקה", the buyer types "מגיע"'],
    ["כמה עולה 2×4 City", "price-4x2", '"2×4 City" is a substring of "2×4 City Long Range"'],
    ["מה הטווח של ספייק", "spyqe-spec", 'the definite article: "הטווח" vs the corpus\'s "טווח"'],
    ["מה המחיר של Pro Max", "price-4x4", "already worked — must not regress"],
    ["איך לבחור דגם", "model-choose", "already worked — must not regress"],
    ["מה הסוללה", "spec-battery", 'the construct state: the battery row writes "סוללת"'],
    ["כמה תשלומים אפשר", "finance", '"אפשר" sits in one row, so IDF makes a filler word decisive'],
    ["כמה עולה להשכיר", "rental", "renting is a different product line from buying"],
    ["איך אני מזמין", "lead", 'final forms: "מזמין" is not a substring of "מזמינים"'],
  ];

  for (const [q, expected, why] of CASES) {
    it(`"${q}" → ${expected}  (${why})`, async () => {
      const [top] = await retrieve(q, 3);
      expect(top, "retrieval returned nothing").toBeTruthy();
      expect(top.id, `"${q}" was answered from ${top.id}, not ${expected}`).toBe(expected);
    });
  }

  it("a SPYQE question never ranks a MIA FOUR row first", async () => {
    // The whole point of the SPYQE rows: a different vehicle at roughly half the price.
    const MIA_FOUR = new Set(["price-4x2", "price-2x4lr", "price-4x4", "delivery", "spec-range", "model-choose"]);
    for (const q of ["כמה עולה ספייק", "מתי מגיע ספייק", "מה הטווח של ספייק", "ספייק מחיר"]) {
      const [top] = await retrieve(q, 3);
      expect(MIA_FOUR.has(top.id), `"${q}" → ${top.id}, a MIA FOUR row`).toBe(false);
    }
  });

  it("between two rows carrying the same terms, the tighter one wins", async () => {
    // Pins the length normalisation. On the LIVE corpus this was the deciding
    // mechanism: "כמה עולה 2×4 City" scored 10.43 against 10.43 — an exact tie,
    // because "2×4 City" is a substring of "2×4 City Long Range" — and the tie fell to
    // the id that sorted first, which was the dearer Long Range. The 19-row fixture
    // above happens to break that tie on IDF alone, so the property is pinned here by
    // construction instead of by luck.
    vi.stubGlobal("fetch", async () =>
      new Response(
        // The LONG row is first on purpose: Array.prototype.sort is stable, so without
        // length normalisation the tie resolves to whichever row the corpus happened to
        // return first — and this test would then pass for the wrong reason.
        JSON.stringify([
          { id: "loose", source: "t", body: "מיה פור 2×4 City Long Range — מחיר 21,900, " + "טקסט נוסף ".repeat(20) },
          { id: "tight", source: "t", body: "מיה פור 2×4 City — מחיר 19,900" },
        ]),
        { status: 200 },
      ),
    );
    const [top] = await retrieve("2×4 City מחיר", 2);
    expect(top.id, "the longer row won a tie it should have lost").toBe("tight");
  });

  it("a term in nearly every row cannot outweigh a rare one", async () => {
    // Pins the IDF weighting, and pins it ALONE. The first version of this test put the
    // rare row in a SHORT body, so length normalisation carried it and the test still
    // passed with the weighting removed — it proved nothing. Here the rare row is the
    // LONGEST in the corpus, so normalisation actively penalises it: only the weighting
    // can put it first.
    vi.stubGlobal("fetch", async () =>
      new Response(
        JSON.stringify([
          // Carries BOTH common terms and neither rare one, in the shortest body of the
          // pair. On a plain match count it scores 2 — the same as the rare row — and
          // being both shorter and listed first it would win on either tiebreak.
          { id: "two-common", source: "t", body: "מיה פור וגם קלנועית רגילה" },
          { id: "one-rare", source: "t", body: "מיה פור ייחודית " + "טקסט נוסף ".repeat(6) },
          { id: "n1", source: "t", body: "מיה פור קלנועית אחת" },
          { id: "n2", source: "t", body: "מיה פור קלנועית שתיים" },
          { id: "n3", source: "t", body: "מיה פור קלנועית שלוש" },
          { id: "n4", source: "t", body: "מיה פור קלנועית ארבע" },
        ]),
        { status: 200 },
      ),
    );
    // "פור" is in all six rows and "קלנועית" in five; "ייחודית" is in exactly one. A
    // count scores two-common at 2 and one-rare at 2 — and then the length penalty
    // hands the top spot to one of the short rows. The rare term has to outweigh the
    // pair by enough to overcome that penalty, because it is the only word here that
    // tells the rows apart.
    const [top] = await retrieve("פור קלנועית ייחודית", 2);
    expect(top.id, "two terms present in every row outweighed a term present in one").toBe("one-rare");
  });

  it("a question word cannot outrank the word that carries the question", async () => {
    // Pins the STOP list, and the reason it exists is IDF itself: a function word is
    // not necessarily a COMMON word. "איך" appears in exactly one row of the live
    // corpus, so inverse document frequency hands it the highest weight there is —
    // the same weight as the one word that actually names the subject.
    //
    // MEASURED on the live 37-row corpus, 2026-09-01: dropping the STOP list moved the
    // rank-1 answer for 6 of 25 buyer questions, and where the right answer is not in
    // doubt it moved it the wrong way — "איך יוצרים קשר" → the model-picker row,
    // "מה המשקל של ספייק" → the sign-up row instead of the row that says the weight is
    // unpublished, "מה הטווח" → SPYQE's range instead of MIA FOUR's. The four rows
    // below are taken straight from the shared fixture, which is verbatim live.
    vi.stubGlobal("fetch", async () =>
      new Response(
        JSON.stringify([
          // The right answer, and the LONGER body — so length normalisation is against
          // it too. Only refusing to score "איך" can put it first.
          CORPUS.find((d) => d.id === "contact"),
          CORPUS.find((d) => d.id === "model-choose"),
          CORPUS.find((d) => d.id === "delivery"),
          CORPUS.find((d) => d.id === "spec-range"),
        ]),
        { status: 200 },
      ),
    );
    const [top] = await retrieve("איך יוצרים קשר", 2);
    expect(top.id, "a question word decided which row answered the question").toBe("contact");
  });

  it("a term scores once however many surface forms match it", async () => {
    // "הטווח" and its stem "טווח" both occur in the Long Range row's "הטווח המורחב".
    // Summing them double-counts one occurrence — the bug that put that row back on
    // top after the first fix.
    const [top] = await retrieve("הטווח", 3);
    expect(["spec-range", "spyqe-spec", "price-2x4lr"]).toContain(top.id);
    const lr = (await retrieve("מה הטווח של ספייק", 5)).find((d) => d.id === "price-2x4lr");
    const spec = (await retrieve("מה הטווח של ספייק", 5)).find((d) => d.id === "spyqe-spec");
    expect(spec!.score!).toBeGreaterThan(lr?.score ?? 0);
  });
});
