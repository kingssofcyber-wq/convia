import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/ads-auth";

export const runtime = "nodejs";

export async function POST() {
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
