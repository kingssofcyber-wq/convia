import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdsAdmin, authErrorResponse } from "@/lib/ads/require-admin";
import { parseAdSenseSnippet } from "@/lib/ads-parser";
import { AD_ZONES, ROUTE_SCOPES, type AdDevice, type AdRouteScope, type AdZone } from "@/lib/ads-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdsAdmin(request);
    const { data, error } = await getSupabaseAdmin()
      .from("convia_ad_units")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ units: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status !== 500) return NextResponse.json({ error: auth.message }, { status: auth.status });
    console.error("Convia admin list error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load ad units." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdsAdmin(request);
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const code = typeof body.code === "string" ? body.code : "";
    const zone = body.zone as AdZone;
    const routeScope = body.routeScope as AdRouteScope;
    let routePath = typeof body.routePath === "string" ? body.routePath.trim() : "";
    let device = body.device as AdDevice;
    const priorityNumber = Number(body.priority ?? 50);
    const priority = Number.isFinite(priorityNumber) ? Math.max(0, Math.min(1000, Math.round(priorityNumber))) : 50;

    if (!name) return NextResponse.json({ error: "Enter a name for this ad unit." }, { status: 400 });
    if (!AD_ZONES.some((item) => item.value === zone)) return NextResponse.json({ error: "Select a valid placement." }, { status: 400 });
    if (!ROUTE_SCOPES.some((item) => item.value === routeScope)) return NextResponse.json({ error: "Select a valid page scope." }, { status: 400 });
    if (!["all", "desktop", "mobile"].includes(device)) return NextResponse.json({ error: "Select a valid device." }, { status: 400 });
    if (routeScope === "exact" && (!routePath.startsWith("/") || routePath.includes("..") || routePath.length > 255)) {
      return NextResponse.json({ error: "Enter a valid exact route, for example /pdf/compress." }, { status: 400 });
    }
    if (routeScope !== "exact") routePath = "";

    const parsed = parseAdSenseSnippet(code);
    const configuredPublisher = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-7776844434912624";
    if (parsed.publisherId !== configuredPublisher) {
      return NextResponse.json({ error: `Publisher mismatch. This code is for ${parsed.publisherId}; Convia is configured for ${configuredPublisher}.` }, { status: 400 });
    }

    // Fixed-width leaderboard units are desktop-only by default to avoid phone overflow.
    if (parsed.widthPx && parsed.widthPx >= 600 && device === "all") device = "desktop";
    if ((zone === "side-left" || zone === "side-right") && parsed.widthPx && parsed.widthPx > 160) {
      return NextResponse.json({ error: "This fixed unit is wider than the desktop side rail. Use a responsive unit or choose an in-page placement." }, { status: 400 });
    }

    const row = {
      name,
      publisher_id: parsed.publisherId,
      slot_id: parsed.slotId,
      ad_format: parsed.format,
      ad_layout: parsed.layout,
      ad_layout_key: parsed.layoutKey,
      width_px: parsed.widthPx,
      height_px: parsed.heightPx,
      full_width_responsive: parsed.fullWidthResponsive,
      zone,
      route_scope: routeScope,
      route_path: routePath || null,
      device,
      priority,
      enabled: body.enabled !== false,
      created_by_email: admin.email,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("convia_ad_units")
      .insert(row)
      .select("id,name,publisher_id,slot_id,zone,route_scope,route_path,device,priority,enabled,created_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, unit: data }, { status: 201 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status !== 500) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const message = error instanceof Error ? error.message : "Could not save this ad unit.";
    console.error("Convia admin create error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
