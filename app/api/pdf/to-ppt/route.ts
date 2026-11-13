import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_SLIDES = 80;
const MAX_JSON_BYTES = 36 * 1024 * 1024;
const MAX_TEXT_SHAPES = 16_000;
const MAX_TEXT_LENGTH = 10_000;
const MAX_IMAGE_DATA = 12 * 1024 * 1024;
const MAX_TOTAL_IMAGE_DATA = 32 * 1024 * 1024;
const requestHits = new Map<string, { minute: number; count: number }>();

function requestAllowed(request: NextRequest) {
  const key = (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 80);
  const minute = Math.floor(Date.now() / 60_000);
  const current = requestHits.get(key);
  if (!current || current.minute !== minute) requestHits.set(key, { minute, count: 1 });
  else current.count += 1;
  for (const [storedKey, value] of requestHits) if (value.minute < minute - 2) requestHits.delete(storedKey);
  return (requestHits.get(key)?.count ?? 0) <= 5;
}

async function readJsonLimited(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_JSON_BYTES) {
      await reader.cancel();
      throw new Error("Slide data is too large. Try fewer pages or use a smaller PDF.");
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return JSON.parse(bytes.toString("utf8"));
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanFileName(value: unknown) {
  const raw = typeof value === "string" ? value : "convia-document.pptx";
  const name = raw.replace(/[\r\n"\\/:*?<>|]+/g, "-").slice(0, 120);
  return name.toLowerCase().endsWith(".pptx") ? name : `${name || "convia-document"}.pptx`;
}

function numberInRange(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

export async function POST(request: NextRequest) {
  if (!requestAllowed(request)) return error("Too many PowerPoint conversion requests. Try again in a minute.", 429);
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_JSON_BYTES) return error("Slide data is too large. Try fewer pages or use a smaller PDF.", 413);

  let body: unknown;
  try {
    body = await readJsonLimited(request);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not read the slide data.";
    return error(message, message.includes("too large") ? 413 : 400);
  }

  if (!body || typeof body !== "object") return error("Invalid PowerPoint request.");
  const input = body as { fileName?: unknown; slides?: unknown };
  if (!Array.isArray(input.slides) || input.slides.length < 1 || input.slides.length > MAX_SLIDES) {
    return error(`PowerPoint must contain between 1 and ${MAX_SLIDES} slides.`);
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Convia";
  pptx.company = "Convia";
  pptx.subject = "PowerPoint converted from PDF";
  pptx.title = cleanFileName(input.fileName).replace(/\.pptx$/i, "");
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: "Arial",
    bodyFontFace: "Arial",
    lang: "en-US",
  };

  let totalShapes = 0;
  let totalImageBytes = 0;

  try {
    for (let index = 0; index < input.slides.length; index += 1) {
      const rawSlide = input.slides[index];
      if (!rawSlide || typeof rawSlide !== "object") return error(`Slide ${index + 1} is invalid.`);
      const slideData = rawSlide as Record<string, unknown>;
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };

      if (slideData.kind === "image") {
        const data = typeof slideData.data === "string" ? slideData.data : "";
        const match = data.match(/^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/i);
        if (!match) return error(`Slide ${index + 1} contains an unsupported image.`);
        const estimatedBytes = Math.floor((match[2].length * 3) / 4);
        totalImageBytes += estimatedBytes;
        if (estimatedBytes > MAX_IMAGE_DATA || totalImageBytes > MAX_TOTAL_IMAGE_DATA) {
          return error("Rendered slide images are too large. Convert fewer pages at a time or use a smaller PDF.", 413);
        }
        slide.addImage({
          data,
          x: numberInRange(slideData.x, 0, 13.333, 0),
          y: numberInRange(slideData.y, 0, 7.5, 0),
          w: numberInRange(slideData.w, 0.01, 13.333, 13.333),
          h: numberInRange(slideData.h, 0.01, 7.5, 7.5),
        });
        continue;
      }

      if (slideData.kind !== "text" || !Array.isArray(slideData.shapes)) {
        return error(`Slide ${index + 1} has no valid content.`);
      }

      totalShapes += slideData.shapes.length;
      if (totalShapes > MAX_TEXT_SHAPES) return error("This PDF contains too many text elements. Try fewer pages.", 413);

      for (const rawShape of slideData.shapes) {
        if (!rawShape || typeof rawShape !== "object") continue;
        const shape = rawShape as Record<string, unknown>;
        const text = typeof shape.text === "string" ? shape.text.slice(0, MAX_TEXT_LENGTH) : "";
        if (!text.trim()) continue;
        slide.addText(text, {
          x: numberInRange(shape.x, 0, 13.25, 0),
          y: numberInRange(shape.y, 0, 7.42, 0),
          w: numberInRange(shape.w, 0.05, 13.333, 0.5),
          h: numberInRange(shape.h, 0.05, 7.5, 0.2),
          fontFace: "Arial",
          fontSize: numberInRange(shape.fontSize, 5, 36, 12),
          color: typeof shape.color === "string" && /^[0-9A-F]{6}$/i.test(shape.color) ? shape.color : "111827",
          bold: shape.bold === true,
          italic: shape.italic === true,
          margin: 0,
          breakLine: false,
          valign: "mid",
          fit: "shrink",
          paraSpaceAfterPt: 0,
        });
      }
    }

    const output = await pptx.write({ outputType: "nodebuffer", compression: true });
    const bytes = new Uint8Array(output as Uint8Array);
    if (bytes.byteLength < 1000) return error("PowerPoint generation returned an empty file. Please retry.", 500);

    const fileName = cleanFileName(input.fileName);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown PowerPoint generation error.";
    return error(`PowerPoint generation failed: ${message.slice(0, 500)}`, 500);
  }
}
