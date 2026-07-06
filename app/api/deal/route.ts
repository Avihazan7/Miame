// app/api/deal/route.ts — storefront DEAL capture.
//
// The Mia FOUR simulator's built deal → the U.M.M central brain (leasing-api) as
// the `miame` tenant, returning the SEALED Deal Score (score + grade + reasons).
// This is ADDITIVE to the existing client-side WhatsApp + Supabase funnel and
// must never block it: when the brain is unreachable it returns captured:false
// and the client carries on. Tenant routing + scoring live entirely server-side;
// the browser never sees the brain key or the scoring weights.
//
// M1 hardening: origin allowlist → per-IP rate limit → body cap → honeypot before
// the relay; the visitor's IP is forwarded (x-client-ip) so the central brain's
// per-visitor rate buckets survive the relay hop.
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { postLead, brainConfigured, type LeadPayload } from "@/lib/brain";
import { clientIp, guardJsonPost, honeypotTripped } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness without exposing any secret. */
export function GET() {
  return NextResponse.json({ ok: true, configured: brainConfigured, service: "miame-deal-capture" });
}

export async function POST(req: Request) {
  const guarded = await guardJsonPost(req, {
    bucket: "deal",
    max: 10,
    maxEnv: "RATE_LIMIT_DEAL_MAX",
    maxBodyBytes: 32_000,
  });
  if (guarded.reject) return guarded.reject;

  // Honeypot: a bot-built deal is acknowledged as "not captured" (a shape the
  // client already treats as a soft-degrade) and never reaches the brain.
  if (honeypotTripped(guarded.body)) {
    console.warn("[miame-deal-capture] honeypot tripped");
    return NextResponse.json({ ok: true, captured: false });
  }

  const body = guarded.body as Partial<LeadPayload> & { idempotencyKey?: string };
  if (!body.ref || !body.model || !body.customerType || !body.quote) {
    return NextResponse.json({ error: "ref, model, customerType and quote are required" }, { status: 400 });
  }

  // Idempotent by construction: a client-supplied key (a retried submit) collapses
  // to one lead; otherwise each distinct submit gets a fresh key.
  const key =
    typeof body.idempotencyKey === "string" && body.idempotencyKey ? body.idempotencyKey : randomUUID();

  const result = await postLead(body as LeadPayload, key, clientIp(req));
  if (!result) {
    return NextResponse.json({ ok: false, captured: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true, captured: true, leadId: result.leadId, score: result.score });
}
