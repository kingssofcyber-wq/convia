"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileDown,
  FileText,
  Gauge,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";
import { PDFDocument } from "pdf-lib";

type CompressStatus = "idle" | "reading" | "processing" | "done" | "error";

type CompressionResult = {
  blob: Blob;
  filename: string;
  originalSize: number;
  compressedSize: number;
  savings: number;
  targetSize: number;
  targetReached: boolean;
  keptOriginal: boolean;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "document";
}

function getTargetSize(originalSize: number, reductionPercent: number): number {
  // The selected percentage is the amount to REMOVE, not the amount to KEEP.
  // Example: 50 MB with 90% reduction => 50 * (100 - 90) / 100 = 5 MB.
  const percentToKeep = 100 - reductionPercent;
  return Math.max(1024, Math.floor((originalSize * percentToKeep) / 100));
}

async function createFirstPagePreview(file: File): Promise<{ previewUrl: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, 560 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("PDF preview could not start in this browser. Please try Chrome or Edge.");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const previewBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the PDF preview."))), "image/jpeg", 0.88);
    });
    const previewUrl = URL.createObjectURL(previewBlob);
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup?.();
    return { previewUrl, pages: pageCount };
  } finally {
    // PDF.js exposes destroy on the loading task; close the worker after creating the thumbnail.
    await loadingTask.destroy();
  }
}

type RasterProgress = (completedPages: number, totalPages: number) => void;

/**
 * 11zon-inspired compression pipeline:
 * render each PDF page to a white-backed canvas, encode it as JPEG,
 * and rebuild a compact PDF containing those page images.
 * This is a newly written implementation, not 11zon's private source code.
 */
async function rasterizePdfToJpegPdf(
  file: File,
  dpi: number,
  quality: number,
  onPageProgress: RasterProgress,
): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const inputBytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({
    data: inputBytes,
    isEvalSupported: false,
  });

  try {
    const sourcePdf = await loadingTask.promise;
    const outputPdf = await PDFDocument.create();
    const totalPages = sourcePdf.numPages;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const sourcePage = await sourcePdf.getPage(pageNumber);
      const requestedScale = dpi / 96;
      let effectiveScale = requestedScale;
      let viewport = sourcePage.getViewport({ scale: effectiveScale });

      // Guard against unusually large page dimensions exhausting browser memory.
      const maxPixels = 12_000_000;
      const pixelCount = viewport.width * viewport.height;
      if (pixelCount > maxPixels) {
        const safetyScale = Math.sqrt(maxPixels / pixelCount);
        effectiveScale = requestedScale * safetyScale;
        viewport = sourcePage.getViewport({ scale: effectiveScale });
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        throw new Error("Your browser could not create an image canvas. Please try Chrome or Edge.");
      }

      // JPEG has no alpha channel; use a white page background for transparent PDFs.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await sourcePage.render({
        canvasContext: context,
        viewport,
        background: "rgb(255,255,255)",
      }).promise;

      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error(`Could not encode PDF page ${pageNumber}.`))),
          "image/jpeg",
          quality,
        );
      });
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const embeddedImage = await outputPdf.embedJpg(jpegBytes);

      // Convert rendered pixels back to PDF points, accounting for PDF.js CSS pixels.
      const actualDpi = effectiveScale * 96;
      const safeDpi = Number.isFinite(actualDpi) && actualDpi > 0 ? actualDpi : dpi;
      const pageWidthPoints = (canvas.width * 72) / safeDpi;
      const pageHeightPoints = (canvas.height * 72) / safeDpi;
      const outputPage = outputPdf.addPage([pageWidthPoints, pageHeightPoints]);
      outputPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageWidthPoints,
        height: pageHeightPoints,
      });

      // Release large pixel buffers before moving to the next page.
      canvas.width = 0;
      canvas.height = 0;
      sourcePage.cleanup();
      onPageProgress(pageNumber, totalPages);
    }

    const outputBytes = await outputPdf.save({ useObjectStreams: true });
    const stableBytes = new Uint8Array(outputBytes);
    return new Blob([stableBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  } finally {
    // PDF.js provides destroy() on the loading task, not on the document proxy.
    await loadingTask.destroy();
  }
}

