// brain/knowledge.ts — RAG knowledge layer (ULEASE_SPEC §7.1).
//
// Backed by the live Supabase `public.knowledge` table (pgvector-ready). Today it does
// keyword retrieval over the corpus (Hebrew-safe). When an embeddings provider is
// wired, switch `retrieve` to the `match_knowledge` RPC (vector cosine) — the table,
// the ivfflat index and the RPC already exist. Server-side; reads the public
// anon-SELECT corpus, so no secret is needed.  (D-022: RAG over fine-tuning.)
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export interface KnowledgeDoc {
  id: string;
  source: string; // provenance — REQUIRED so Guardian's grounding gate can pass
  text: string;
  score?: number;
}

// Offline fallback so the brain never hard-fails if the DB is unreachable.
const FALLBACK: KnowledgeDoc[] = [
  { id: "spec-range", source: "MiaMe/Specs", text: 'טווח ריאלי עד 100 ק"מ; יצרן עד 120 ק"מ.' },
  { id: "price-4x2", source: "MiaMe/Models", text: 'מיה פור 4x2 — החל מ-19,900 ש"ח.' }
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

export async function retrieve(query: string, k = 4): Promise<KnowledgeDoc[]> {
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
