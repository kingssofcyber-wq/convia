import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isEligiblePublicPath, routeMatches } from "@/lib/ads/route-matcher";
import { AD_ZONES, type AdZone, type AdUnitRow, type PublicAdUnit } from "@/lib/ads-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const zone = params.get("zone") as AdZone | null;
  const pathname = params.get("pathname") || "/";

  if (!zone || !AD_ZONES.some((item) => item.value === zone)) {
    return NextResponse.json({ ads: [] }, { status: 400 });
  }
  if (!isEligiblePublicPath(pathname)) {
    return NextResponse.json({ ads: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("convia_ad_units")
      .select("id,name,publisher_id,slot_id,ad_format,ad_layout,ad_layout_key,width_px,height_px,full_width_responsive,zone,route_scope,route_path,device,priority,enabled,created_at,updated_at,created_by_email")
      .eq("enabled", true)
      .eq("zone", zone)
      .order("priority", { ascending: true });

    if (error) throw error;

    const ads: PublicAdUnit[] = ((data || []) as AdUnitRow[])
      .filter((unit) => routeMatches(unit.route_scope, unit.route_path, pathname))
      .map((unit) => ({
        id: unit.id,
        name: unit.name,
        publisher_id: unit.publisher_id,
        slot_id: unit.slot_id,
        ad_format: unit.ad_format,
        ad_layout: unit.ad_layout,
        ad_layout_key: unit.ad_layout_key,
        width_px: unit.width_px,
        height_px: unit.height_px,
        full_width_responsive: unit.full_width_responsive,
        zone: unit.zone,
        device: unit.device,
        priority: unit.priority,
      }));

    return NextResponse.json({ ads }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Convia public ad config error:", error);
    return NextResponse.json({ ads: [], error: "Ad configuration is temporarily unavailable." }, { status: 200 });
  }
}
