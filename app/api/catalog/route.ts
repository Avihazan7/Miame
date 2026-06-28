// app/api/catalog/route.ts — miame-scoped storefront catalog from the central
// read model (vehicle_read_model), proxied server-side so tenant resolution stays
// Host-based. Falls back to an empty catalog when the brain is unconfigured.
import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getCatalog();
  if (!catalog) {
    return NextResponse.json({ tenant: "miame", count: 0, vehicles: [] });
  }
  return NextResponse.json(catalog);
}
