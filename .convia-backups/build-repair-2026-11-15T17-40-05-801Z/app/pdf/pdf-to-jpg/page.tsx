"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type OutputFormat = "jpg" | "png" | "webp";
type ConvertedImage = {
  page: number;
  blob: Blob;
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
};
type PdfInfo = { pages: number; size: number };
type PdfJsModule = typeof import("pdfjs-dist");

const MAX_FILE_BYTES = 120 * 1024 * 1024;
const MAX_PAGE_PIXELS = 40_000_000;
const MAX_TOTAL_PIXELS = 450_000_000;
const MAX_RENDERED_PAGES = 250;

const FORMAT_DETAILS: Record<OutputFormat, { mime: string; extension: string; label: string }> = {
  jpg: { mime: "image/jpeg", extension: "jpg", label: "JPG / JPEG" },
  png: { mime: "image/png", extension: "png", label: "PNG" },
  webp: { mime: "image/webp", extension: "webp", label: "WebP" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim() || "convia-pdf";
}

function parsePageRange(value: string, totalPages: number): { pages: number[]; error: string | null } {
  if (!value.trim()) {
    return { pages: Array.from({ length: totalPages }, (_, index) => index + 1), error: null };
  }

  const selected: number[] = [];
  const seen = new Set<number>();
  const tokens = value.split(",").map((token) => token.trim());
  if (tokens.some((token) => !token)) {
    return { pages: [], error: "Please remove empty items from the page range." };
  }

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page < 1 || page > totalPages) {
        return { pages: [], error: `Page ${page} is outside this PDF. Use pages 1–${totalPages}.` };
      }
      if (!seen.has(page)) {
        selected.push(page);
        seen.add(page);
      }
      continue;
    }

    const match = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) {
      return { pages: [], error: `“${token}” is not valid. Use a format such as 1-3, 5, 8-10.` };
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < 1 || end > totalPages || start > totalPages || end < 1) {
      return { pages: [], error: `Range ${token} is outside this PDF. Use pages 1–${totalPages}.` };
    }
    if (start > end) {
      return { pages: [], error: `Range ${token} is backwards. The first page must be smaller.` };
    }
    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) {
        selected.push(page);
        seen.add(page);
      }
    }
  }

  if (selected.length === 0) return { pages: [], error: "Select at least one page." };
  if (selected.length > MAX_RENDERED_PAGES) {
    return { pages: [], error: `Please convert up to ${MAX_RENDERED_PAGES} pages at a time. Use multiple page ranges for larger PDFs.` };
  }
  return { pages: selected, error: null };
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Your browser could not encode this page. Try a lower DPI or another image format."));
        return;
      }
      if (blob.type !== mime) {
        reject(new Error(`${mime} export is not supported by this browser. Please choose JPG or PNG.`));
        return;
      }
      resolve(blob);
    }, mime, quality);
  });
}

