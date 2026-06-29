import { NextResponse } from "next/server";

// Public, secret-free uptime endpoint for MiaMe.co.il.
//
// Safe for external uptime checks: returns only build/runtime metadata that is
// already public, never touches Supabase or any secret, and always answers 200
// so a probe can distinguish "app is serving" from "domain/alias is broken".
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "miame",
      parent: "ulease-leasing-co-il",
      timestamp: new Date().toISOString(),
      environment:
        process.env.VERCEL_ENV ??
        process.env.NEXT_PUBLIC_VERCEL_ENV ??
        process.env.NODE_ENV ??
        "unknown",
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
        null,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
