// brain/knowledge.ts — RAG knowledge layer (ULEASE_SPEC §7.1).
//
// Backed by the live Supabase `public.knowledge` table (pgvector). `retrieve` is
// VECTOR-FIRST: when an embeddings key is present it embeds the query and calls the
// `match_knowledge` RPC (cosine over the ivfflat index); otherwise — or if the vector
// path returns nothing (corpus not yet backfilled) or errors — it falls back to
// Hebrew-safe keyword retrieval. Both paths read the public anon-SELECT corpus, so no
// secret is needed for reads.  (D-022: RAG over fine-tuning.)
import { SUPABASE_URL, SUPABASE_ANON_KEY, embeddingsReady } from "./config";
import { embedQueryVia } from "./router";
import { SPYQE, SPYQE_TOTAL, SPYQE_BALANCE } from "@/lib/spyqe";
import { MIA_FOUR_DELIVERY_DAYS, WARRANTY_MONTHS } from "@/lib/content";
import { TRACKS } from "@/lib/finance";

export interface KnowledgeDoc {
  id: string;
  source: string; // provenance — REQUIRED so Guardian's grounding gate can pass
  text: string;
  score?: number;
}

// Offline fallback so the brain never hard-fails if the DB is unreachable.
// This is the always-available, brand-safe corpus the keyword retriever scans
// when Supabase is unreachable or the vector corpus is not yet backfilled. It
// mirrors (a subset of) the seed rows in
// supabase/migrations/20260629_knowledge_seed_miame.sql so the brain stays
// grounded even fully offline. Keep facts in lock-step with lib/models.ts,
// components/Specs.tsx and components/LegalStatus.tsx (single source of truth).
// Exported so test/contentTruth.test.ts can read the RESOLVED strings rather than
// the source text: a template literal that renders the wrong number looks identical
// to a correct one under a static grep.
export const FALLBACK: KnowledgeDoc[] = [
  // ── Product spec (MIA FOUR 4×4 Pro Max) ─────────────────────────────────────
  { id: "spec-range", source: "MiaMe/Specs", text: 'טווח ריאלי עד 100 ק"מ; יצרן עד 120 ק"מ. ניתן להאריך טווח בעזרת סוללות נוספות.' },
  { id: "spec-motors", source: "MiaMe/Specs", text: 'מיה פור מונעת ב-2 או 4 מנועים חשמליים, בהספק 1,800W כל אחד (x2/x4). הנעה חשמלית שקטה וירוקה.' },
  { id: "spec-battery", source: "MiaMe/Specs", text: 'סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah, תאי LG 21700, משקל כ-6.3 ק"ג. זמן טעינה עד 8 שעות במטען סטנדרטי.' },
  { id: "spec-speed", source: "MiaMe/Specs", text: 'מהירות מרבית 12 קמ"ש, בהתאם לתקנות הקלנועית בישראל. בלימה: דיסק הידראולי כפול 140 מ"מ.' },
  { id: "spec-fold", source: "MiaMe/Specs", text: 'כידון מתקפל וכיסא בשחרור מהיר ביד אחת — קל לאחסון ושינוע, נכנסת גם לרכב קטן. משקל הקלנועית כ-42 ק"ג (דגם 2×4 City).' },
  { id: "spec-suspension", source: "MiaMe/Engineering", text: 'מערכת מתלים מכנית פורצת דרך על פלטפורמה מוגנת פטנט: שיכוך מלא קדמי ואחורי, מתלה עצמאי לכל גלגל — יציבות ובטיחות בתוואי רכיבה משתנה.' },
  // ── Use cases / experience ──────────────────────────────────────────────────
  { id: "usecase", source: "MiaMe/Lifestyle", text: 'חוויה של דו-גלגלי עם יציבות ובטיחות של ארבעה גלגלים. אידיאלי לפעילות, סיורים, תיירות ושילוח. אפשרות ישיבה או עמידה.' },
  // ── Pricing ─────────────────────────────────────────────────────────────────
  { id: "price-4x2", source: "MiaMe/Models", text: 'מיה פור 2×4 City (העירוני החכם), החל מ-19,900 ₪.' },
  { id: "price-2x4lr", source: "MiaMe/Models", text: 'מיה פור 2×4 City Long Range (הטווח המורחב), החל מ-21,900 ₪, סוללה 35Ah.' },
  { id: "price-4x4", source: "MiaMe/Models", text: 'מיה פור 4×4 Pro Max (הכוח לכל מסלול), החל מ-27,900 ₪, ארבעה מנועים והנעה כפולה לשטח.' },
  // ── Legal status ────────────────────────────────────────────────────────────
  { id: "legal-status", source: "MiaMe/LegalStatus", text: 'מיה פור מסווגת כקלנועית: מזוהה במספר שילדה ייחודי (לא לוחית רישוי), ללא אגרות רישוי, פטורה מהדוחות שדו-גלגלי ממונע סופג. תואמת תקן EN17128 ולתקנות הקלנועית בישראל.' },
  // ── Patents ─────────────────────────────────────────────────────────────────
  { id: "patents", source: "MiaMe/Patents", text: 'פלטפורמת המזעור של MIA Dynamics מוגנת פטנטים רשומים בארה"ב ובישראל: US 11,878,763 B2, US 12,097,926 B2, IL 280339, IL 285336.' },
  // ── Service & warranty ──────────────────────────────────────────────────────
  { id: "service", source: "MiaMe/Service", text: `אחריות יבואן רשמי ${WARRANTY_MONTHS} חודשים · MEU · Mayer Electric Utilities. שירות וחלפים מקוריים, ומסירה מתואמת בכל אזורי הארץ.` },
  // ── Methodology (the unique architecture) ───────────────────────────────────
  { id: "method-arch", source: "MiaMe/Brain", text: 'ארכיטקטורת המוח: Ultra (אורקסטרציה) → Masters (החלטות איכות, Sonnet) → Max (פעולות מהירות, Haiku) → Guardian (ציות ובטיחות דטרמיניסטיים). דוקטרינה: RAG על פני fine-tuning, מקור-אמת יחיד.' },
  { id: "method-bigfive", source: "MiaMe/Brain", text: 'התאמת Big Five Deal: מודל OCEAN ממפה את פרופיל הלקוח לדגם ולמסלול (2×4 City · 2×4 City LR · 4×4 Pro Max · השכרה Hub). ההתאמה מוסברת, לא קופסה שחורה.' },
  { id: "method-gametheory", source: "MiaMe/Brain", text: 'שער תורת-משחקים: הצעות נבחנות לאופטימליות פארטו — אין ביצוע אוטומטי להצעה שאינה Pareto-efficient, כדי שכל עסקה תהיה win-win ללקוח ולמערכת.' },
  { id: "method-enrichment", source: "MiaMe/Brain", text: 'העשרה אינסטרומנטלית (Feuerstein): המערכת לומדת ומשתפרת מכל אינטראקציה (Perceive → Reason → Act → Learn → Deliver), ומעשירה את בסיס הידע באופן מתודולוגי ומתמשך.' },
  // ── The sales campaign ──────────────────────────────────────────────────────
  // These five were missing, and their absence was invisible: the DB corpus has
  // them, so every path anyone actually exercises answers correctly. They matter
  // only on the path nobody looks at — Supabase unreachable, non-2xx, or an empty
  // table — and that is exactly when the brain would have had NO answer at all for
  // "how many instalments", "when does it arrive", or the campaign's headline
  // product. A fallback that silently drops the current offer is worse than no
  // fallback, because it still sounds grounded.
  //
  // Every number here is DERIVED, never typed: the offer from lib/spyqe.ts, the
  // supply commitment from lib/content.ts, the instalment cap from lib/finance.ts.
  // Guarded by test/contentTruth.test.ts, which compares them to those sources.
  {
    id: "finance-terms",
    source: "MiaMe/Finance",
    // "מימון" leads, for the same measured reason as the database row this mirrors:
    // it was the ONLY word a buyer uses for this that appeared nowhere in the corpus,
    // so the financing question was answered out of a disabled-veterans subsidy row.
    text: `מימון ומסלולי תשלום ב-0% ריבית בכפוף לאישור עסקה; עד ${TRACKS.private.months.max} תשלומים ללא ריבית והצמדה. הסימולטור באתר בונה הצעה תוך דקה.`
  },
  {
    id: "delivery-four",
    source: "MiaMe/Service",
    text: `מיה פור נמצאת במלאי. האספקה אליכם עד ${MIA_FOUR_DELIVERY_DAYS} ימי עסקים, בכפוף לזמינות מלאי, בכל אזור בארץ ובמסירה מתואמת מראש. זמן האספקה של ${SPYQE.name} (${SPYQE.nameHe}) שונה — הוא דגם בהזמנה מוקדמת.`
  },
  {
    id: "spyqe-offer",
    source: "MiaMe/Spyqe",
    text: `${SPYQE.name} (${SPYQE.nameHe}) בהזמנה מוקדמת: מקדמה ${SPYQE.deposit.toLocaleString("he-IL")} ש"ח ליבואן בהרשמה, והיתרה ${SPYQE_BALANCE.toLocaleString("he-IL")} ש"ח ב-${SPYQE.months} תשלומים של ${SPYQE.monthlyPayment} ש"ח שמתחילים עם הגעת המשלוח למחסני היבואן. סה"כ ${SPYQE_TOTAL.toLocaleString("he-IL")} ש"ח במקום מחיר יבואן ${SPYQE.listPrice.toLocaleString("he-IL")} ש"ח, ללא ריבית והצמדה. ההטבה ל-${SPYQE.slots} הזוכים הראשונים. זהו מחיר ${SPYQE.name} בלבד ואינו מחיר מיה פור.`
  },
  {
    id: "spyqe-delivery",
    source: "MiaMe/Spyqe",
    text: `אספקת ${SPYQE.name} (${SPYQE.nameHe}) משוערת עד ${SPYQE.deliveryBusinessDays} ימי עסקים, מהמשלוח הראשון לישראל. זו הערכה ולא התחייבות, והיא שונה מזמן האספקה של מיה פור שנמצאת במלאי.`
  },
  {
    // The refusal is itself a fact worth retrieving. Without it the model has a
    // SPYQE row and a MIA FOUR spec row and nothing telling it they are different
    // vehicles — which is the exact shape of the mistake that would quote MIA
    // FOUR's 1,800W motor for a machine at roughly half the price.
    id: "spyqe-unpublished",
    source: "MiaMe/Spyqe",
    text: `עבור ${SPYQE.name} (${SPYQE.nameHe}) טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה והספק מנוע בוואט. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור. התשובה הנכונה היא שהנתון יפורסם כשיאומת.`
  }
];