export default function PdfToJpgPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const objectUrlsRef = React.useRef<Set<string>>(new Set());

  const [file, setFile] = React.useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = React.useState<PdfInfo | null>(null);
  const [isReading, setIsReading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [passwordRequired, setPasswordRequired] = React.useState(false);

  const [format, setFormat] = React.useState<OutputFormat>("jpg");
  const [dpi, setDpi] = React.useState(300);
  const [quality, setQuality] = React.useState(94);
  const [pageRange, setPageRange] = React.useState("");

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [progressText, setProgressText] = React.useState("Preparing your PDF...");
  const [images, setImages] = React.useState<ConvertedImage[]>([]);
  const [selectedPreview, setSelectedPreview] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isCreatingZip, setIsCreatingZip] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState(0);
  const [zipUrl, setZipUrl] = React.useState<string | null>(null);

  const parsedRange = React.useMemo(
    () => (pdfInfo ? parsePageRange(pageRange, pdfInfo.pages) : { pages: [], error: null }),
    [pageRange, pdfInfo],
  );

  const trackUrl = React.useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const clearGenerated = React.useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    setImages([]);
    setZipUrl(null);
    setSelectedPreview(null);
    setZipProgress(0);
  }, []);

  React.useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  const loadPdfJs = React.useCallback(async (): Promise<PdfJsModule> => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return pdfjs;
  }, []);

  const readPdfInfo = React.useCallback(async (selectedFile: File, enteredPassword: string) => {
    setIsReading(true);
    setError(null);
    setNotice(null);
    setPasswordRequired(false);
    setPdfInfo(null);
    try {
      const pdfjs = await loadPdfJs();
      const data = new Uint8Array(await selectedFile.arrayBuffer());
      const loadingTask = pdfjs.getDocument({
        data,
        password: enteredPassword || undefined,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      let pdf: any;
      try {
        pdf = await loadingTask.promise;
        setPdfInfo({ pages: pdf.numPages, size: selectedFile.size });
        if (pdf.numPages > MAX_RENDERED_PAGES) {
          setNotice(`This PDF contains ${pdf.numPages} pages. You can convert it in batches of up to ${MAX_RENDERED_PAGES} pages using the page-range field.`);
        }
      } finally {
        // PDFDocumentProxy does not expose destroy() in all PDF.js builds.
        // The loading task owns the worker and transport lifecycle.
        await loadingTask.destroy().catch((cleanupError: unknown) => {
          console.warn("PDF.js loading-task cleanup warning:", cleanupError);
        });
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The PDF could not be opened.";
      const isPasswordError = /password/i.test(message) || (caught as { name?: string })?.name === "PasswordException";
      if (isPasswordError) {
        setPasswordRequired(true);
        setError(enteredPassword ? "That password did not unlock this PDF. Check it and try again." : "This PDF is password-protected. Enter its open password to continue.");
      } else {
        setError(message || "We could not read this PDF. It may be damaged or unsupported.");
      }
    } finally {
      setIsReading(false);
    }
  }, [loadPdfJs]);

  const handleSelectedFile = React.useCallback(async (selectedFile?: File) => {
    if (!selectedFile) return;
    clearGenerated();
    setError(null);
    setNotice(null);
    setPassword("");
    setPdfInfo(null);
    setPageRange("");
    setFile(null);
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setError("This PDF is larger than 120 MB. Please choose a smaller file or split it into smaller parts first.");
      return;
    }
    setFile(selectedFile);
    await readPdfInfo(selectedFile, "");
  }, [clearGenerated, readPdfInfo]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleSelectedFile(event.dataTransfer.files?.[0]);
  };

  const handleReset = () => {
    clearGenerated();
    setFile(null);
    setPdfInfo(null);
    setPassword("");
    setPasswordRequired(false);
    setPageRange("");
    setError(null);
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConvert = async () => {
    if (!file || !pdfInfo || isProcessing || parsedRange.error || parsedRange.pages.length === 0) return;

    clearGenerated();
    setError(null);
    setNotice(null);
    setIsProcessing(true);
    setProgress(0);
    setProgressText("Opening PDF and preparing high-resolution pages...");

    let pdf: any;
    let loadingTask: any;
    const converted: ConvertedImage[] = [];
    let totalPixels = 0;

    try {
      const pdfjs = await loadPdfJs();
      const data = new Uint8Array(await file.arrayBuffer());
      loadingTask = pdfjs.getDocument({
        data,
        password: password || undefined,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      pdf = await loadingTask.promise;

      const pagesToConvert = parsedRange.pages;
      const details = FORMAT_DETAILS[format];
      const baseName = safeBaseName(file.name);
      const scale = dpi / 72;

      for (let index = 0; index < pagesToConvert.length; index += 1) {
        const pageNumber = pagesToConvert[index];
        setProgressText(`Rendering page ${pageNumber} of ${pdf.numPages} at ${dpi} DPI...`);
        const page = await pdf.getPage(pageNumber);
        let canvas: HTMLCanvasElement | null = null;

        try {
          const viewport = page.getViewport({ scale });
          const width = Math.ceil(viewport.width);
          const height = Math.ceil(viewport.height);
          const pixels = width * height;

          if (width > 32767 || height > 32767 || pixels > MAX_PAGE_PIXELS) {
            throw new Error(`Page ${pageNumber} is too large at ${dpi} DPI. Choose 300 DPI or lower for this page.`);
          }
          totalPixels += pixels;
          if (totalPixels > MAX_TOTAL_PIXELS) {
            throw new Error("This selection is too large to process safely in one browser session. Lower the DPI or convert fewer pages at a time using Page range.");
          }

          canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error(`Could not create the canvas for page ${pageNumber}.`);
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);

          await page.render({ canvasContext: context, viewport, background: "#ffffff" }).promise;
          const blob = await canvasToBlob(canvas, details.mime, quality / 100);
          const paddedPage = String(pageNumber).padStart(3, "0");
          const name = `${baseName}-page-${paddedPage}.${details.extension}`;
          const url = trackUrl(blob);
          converted.push({ page: pageNumber, blob, url, name, width, height, size: blob.size });
          setImages([...converted]);
          setProgress(Math.round(((index + 1) / pagesToConvert.length) * 100));
          setProgressText(`Created ${index + 1} of ${pagesToConvert.length} images`);
        } finally {
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
          }
          page.cleanup();
        }
      }

      setNotice(`Successfully converted ${converted.length} of ${pagesToConvert.length} selected PDF pages. Download individual images or all images as a ZIP.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The PDF could not be converted.";
      setError(message);
      if (converted.length > 0) {
        setNotice(`${converted.length} page(s) were converted before the error. You can still download those pages.`);
      }
    } finally {
      // PDFDocumentProxy (the value returned by loadingTask.promise) has no
      // destroy() method. The PDFDocumentLoadingTask owns the worker lifecycle.
      // Guard and catch cleanup so it can never mask the conversion result.
      try {
        if (loadingTask && typeof loadingTask.destroy === "function") {
          await loadingTask.destroy();
        }
      } catch (cleanupError: unknown) {
        console.warn("PDF.js loading-task cleanup warning:", cleanupError);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadZip = async () => {
    if (images.length === 0 || isCreatingZip) return;
    setIsCreatingZip(true);
    setZipProgress(0);
    setError(null);
    try {
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      images.forEach((image) => zip.file(image.name, image.blob, { binary: true }));
      const blob = await zip.generateAsync(
        { type: "blob", compression: "STORE", mimeType: "application/zip", streamFiles: true },
        (metadata) => setZipProgress(Math.round(metadata.percent)),
      );
      const url = trackUrl(blob);
      setZipUrl(url);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeBaseName(file?.name || "convia-pdf")}-images.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the ZIP file. Try downloading individual images.");
    } finally {
      setIsCreatingZip(false);
    }
  };

  const downloadImage = (image: ConvertedImage) => {
    const anchor = document.createElement("a");
    anchor.href = image.url;
    anchor.download = image.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const canConvert = Boolean(file && pdfInfo && parsedRange.pages.length > 0 && !parsedRange.error && !isReading && !passwordRequired && !isProcessing);
  const previewsToShow = images.slice(0, 24);

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="relative isolate overflow-hidden bg-gradient-to-r from-primary via-violet-600 to-fuchsia-600 text-white shadow-md shadow-primary/10">
        <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(135deg,rgba(255,255,255,.20)_1px,transparent_1px),linear-gradient(45deg,rgba(255,255,255,.10)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="container relative z-10 mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow-inner backdrop-blur-sm sm:h-11 sm:w-11">
              <ImageIcon className="h-5 w-5 text-white sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-[.18em] text-white/75 sm:text-[10px]">Convia PDF Workspace</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90">Image converter</span>
              </div>
              <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight sm:text-xl md:text-2xl">PDF to JPG</h1>
              <p className="mt-0.5 hidden max-w-3xl truncate text-xs leading-5 text-white/80 sm:block sm:text-[13px]">
                Convert PDF pages into high-resolution JPG, PNG or WebP images.
              </p>
            </div>
          </div>
          <Link
            href="/#pdf-tools"
            className="inline-flex h-9 shrink-0 items-center justify-center self-start rounded-full border border-white/25 bg-white/10 px-3.5 text-xs font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/20 sm:self-center sm:text-sm"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Tools
          </Link>
        </div>
      </header>

      <main className="container relative z-20 mx-auto mt-6 max-w-7xl px-4">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl shadow-primary/5">
            <div className="border-b border-border/70 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[.18em] text-primary">Image converter</p>
                  <h2 className="text-xl font-extrabold text-foreground md:text-2xl">Upload your PDF</h2>
                  <p className="mt-1 text-sm text-muted-foreground">All pages are selected automatically.</p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                  <FileText className="h-6 w-6" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => void handleSelectedFile(event.target.files?.[0])}
              />

              {!file ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-[290px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${isDragging ? "scale-[1.01] border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5"}`}
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-extrabold">Drop your PDF here</h3>
                  <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">Drag and drop a PDF, or browse files from your device. Every page can be exported as a separate image.</p>
                  <Button type="button" className="gradient-primary h-12 rounded-xl px-7 font-bold text-white shadow-lg shadow-primary/20">
                    Choose PDF file
                  </Button>
                  <p className="mt-5 text-xs text-muted-foreground">PDF only · Maximum 120 MB · Up to 250 selected pages</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/20 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FileText className="h-6 w-6" /></div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">{file.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatBytes(file.size)}{pdfInfo ? ` · ${pdfInfo.pages} pages` : " · Reading PDF..."}</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isProcessing} className="shrink-0 rounded-xl">
                      <RefreshCw className="mr-2 h-4 w-4" /> Change PDF
                    </Button>
                  </div>
                  {isReading && <div className="mt-4 flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" /> Reading PDF pages...</div>}
                  {passwordRequired && (
                    <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <label className="mb-2 block text-sm font-bold" htmlFor="pdf-password">PDF open password</label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input id="pdf-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter PDF password" className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                        <Button type="button" onClick={() => void readPdfInfo(file, password)} disabled={!password || isReading} className="gradient-primary rounded-xl text-white">Unlock PDF</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pdfInfo && (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="format" className="mb-2 flex items-center gap-2 text-sm font-bold"><ImageIcon className="h-4 w-4 text-primary" /> Output format</label>
                      <div className="relative">
                        <select id="format" value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} className="h-12 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                          <option value="jpg">JPG / JPEG – smaller files</option>
                          <option value="png">PNG – lossless quality</option>
                          <option value="webp">WebP – modern compact image</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="dpi" className="mb-2 flex items-center gap-2 text-sm font-bold"><Settings2 className="h-4 w-4 text-primary" /> Image resolution</label>
                      <div className="relative">
                        <select id="dpi" value={dpi} onChange={(event) => setDpi(Number(event.target.value))} className="h-12 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                          <option value={150}>150 DPI – Standard</option>
                          <option value={200}>200 DPI – Good</option>
                          <option value={300}>300 DPI – High quality</option>
                          <option value={450}>450 DPI – Very high</option>
                          <option value={600}>600 DPI – Print quality</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {format !== "png" && (
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label htmlFor="quality" className="text-sm font-bold">Image quality</label>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-extrabold text-primary">{quality}%</span>
                      </div>
                      <input id="quality" type="range" min="70" max="100" step="1" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full accent-primary" />
                      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Smaller file</span><span>Maximum quality</span></div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="page-range" className="mb-2 block text-sm font-bold">Pages to convert</label>
                    <input id="page-range" type="text" value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder={`Leave blank to convert all ${pdfInfo.pages} pages (e.g. 1-3, 5, 8-10)`} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10" />
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{parsedRange.error ? parsedRange.error : `${parsedRange.pages.length || pdfInfo.pages} page(s) selected. Leave this field blank to export every page.`}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0 flex-1"><p className="font-bold text-foreground">Private browser processing</p><p className="mt-0.5 text-xs text-muted-foreground">Your PDF is rendered locally in this browser. It is not uploaded to a Convia conversion server.</p></div>
                  </div>

                  <Button type="button" onClick={handleConvert} disabled={!canConvert} className="gradient-primary h-14 w-full rounded-xl text-base font-extrabold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Converting pages...</> : <><Zap className="mr-2 h-5 w-5" /> Convert {parsedRange.pages.length || pdfInfo.pages} pages to {format.toUpperCase()}</>}
                  </Button>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-border/70 bg-background p-6 shadow-xl shadow-primary/5">
              <div className="mb-4 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ImageIcon className="h-5 w-5" /></div><div><h2 className="font-extrabold">Image preview</h2><p className="text-xs text-muted-foreground">High-resolution page output</p></div></div>
              {images.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
                    <img src={(images.find((image) => image.page === selectedPreview) || images[0]).url} alt={`Converted PDF page ${selectedPreview ?? images[0].page}`} className="mx-auto max-h-[360px] w-full object-contain" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{images.length} image(s) ready</span><span>{dpi} DPI · {format.toUpperCase()}</span></div>
                </>
              ) : (
                <div className="flex min-h-[210px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-5 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileImage className="h-7 w-7" /></div>
                  <p className="font-bold">Your page previews will appear here</p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Upload a PDF and start conversion to preview its pages as images.</p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border/70 bg-background p-6 shadow-xl shadow-primary/5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-extrabold">Conversion status</h2><p className="mt-1 text-xs text-muted-foreground">Page-by-page progress</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">{progress}%</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              <p className="mt-3 min-h-5 text-xs text-muted-foreground">{isProcessing ? progressText : images.length > 0 ? `Completed: ${images.length} image(s) generated.` : "Waiting for a PDF file."}</p>
              {isProcessing && <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering at selected DPI</div>}
            </section>

            {images.length > 0 && (
              <section className="rounded-3xl border border-border/70 bg-background p-6 shadow-xl shadow-primary/5">
                <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div><div><h2 className="font-extrabold">Your images are ready</h2><p className="text-xs text-muted-foreground">Download one page or all pages.</p></div></div>
                <Button type="button" onClick={() => void handleDownloadZip()} disabled={isCreatingZip} className="gradient-primary h-12 w-full rounded-xl font-bold text-white">
                  {isCreatingZip ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating ZIP {zipProgress}%</> : <><FileArchive className="mr-2 h-4 w-4" /> Download all images (ZIP)</>}
                </Button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">{images.length} image files · {formatBytes(images.reduce((total, image) => total + image.size, 0))} total before ZIP</p>
              </section>
            )}
          </aside>
        </div>

        {error && <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300"><X className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div>}
        {notice && !error && <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><span>{notice}</span></div>}

        {images.length > 0 && (
          <section className="mt-8 rounded-3xl border border-border/70 bg-background p-6 shadow-xl shadow-primary/5 md:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="mb-1 text-xs font-extrabold uppercase tracking-[.18em] text-primary">Converted files</p><h2 className="text-2xl font-extrabold">All generated images</h2><p className="mt-1 text-sm text-muted-foreground">Select a preview or download each page separately.</p></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {images.length} ready</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {previewsToShow.map((image) => (
                <div key={image.page} className={`overflow-hidden rounded-2xl border bg-background transition ${selectedPreview === image.page ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                  <button type="button" onClick={() => setSelectedPreview(image.page)} className="block w-full bg-muted/30 p-2" aria-label={`Preview page ${image.page}`}>
                    <img src={image.url} alt={`PDF page ${image.page}`} loading="lazy" className="h-36 w-full object-contain" />
                  </button>
                  <div className="p-3"><p className="truncate text-xs font-bold">Page {image.page}</p><p className="mt-1 text-[10px] text-muted-foreground">{image.width} × {image.height}</p><p className="text-[10px] text-muted-foreground">{formatBytes(image.size)}</p><button type="button" onClick={() => downloadImage(image)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-2 py-2 text-xs font-bold text-primary transition hover:bg-primary/15"><Download className="h-3.5 w-3.5" /> Download</button></div>
                </div>
              ))}
            </div>
            {images.length > previewsToShow.length && <p className="mt-4 text-center text-xs text-muted-foreground">Showing the first {previewsToShow.length} previews. All {images.length} images are included in the ZIP download.</p>}
          </section>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div><h3 className="font-extrabold">Private by design</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">PDF pages are rendered in your browser. No upload to a third-party image conversion API is required.</p></div>
          <div className="rounded-2xl border border-border/60 bg-background p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Sparkles className="h-5 w-5" /></div><h3 className="font-extrabold">High-resolution output</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Choose up to 600 DPI. Higher DPI creates larger images and needs more browser memory.</p></div>
          <div className="rounded-2xl border border-border/60 bg-background p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><FileArchive className="h-5 w-5" /></div><h3 className="font-extrabold">One ZIP for every page</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Each page gets its own numbered image file, and all converted pages can be downloaded together.</p></div>
        </div>
      </main>
    </div>
  );
}
