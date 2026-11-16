"use client";

import * as React from "react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { extractPositionedPages } from "@/lib/pdf/positioned-extract";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Presentation,
  UploadCloud,
  X,
} from "lucide-react";

type SlideText = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
};

type SlidePayload =
  | { kind: "image"; data: string; x: number; y: number; w: number; h: number }
  | { kind: "text"; shapes: SlideText[] };

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const MAX_FILE_BYTES = 60 * 1024 * 1024;
const MAX_PAGES = 80;
const MAX_PAYLOAD_BYTES = 34 * 1024 * 1024;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function outputName(fileName: string, mode: "editable" | "visual") {
  const base = fileName.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 100) || "document";
  return `${base}-${mode === "editable" ? "editable-text" : "visual"}.pptx`;
}

export function PdfToPptWorkspace() {
  const input = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<"editable" | "visual">("editable");
  const [useOcr, setUseOcr] = React.useState(false);
  const [ocrLanguage, setOcrLanguage] = React.useState<"eng" | "hin" | "eng+hin">("eng");
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [result, setResult] = React.useState<{ url: string; name: string; size: number } | null>(null);

  React.useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result]);

  const selectFile = (next: File | undefined) => {
    if (!next) return;
    if (next.type !== "application/pdf" && !next.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setError("PDF must be 60 MB or less.");
      return;
    }
    setFile(next);
    setError("");
    setNotice("");
    setResult(null);
    setProgress(0);
  };

  const convert = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setProgress(3);
    setPhase("Opening PDF");

    let loadingTask: { destroy: () => Promise<void> } | null = null;
    let pdfDocument: { numPages: number; getPage: (n: number) => Promise<any>; destroy?: () => Promise<void> } | null = null;

    try {
      const positioned = mode === "editable" && useOcr
        ? await extractPositionedPages(file, {
            useOcr: true,
            ocrLanguage,
            onProgress: (value, message) => {
              setProgress(Math.min(55, 5 + Math.round(value * 0.55)));
              setPhase(message);
            },
          })
        : null;

      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      pdfDocument = await loadingTask.promise;

      if (pdfDocument.numPages > MAX_PAGES) {
        throw new Error(`This tool supports up to ${MAX_PAGES} pages per conversion. Split the PDF and try again.`);
      }

      const slides: SlidePayload[] = [];
      let shapeCount = 0;

      for (let pageNo = 1; pageNo <= pdfDocument.numPages; pageNo += 1) {
        setPhase(`Preparing slide ${pageNo} of ${pdfDocument.numPages}`);
        setProgress(Math.min(88, 8 + Math.round((pageNo - 1) / pdfDocument.numPages * 78)));
        const page = await pdfDocument.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(SLIDE_W / viewport.width, SLIDE_H / viewport.height);
        const offsetX = (SLIDE_W - viewport.width * scale) / 2;
        const offsetY = (SLIDE_H - viewport.height * scale) / 2;

        if (mode === "visual") {
          const renderScale = Math.min(1.6, 2400 / Math.max(viewport.width, viewport.height));
          const renderViewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error(`Could not render page ${pageNo}.`);
          await page.render({ canvas, canvasContext: context, viewport: renderViewport }).promise;
          const data = canvas.toDataURL("image/jpeg", 0.88);
          const imageW = viewport.width * scale;
          const imageH = viewport.height * scale;
          slides.push({ kind: "image", data, x: offsetX, y: offsetY, w: imageW, h: imageH });
          canvas.width = 1;
          canvas.height = 1;
        } else {
          const shapes: SlideText[] = [];
          const positionedPage = positioned?.[pageNo - 1];

          if (positionedPage) {
            const chunks = positionedPage.lines.flatMap((line) => line.chunks);
            for (const chunk of chunks) {
              const topY = positionedPage.ocrUsed
                ? (-chunk.y - chunk.height / 2)
                : (viewport.height - chunk.y - chunk.height);
              const x = offsetX + chunk.x * scale;
              const y = offsetY + topY * scale;
              shapes.push({
                text: chunk.text,
                x: clamp(x, 0, SLIDE_W - 0.08),
                y: clamp(y, 0, SLIDE_H - 0.08),
                w: clamp(chunk.width * scale + 0.04, 0.08, SLIDE_W),
                h: clamp(chunk.height * scale * 1.55, 0.08, 2),
                fontSize: clamp((chunk.fontSize || 10) * scale * 72, 5, 34),
                color: "111827",
                bold: /bold|black|heavy/i.test(chunk.fontName),
                italic: /italic|oblique/i.test(chunk.fontName),
              });
            }
          } else {
            const content = await page.getTextContent();
            const items = (content.items as Array<{
              str?: string;
              transform?: number[];
              width?: number;
              height?: number;
              fontName?: string;
            }>).filter((item) => typeof item.str === "string" && item.str.trim().length > 0);

            for (const item of items) {
              const transform = item.transform ?? [10, 0, 0, 10, 0, 0];
              const pdfFontSize = clamp(Math.hypot(transform[0] ?? 0, transform[1] ?? 0) || item.height || 10, 5, 48);
              const textX = transform[4] ?? 0;
              const textY = transform[5] ?? 0;
              const x = offsetX + textX * scale;
              const y = offsetY + (viewport.height - textY - pdfFontSize) * scale;
              const width = (item.width ?? (item.str?.length ?? 1) * pdfFontSize * 0.48) * scale;
              shapes.push({
                text: item.str ?? "",
                x: clamp(x, 0, SLIDE_W - 0.08),
                y: clamp(y, 0, SLIDE_H - 0.08),
                w: clamp(width + 0.06, 0.08, SLIDE_W),
                h: clamp(pdfFontSize * scale * 1.55, 0.08, 1.8),
                fontSize: clamp(pdfFontSize * scale * 72, 5, 34),
                color: "111827",
                bold: /bold|black|heavy/i.test(item.fontName ?? ""),
                italic: /italic|oblique/i.test(item.fontName ?? ""),
              });
            }
          }

          if (!shapes.length) {
            shapes.push({
              text: "No selectable text was found on this page. Enable OCR for scanned PDFs or choose Original page appearance.",
              x: 0.7, y: 3.3, w: 11.9, h: 0.8, fontSize: 15, color: "64748B",
            });
          }
          shapeCount += shapes.length;
          if (shapeCount > 16000) throw new Error("This PDF contains too many text elements for one editable PowerPoint. Try fewer pages or use Original page appearance.");
          slides.push({ kind: "text", shapes });
        }
        page.cleanup();
      }

      setPhase("Sending slide data to the PowerPoint generator");
      setProgress(91);
      const fileName = outputName(file.name, mode);
      const requestBody = JSON.stringify({ fileName, slides });
      const payloadSize = new Blob([requestBody]).size;
      if (payloadSize > MAX_PAYLOAD_BYTES) {
        throw new Error("The generated slide data is too large for one request. Try fewer pages or use a smaller PDF.");
      }

      const response = await fetch("/api/pdf/to-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (!response.ok) {
        let message = "The server could not create the PowerPoint file.";
        try {
          const body = await response.json();
          if (typeof body.error === "string") message = body.error;
        } catch { /* Keep fallback message. */ }
        throw new Error(message);
      }

      setPhase("Validating PowerPoint output");
      setProgress(97);
      const blob = await response.blob();
      if (blob.size < 1000 || (blob.type && !blob.type.includes("presentationml"))) {
        throw new Error("The server returned an invalid PowerPoint file. Please retry with a smaller PDF.");
      }
      const url = URL.createObjectURL(blob);
      setResult({ url, name: fileName, size: blob.size });
      setProgress(100);
      setNotice(mode === "editable"
        ? "PowerPoint created with editable text boxes. Photos, diagrams and vector artwork are not rebuilt in editable-text mode."
        : "PowerPoint created with full-page slide images. Text and artwork on each slide are not individually editable.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create PowerPoint. Please try another PDF.");
    } finally {
      try { await pdfDocument?.destroy?.(); } catch { /* Ignore cleanup errors. */ }
      if (loadingTask) {
        try { await loadingTask.destroy(); } catch { /* Ignore cleanup errors. */ }
      }
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolPageHeader title="PDF to PowerPoint" description="Create editable text slides or full-page visual slides from your PDF." />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8">
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}
              className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-6 text-center transition hover:border-primary/50"
            >
              <UploadCloud size={34} className="mb-4 text-primary" />
              <span className="text-2xl font-extrabold">Upload PDF</span>
              <span className="mt-2 text-sm text-muted-foreground">Create an editable or visual PowerPoint.</span>
              <span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose PDF</span>
              <span className="mt-4 text-xs text-muted-foreground">PDF only · Maximum 60 MB · Up to 80 pages</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4">
              <FileText className="text-primary" size={24} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => { setFile(null); setResult(null); setError(""); setNotice(""); if (input.current) input.current.value = ""; }} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold">
                Change
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setMode("editable"); setResult(null); }} className={`rounded-2xl border p-4 text-left transition ${mode === "editable" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
              <b className="flex items-center gap-2"><Presentation size={18} /> Editable text</b>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Rebuild selectable text as PowerPoint text boxes with approximate positions.</p>
            </button>
            <button type="button" onClick={() => { setMode("visual"); setResult(null); }} className={`rounded-2xl border p-4 text-left transition ${mode === "visual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
              <b className="flex items-center gap-2"><FileText size={18} /> Original page appearance</b>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Each PDF page becomes a crisp slide image; the page content is not individually editable.</p>
            </button>
          </div>

          {mode === "editable" && (
            <div className="mt-5 rounded-2xl border border-border bg-muted/10 p-4">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={useOcr} onChange={(event) => setUseOcr(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                <span><b className="text-sm">OCR scanned pages for editable text</b><span className="mt-1 block text-xs text-muted-foreground">OCR text is rebuilt as text boxes. Original artwork is not reconstructed in editable mode.</span></span>
              </label>
              {useOcr && (
                <label className="mt-4 block max-w-xs text-xs font-bold">OCR language
                  <select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value as typeof ocrLanguage)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                    <option value="eng">English</option>
                    <option value="hin">Hindi</option>
                    <option value="eng+hin">Hindi + English</option>
                  </select>
                </label>
              )}
            </div>
          )}

          {busy && (
            <div className="mt-6 rounded-xl bg-primary/5 p-4">
              <div className="flex justify-between gap-4 text-sm"><span className="font-bold"><Loader2 size={16} className="mr-2 inline animate-spin" />{phase}</span><b>{progress}%</b></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-primary to-violet-600 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-600"><X size={18} className="mt-0.5 shrink-0" />{error}</div>}
          {notice && <div role="status" className="mt-5 flex gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700"><CheckCircle2 size={18} className="shrink-0" />{notice}</div>}

          {result && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <b>{result.name}</b>
              <p className="mt-1 text-xs text-muted-foreground">{(result.size / 1024).toFixed(1)} KB</p>
              <a href={result.url} download={result.name} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 p-3.5 font-extrabold text-white"><Download size={17} /> Download PPTX</a>
            </div>
          )}

          <button type="button" onClick={() => void convert()} disabled={!file || busy} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 p-4 font-extrabold text-white disabled:opacity-50">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Presentation size={18} />}
            {busy ? "Converting…" : "Create PowerPoint"}
          </button>
        </section>
      </main>
    </div>
  );
}
