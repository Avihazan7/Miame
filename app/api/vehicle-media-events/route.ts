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

  const url = SUPABASE_PUBLIC_CONFIG.url;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "missing_supabase_env" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

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
