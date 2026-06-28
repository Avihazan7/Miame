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
