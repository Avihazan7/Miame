// app/api/embed/route.ts — one-time (idempotent) backfill of RAG embeddings.
//
// Reads every knowledge row whose `embedding IS NULL`, embeds its body via Voyage,
// and writes the 1024-d vector back with the service-role key (anon can only SELECT).
// SERVER-ONLY and doubly-gated: needs VOYAGE_API_KEY (to embed) and
// SUPABASE_SERVICE_ROLE_KEY (to write). Until both are set the brain runs on keyword
// retrieval — which is accurate at the current corpus size — so nothing breaks.
//
// Run once after adding the keys:  curl -X POST https://<site>/api/embed
import { NextResponse } from "next/server";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY,
  embeddingsReady
} from "@/brain/config";
import { embedDocuments } from "@/brain/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PendingRow {
  id: string;
  body: string;
}

async function pendingRows(): Promise<PendingRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/knowledge?select=id,body&embedding=is.null`,
    {
      headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cache: "no-store"
    }
  );
  if (!res.ok) throw new Error(`pending query failed (${res.status})`);
  return (await res.json()) as PendingRow[];
}

/** Health: how many rows still need embeddings, and whether the keys are present. */
export async function GET() {
  let pending = -1;
  try {
    pending = (await pendingRows()).length;
  } catch {
    /* leave -1 to signal the count could not be read */
  }
  return NextResponse.json({
    ok: true,
    service: "brain/embed",
    embeddingsReady,
    hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
    pending
  });
}

export async function POST() {
  if (!embeddingsReady) {
    return NextResponse.json(
      { ok: false, error: "VOYAGE_API_KEY not set — embeddings provider not configured" },
      { status: 503 }
    );
  }
  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY not set — backfill needs write access" },
      { status: 503 }
    );
  }

  let rows: PendingRow[];
  try {
    rows = await pendingRows();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "pending query error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
  if (!rows.length) {
    return NextResponse.json({ ok: true, embedded: 0, message: "nothing to backfill" });
  }

  let vectors: number[][];
  try {
    vectors = await embedDocuments(rows.map((r) => r.body));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "embedding error";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  let embedded = 0;
  const failed: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    // pgvector accepts its text input form "[a,b,c]" through PostgREST; a raw JSON
    // number array would be parsed as a Postgres array and fail the vector cast.
    const literal = `[${vectors[i].join(",")}]`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge?id=eq.${encodeURIComponent(rows[i].id)}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          apikey: SUPABASE_SERVICE_KEY,
          authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          prefer: "return=minimal"
        },
        body: JSON.stringify({ embedding: literal })
      }
    );
    if (res.ok) embedded++;
    else failed.push(rows[i].id);
  }

  return NextResponse.json({ ok: failed.length === 0, embedded, total: rows.length, failed });
}
