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
const FALLBACK: KnowledgeDoc[] = [
  // ── Product spec (MIA FOUR X4) ──────────────────────────────────────────────
  { id: "spec-range", source: "MiaMe/Specs", text: 'טווח ריאלי עד 100 ק"מ; יצרן עד 120 ק"מ. ניתן להאריך טווח בעזרת סוללות נוספות.' },
  { id: "spec-motors", source: "MiaMe/Specs", text: 'מיה פור מונעת ב-2 או 4 מנועים חשמליים, בהספק 1,800W כל אחד (x2/x4). הנעה חשמלית שקטה וירוקה.' },
  { id: "spec-battery", source: "MiaMe/Specs", text: 'סוללת ליתיום נשלפת 60V בקיבולת 25/35Ah, עם שכבת הגנה מאלומיניום במשקל 10 ק"ג. תאי LG 21700. זמן טעינה עד 8 שעות במטען סטנדרטי.' },
  { id: "spec-speed", source: "MiaMe/Specs", text: 'מהירות מרבית 12 קמ"ש, בהתאם לתקנות הקלנועית בישראל. בלימה: דיסק הידראולי כפול 140 מ"מ.' },
  { id: "spec-fold", source: "MiaMe/Specs", text: 'כידון מתקפל וכיסא בשחרור מהיר ביד אחת — קל לאחסון ושינוע, נכנס גם לרכב קטן. משקל הכלי כ-42 ק"ג (דגם 4×2).' },
  { id: "spec-suspension", source: "MiaMe/Engineering", text: 'מערכת מתלים מכנית פורצת דרך על פלטפורמה מוגנת פטנט: שיכוך מלא קדמי ואחורי, מתלה עצמאי לכל גלגל — יציבות ובטיחות בתוואי רכיבה משתנה.' },
  // ── Use cases / experience ──────────────────────────────────────────────────
  { id: "usecase", source: "MiaMe/Lifestyle", text: 'חוויה של דו-גלגלי עם יציבות ובטיחות של ארבעה גלגלים. אידיאלי לפעילות, סיורים, תיירות ושילוח. אפשרות ישיבה או עמידה.' },
  // ── Pricing ─────────────────────────────────────────────────────────────────
  { id: "price-4x2", source: "MiaMe/Models", text: 'מיה פור 4×2 (העירוני החכם) — החל מ-19,900 ש"ח.' },
  { id: "price-2x4lr", source: "MiaMe/Models", text: 'מיה פור 2×4 Long Range (הטווח המורחב) — החל מ-21,900 ש"ח, סוללה 35Ah.' },
  { id: "price-4x4", source: "MiaMe/Models", text: 'מיה פור 4×4 (הכוח לכל מסלול) — החל מ-27,900 ש"ח, ארבעה מנועים והנעה כפולה לשטח.' },
  // ── Legal status ────────────────────────────────────────────────────────────
  { id: "legal-status", source: "MiaMe/LegalStatus", text: 'מיה פור מסווגת כקלנועית: מזוהה במספר שילדה ייחודי (לא לוחית רישוי), ללא אגרות רישוי, פטורה מהדוחות שדו-גלגלי ממונע סופג. תואמת תקן EN17128 ולתקנות הקלנועית בישראל.' },
  // ── Patents ─────────────────────────────────────────────────────────────────
  { id: "patents", source: "MiaMe/Patents", text: 'פלטפורמת המזעור של MIA Dynamics מוגנת פטנטים רשומים בארה"ב ובישראל: US 11,878,763 B2, US 12,097,926 B2, IL 280339, IL 285336.' },
  // ── Service & warranty ──────────────────────────────────────────────────────
  { id: "service", source: "MiaMe/Service", text: 'אחריות יבואן רשמי 12 חודשים · MEU · Mayer Electric Utilities. שירות ארצי ורשת מורשים.' },
  // ── Methodology (the unique architecture) ───────────────────────────────────
  { id: "method-arch", source: "MiaMe/Brain", text: 'ארכיטקטורת המוח: Ultra (אורקסטרציה) → Masters (החלטות איכות, Sonnet) → Max (פעולות מהירות, Haiku) → Guardian (ציות ובטיחות דטרמיניסטיים). דוקטרינה: RAG על פני fine-tuning, מקור-אמת יחיד.' },
  { id: "method-bigfive", source: "MiaMe/Brain", text: 'התאמת Big Five Deal: מודל OCEAN ממפה את פרופיל הלקוח לדגם ולמסלול (4×2 · 2×4 LR · 4×4 · השכרה Hub). ההתאמה מוסברת, לא קופסה שחורה.' },
  { id: "method-gametheory", source: "MiaMe/Brain", text: 'שער תורת-משחקים: הצעות נבחנות לאופטימליות פארטו — אין ביצוע אוטומטי להצעה שאינה Pareto-efficient, כדי שכל עסקה תהיה win-win ללקוח ולמערכת.' },
  { id: "method-enrichment", source: "MiaMe/Brain", text: 'העשרה אינסטרומנטלית (Feuerstein): המערכת לומדת ומשתפרת מכל אינטראקציה (Perceive → Reason → Act → Learn → Deliver), ומעשירה את בסיס הידע באופן מתודולוגי ומתמשך.' }
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
      if (hits.length) return hits; // empty ⇒ corpus not backfilled ⇒ fall through
    } catch {
      // provider/RPC hiccup ⇒ degrade gracefully to keyword
    }
  }
  return keywordRetrieve(query, k);
}
