import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { guardJsonPost } from "@/lib/apiGuard";

export const dynamic = "force-dynamic";

const schema = z.object({
  vehicleId: z.string().min(1).max(140),
  type: z.enum(["gallery_view", "spin360_view", "model3d_view", "cta_click"]),
  payload: z.record(z.unknown()).optional(),
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
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
