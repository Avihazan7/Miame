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
import { MIA_FOUR_DELIVERY_DAYS } from "@/lib/content";
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
  { id: "service", source: "MiaMe/Service", text: 'אחריות יבואן רשמי 12 חודשים · MEU · Mayer Electric Utilities. שירות וחלפים מקוריים, ומסירה מתואמת בכל אזורי הארץ.' },
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
    text: `מסלולי תשלום ב-0% ריבית בכפוף לאישור עסקה; עד ${TRACKS.private.months.max} תשלומים ללא ריבית והצמדה. הסימולטור באתר בונה הצעה תוך דקה.`
  },
  {
    id: "delivery-four",
    source: "MiaMe/Service",
    text: `מיה פור נמצאת במלאי. האספקה אליכם עד ${MIA_FOUR_DELIVERY_DAYS} ימי עסקים, בכפוף לזמינות מלאי, בכל אזור בארץ ובמסירה מתואמת מראש. זמן האספקה של ${SPYQE.name} שונה — הוא דגם בהזמנה מוקדמת.`
  },
  {
    id: "spyqe-offer",
    source: "MiaMe/Spyqe",
    text: `${SPYQE.name} בהזמנה מוקדמת: מקדמה ${SPYQE.deposit.toLocaleString("he-IL")} ש"ח ליבואן בהרשמה, והיתרה ${SPYQE_BALANCE.toLocaleString("he-IL")} ש"ח ב-${SPYQE.months} תשלומים של ${SPYQE.monthlyPayment} ש"ח שמתחילים עם הגעת המשלוח למחסני היבואן. סה"כ ${SPYQE_TOTAL.toLocaleString("he-IL")} ש"ח במקום מחיר יבואן ${SPYQE.listPrice.toLocaleString("he-IL")} ש"ח, ללא ריבית והצמדה. ההטבה ל-${SPYQE.slots} הזוכים הראשונים. זהו מחיר ${SPYQE.name} בלבד ואינו מחיר מיה פור.`
  },
  {
    id: "spyqe-delivery",
    source: "MiaMe/Spyqe",
    text: `אספקת ${SPYQE.name} משוערת עד ${SPYQE.deliveryBusinessDays} ימי עסקים, מהמשלוח הראשון לישראל. זו הערכה ולא התחייבות, והיא שונה מזמן האספקה של מיה פור שנמצאת במלאי.`
  },
  {
    // The refusal is itself a fact worth retrieving. Without it the model has a
    // SPYQE row and a MIA FOUR spec row and nothing telling it they are different
    // vehicles — which is the exact shape of the mistake that would quote MIA
    // FOUR's 1,800W motor for a machine at roughly half the price.
    id: "spyqe-unpublished",
    source: "MiaMe/Spyqe",
    text: `עבור ${SPYQE.name} טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה והספק מנוע בוואט. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור. התשובה הנכונה היא שהנתון יפורסם כשיאומת.`
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

/** Keyword retrieval (Hebrew-safe). The always-available fallback — no key needed. */
async function keywordRetrieve(query: string, k: number): Promise<KnowledgeDoc[]> {
  const corpus = await fetchCorpus();
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const scored = corpus.map((d) => {
    const hay = d.text.toLowerCase();
    return { ...d, score: words.filter((w) => hay.includes(w)).length };
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
