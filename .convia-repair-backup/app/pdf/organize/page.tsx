"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FilePlus2,
  FileText,
  GripVertical,
  RotateCcw,
  RotateCw,
  Upload,
  X,
  Sparkles,
} from "lucide-react";
import { degrees, PDFDocument } from "pdf-lib";
import Link from "next/link";

type PdfJsPage = {
  rotate: number;
  getViewport: (options: { scale: number; rotation?: number }) => {
    width: number;
    height: number;
  };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  destroy?: () => Promise<void> | void;
};

type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: Uint8Array }) => {
    promise: Promise<PdfJsDocument>;
  };
};

type PageItem = {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnail: string;
};

function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

async function renderThumbnail(
  document: PdfJsDocument,
  pageNumber: number,
  extraRotation: number,
) {
  const page = await document.getPage(pageNumber);
  const rotation = normalizeRotation(page.rotate + extraRotation);
  const baseViewport = page.getViewport({ scale: 1, rotation: 0 });
  const longestSide = Math.max(baseViewport.width, baseViewport.height);
  const scale = Math.min(0.62, 220 / longestSide);
  const viewport = page.getViewport({ scale, rotation });
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Your browser could not prepare the page preview.");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const thumbnail = canvas.toDataURL("image/jpeg", 0.84);
  canvas.width = 0;
  canvas.height = 0;
  return thumbnail;
}