export default function CompressPdfPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [reductionPercent, setReductionPercent] = useState(80);
  const [status, setStatus] = useState<CompressStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [activity, setActivity] = useState("Ready when you are");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const busy = status === "reading" || status === "processing";
  const requestedTargetSize = file ? getTargetSize(file.size, reductionPercent) : 0;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, [previewUrl]);

  function clearPreviousResult() {
    setResult(null);
    setProgress(0);
    setErrorMessage("");
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  }

  async function chooseFile(nextFile?: File) {
    if (!nextFile || busy) return;
    clearPreviousResult();

    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a PDF file.");
      setStatus("error");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setErrorMessage("This file is larger than 100 MB. Please choose a smaller PDF.");
      setStatus("error");
      return;
    }

    setStatus("reading");
    setActivity("Reading PDF and preparing first-page preview…");
    setFile(null);
    setPageCount(null);
    try {
      const preview = await createFirstPagePreview(nextFile);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return preview.previewUrl;
      });
      setFile(nextFile);
      setPageCount(preview.pages);
      setStatus("idle");
      setActivity("PDF ready to compress");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not read this PDF.";
      setErrorMessage(message);
      setStatus("error");
      setActivity("Could not read this PDF");
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void chooseFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    if (busy) return;
    setFile(null);
    setPageCount(null);
    setStatus("idle");
    setActivity("Ready when you are");
    setErrorMessage("");
    clearPreviousResult();
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function compressPdf() {
    if (!file || busy) return;
    clearPreviousResult();
    setStatus("processing");
    setProgress(1);
    setActivity("Preparing image-based PDF compression…");

    const targetSizeBytes = getTargetSize(file.size, reductionPercent);
    const maxPasses = 6;
    let lowQualityBound = 0;
    let highQualityBound = 1;
    // A stronger requested reduction starts with lower DPI/JPEG quality.
    let qualitySearch = Math.max(0.08, Math.min(0.92, 1 - (reductionPercent / 100) * 0.8));
    let bestAtOrBelowTarget: { blob: Blob; dpi: number; quality: number } | null = null;
    let smallestAttempt: { blob: Blob; dpi: number; quality: number } | null = null;

    try {
      for (let pass = 0; pass < maxPasses; pass += 1) {
        const dpi = Math.round(72 + qualitySearch * 108);
        const jpegQuality = Math.max(0.35, Math.min(0.93, 0.38 + qualitySearch * 0.52));
        const passNumber = pass + 1;
        setProgress(Math.round((pass / maxPasses) * 94));
        setActivity(`Image compression pass ${passNumber}/${maxPasses} · ${dpi} DPI · ${(jpegQuality * 100).toFixed(0)}% JPEG quality`);

        const candidateBlob = await rasterizePdfToJpegPdf(
          file,
          dpi,
          jpegQuality,
          (completedPages, totalPages) => {
            const passFraction = completedPages / Math.max(1, totalPages);
            const overall = ((pass + passFraction) / maxPasses) * 94;
            setProgress(Math.max(1, Math.min(94, Math.round(overall))));
            setActivity(`Pass ${passNumber}/${maxPasses}: rendering page ${completedPages} of ${totalPages}…`);
          },
        );

        const attempt = { blob: candidateBlob, dpi, quality: jpegQuality };
        if (!smallestAttempt || candidateBlob.size < smallestAttempt.blob.size) {
          smallestAttempt = attempt;
        }

        if (candidateBlob.size <= targetSizeBytes) {
          if (!bestAtOrBelowTarget || candidateBlob.size > bestAtOrBelowTarget.blob.size) {
            bestAtOrBelowTarget = attempt;
          }
          // We are below the target; try a little more quality to get closer to it.
          lowQualityBound = qualitySearch;
        } else {
          // We are above the target; reduce DPI/quality on the next pass.
          highQualityBound = qualitySearch;
        }

        const sizeDelta = Math.abs(candidateBlob.size - targetSizeBytes) / Math.max(1, targetSizeBytes);
        if (sizeDelta <= 0.025 || highQualityBound - lowQualityBound <= 0.025) {
          break;
        }
        qualitySearch = (lowQualityBound + highQualityBound) / 2;
      }

      const best = bestAtOrBelowTarget ?? smallestAttempt;
      if (!best) throw new Error("The PDF compressor could not create an output file.");

      // Never replace the source with a larger file.
      const keptOriginal = best.blob.size >= file.size;
      const finalBlob = keptOriginal ? file : best.blob;
      const compressedSize = finalBlob.size;
      const savings = file.size > 0 ? Math.max(0, ((file.size - compressedSize) / file.size) * 100) : 0;
      const targetReached = !keptOriginal && compressedSize <= targetSizeBytes;
      const filename = `${safeBaseName(file.name)}-compressed.pdf`;

      setResult({
        blob: finalBlob,
        filename,
        originalSize: file.size,
        compressedSize,
        savings,
        targetSize: targetSizeBytes,
        targetReached,
        keptOriginal,
      });
      setProgress(100);
      setStatus("done");
      setActivity(keptOriginal ? "No smaller output was produced" : targetReached ? "Requested target size reached" : "Closest image-compressed result created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF compression could not be completed.";
      setErrorMessage(message);
      setStatus("error");
      setActivity("Compression could not be completed");
    }
  }

  function downloadResult() {
    if (!result) return;
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    const url = URL.createObjectURL(result.blob);
    downloadUrlRef.current = url;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => {
      if (downloadUrlRef.current === url) {
        URL.revokeObjectURL(url);
        downloadUrlRef.current = null;
      }
    }, 30000);
  }

  function resetTool() {
    if (busy) return;
    removeFile();
    setReductionPercent(80);
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolHeader
        title="Compress PDF"
        description="Set how much smaller you want your PDF. Convia calculates a target size and aims to preserve readable pages."
        icon={FileDown}
      />

      <main className="container mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={onFileChange} className="hidden" />

        {!file && (
          <section className="mx-auto mt-3 max-w-3xl rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload your PDF</h2>
                <p className="text-sm text-muted-foreground">Choose a PDF up to 100 MB. Then set your target reduction.</p>
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${isDragging ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border bg-muted/20 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"}`}
            >
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                {status === "reading" ? <Loader2 className="h-8 w-8 animate-spin" /> : <UploadCloud className="h-8 w-8" />}
              </div>
              <h3 className="text-xl font-bold">{status === "reading" ? "Reading your PDF…" : "Drop your PDF here"}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Drag and drop a PDF file here, or browse your device. Your document stays in your browser.</p>
              <button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); fileInputRef.current?.click(); }} className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-violet-600 px-6 font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-50">
                <FileText className="h-5 w-5" /> Select PDF file
              </button>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Private browser processing</span>
                <span>PDF files only</span>
                <span>Maximum 100 MB</span>
              </div>
            </div>
          </section>
        )}

        {errorMessage && (
          <div role="alert" className="mx-auto mt-5 flex max-w-5xl items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-600">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage("")} aria-label="Dismiss error" className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {file && (
          <div className="mt-2 grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="space-y-5">
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-600"><FileText className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Step 1</p>
                      <h2 className="text-lg font-bold">Your PDF</h2>
                    </div>
                  </div>
                  <button type="button" onClick={removeFile} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600"><FileText className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold" title={file.name}>{file.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatBytes(file.size)}{pageCount ? ` · ${pageCount} pages` : ""}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><Gauge className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Step 2</p>
                    <h2 className="text-lg font-bold">Choose target reduction</h2>
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <label htmlFor="compression-reduction" className="text-sm font-semibold">Reduce file size by</label>
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-3 py-2">
                    <input
                      aria-label="Target file size reduction percentage"
                      type="number"
                      min={5}
                      max={90}
                      value={reductionPercent}
                      disabled={busy}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") return;
                        const value = Math.max(5, Math.min(90, Math.round(Number(raw))));
                        if (Number.isFinite(value)) setReductionPercent(value);
                      }}
                      className="w-12 bg-transparent text-right text-sm font-bold outline-none"
                    />
                    <span className="text-sm font-bold text-muted-foreground">%</span>
                  </div>
                </div>
                <input
                  id="compression-reduction"
                  type="range"
                  min={5}
                  max={90}
                  step={1}
                  value={reductionPercent}
                  disabled={busy}
                  onChange={(event) => setReductionPercent(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Gentler reduction</span><span>Stronger reduction</span></div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Original size</p>
                    <p className="mt-1 text-lg font-bold">{formatBytes(file.size)}</p>
                  </div>
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-xs text-muted-foreground">Requested target size</p>
                    <p className="mt-1 text-lg font-bold text-violet-700 dark:text-violet-200">{formatBytes(requestedTargetSize)}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <p className="text-muted-foreground">An {reductionPercent}% reduction means the output target is {100 - reductionPercent}% of the original size. For example, 50 MB at 90% reduction targets 5 MB. Convia tries multiple image-quality and DPI combinations to get as close to that target as possible.</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">This 11zon-inspired method renders each page as a compressed JPEG image and rebuilds the PDF. It can reduce image-heavy files substantially, but text will no longer be selectable/searchable and fine print may soften at strong settings.</p>
                </div>
                <button type="button" onClick={() => void compressPdf()} disabled={busy || !file} className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 px-6 text-base font-bold text-white shadow-xl shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Compressing toward target…</> : <><Sparkles className="h-5 w-5" /> Compress PDF to target</>}
                </button>
                {status === "processing" && (
                  <div className="mt-5" aria-live="polite">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-muted-foreground">{activity}</span><span className="font-bold tabular-nums">{progress}%</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                  </div>
                )}
              </div>

              {result && (
                <div className="rounded-3xl border border-emerald-500/20 bg-card p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Step 3</p>
                      <h2 className="text-lg font-bold">Compression Finished</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Original size</p><p className="mt-1 text-lg font-bold">{formatBytes(result.originalSize)}</p></div>
                    <div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Final size</p><p className="mt-1 text-lg font-bold">{formatBytes(result.compressedSize)}</p></div>
                  </div>
                  <div className={`mt-3 rounded-2xl p-4 ${result.targetReached ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                    <p className={`text-sm font-bold ${result.targetReached ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                      {result.keptOriginal ? "No smaller output was produced" : result.targetReached ? "Requested target reached" : "Best available result — target not reached"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.keptOriginal
                        ? "The original PDF is kept because the compression output was not smaller."
                        : `${result.savings.toFixed(1)}% smaller · ${formatBytes(result.originalSize - result.compressedSize)} saved. Requested target: ${formatBytes(result.targetSize)}.`}
                    </p>
                    {!result.targetReached && !result.keptOriginal && (
                      <p className="mt-2 text-xs text-muted-foreground">This file could not reach the requested size with the available image-quality settings. Try a smaller reduction target for clearer pages.</p>
                    )}
                  </div>
                  <button type="button" onClick={downloadResult} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700">
                    <Download className="h-5 w-5" /> Download Compressed PDF
                  </button>
                  <button type="button" onClick={resetTool} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition hover:bg-muted">
                    <RefreshCw className="h-4 w-4" /> Compress another PDF
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200"><FileCheck2 className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Preview</p>
                    <h2 className="text-lg font-bold">First page preview</h2>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Page 1{pageCount ? ` / ${pageCount}` : ""}</span>
              </div>
              <div className="flex min-h-[560px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-slate-100 p-4 dark:bg-slate-900 sm:min-h-[680px]">
                {previewUrl ? (
                  // Only the first page is rasterized for preview; the original PDF remains unchanged until compression.
                  <img src={previewUrl} alt="First page of the uploaded PDF" className="max-h-[640px] w-auto max-w-full rounded-lg bg-white object-contain shadow-xl" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center text-muted-foreground"><FileText className="h-12 w-12 opacity-40" /><p className="text-sm">PDF preview will appear here.</p></div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Your PDF is processed locally in your browser.</div>
            </section>
          </div>
        )}

        {status === "error" && !file && !errorMessage && (
          <p className="mt-4 text-center text-sm text-muted-foreground">Select a PDF to start again.</p>
        )}
      </main>
    </div>
  );
}
