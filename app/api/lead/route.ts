// app/api/lead/route.ts — the Demand engine's per-lead endpoint.
//
// POST a lead → processLead() → { score, segment, priority, nurture, guardian }.
// This is the HTTP face of the deals campaign: a web form, the WhatsApp bot, or an
// n8n node posts a lead here and gets back a scored, segmented, grounded nurture
// draft. SERVER-ONLY; gated on ANTHROPIC_API_KEY (the Max/Master tiers).
import { NextResponse } from "next/server";
import { processLead, type LeadInput } from "@/brain/pipeline";
import { brainReady } from "@/brain/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Health check — readiness without exposing any secret. */
export function GET() {
  return NextResponse.json({ ok: true, ready: brainReady, service: "miame-demand-lead" });
}

export async function POST(req: Request) {
  if (!brainReady) {
    return NextResponse.json(
      { error: "brain not configured — set ANTHROPIC_API_KEY in the environment" },
      { status: 503 }
    );
  }

  let lead: LeadInput;
  try {
    lead = (await req.json()) as LeadInput;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const outcome = await processLead(lead, new Date().toISOString());
    return NextResponse.json(outcome);
  } catch (e) {
    // Never surface the raw pipeline error to the public client — an upstream model
    // error can carry provider/account detail (billing, request ids). Keep it in the
    // server log only. An upstream model failure (billing, rate-limit, provider
    // outage) is a transient 503; anything else is a genuine 500. The web lead itself
    // is captured client-side → Supabase independently of this AI-nurture endpoint,
    // so a failure here never costs us the lead.
    const raw = e instanceof Error ? e.message : String(e);
    const upstream = raw.startsWith("[brain]");
    console.error("[miame-demand-lead] pipeline error:", raw);
    return NextResponse.json(
      { error: upstream ? "nurture service temporarily unavailable" : "lead pipeline error" },
      { status: upstream ? 503 : 500 }
    );
  }
}