async function fetchCorpus(): Promise<KnowledgeDoc[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/knowledge?select=id,source,body`, {
      headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cache: "no-store"
    });
    if (!res.ok) return FALLBACK;
    const rows = (await res.json()) as Array<{ id: string; source: string; body: string }>;
    return rows.length
      ? rows.map((r) => ({ id: r.id, source: r.source, text: r.body }))
      : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/** Vector cosine retrieval via the `match_knowledge` RPC. Returns [] if the corpus
 *  has no embeddings yet (the RPC filters `embedding is not null`) so the caller can
 *  fall back. Requires an embeddings key to embed the query. */
async function vectorRetrieve(query: string, k: number): Promise<KnowledgeDoc[]> {
  const queryEmbedding = await embedQueryVia(query);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_knowledge`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ query_embedding: queryEmbedding, match_count: k }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`match_knowledge ${res.status}`);
  const rows = (await res.json()) as Array<{
    id: string;
    source: string;
    body: string;
    similarity: number;
  }>;
  return rows.map((r) => ({ id: r.id, source: r.source, text: r.body, score: r.similarity }));
}

/**
 * What a buyer types, mapped onto what the corpus writes.
 *
 * MEASURED against the live 37-row corpus, 2026-09-01, by running the retriever's own
 * scoring over it. "כמה עולה ספייק" returned the MIA FOUR DELIVERY row first and the
 * SPYQE price row second — because the word "עולה" appears in NO row: the corpus says
 * "מחיר". Only "ספייק" matched anything, it matches eight rows, they all scored 1, and
 * the tie fell to whichever id sorted first.
 *
 * This is vocabulary mismatch, not a corpus-size problem, and it is exactly what an
 * embedding resolves. Until the vectors exist, this table closes the gap for the
 * handful of commercial questions that actually get asked. It is deliberately TINY:
 * every entry is a word a buyer used that the corpus does not contain. A synonym list
 * that grows past that becomes a second vocabulary to keep true.
 */
