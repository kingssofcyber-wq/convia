import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/lib/ads-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password : "";
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
    }
    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
