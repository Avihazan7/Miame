// app/api/brain/route.ts — server-side entry point to the U.M.M brain.
//
// POST a BrainEvent → runBrain() → JSON BrainResult. This route handler runs ONLY
// on the server (never bundled to the client), so importing the brain here keeps the
// API key server-side and adds nothing to the public bundle.
//
// M1 hardening: origin allowlist → per-IP rate limit → body cap run BEFORE any
// paid model call, and upstream error text never reaches the public client.
import { NextResponse } from "next/server";
import { runBrain } from "@/brain";
import type { BrainEvent } from "@/brain/types";
import { brainReady } from "@/brain/config";
import { providersHealth } from "@/brain/failover";
import { guardJsonPost } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Health check — readiness + provider/circuit snapshot, zero secrets. */
export function GET() {
  return NextResponse.json({
    ok: true,
    ready: brainReady,
    service: "miame-brain-umm",
    providers: providersHealth()
  });
}

export async function POST(req: Request) {
  const guarded = await guardJsonPost(req, {
    bucket: "brain",
    max: 10,
    maxEnv: "RATE_LIMIT_BRAIN_MAX",
    maxBodyBytes: 16_000,
  });
  if (guarded.reject) return guarded.reject;

  const event = guarded.body as BrainEvent;
  if (!event || typeof event.type !== "string" || event.type.length > 64) {
    return NextResponse.json({ error: "missing event.type" }, { status: 400 });
  }

  if (!brainReady) {
    return NextResponse.json(
      { error: "brain not configured — set ANTHROPIC_API_KEY in the environment" },
      { status: 503 }
    );
  }

  try {
    const result = await runBrain(event, new Date().toISOString());
    const tr = result.trace;
    console.log(
      `[brain] req calls=${tr?.calls ?? 0} costUsd=${(tr?.costUsd ?? 0).toFixed(6)} latencyMs=${tr?.latencyMs ?? 0}`
    );
    return NextResponse.json(result);
  } catch (e) {
    // Generic message only — an upstream model error can carry provider/account
    // detail (billing, request ids). Full error stays in the server log.
    console.error("[miame-brain-umm] error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "brain temporarily unavailable" }, { status: 503 });
  }
}
