// app/api/lead/route.ts — the Demand engine's per-lead endpoint.
//
// POST a lead → processLead() → { score, segment, priority, nurture, guardian }.
// This is the HTTP face of the deals campaign: a web form, the WhatsApp bot, or an
// n8n node posts a lead here and gets back a scored, segmented, grounded nurture
// draft. SERVER-ONLY; gated on ANTHROPIC_API_KEY (the Max/Master tiers).
//
// M1 hardening: every POST passes the guard chain (origin allowlist → per-IP
// rate limit → body cap → JSON parse), then a zod-bounded schema and a honeypot
// check — all BEFORE the paid model pipeline can be reached.
import { NextResponse } from "next/server";
import { z } from "zod";
import { processLead, type LeadInput } from "@/brain/pipeline";
import { brainReady } from "@/brain/config";
import { guardJsonPost, honeypotTripped } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Health check — readiness without exposing any secret. */
export function GET() {
  return NextResponse.json({ ok: true, ready: brainReady, service: "miame-demand-lead" });
}

const leadSchema = z.object({
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(32).optional(),
  message: z.string().max(2000).optional(),
  model: z.string().trim().max(64).optional(),
  monthly: z.number().finite().min(0).max(10_000_000).optional(),
  source: z.string().trim().max(64).optional(),
  channel: z.string().trim().max(32).optional(),
  consent: z.boolean().optional(),
});

export async function POST(req: Request) {
  const guarded = await guardJsonPost(req, {
    bucket: "lead",
    max: 5,
    maxEnv: "RATE_LIMIT_LEAD_MAX",
    maxBodyBytes: 16_000,
  });
  if (guarded.reject) return guarded.reject;

  // Honeypot: a filled hidden field means a bot — acknowledge and do nothing,
  // so the paid scoring/nurture pipeline is never invoked for spam.
  if (honeypotTripped(guarded.body)) {
    console.warn("[miame-demand-lead] honeypot tripped");
    return NextResponse.json({ ok: true });
  }

  const parsed = leadSchema.safeParse(guarded.body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid lead payload" }, { status: 400 });
  }
  const lead: LeadInput = parsed.data;

  if (!brainReady) {
    return NextResponse.json(
      { error: "brain not configured — set ANTHROPIC_API_KEY in the environment" },
      { status: 503 }
    );
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
