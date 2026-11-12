import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const MAX_FILE_BYTES = 60 * 1024 * 1024;
const MAX_CERT_BYTES = 8 * 1024 * 1024;
const ALLOWED_ACTIONS = new Set(["office-to-pdf", "html-to-pdf", "pdfa", "protect", "unlock", "sign"]);
const hits = new Map<string, { window: number; count: number }>();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function clientKey(request: NextRequest) {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 80);
}

function withinLimit(request: NextRequest) {
  const key = clientKey(request);
  const minute = Math.floor(Date.now() / 60_000);
  const current = hits.get(key);
  if (!current || current.window !== minute) hits.set(key, { window: minute, count: 1 });
  else current.count += 1;
  for (const [storedKey, value] of hits) if (value.window < minute - 2) hits.delete(storedKey);
  return (hits.get(key)?.count ?? 0) <= 8;
}

function baseUrl() {
  const raw = process.env.GOTENBERG_URL?.trim();
  if (!raw) return null;
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("Remote PDF engine must use HTTPS.");
  }
  return parsed;
}

function authHeader() {
  const username = process.env.GOTENBERG_USERNAME;
  const password = process.env.GOTENBERG_PASSWORD;
  if (!username || !password) return undefined;
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function safeOutputName(name: string) {
  return name.replace(/[\r\n"\\/]+/g, "-").replace(/[^\w.-]+/g, "_").slice(0, 120) || "convia-output.pdf";
}

function sanitizeHtml(input: string) {
  let html = input.slice(0, 2_000_000);
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<(script|iframe|object|embed|form|video|audio|source|link|base|meta)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  html = html.replace(/<(script|iframe|object|embed|form|video|audio|source|link|base|meta)\b[^>]*\/?>/gi, "");
  html = html.replace(/\s(on[a-z]+|srcdoc|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s(href|src|poster)\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]+))/gi, (whole, attr: string, doubleValue: string, singleValue: string, bareValue: string) => {
    const value = (doubleValue ?? singleValue ?? bareValue ?? "").trim();
    if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value) && attr.toLowerCase() === "src") return ` ${attr}="${value}"`;
    if (value.startsWith("#")) return ` ${attr}="${value}"`;
    return "";
  });
  html = html.replace(/url\(\s*(['"]?)(?!data:image\/)[^)]+\)/gi, "none");
  if (!/<html[\s>]/i.test(html)) html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  return html;
}

async function pingEngine(base: URL) {
  const headers = new Headers();
  const auth = authHeader();
  if (auth) headers.set("Authorization", auth);
  return fetch(new URL("/health", base), { headers, signal: AbortSignal.timeout(8000), cache: "no-store" });
}

export async function GET() {
  try {
    const base = baseUrl();
    if (!base) return NextResponse.json({ configured: false, reachable: false, engine: "Gotenberg 9" }, { headers: { "Cache-Control": "no-store" } });
    const response = await pingEngine(base);
    return NextResponse.json({ configured: true, reachable: response.ok, engine: "Gotenberg 9", status: response.status }, { status: response.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ configured: Boolean(process.env.GOTENBERG_URL), reachable: false, error: error instanceof Error ? error.message : "Engine unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  if (!withinLimit(request)) return jsonError("Too many PDF engine requests from this network. Try again in a minute.", 429);
  let base: URL | null;
  try { base = baseUrl(); } catch (error) { return jsonError(error instanceof Error ? error.message : "Invalid PDF engine URL.", 500); }
  if (!base || !process.env.GOTENBERG_USERNAME || !process.env.GOTENBERG_PASSWORD) return jsonError("Advanced PDF engine is not configured. The site owner must set GOTENBERG_URL, GOTENBERG_USERNAME and GOTENBERG_PASSWORD on the server.", 503);

  let form: FormData;
  try { form = await request.formData(); } catch { return jsonError("Could not read the uploaded form. Please upload the file again.", 400); }
  const action = String(form.get("action") ?? "");
  if (!ALLOWED_ACTIONS.has(action)) return jsonError("Unsupported PDF engine action.", 400);
  const source = form.get("file");
  if (!(source instanceof File) || source.size === 0) return jsonError("Select a non-empty source file.", 400);
  if (source.size > MAX_FILE_BYTES) return jsonError("The source file exceeds the 60 MB upload limit.", 413);
  if (["pdfa", "protect", "unlock", "sign"].includes(action) && !source.name.toLowerCase().endsWith(".pdf")) return jsonError("This operation requires a PDF file.", 415);

  const upstreamForm = new FormData();
  const headers = new Headers();
  const auth = authHeader();
  if (auth) headers.set("Authorization", auth);
  let endpoint = "";
  let outputName = safeOutputName(`${source.name.replace(/\.[^.]+$/, "")}-${action}.pdf`);

  if (action === "office-to-pdf") {
    const ext = source.name.toLowerCase().split(".").pop();
    if (!ext || !["doc", "docx", "odt", "rtf", "xls", "xlsx", "ods", "csv", "ppt", "pptx", "odp"].includes(ext)) return jsonError("Choose a supported Word, Excel, PowerPoint or OpenDocument file.", 415);
    endpoint = "/forms/libreoffice/convert";
    upstreamForm.append("files", source, source.name);
  } else if (action === "html-to-pdf") {
    const html = sanitizeHtml(await source.text());
    const safeFile = new File([html], "index.html", { type: "text/html" });
    endpoint = "/forms/chromium/convert/html";
    upstreamForm.append("files", safeFile, "index.html");
    upstreamForm.append("paperWidth", "8.27");
    upstreamForm.append("paperHeight", "11.7");
    upstreamForm.append("printBackground", "true");
    upstreamForm.append("preferCssPageSize", "true");
    outputName = safeOutputName(`${source.name.replace(/\.[^.]+$/, "")}-converted.pdf`);
  } else if (action === "pdfa") {
    const profile = String(form.get("profile") ?? "PDF/A-2b");
    const supportedProfiles = ["PDF/A-1a", "PDF/A-1b", "PDF/A-2a", "PDF/A-2b", "PDF/A-2u", "PDF/A-3a", "PDF/A-3b", "PDF/A-3u", "PDF/A-4", "PDF/A-4e", "PDF/A-4f", "PDF/UA-1", "PDF/UA-2"];
    if (!supportedProfiles.includes(profile)) return jsonError("Unsupported PDF/A or PDF/UA profile.", 400);
    const language = String(form.get("language") ?? "en").trim().slice(0, 35) || "en";
    endpoint = "/forms/pdf/remediate";
    upstreamForm.append("files", source, source.name);
    upstreamForm.append("profile", profile);
    upstreamForm.append("language", language);
    if (form.get("aggressive") === "true") upstreamForm.append("aggressive", "true");
  } else if (action === "protect") {
    const userPassword = String(form.get("userPassword") ?? "");
    const ownerPassword = String(form.get("ownerPassword") ?? "");
    if (userPassword.length < 8) return jsonError("Use an opening password with at least 8 characters.", 400);
    endpoint = "/forms/pdf/encrypt";
    upstreamForm.append("files", source, source.name);
    upstreamForm.append("userPassword", userPassword);
    upstreamForm.append("ownerPassword", ownerPassword || userPassword);
    upstreamForm.append("algorithm", "aes256");
    const rawPermissions = form.get("permissions");
    if (typeof rawPermissions === "string" && rawPermissions.length <= 2000) {
      try {
        const parsed = JSON.parse(rawPermissions) as Record<string, unknown>;
        const allowed = ["print", "printHighQuality", "modifyContent", "extractText", "modifyAnnotations", "fillForms", "assemble"];
        const safe: Record<string, boolean> = {};
        for (const key of allowed) if (typeof parsed[key] === "boolean") safe[key] = parsed[key] as boolean;
        if (Object.keys(safe).length) upstreamForm.append("permissions", JSON.stringify(safe));
      } catch { return jsonError("Invalid PDF permission settings.", 400); }
    }
  } else if (action === "unlock") {
    const password = String(form.get("password") ?? "");
    if (!password) return jsonError("Enter the correct opening password.", 400);
    endpoint = "/forms/pdf/decrypt";
    upstreamForm.append("files", source, source.name);
    upstreamForm.append("password", password);
  } else if (action === "sign") {
    const certificate = form.get("certificate");
    if (!(certificate instanceof File) || !certificate.size || certificate.size > MAX_CERT_BYTES || !/\.(p12|pfx)$/i.test(certificate.name)) return jsonError("Upload a valid PKCS#12 .p12 or .pfx certificate (maximum 8 MB).", 400);
    const certificatePassword = String(form.get("certificatePassword") ?? "");
    if (!certificatePassword) return jsonError("Enter the signing certificate password.", 400);
    endpoint = "/forms/pdf/sign";
    upstreamForm.append("files", source, source.name);
    upstreamForm.append("files", certificate, certificate.name);
    upstreamForm.append("certificate", certificate.name);
    upstreamForm.append("certificatePassword", certificatePassword);
    upstreamForm.append("name", String(form.get("signerName") ?? "Convia signer").slice(0, 120));
    upstreamForm.append("reason", String(form.get("reason") ?? "Document signed").slice(0, 240));
    upstreamForm.append("location", String(form.get("location") ?? "").slice(0, 120));
    upstreamForm.append("pades", "true");
    outputName = safeOutputName(`${source.name.replace(/\.[^.]+$/, "")}-pades-signed.pdf`);
  }

  try {
    const endpointUrl = new URL(endpoint, base);
    headers.set("Gotenberg-Output-Filename", outputName);
    const upstream = await fetch(endpointUrl, { method: "POST", headers, body: upstreamForm, signal: AbortSignal.timeout(180_000), cache: "no-store" });
    if (!upstream.ok) {
      const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
      return jsonError(`The document engine could not complete this operation (HTTP ${upstream.status}). Check that the file is supported, the password or certificate is correct, and the engine has the required module enabled.`, status);
    }
    const bytes = await upstream.arrayBuffer();
    if (!bytes.byteLength) return jsonError("The document engine returned an empty file.", 502);
    const outHeaders = new Headers({ "Content-Type": upstream.headers.get("content-type") || "application/pdf", "Content-Disposition": `attachment; filename="${outputName}"`, "Content-Length": String(bytes.byteLength), "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" });
    const residual = upstream.headers.get("Gotenberg-Pdf-Remediate-Residual") || upstream.headers.get("Gotenberg-Remediation-Residual");
    const rolledBack = upstream.headers.get("Gotenberg-Pdf-Remediate-Rolled-Back") || upstream.headers.get("Gotenberg-Remediation-Rolled-Back");
    if (residual) outHeaders.set("X-Convia-Pdfa-Residual", residual);
    if (rolledBack) outHeaders.set("X-Convia-Pdfa-Rolled-Back", rolledBack);
    return new Response(bytes, { status: 200, headers: outHeaders });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "The document conversion timed out. Try fewer pages or a smaller file." : "Could not connect to the configured PDF engine. Check its URL and credentials.";
    return jsonError(message, 502);
  }
}
