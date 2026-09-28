import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { guardJsonPost } from "@/lib/apiGuard";
import { SUPABASE_PUBLIC_CONFIG } from "@/lib/supabase-config";

export const dynamic = "force-dynamic";

/**
 * `payload` WAS `z.record(z.unknown())` — an object of arbitrary shape and depth,
 * bounded only by the route's 8,000-byte body cap, written straight into a jsonb
 * column by the one role in the project that bypasses RLS.
 *
 * The application sends exactly one payload in the whole tree:
 * `{ frames: number }` (components/Product360Stage.tsx:153). Nothing else even has a
 * payload. So the permissive shape bought nothing and accepted everything, and a flat
 * map of scalars is a superset of what any caller here actually needs.
 *
 * Depth is the part that matters: a flat map cannot carry a nested structure at all,
 * so the size cap stops being the only thing standing between an anonymous caller and
 * whatever they feel like storing.
 */
const payloadValue = z.union([z.string().max(120), z.number(), z.boolean(), z.null()]);

const schema = z.object({
  vehicleId: z.string().min(1).max(140),
  type: z.enum(["gallery_view", "spin360_view", "model3d_view", "cta_click"]),
  payload: z
    .record(payloadValue)
    .refine((p) => Object.keys(p).length <= 8, { message: "too many keys" })
    .refine((p) => Object.keys(p).every((k) => k.length <= 40), { message: "key too long" })
    .optional(),
});

export async function POST(request: Request) {
  // M1: origin allowlist + per-IP rate limit + body cap before the
  // service-role insert — this is an unauthenticated public write.
  const guarded = await guardJsonPost(request, {
    bucket: "media-events",
    max: 60,
    maxEnv: "RATE_LIMIT_MEDIA_EVENTS_MAX",
    maxBodyBytes: 8_000,
  });
  if (guarded.reject) return guarded.reject;

  const parsed = schema.safeParse(guarded.body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  // THE ANON KEY IS THE CORRECT PRINCIPAL HERE, NOT A DOWNGRADE.
  //
  // This route used SUPABASE_SERVICE_ROLE_KEY — the one credential in the project that
  // BYPASSES RLS — on behalf of an unauthenticated caller, because the table had no
  // anon INSERT policy (20260629_vehicle_media_ultra.sql said so explicitly). The
  // guards in front of it were an Origin check that passes when no Origin header is
  // sent — curl, by definition — and an in-memory rate limit. MEASURED 2026-09-10
  // against a production build: 200 unauthenticated POSTs with a rotating
  // x-forwarded-for, 200 accepted, because the limiter's key was attacker-chosen.
  //
  // Phase 26-media-events-anon-bounded-insert (ledger 20260910080111) added the policy,
  // bounded by the same shape the zod schema above enforces, so the DATABASE refuses
  // what the application refuses instead of trusting it to. With that in place the
  // strongest credential in the project no longer sits behind a public endpoint.
  //
  // app/api/vehicles/[vehicleId]/media/route.ts made the same move for reads, and its
  // comment states the principle this follows: "The anon client is not a downgrade
  // here; it is the correct principal."
  //
  // ORDER: the policy landed FIRST and this switch second. The reverse would mean an
  // anon INSERT against a table with RLS on and no policy — every media event refused.
  const url = SUPABASE_PUBLIC_CONFIG.url;
  const key = SUPABASE_PUBLIC_CONFIG.anonKey;
  if (!key) {
    return NextResponse.json({ ok: false, error: "missing_supabase_env" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // NO `.select()` HERE, EVER. anon writes this table and can never read it back —
  // that is the design — so there is no SELECT policy for it. `.select()` would make
  // postgrest-js send `Prefer: return=representation`, PostgREST would emit
  // `INSERT ... RETURNING`, and RLS would refuse every single event with an error that
  // names the policy rather than the `.select()` that caused it. Reproduced on a local
  // PostgreSQL 16.13 carrying this exact table and policy, 2026-09-14; the same probe
  // showed the plain insert below succeeding for all four event types. Gated by
  // test/apiRoutes.test.ts, "never asks PostgREST to return the inserted row".
  const { error } = await supabase.from("vehicle_media_events").insert({
    vehicle_id: parsed.data.vehicleId,
    event_type: parsed.data.type,
    source: "web",
    payload: parsed.data.payload ?? {},
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
