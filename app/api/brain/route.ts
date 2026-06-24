// app/api/brain/route.ts — server-side entry point to the U.M.M brain.
//
// POST a BrainEvent → runBrain() → JSON BrainResult. This route handler runs ONLY
// on the server (never bundled to the client), so importing the brain here keeps the
// API key server-side and adds nothing to the public bundle.
import { NextResponse } from "next/server";
import { runBrain } from "@/brain";
import type { BrainEvent } from "@/brain/types";
import { brainReady } from "@/brain/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Health check — reports readiness without exposing any secret. */
export function GET() {
  return NextResponse.json({ ok: true, ready: brainReady, service: "miame-brain-umm" });
}

export async function POST(req: Request) {
  if (!brainReady) {
    return NextResponse.json(
      { error: "brain not configured — set ANTHROPIC_API_KEY in the environment" },
      { status: 503 }
    );
  }

  let event: BrainEvent;
  try {
    event = (await req.json()) as BrainEvent;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!event || typeof event.type !== "string") {
    return NextResponse.json({ error: "missing event.type" }, { status: 400 });
  }

  try {
    const result = await runBrain(event, new Date().toISOString());
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "brain error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
