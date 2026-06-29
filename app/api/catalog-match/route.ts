// app/api/catalog-match/route.ts — Master Match for the storefront.
//
// The browser sends its anonymous visitor ref; we forward it server-side (with
// the miame Host) to the central brain, which loads that visitor's Big Five +
// In-Market band and returns the best-matched 2026 model. Best-effort: a null
// result (brain unreachable / unconfigured) degrades the UI to the plain grid.
import { NextResponse } from "next/server";
import { matchModel } from "@/lib/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { ref?: string; make?: string };
  try {
    body = (await req.json()) as { ref?: string; make?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const ref = String(body.ref ?? "").trim();
  if (ref && !/^[A-Za-z0-9:_-]{1,64}$/.test(ref)) {
    return NextResponse.json({ error: "invalid ref" }, { status: 400 });
  }
  const result = await matchModel({ ref: ref || undefined, make: body.make });
  return NextResponse.json(result ?? { match: null, top: [], inMarket: null });
}
