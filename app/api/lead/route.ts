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
    const msg = e instanceof Error ? e.message : "lead pipeline error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