/**
 * What a substituted word is worth against the buyer's own. Not zero — the substitution
 * is the only thing that answers "כמה עולה ספייק" at all, since no row contains "עולה" —
 * and not one, because a row that literally says what the buyer said is better evidence
 * than a row that says what we decided the buyer meant. MEASURED on the live corpus:
 * at 1.0 the SPYQE sign-up row (which matches only the substituted "הרשמה", and is the
 * shorter body) outranked the ordering row that opens with the buyer's own word.
 */
const SYNONYM = 0.8;

const ASK_TO_CORPUS: Record<string, string[]> = {
  עולה: ["מחיר"],
  עולות: ["מחיר"],
  יקר: ["מחיר"],
  זול: ["מחיר"],
  מגיע: ["אספקה", "משלוח"],
  מגיעה: ["אספקה", "משלוח"],
  מתי: ["אספקה", "ימי עסקים"],
  לקנות: ["מחיר", "הזמנה"],
  להזמין: ["הזמנה", "הרשמה"],
  קילומטר: ["ק\"מ", "טווח"],
  מהירות: ["קמ\"ש"],
  // MEASURED on the live corpus, 2026-09-01. "להשכיר" maps to the four-letter root
  // "השכר" rather than to a full word: matching is a substring test, so the shorter
  // form covers both "השכרה" and the corpus's actual "השכרת" without a second entry
  // to keep true. Without it "כמה עולה להשכיר" answered with the 2x4 City purchase
  // price — the wrong product line, quoted with confidence.
  להשכיר: ["השכר"],
  לשכור: ["השכר"],
  // The present tense of an entry that already exists. "מזמין" strips to the stem
  // "זמין", which is a FALSE FRIEND: it matches "זמינה" (in stock) and "לזמינות",
  // not "הזמנה" (an order). MEASURED: "איך אני מזמין" was answered from the row that
  // says the vehicle comes in premium black.
  מזמין: ["הזמנה", "הרשמה"],
  // ONE ENTRY WAS WRITTEN AND THEN REMOVED, recorded so it is not added again on the
  // same reasoning: לטעון → טעינה. It looked obviously right — "לטעון" strips to the
  // stem "טעון", which is in no row — and MEASURED it lifted "כמה זמן לוקח לטעון" from
  // 2.60 to 6.32 on spec-charging. But spec-charging was already rank 1 at 2.60, on the
  // word "זמן" alone, so the entry never changed an ANSWER. Removing it failed no test,
  // which is the whole objection: an entry nothing can hold is a decision nobody
  // checked. The row fixed that question; the entry only flattered the score.
  רישיון: ["רישוי"],
};

