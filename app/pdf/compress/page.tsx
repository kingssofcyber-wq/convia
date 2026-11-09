"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
  AlertCircle,
} from "lucide-react";

type FileStatus = "ready" | "compressing" | "complete" | "unchanged" | "error";

type PdfItem = {
  id: string;
  file: File;
  pageCount: number;
  firstPagePreview: string;
  status: FileStatus;
  progress: string;
  compressedBlob?: Blob;
  compressedSize?: number;
  savedPercent?: number;
  message?: string;
};

const MB = 1024 * 1024;
const MAX_FILE_SIZE = 150 * MB;
const MIN_TARGET_BYTES = 10 * 1024;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(2)} MB`;
}

function outputName(name: string): string {
  const dot = name.toLowerCase().lastIndexOf(".pdf");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  return `${base}-compressed.pdf`;
}

async function createFirstPagePreview(
  file: File,
): Promise<{ pageCount: number; dataUrl: string }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const originalViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(260 / originalViewport.width, 0.55);
    const viewport = page.getViewport({ scale: Math.max(scale, 0.2) });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) throw new Error("Your browser could not create the PDF preview.");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    try {
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      return {
        pageCount: pdf.numPages,
        dataUrl: canvas.toDataURL("image/jpeg", 0.82),
      };
    } finally {
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
    }
  } finally {
    // destroy belongs to PDFDocumentLoadingTask, not PDFDocumentProxy.
    try {
      await loadingTask.destroy();
    } catch (cleanupError) {
      console.warn("PDF preview cleanup warning:", cleanupError);
    }
  }
}

function getCompressionSettings(level: number) {
  // The slider represents the requested percentage reduction.
  // The engine may return a larger file if the source cannot be reduced that far.
  const reduction = level / 100;
  const mode: "low" | "balanced" | "high" | "maximum" =
    level <= 25 ? "low" : level <= 50 ? "balanced" : level <= 75 ? "high" : "maximum";

  const imageQuality = Math.max(0.28, Math.min(0.94, 0.95 - reduction * 0.67));
  const maxImageDimension = Math.round(3000 - reduction * 2100);
  const targetDpi = Math.round(300 - reduction * 220);

  return { mode, imageQuality, maxImageDimension, targetDpi };
}

export default function CompressPdfPage() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<PdfItem[]>([]);
  const [compressionLevel, setCompressionLevel] = React.useState(60);
  const [isAddingFiles, setIsAddingFiles] = React.useState(false);
  const [isCompressingAll, setIsCompressingAll] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState("");

  const updateItem = React.useCallback((id: string, updates: Partial<PdfItem>) => {
    setItems((current) => current.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    ));
  }, []);

  const addFiles = React.useCallback(async (fileList: FileList | File[]) => {
    const selectedFiles = Array.from(fileList);
    if (!selectedFiles.length) return;

    setError("");
    setIsAddingFiles(true);

    for (const file of selectedFiles) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError(`${file.name}: Please select a PDF file only.`);
        continue;
      }
      if (!file.size) {
        setError(`${file.name}: This file is empty.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: Files larger than 150 MB are not supported.`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      try {
        const preview = await createFirstPagePreview(file);
        setItems((current) => [
          ...current,
          {
            id,
            file,
            pageCount: preview.pageCount,
            firstPagePreview: preview.dataUrl,
            status: "ready",
            progress: "",
          },
        ]);
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : "The PDF could not be opened.";
        setError(`${file.name}: Unable to read this PDF. ${detail}`);
      }
    }

    setIsAddingFiles(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void addFiles(event.target.files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const deleteAll = () => {
    setItems([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const compressAll = async () => {
    if (!items.length || isCompressingAll) return;

    setError("");
    setIsCompressingAll(true);

    try {
      const { compressPDF, toBytes } = await import("@fileslim/compress");
      const initialItems = [...items];

      // Process sequentially to avoid holding several large PDFs in memory.
      for (const item of initialItems) {
        updateItem(item.id, {
          status: "compressing",
          progress: "Preparing compression…",
          compressedBlob: undefined,
          compressedSize: undefined,
          savedPercent: undefined,
          message: undefined,
        });

        try {
          const targetBytes = Math.max(
            MIN_TARGET_BYTES,
            Math.floor(item.file.size * (1 - compressionLevel / 100)),
          );
          const targetSize = toBytes(targetBytes / MB, "MB");

          if (typeof targetSize !== "number" || !Number.isFinite(targetSize) || targetSize <= 0) {
            throw new Error("Could not calculate a valid target file size.");
          }

          const settings = getCompressionSettings(compressionLevel);
          const result = await compressPDF(item.file, {
            ...settings,
            targetSize,
            stripMetadata: true,
            onProgress: (phase: string, percent: number) => {
              const progress = Number.isFinite(percent) ? ` ${Math.round(percent)}%` : "";
              updateItem(item.id, { progress: `${phase}${progress}` });
            },
          } as Parameters<typeof compressPDF>[1]);

          if (!(result?.blob instanceof Blob) || result.blob.size === 0) {
            throw new Error("The compression engine did not return a valid PDF.");
          }

          // Verify the exact Blob which will be downloaded.
          const bytes = await result.blob.arrayBuffer();
          const verifiedBlob = new Blob([bytes], { type: "application/pdf" });
          if (verifiedBlob.size !== bytes.byteLength || verifiedBlob.size === 0) {
            throw new Error("The compressed PDF could not be verified.");
          }

          const header = new TextDecoder().decode(bytes.slice(0, 1024));
          if (!header.includes("%PDF-")) {
            throw new Error("The compression engine returned an invalid PDF file.");
          }

          if (verifiedBlob.size >= item.file.size) {
            updateItem(item.id, {
              status: "unchanged",
              progress: "",
              compressedSize: verifiedBlob.size,
              savedPercent: 0,
              message: "This PDF could not be made smaller with the selected level. The original file has been kept unchanged.",
            });
            continue;
          }

          const savedPercent = ((item.file.size - verifiedBlob.size) / item.file.size) * 100;
          const reachedTarget = verifiedBlob.size <= targetBytes;

          updateItem(item.id, {
            status: "complete",
            progress: "",
            compressedBlob: verifiedBlob,
            compressedSize: verifiedBlob.size,
            savedPercent,
            message: reachedTarget
              ? `Target reached: ${formatBytes(targetBytes)} or smaller.`
              : `Actual result: ${savedPercent.toFixed(1)}% smaller. The PDF could not reach the requested ${compressionLevel}% reduction without more aggressive changes.`,
          });
        } catch (cause) {
          const detail = cause instanceof Error ? cause.message : "Compression failed.";
          updateItem(item.id, {
            status: "error",
            progress: "",
            message: detail,
          });
        }
      }
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Could not load the compression engine.";
      setError(`Unable to start PDF compression. ${detail}`);
    } finally {
      setIsCompressingAll(false);
    }
  };

  const downloadItem = async (item: PdfItem) => {
    if (!item.compressedBlob) return;

    try {
      const bytes = await item.compressedBlob.arrayBuffer();
      if (bytes.byteLength !== item.compressedBlob.size) {
        throw new Error("The download data did not match the displayed compressed size.");
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = outputName(item.file.name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not download the compressed PDF.");
    }
  };

  const rangeBackground = `linear-gradient(to right, #0969bd 0%, #0969bd ${compressionLevel}%, #e5e7eb ${compressionLevel}%, #e5e7eb 100%)`;
  const busy = isAddingFiles || isCompressingAll;

  return (
    <main className="min-h-screen bg-[#f5f7fa] px-3 pb-12 text-slate-800 dark:bg-[#0b1220] dark:text-slate-100 sm:px-5">
      <div className="mx-auto max-w-[1600px]">
        {/* Toolbar styled to match the supplied reference screenshot. */}
        <section className="sticky top-0 z-30 -mx-3 border-b border-slate-300 bg-white px-3 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:-mx-5 sm:px-5">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-5">
            <div className="flex shrink-0 items-center gap-2 text-xl font-medium sm:text-2xl">
              <span>Compression Level</span>
              <span className="group relative inline-flex">
                <Info className="h-5 w-5 cursor-help text-slate-500 sm:h-6 sm:w-6" />
                <span className="pointer-events-none absolute left-0 top-8 z-50 hidden w-72 rounded-xl bg-slate-900 p-3 text-xs leading-5 text-white shadow-xl group-hover:block">
                  Choose how much smaller you want the PDF to become. 100% requests the strongest reduction possible; a valid PDF cannot be reduced to zero bytes. The actual result depends on the PDF content.
                </span>
              </span>
            </div>

            <div className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-4 py-4 dark:border-slate-700">
              <input
                aria-label="Compression level from 1 to 100 percent"
                type="range"
                min={1}
                max={100}
                step={1}
                value={compressionLevel}
                onChange={(event) => setCompressionLevel(Number(event.target.value))}
                className="h-3 w-full cursor-pointer appearance-none rounded-full accent-[#0969bd]"
                style={{ background: rangeBackground }}
              />
            </div>

            <div className="flex h-[58px] w-[92px] shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900 sm:w-[110px]">
              <input
                aria-label="Compression percentage"
                type="number"
                min={1}
                max={100}
                value={compressionLevel}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") return;
                  const value = Number(raw);
                  if (Number.isFinite(value)) setCompressionLevel(Math.max(1, Math.min(100, Math.round(value))));
                }}
                className="w-full min-w-0 bg-transparent text-center text-2xl font-semibold outline-none sm:text-3xl"
              />
            </div>
            <span className="shrink-0 text-2xl">%</span>

            <button
              type="button"
              onClick={() => void compressAll()}
              disabled={!items.length || busy}
              className="inline-flex h-[58px] min-w-[145px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#0969bd] px-5 text-lg font-semibold text-white shadow-sm transition hover:bg-[#075ca5] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xl lg:flex-none"
            >
              {isCompressingAll ? <><Loader2 className="h-5 w-5 animate-spin" /> Compressing</> : "Compress"}
            </button>

            <button
              type="button"
              onClick={deleteAll}
              disabled={!items.length || busy}
              className="inline-flex h-[58px] min-w-[145px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#0969bd] px-5 text-lg font-semibold text-white shadow-sm transition hover:bg-[#075ca5] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xl lg:flex-none"
            >
              <Trash2 className="h-5 w-5" /> Delete All
            </button>
          </div>
        </section>

        <div className="mx-auto max-w-[1450px] pt-8 sm:pt-10">
          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
              <button type="button" className="ml-auto" onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="grid grid-cols-1 items-start gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <article key={item.id} className="relative mx-auto w-full max-w-[340px] rounded-xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.09)] ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={busy}
                  aria-label={`Remove ${item.file.name}`}
                  className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="min-h-[42px] pr-12">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100" title={item.file.name}>{item.file.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatBytes(item.file.size)} · {item.pageCount} pages</p>
                </div>

                <div className="mx-auto mt-3 flex h-[300px] max-w-[245px] items-center justify-center overflow-hidden rounded-sm bg-white shadow-[0_4px_18px_rgba(15,23,42,0.16)] ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                  {/* Only the first page is shown, not every page thumbnail. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.firstPagePreview} alt={`First page of ${item.file.name}`} className="h-full w-full object-contain" />
                </div>

                {item.status === "compressing" && (
                  <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-center text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                    <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> {item.progress || "Compressing PDF…"}
                  </div>
                )}

                {item.status === "complete" && item.compressedBlob && (
                  <div className="mt-4 text-center">
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">New size: {formatBytes(item.compressedBlob.size)}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{item.savedPercent?.toFixed(1)}% smaller</p>
                    <button
                      type="button"
                      onClick={() => void downloadItem(item)}
                      className="mt-3 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-lg bg-[#0969bd] px-4 py-3 text-lg font-semibold text-white transition hover:bg-[#075ca5]"
                    >
                      <Download className="h-5 w-5" /> Download
                    </button>
                    <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.message}</p>
                  </div>
                )}

                {item.status === "unchanged" && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">No smaller output</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">{item.message}</p>
                  </div>
                )}

                {item.status === "error" && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-center text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                    {item.message || "Compression failed."}
                  </div>
                )}

                {item.status === "ready" && (
                  <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Ready to compress
                  </div>
                )}
              </article>
            ))}

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mx-auto flex min-h-[330px] w-full max-w-[340px] cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed px-8 text-center transition ${isDragging ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30" : "border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-blue-950/20"}`}
            >
              {isAddingFiles ? <Loader2 className="h-12 w-12 animate-spin text-[#0969bd]" /> : <Plus className="h-14 w-14 text-slate-700 dark:text-slate-200" />}
              <span className="mt-5 text-2xl font-normal leading-relaxed text-slate-800 dark:text-slate-100">{isAddingFiles ? "Loading PDF Files" : items.length ? "Add More PDF Files" : "Add PDF Files"}</span>
              <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">Click or drag PDF files here</span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span>{items.length} PDF file{items.length === 1 ? "" : "s"} · {items.filter((item) => item.status === "complete").length} compressed</span>
              <span className="inline-flex items-center gap-2 text-xs"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Files stay in your browser</span>
            </div>
          )}

          <div className="mx-auto mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p>The slider requests a reduction from 1% to 100%. A 100% reduction would mean a zero-byte file, which cannot be a valid PDF; the engine therefore seeks the closest valid result. The actual size depends on embedded images, fonts and existing compression. Stronger settings can soften images or reduce fine detail. Text and vector elements are retained where supported. Keep your original PDF for important or digitally signed documents.</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <ArrowLeft className="h-4 w-4" /> Back to Convia
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
