import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "convia_ads_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function signature(timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(`convia-ads-admin:${timestamp}`).digest("hex");
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.CONVIA_ADS_ADMIN_PASSWORD;
  if (!expected || !candidate || candidate.length > 300) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createAdminSession(): Promise<void> {
  const secret = process.env.CONVIA_ADS_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CONVIA_ADS_SESSION_SECRET must contain at least 32 characters.");
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const value = `${timestamp}.${signature(timestamp, secret)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function isAdsAdmin(): Promise<boolean> {
  const secret = process.env.CONVIA_ADS_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const [timestamp, supplied] = raw.split(".");
  if (!timestamp || !supplied || !/^\d+$/.test(timestamp)) return false;
  const issued = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(issued) || issued > now + 60 || now - issued > SESSION_SECONDS) return false;
  const expected = signature(timestamp, secret);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