/**
 * Hebrew glues its articles and prepositions onto the front of the word, and matching
 * is a substring test — so the buyer's inflected form silently misses the corpus's
 * base form. MEASURED on the live corpus: "מה הטווח של ספייק" ranked the 2×4 Long
 * Range first, because that row happens to write "הטווח המורחב" while the SPYQE spec
 * row — the one that actually carries the range — writes "טווח" and was therefore
 * never matched at all. One letter decided which vehicle the buyer was told about.
 *
 * Stripping is additive and conservative: the original word is always kept, only the
 * seven single-letter prefixes are tried, and only when at least three letters remain,
 * so "של"→"ל" or "מה"→"ה" cannot happen.
 */
/**
 * Hebrew writes five letters differently when they end a word — ך ם ן ף ץ for כ מ נ פ צ —
 * and inflection moves them into the middle, where they change back. So "מזמין" is NOT
 * a substring of "מזמינים": the nun is final in one and medial in the other. Matching
 * here is a substring test, so that single glyph difference makes the inflected form
 * invisible. MEASURED on the live corpus: it is why the row that literally opens with
 * "איך מזמינים מיה פור" did not match a buyer asking "איך אני מזמין".
 *
 * Folding is applied to BOTH sides, query and body alike, and it never changes a
 * string's length, so length normalisation is unaffected.
 */