export default function OrganizePdfPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfDocumentRef = useRef<PdfJsDocument | null>(null);
  const draggedPageId = useRef<string | null>(null);
  
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("1");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? null;

  async function loadPdf(file: File) {
    setError("");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setPages([]);
    setSelectedPageId(null);
    setSourceFile(file);

    try {
      pdfDocumentRef.current?.destroy?.();
      const pdfjs = (await import("pdfjs-dist")) as unknown as PdfJsModule;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const bytes = new Uint8Array(await file.arrayBuffer());
      const document = await pdfjs.getDocument({ data: bytes }).promise;
      pdfDocumentRef.current = document;

      const loadedPages: PageItem[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const thumbnail = await renderThumbnail(document, pageNumber, 0);
        const item: PageItem = {
          id: `${Date.now()}-${pageNumber}-${Math.random().toString(36).slice(2, 8)}`,
          originalIndex: pageNumber - 1,
          rotation: 0,
          thumbnail,
        };
        loadedPages.push(item);
        setPages([...loadedPages]);
        setProgress(Math.round((pageNumber / document.numPages) * 100));
      }

      if (loadedPages.length > 0) {
        setSelectedPageId(loadedPages[0].id);
      }
    } catch (loadError) {
      console.error("PDF loading error:", loadError);
      setSourceFile(null);
      setPages([]);
      setError("We could not read this PDF. It may be password-protected or damaged.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadPdf(file);
    event.target.value = "";
  }

  function handleUploadDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadPdf(file);
  }

  async function rotatePage(pageId: string, direction: -1 | 1) {
    const target = pages.find((page) => page.id === pageId);
    const document = pdfDocumentRef.current;
    if (!target || !document) return;

    const nextRotation = normalizeRotation(target.rotation + direction * 90);
    setError("");
    try {
      const thumbnail = await renderThumbnail(document, target.originalIndex + 1, nextRotation);
      setPages((current) =>
        current.map((page) =>
          page.id === pageId ? { ...page, rotation: nextRotation, thumbnail } : page
        )
      );
      setSelectedPageId(pageId);
    } catch (rotateError) {
      setError("This page could not be rotated. Please try again.");
    }
  }

  function deletePage(pageId: string) {
    if (pages.length <= 1) {
      setError("A PDF must contain at least one page.");
      return;
    }
    const oldIndex = pages.findIndex((page) => page.id === pageId);
    const nextPages = pages.filter((page) => page.id !== pageId);
    setPages(nextPages);
    if (selectedPageId === pageId) {
      const replacement = nextPages[Math.min(oldIndex, nextPages.length - 1)];
      setSelectedPageId(replacement?.id ?? null);
    }
    setError("");
  }

  function reorderPages(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setPages((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return current;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function moveSelectedPage() {
    if (!selectedPageId || pages.length < 2) return;
    const fromIndex = pages.findIndex((page) => page.id === selectedPageId);
    const requested = Number.parseInt(moveTo, 10);
    if (!Number.isFinite(requested)) return;
    const toIndex = Math.max(0, Math.min(pages.length - 1, requested - 1));
    reorderPages(fromIndex, toIndex);
    setMoveTo(String(toIndex + 1));
  }

  function moveByOne(pageId: string, direction: -1 | 1) {
    const index = pages.findIndex((page) => page.id === pageId);
    const destination = index + direction;
    if (destination < 0 || destination >= pages.length) return;
    reorderPages(index, destination);
    setSelectedPageId(pageId);
    setMoveTo(String(destination + 1));
  }

  function handlePageDragStart(event: DragEvent<HTMLElement>, pageId: string) {
    draggedPageId.current = pageId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pageId);
  }

  function handlePageDrop(event: DragEvent<HTMLElement>, targetPageId: string) {
    event.preventDefault();
    const sourceId = draggedPageId.current || event.dataTransfer.getData("text/plain");
    const fromIndex = pages.findIndex((page) => page.id === sourceId);
    const toIndex = pages.findIndex((page) => page.id === targetPageId);
    reorderPages(fromIndex, toIndex);
    draggedPageId.current = null;
  }

  async function exportPdf() {
    if (!sourceFile || pages.length === 0) return;
    setExporting(true);
    setError("");

    try {
      const originalBytes = await sourceFile.arrayBuffer();
      const sourceDocument = await PDFDocument.load(originalBytes);
      const outputDocument = await PDFDocument.create();
      const copiedPages = await outputDocument.copyPages(
        sourceDocument,
        pages.map((page) => page.originalIndex)
      );

      copiedPages.forEach((page, index) => {
        const originalRotation = page.getRotation().angle;
        const finalRotation = normalizeRotation(originalRotation + pages[index].rotation);
        page.setRotation(degrees(finalRotation));
        outputDocument.addPage(page);
      });

      const outputBytes = await outputDocument.save();
      const buffer = outputBytes.buffer.slice(
        outputBytes.byteOffset,
        outputBytes.byteOffset + outputBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      const baseName = sourceFile.name.replace(/\.pdf$/i, "");
      anchor.href = url;
      anchor.download = `${baseName}-organized.pdf`;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError("The PDF could not be exported. Try an unprotected copy.");
    } finally {
      setExporting(false);
    }
  }

  function resetWorkspace() {
    pdfDocumentRef.current?.destroy?.();
    pdfDocumentRef.current = null;
    setSourceFile(null);
    setPages([]);
    setSelectedPageId(null);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header - Reduced Size & Width */}
      <header className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden py-10 px-4 text-center">
        <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 bg-pink-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center text-xs font-medium text-white/80 hover:text-white mb-6 transition-colors bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 drop-shadow-md">
            Organize PDF
          </h1>
          <p className="text-sm md:text-base text-white/90 max-w-xl mx-auto">
            Rearrange, rotate, and remove pages with a visual preview.
          </p>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 pb-24 relative z-20 -mt-6">
        
        {/* Upload Area (If no file) */}
        {!sourceFile && !loading && (
          <div
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleUploadDrop}
            className={`mx-auto flex min-h-[350px] max-w-2xl flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all bg-background shadow-xl mt-10 ${
              dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50"
            }`}
          >
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload a PDF to start</h2>
            <p className="max-w-sm text-sm text-muted-foreground mb-6">
              Drag and drop your file here, or click below. All pages will appear as cards.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-12 items-center gap-2 rounded-xl gradient-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:scale-105"
            >
              <FilePlus2 className="h-5 w-5" /> Choose PDF file
            </button>
          </div>
        )}

        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />

        {/* Loading State */}
        {loading && (
          <div className="mx-auto max-w-xl rounded-3xl bg-background p-8 shadow-xl border border-border mt-10">
            <div className="mb-4 flex items-center justify-between text-sm font-bold">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary animate-spin" /> Reading pages...</span>
              <span className="text-primary tabular-nums">{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-600 shadow-sm max-w-4xl mx-auto">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Main Workspace (If file is loaded) */}
        {sourceFile && !loading && pages.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Full Width File Info Strip */}
            <div className="w-full bg-background rounded-2xl shadow-lg border border-border p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="min-w-0 text-left flex-1 md:flex-none">
                  <h2 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                    {sourceFile.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <span>{(sourceFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" /> {pages.length} Pages
                </div>
                <button
                  type="button"
                  onClick={resetWorkspace}
                  className="inline-flex h-9 items-center gap-2 rounded-lg text-red-500 bg-red-500/10 px-3 text-sm font-bold transition hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-4 rounded-2xl shadow-sm border border-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Move selected page to:</span>
                <input
                  type="number"
                  min={1}
                  max={pages.length}
                  value={moveTo}
                  onChange={(event) => setMoveTo(event.target.value)}
                  className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={moveSelectedPage}
                  disabled={!selectedPage || pages.length < 2}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-secondary px-3 text-sm font-bold text-secondary-foreground transition hover:bg-secondary/80 disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" /> Move
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!selectedPage}
                  onClick={() => selectedPage && void rotatePage(selectedPage.id, -1)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" /> Left
                </button>
                <button
                  type="button"
                  disabled={!selectedPage}
                  onClick={() => selectedPage && void rotatePage(selectedPage.id, 1)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-40"
                >
                  <RotateCw className="h-4 w-4" /> Right
                </button>
              </div>
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {pages.map((page, index) => {
                const isSelected = page.id === selectedPageId;
                return (
                  <article
                    key={page.id}
                    draggable
                    onDragStart={(event) => handlePageDragStart(event, page.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handlePageDrop(event, page.id)}
                    onDragEnd={() => (draggedPageId.current = null)}
                    onClick={() => {
                      setSelectedPageId(page.id);
                      setMoveTo(String(index + 1));
                      setError("");
                    }}
                    className={`group relative rounded-2xl border-2 bg-background p-3 shadow-sm transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary ring-4 ring-primary/20 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:shadow-md"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        <GripVertical className="h-3.5 w-3.5" /> Page {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                        className="grid h-8 w-8 place-items-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-white p-2">
                      <img
                        src={page.thumbnail}
                        alt={`Page ${index + 1}`}
                        className="max-h-full max-w-full select-none object-contain drop-shadow-md"
                        draggable={false}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveByOne(page.id, -1); }}
                        disabled={index === 0}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground transition hover:bg-secondary disabled:opacity-30"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void rotatePage(page.id, 1); }}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground transition hover:bg-secondary"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveByOne(page.id, 1); }}
                        disabled={index === pages.length - 1}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground transition hover:bg-secondary disabled:opacity-30"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Bottom Download Button */}
            <div className="pt-10 pb-6 flex justify-center">
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting || pages.length === 0}
                className="group relative inline-flex h-16 w-full max-w-md items-center justify-center gap-3 rounded-full gradient-primary px-8 text-xl font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
              >
                {exporting ? (
                  <><Sparkles className="h-6 w-6 animate-spin" /> Creating PDF...</>
                ) : (
                  <><Download className="h-6 w-6 group-hover:animate-bounce" /> Download Organized PDF</>
                )}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}