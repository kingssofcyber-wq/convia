import { NextResponse } from "next/server";
import { isAdsAdmin } from "@/lib/ads-auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdsAdmin() });
}
