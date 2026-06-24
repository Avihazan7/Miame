// brain/embeddings.ts — the embeddings provider for the RAG *vector* path.
//
// SERVER-SIDE ONLY. Wraps Voyage AI (voyage-3.x → 1024-dim, matching the
// `knowledge.embedding vector(1024)` column and the `match_knowledge` RPC).
// GATED on VOYAGE_API_KEY: callers must check `embeddingsReady` first or catch —
// with no key the brain falls back to keyword retrieval (see knowledge.ts). Voyage
// is intentionally separate from the Anthropic model key: Anthropic has no
// embeddings endpoint, so the vector path needs its own provider. (D-022: RAG.)
import {
  VOYAGE_API_KEY,
  VOYAGE_BASE,
  EMBED_MODEL,
  EMBED_DIM,
  embeddingsReady
} from "./config";

interface VoyageResponse {
  data?: Array<{ embedding: number[] }>;
}

// Voyage uses input_type to optimize asymmetric retrieval (a short query vs a stored
// document are embedded into a shared space but with different priors).
export type EmbedKind = "query" | "document";

async function embedBatch(texts: string[], kind: EmbedKind): Promise<number[][]> {
  if (!embeddingsReady) {
    throw new Error("[brain] VOYAGE_API_KEY not set — embeddings provider not configured.");
  }
  const res = await fetch(`${VOYAGE_BASE}/v1/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      input_type: kind,
      output_dimension: EMBED_DIM
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[brain] embeddings call failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as VoyageResponse;
  const out = (data.data || []).map((d) => d.embedding);
  if (out.length !== texts.length) {
    throw new Error(`[brain] embeddings count mismatch: got ${out.length} for ${texts.length}`);
  }
  return out;
}

/** Embed a single query string → 1024-d vector (for retrieval). */
export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedBatch([text], "query");
  return v;
}

/** Embed a batch of document bodies → 1024-d vectors (for the backfill route). */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  return embedBatch(texts, "document");
}
