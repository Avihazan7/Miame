// app/api/catalog-match/route.ts — Master Match for the storefront.
//
// The browser sends its anonymous visitor ref; we forward it server-side (with
// the miame Host) to the central brain, which loads that visitor's Big Five +
// In-Market band and returns the best-matched 2026 model. Best-effort: a null
// result (brain unreachable / unconfigured) degrades the UI to the plain grid.
//
// M1 hardening: origin allowlist → per-IP rate limit → body cap before the relay.
import { NextResponse } from "next/server";
import { matchModel } from "@/lib/brain";
import { clientIp, guardJsonPost } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guarded = await guardJsonPost(req, {
    bucket: "catalog-match",
    max: 30,
    maxEnv: "RATE_LIMIT_MATCH_MAX",
    maxBodyBytes: 4_000,
  });
  if (guarded.reject) return guarded.reject;

  const body = guarded.body as { ref?: string; make?: string };
  const ref = String(body.ref ?? "").trim();
  if (ref && !/^[A-Za-z0-9:_-]{1,64}$/.test(ref)) {
    return NextResponse.json({ error: "invalid ref" }, { status: 400 });
  }
  const make = typeof body.make === "string" ? body.make.slice(0, 64) : undefined;
  const result = await matchModel({ ref: ref || undefined, make }, clientIp(req));
  return NextResponse.json(result ?? { match: null, top: [], inMarket: null });
}
