import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server env vars.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { vehicleId: string } }
) {
  const supabase = adminSupabase();

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
    return NextResponse.json(
      { ok: false, error: "vehicle_media_query_failed", detail: error.message },
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
