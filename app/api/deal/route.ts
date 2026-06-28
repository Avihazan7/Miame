// app/api/deal/route.ts — storefront DEAL capture.
//
// The Mia FOUR simulator's built deal → the U.M.M central brain (leasing-api) as
// the `miame` tenant, returning the SEALED Deal Score (score + grade + reasons).
// This is ADDITIVE to the existing client-side WhatsApp + Supabase funnel and
// must never block it: when the brain is unreachable it returns captured:false
// and the client carries on. Tenant routing + scoring live entirely server-side;
// the browser never sees the brain key or the scoring weights.
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { postLead, brainConfigured, type LeadPayload } from "@/lib/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness without exposing any secret. */
export function GET() {
  return NextResponse.json({ ok: true, configured: brainConfigured, service: "miame-deal-capture" });
}

export async function POST(req: Request) {
  let body: Partial<LeadPayload> & { idempotencyKey?: string };
  try {
    body = (await req.json()) as Partial<LeadPayload> & { idempotencyKey?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.ref || !body.model || !body.customerType || !body.quote) {
    return NextResponse.json({ error: "ref, model, customerType and quote are required" }, { status: 400 });
  }

  // Idempotent by construction: a client-supplied key (a retried submit) collapses
  // to one lead; otherwise each distinct submit gets a fresh key.
  const key =
    typeof body.idempotencyKey === "string" && body.idempotencyKey ? body.idempotencyKey : randomUUID();

  const result = await postLead(body as LeadPayload, key);
  if (!result) {
    return NextResponse.json({ ok: false, captured: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true, captured: true, leadId: result.leadId, score: result.score });
}
