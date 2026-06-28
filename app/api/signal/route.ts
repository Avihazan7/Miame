// app/api/signal/route.ts — storefront behavioural signal → central brain.
//
// The browser emits an anonymous per-visitor ref + a known interaction signal; we
// forward it server-side (with the miame Host) so the brain nudges that visitor's
// Big Five on the central Entity Graph. Best-effort: learning never blocks the UI.
import { NextResponse } from "next/server";
import { postSignal } from "@/lib/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { ref?: string; signal?: string; vin?: string };
  try {
    body = (await req.json()) as { ref?: string; signal?: string; vin?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const ref = String(body.ref ?? "").trim();
  const signal = String(body.signal ?? "").trim();
  if (!ref || !signal) {
    return NextResponse.json({ error: "ref and signal are required" }, { status: 400 });
  }
  const result = await postSignal(ref, signal, body.vin ? String(body.vin) : undefined);
  return NextResponse.json({ ok: result != null });
}
