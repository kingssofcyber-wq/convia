import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdsAdmin, authErrorResponse } from "@/lib/ads/require-admin";

export const runtime = "nodejs";

function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdsAdmin(request);
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid ad unit ID." }, { status: 400 });
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.enabled === "boolean") update.enabled = body.enabled;
    if (typeof body.priority === "number" && Number.isFinite(body.priority)) update.priority = Math.max(0, Math.min(1000, Math.round(body.priority)));
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "No supported changes supplied." }, { status: 400 });
    update.updated_at = new Date().toISOString();

    const { data, error } = await getSupabaseAdmin()
      .from("convia_ad_units")
      .update(update)
      .eq("id", id)
      .select("id,enabled,priority,updated_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, unit: data });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status !== 500) return NextResponse.json({ error: auth.message }, { status: auth.status });
    console.error("Convia ad update error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update ad unit." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdsAdmin(request);
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid ad unit ID." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("convia_ad_units").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status !== 500) return NextResponse.json({ error: auth.message }, { status: auth.status });
    console.error("Convia ad delete error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete ad unit." }, { status: 500 });
  }
}