const FINAL_FORMS: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
const foldFinals = (t: string): string => t.replace(/[ךםןףץ]/g, (c) => FINAL_FORMS[c]);

const HE_PREFIX = /^[הבלמושכ]/;
const stems = (w: string): string[] => {
  const out: string[] = [];
  if (HE_PREFIX.test(w) && w.length >= 4) out.push(w.slice(1));
  // The same miss at the other end of the word. Hebrew's construct state turns a final
  // he into a tav — "סוללה" becomes "סוללת ליתיום" — and MEASURED on the live corpus
  // that is why "מה הסוללה" was answered from a PRICE row: the one row that describes
  // the battery is the only row in the corpus that never spells the word "סוללה".
  for (const form of [w, ...out]) {
    if (form.endsWith("ה") && form.length >= 4) out.push(form.slice(0, -1) + "ת");
  }
  return out;
};

/** Hebrew and English function words carry no signal and drown the words that do. */
const STOP = new Set([
  "מה", "של", "כמה", "איך", "את", "עם", "על", "הוא", "היא", "לי", "יש", "אני", "זה",
  "אם", "או", "גם", "כל", "לא", "אבל", "כדי", "עוד", "אפשר", "the", "is", "of", "for", "and", "to", "how",
]);

/**
 * Keyword retrieval (Hebrew-safe). The always-available fallback — no key needed.
 *
 * Scoring is INVERSE DOCUMENT FREQUENCY, not a match count. The count treated every
 * word alike, so "ספייק" — which eight of thirty-seven rows carry — weighed the same
 * as a word that appears once, and every SPYQE question ended in an eight-way tie
 * broken by id. Weighting each match by log(N / rows-containing-it) makes the rare,
 * distinguishing word decide, which is the whole job.
 */
