// app/api/signal/route.ts — storefront behavioural signal → central brain.
//
// The browser emits an anonymous per-visitor ref + a known interaction signal; we
// forward it server-side (with the miame Host) so the brain nudges that visitor's
// Big Five on the central Entity Graph. Best-effort: learning never blocks the UI.
//
// M1 hardening: origin allowlist → per-IP rate limit → body cap → bounded fields;
// the visitor's IP is forwarded so central per-visitor rate buckets stay accurate.
import { NextResponse } from "next/server";
import { postSignal } from "@/lib/brain";
import { clientIp, guardJsonPost } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guarded = await guardJsonPost(req, {
    bucket: "signal",
    max: 60,
    maxEnv: "RATE_LIMIT_SIGNAL_MAX",
    maxBodyBytes: 4_000,
  });
  if (guarded.reject) return guarded.reject;

  const body = guarded.body as { ref?: string; signal?: string; vin?: string };
  const ref = String(body.ref ?? "").trim().slice(0, 64);
  const signal = String(body.signal ?? "").trim().slice(0, 64);
  if (!ref || !signal) {
    return NextResponse.json({ error: "ref and signal are required" }, { status: 400 });
  }
  const result = await postSignal(ref, signal, body.vin ? String(body.vin).slice(0, 32) : undefined, clientIp(req));
  return NextResponse.json({ ok: result != null });
}
