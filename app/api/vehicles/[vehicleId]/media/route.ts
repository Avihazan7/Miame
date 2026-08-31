import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// LEAST PRIVILEGE, MEASURED AGAINST THE LIVE POLICY SET (2026-08-31). This route
// reads exactly one thing: `vehicle_media_assets` rows with status='published' —
// and that is exactly what RLS already exposes to anon (policy
// `public_read_published_vehicle_media`, SELECT to anon + authenticated).
//
// The previous version created a client from SUPABASE_SERVICE_ROLE_KEY and
// answered 503 without it. Two things were wrong with that at once:
//   · On any deployment where the service key was not configured — production's
//     actual state — the media/3D API was simply DOWN, degrading every consumer
//     to "no media" for want of a key the read never needed.
//   · The key it insisted on grants write powers a public GET must never hold.
// The anon client is not a downgrade here; it is the correct principal. RLS and
// the explicit status='published' filter below enforce the same visibility twice.
// lib/supabase.ts ships public-by-design defaults, so this works with zero env.

export async function GET(
  _request: Request,
  { params }: { params: { vehicleId: string } }
) {
  if (!supabase) {
    // No client (env explicitly blanked) — fail soft so the page renders
    // without media instead of surfacing a 500 to the visitor.
    return NextResponse.json(
      { ok: false, error: "vehicle_media_unavailable", media: null },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data, error } = await supabase
    .from("vehicle_media_assets")
    .select("*")
    .eq("vehicle_id", params.vehicleId)
    .eq("status", "published")
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Generic on purpose: a vendor error string can carry table names, host
    // names or SQL fragments, and this response is world-readable. The shape
    // (`ok:false` + a stable code) is all the consumer branches on.
    return NextResponse.json(
      { ok: false, error: "vehicle_media_query_failed" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "vehicle_media_not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      media: {
        id: data.vehicle_id,
        make: data.make,
        model: data.model,
        trim: data.trim,
        year: data.model_year,
        coverPath: data.cover_path,
        galleryPaths: data.gallery_paths ?? [],
        spin360Paths: data.spin360_paths ?? [],
        glbPath: data.glb_path,
        usdzPath: data.usdz_path,
        altText: data.alt_text,
        qualityTier: data.quality_tier,
        metadata: data.metadata ?? {},
      },
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