async function keywordRetrieve(query: string, k: number): Promise<KnowledgeDoc[]> {
  const corpus = await fetchCorpus();
  const asked = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

  // ONE TERM, SEVERAL SURFACE FORMS — and it must score ONCE.
  //
  // Expansion is additive, never a replacement: the buyer's own word still counts
  // wherever the corpus has it. But the forms of a term overlap by construction —
  // "הטווח" contains "טווח" — so summing them double-counts a single occurrence.
  // MEASURED: that is exactly how "מה הטווח של ספייק" scored the 2×4 Long Range row
  // (which writes "הטווח המורחב") at 7.26 against the SPYQE spec row's 3.99, when the
  // spec row is the one that actually carries SPYQE's range. A term is a set of forms;
  // a document either has the term or it does not, and it earns the weight once.
  //
  // The forms come in TWO GRADES. `own` is the buyer's word and its Hebrew inflections
  // — the same word, spelled as the corpus happens to spell it. `syn` is a word WE
  // chose to stand in for it. A row that literally contains what the buyer typed is
  // better evidence than a row that only contains our substitute, so they do not earn
  // the same credit.
  const terms = asked.map((w) => {
    // Where the lexicon has WRITTEN DOWN what a word means, we do not also GUESS at it.
    // Prefix stripping is a machine rule, and it is wrong as often as a Hebrew verb
    // pattern happens to begin with one of its seven letters: "מזמין" (orders) strips
    // to "זמין", which is "available" — a different word about a different thing.
    // MEASURED on the live corpus: that stem answered "איך אני מזמין" out of the row
    // that says the vehicle comes in premium black. An entry is a decision, a stem is
    // a guess, and where both exist the decision wins.
    const listed = ASK_TO_CORPUS[w];
    const own = [...new Set((listed ? [w] : [w, ...stems(w)]).map(foldFinals))];
    const syn = (listed ?? []).map(foldFinals).filter((f) => !own.includes(f));
    return { own, syn, all: [...own, ...syn] };
  });

  // Fold once per row, not once per row per term: matching is case- and final-form
  // insensitive on both sides, and `d.text.length` stays the UNfolded length because
  // folding never changes it.
  const docs = corpus.map((d) => ({ doc: d, hay: foldFinals(d.text.toLowerCase()) }));
  const n = corpus.length || 1;
  const has = (hay: string, forms: string[]) => forms.some((f) => hay.includes(f));

  // A term's weight comes from how many documents contain ANY of its forms — the
  // document frequency of the concept, not of one spelling of it.
  const weights = terms.map(({ all }) => {
    const df = docs.filter(({ hay }) => has(hay, all)).length;
    return df === 0 ? 0 : Math.log(n / df) + 1; // +1 so a term in every row still counts a little
  });

  // Length normalisation, the BM25 idea in its simplest form. Without it "כמה עולה
  // 2×4 City" tied exactly between the City row and the City LONG RANGE row, because
  // "2×4 City" is a literal substring of "2×4 City Long Range" — every query word is
  // in both — and the tie fell to whichever id sorted first, which was the dearer
  // model. When two rows carry the same terms, the shorter one is the tighter match.
  const avgLen = corpus.reduce((s, d) => s + d.text.length, 0) / (corpus.length || 1);
  const scored = docs.map(({ doc, hay }) => {
    const raw = terms.reduce(
      (s, t, i) => s + (has(hay, t.own) ? weights[i] : has(hay, t.syn) ? weights[i] * SYNONYM : 0),
      0,
    );
    return { ...doc, score: raw === 0 ? 0 : raw / (0.75 + 0.25 * (doc.text.length / (avgLen || 1))) };
  });
  const hits = scored
    .filter((d) => (d.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  // If nothing matched, still return a few rows so the Master has grounded context.
  return (hits.length ? hits : scored).slice(0, k);
}

export async function retrieve(query: string, k = 4): Promise<KnowledgeDoc[]> {
  if (embeddingsReady) {
    try {
      const hits = await vectorRetrieve(query, k);
      if (hits.length >= k) return hits;

      // SHORT, BUT NOT EMPTY — the case this used to get wrong.
      //
      // The old condition was `if (hits.length) return hits`, so ONE hit counted as
      // success and the keyword path never ran. That is not a hypothetical: the
      // ivfflat index this schema shipped returned exactly one row for any k
      // (measured 2026-08-31; removed in 20260901_knowledge_exact_vector_search).
      // Under the old condition the vector path would have answered every question
      // from a single document, quieter and worse than the keyword path it replaced.
      //
      // Dropping the index fixed that instance. This fixes the CLASS: whenever the
      // vector path returns fewer documents than asked for, top the answer up from
      // keyword retrieval instead of answering thin. If the corpus genuinely holds
      // fewer than k rows, both paths are short and the union is simply all of it —
      // no harm. If the vector path is under-returning for any reason, the gap is
      // filled with real documents rather than hidden. Never worse than either path
      // alone, and it cannot fail silently.
      if (hits.length) {
        const seen = new Set(hits.map((h) => h.id));
        const topUp = (await keywordRetrieve(query, k)).filter((d) => !seen.has(d.id));
        return [...hits, ...topUp].slice(0, k);
      }
      // empty ⇒ corpus not backfilled ⇒ fall through
    } catch {
      // provider/RPC hiccup ⇒ degrade gracefully to keyword
    }
  }
  return keywordRetrieve(query, k);
}
