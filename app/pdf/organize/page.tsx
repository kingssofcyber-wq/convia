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
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Upload,
  X,
  Sparkles,
  FileType2,
  Plus,
  Loader2,
  FileSpreadsheet,
  FileImage,
  MoveRight,
  MoveLeft,
} from "lucide-react";
import { degrees, PDFDocument } from "pdf-lib";
import Link from "next/link";

type PdfJsViewport = { width: number; height: number };
type PdfJsPage = {
  rotate: number;
  getViewport: (options: { scale: number; rotation?: number }) => PdfJsViewport;
  render: (options: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
  }) => { promise: Promise<void> };
};
type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
};
type PdfJsLoadingTask = {
  promise: Promise<PdfJsDocument>;
  destroy: () => Promise<void>;
};
type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: Uint8Array }) => PdfJsLoadingTask;
};
type PdfSource = {
  id: string;
  name: string;
  bytes: Uint8Array;
  loadingTask: PdfJsLoadingTask;
  document: PdfJsDocument;
  kind: "pdf" | "image" | "office";
};
type PageItem = {
  id: string;
  sourceId: string;
  sourcePageIndex: number;
  rotation: number;
  thumbnail: string;
  sourceName: string;
  sourceKind: PdfSource["kind"];
};

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_TOTAL_IMPORT_FILES = 20;
const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ACCEPTED_OFFICE_EXTENSIONS = ["docx", "odt"];

function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

function getExtension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("Your browser could not prepare the page preview.");

  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const thumbnail = canvas.toDataURL("image/jpeg", 0.84);
  canvas.width = 1;
  canvas.height = 1;
  return thumbnail;
}

async function createImagePdf(file: File): Promise<Uint8Array> {
  const extension = getExtension(file.name);
  if (!ACCEPTED_IMAGE_EXTENSIONS.includes(extension)) {
    throw new Error("Use JPG, JPEG, PNG or WebP images.");
  }
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 2 GB.`);

  const inputBytes = new Uint8Array(await file.arrayBuffer());
  const output = await PDFDocument.create();
  let embeddedImage: Awaited<ReturnType<PDFDocument["embedJpg"]>>;

  if (extension === "jpg" || extension === "jpeg") {
    embeddedImage = await output.embedJpg(inputBytes);
  } else if (extension === "png") {
    embeddedImage = await output.embedPng(inputBytes);
  } else {
    // pdf-lib does not embed WebP directly; convert it to a high-quality JPEG first.
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = window.document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not prepare the WebP image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("WebP conversion failed.")), "image/jpeg", 0.96);
      });
      embeddedImage = await output.embedJpg(new Uint8Array(await jpegBlob.arrayBuffer()));
      canvas.width = 1;
      canvas.height = 1;
    } finally {
      bitmap.close();
    }
  }

  // Each imported image becomes one A4 page, with the whole image fitted without cropping.
  const portrait = embeddedImage.height >= embeddedImage.width;
  const pageWidth = portrait ? 595.28 : 841.89;
  const pageHeight = portrait ? 841.89 : 595.28;
  const margin = 20;
  const scale = Math.min(
    (pageWidth - margin * 2) / embeddedImage.width,
    (pageHeight - margin * 2) / embeddedImage.height,
  );
  const width = embeddedImage.width * scale;
  const height = embeddedImage.height * scale;
  const page = output.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  });
  return output.save();
}

async function convertOfficeToPdf(file: File): Promise<Uint8Array> {
  const extension = getExtension(file.name);
  if (!ACCEPTED_OFFICE_EXTENSIONS.includes(extension)) {
    throw new Error("Only DOCX and ODT documents are supported here.");
  }
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 2 GB.`);

  const form = new FormData();
  form.append("action", "office-to-pdf");
  form.append("file", file, file.name);
  const response = await fetch("/api/pdf/engine", {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Could not convert ${file.name} to PDF.`;
    try {
      const payload = await response.json() as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the readable fallback message when the engine did not return JSON.
    }
    if (response.status === 503) {
      message = "DOCX/ODT import needs the site's private LibreOffice/Gotenberg PDF engine. Configure GOTENBERG_URL, GOTENBERG_USERNAME and GOTENBERG_PASSWORD on the server, then redeploy.";
    }
    throw new Error(message);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error(`The document engine returned an empty PDF for ${file.name}.`);
  return bytes;
}

export default function OrganizePdfPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const addPdfRef = useRef<HTMLInputElement>(null);
  const addOfficeRef = useRef<HTMLInputElement>(null);
  const addImageRef = useRef<HTMLInputElement>(null);
  const sourcesRef = useRef<Map<string, PdfSource>>(new Map());
  const draggedPageId = useRef<string | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [anchorPageNumber, setAnchorPageNumber] = useState("1");
  const [insertPosition, setInsertPosition] = useState<"before" | "after">("after");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Reading pages...");
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");


  async function loadPdfBytes(
    bytes: Uint8Array,
    name: string,
    kind: PdfSource["kind"],
    insertIndex: number,
  ): Promise<number> {
    const pdfjs = (await import("pdfjs-dist")) as unknown as PdfJsModule;
    // Use the worker copied to /public by the project's existing postinstall script.
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const sourceId = createId();
    const ownedBytes = new Uint8Array(bytes);
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(ownedBytes) });
    let document: PdfJsDocument;

    try {
      document = await loadingTask.promise;
    } catch (loadError) {
      await loadingTask.destroy().catch(() => undefined);
      throw loadError;
    }

    const source: PdfSource = { id: sourceId, name, bytes: ownedBytes, loadingTask, document, kind };
    sourcesRef.current.set(sourceId, source);

    const addedPages: PageItem[] = [];
    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const thumbnail = await renderThumbnail(document, pageNumber, 0);
        addedPages.push({
          id: createId(),
          sourceId,
          sourcePageIndex: pageNumber - 1,
          rotation: 0,
          thumbnail,
          sourceName: name,
          sourceKind: kind,
        });
        setProgress(Math.round((pageNumber / document.numPages) * 100));
      }
    } catch (previewError) {
      sourcesRef.current.delete(sourceId);
      await loadingTask.destroy().catch(() => undefined);
      throw previewError;
    }

    setPages((current) => {
      const safeIndex = Math.max(0, Math.min(current.length, insertIndex));
      return [...current.slice(0, safeIndex), ...addedPages, ...current.slice(safeIndex)];
    });
    if (addedPages[0]) setSelectedPageId(addedPages[0].id);
    return addedPages.length;
  }

  async function loadInitialPdf(file: File) {
    setError("");
    setNotice("");
    if (getExtension(file.name) !== "pdf") {
      setError("Start by choosing a PDF file. You can add images, DOCX and ODT after the PDF is loaded.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("The starting PDF must be 2 GB or less.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setProcessingMessage("Reading your original PDF...");
    setSourceFile(file);
    setPages([]);
    setSelectedPageId(null);
    await destroySources();

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const count = await loadPdfBytes(bytes, file.name, "pdf", 0);
      if (count === 0) throw new Error("This PDF does not contain any pages.");
      setNotice(`Loaded ${count} pages. Select a page preview, then use Add Pages to insert content before or after it.`);
    } catch (loadError) {
      console.error("Organize PDF loading error:", loadError);
      await destroySources();
      setSourceFile(null);
      setPages([]);
      setError(loadError instanceof Error ? loadError.message : "We could not read this PDF. It may be password-protected or damaged.");
    } finally {
      setLoading(false);
    }
  }

  function stageFilesForInsert(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    if (!sourceFile) {
      setError("Upload the main PDF first. Then choose PDF, DOCX/ODT or image pages to insert.");
      return;
    }
    const selectedIndex = pages.findIndex((page) => page.id === selectedPageId);
    setPendingFiles(list);
    setAnchorPageNumber(String(selectedIndex >= 0 ? selectedIndex + 1 : Math.max(1, pages.length)));
    setInsertPosition("after");
    setShowInsertDialog(true);
    setError("");
    setNotice("");
  }

  async function handleAddFiles(
    files: File[],
    insertionIndex: number,
    placementDescription: string,
  ) {
    if (!files.length) return;
    if (!sourceFile) {
      setError("Upload the main PDF first. Then add extra pages.");
      return;
    }
    if (files.length > MAX_TOTAL_IMPORT_FILES) {
      setError(`Add up to ${MAX_TOTAL_IMPORT_FILES} files at a time.`);
      return;
    }
    if (!Number.isInteger(insertionIndex) || insertionIndex < 0 || insertionIndex > pages.length) {
      setError("The selected insertion position is no longer valid. Please select the page again.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setNotice("");
    setError("");
    setProcessingMessage("Preparing pages to insert...");
    let currentInsertionIndex = insertionIndex;
    let totalInsertedPages = 0;

    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const file = files[fileIndex];
        const extension = getExtension(file.name);
        if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 2 GB.`);

        let bytes: Uint8Array;
        let kind: PdfSource["kind"];
        if (extension === "pdf") {
          bytes = new Uint8Array(await file.arrayBuffer());
          kind = "pdf";
        } else if (ACCEPTED_IMAGE_EXTENSIONS.includes(extension)) {
          setProcessingMessage(`Converting image ${fileIndex + 1} of ${files.length}: ${file.name}`);
          bytes = await createImagePdf(file);
          kind = "image";
        } else if (ACCEPTED_OFFICE_EXTENSIONS.includes(extension)) {
          setProcessingMessage(`Converting Word document ${fileIndex + 1} of ${files.length}: ${file.name}`);
          bytes = await convertOfficeToPdf(file);
          kind = "office";
        } else {
          throw new Error(`Unsupported file: ${file.name}. Choose PDF, DOCX, ODT, JPG, JPEG, PNG or WebP.`);
        }

        setProcessingMessage(`Preparing page previews from ${file.name}...`);
        const insertedCount = await loadPdfBytes(bytes, file.name, kind, currentInsertionIndex);
        currentInsertionIndex += insertedCount;
        totalInsertedPages += insertedCount;
        setProgress(Math.round(((fileIndex + 1) / files.length) * 100));
      }
      setNotice(`Added ${totalInsertedPages} page${totalInsertedPages === 1 ? "" : "s"} ${placementDescription}. You can still drag page previews to fine-tune the order.`);
    } catch (addError) {
      console.error("Organize PDF add-pages error:", addError);
      setError(addError instanceof Error ? addError.message : "Could not add the selected file(s).");
    } finally {
      setLoading(false);
      if (addPdfRef.current) addPdfRef.current.value = "";
      if (addOfficeRef.current) addOfficeRef.current.value = "";
      if (addImageRef.current) addImageRef.current.value = "";
    }
  }

  function handleStagedFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files?.length) stageFilesForInsert(files);
    event.target.value = "";
  }

  function confirmInsertFiles() {
    const pageNumber = Number.parseInt(anchorPageNumber, 10);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pages.length) {
      setError(`Choose a current page number from 1 to ${pages.length}.`);
      return;
    }
    // Before page 3 => zero-based index 2. After page 3 => zero-based index 3.
    const insertionIndex = insertPosition === "before" ? pageNumber - 1 : pageNumber;
    const placement = `${insertPosition} page ${pageNumber}`;
    const filesToInsert = [...pendingFiles];
    setShowInsertDialog(false);
    setPendingFiles([]);
    void handleAddFiles(filesToInsert, insertionIndex, placement);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadInitialPdf(file);
    event.target.value = "";
  }

  function handleUploadDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadInitialPdf(file);
  }

  function handleAddDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) stageFilesForInsert(event.dataTransfer.files);
  }

  async function rotatePage(pageId: string, direction: -1 | 1) {
    const target = pages.find((page) => page.id === pageId);
    const source = target ? sourcesRef.current.get(target.sourceId) : undefined;
    if (!target || !source) return;

    const nextRotation = normalizeRotation(target.rotation + direction * 90);
    setError("");
    try {
      const thumbnail = await renderThumbnail(source.document, target.sourcePageIndex + 1, nextRotation);
      setPages((current) => current.map((page) => page.id === pageId ? { ...page, rotation: nextRotation, thumbnail } : page));
      setSelectedPageId(pageId);
    } catch (rotateError) {
      console.error("Organize PDF rotate error:", rotateError);
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
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= pages.length || toIndex >= pages.length) return;
    setPages((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return current;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function moveByOne(pageId: string, direction: -1 | 1) {
    const index = pages.findIndex((page) => page.id === pageId);
    const destination = index + direction;
    if (destination < 0 || destination >= pages.length) return;
    reorderPages(index, destination);
    setSelectedPageId(pageId);
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
    setNotice("");

    try {
      const outputDocument = await PDFDocument.create();
      const sourceDocuments = new Map<string, PDFDocument>();

      for (let index = 0; index < pages.length; index += 1) {
        const pageItem = pages[index];
        const source = sourcesRef.current.get(pageItem.sourceId);
        if (!source) throw new Error(`The source for page ${index + 1} is missing. Please add that file again.`);
        let sourceDocument = sourceDocuments.get(source.id);
        if (!sourceDocument) {
          sourceDocument = await PDFDocument.load(new Uint8Array(source.bytes));
          sourceDocuments.set(source.id, sourceDocument);
        }
        const [copiedPage] = await outputDocument.copyPages(sourceDocument, [pageItem.sourcePageIndex]);
        const finalRotation = normalizeRotation(copiedPage.getRotation().angle + pageItem.rotation);
        copiedPage.setRotation(degrees(finalRotation));
        outputDocument.addPage(copiedPage);
      }

      const outputBytes = await outputDocument.save();
      const buffer = outputBytes.buffer.slice(outputBytes.byteOffset, outputBytes.byteOffset + outputBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      if (!blob.size) throw new Error("The organized PDF output is empty.");
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      const baseName = sourceFile.name.replace(/\.pdf$/i, "");
      anchor.href = url;
      anchor.download = `${baseName}-organized.pdf`;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setNotice(`Created ${pages.length} pages successfully. The download should begin automatically.`);
    } catch (exportError) {
      console.error("Organize PDF export error:", exportError);
      setError(exportError instanceof Error ? exportError.message : "The PDF could not be exported. Try unprotected source files.");
    } finally {
      setExporting(false);
    }
  }

  async function destroySources() {
    const sources = Array.from(sourcesRef.current.values());
    sourcesRef.current.clear();
    await Promise.all(sources.map((source) => source.loadingTask.destroy().catch(() => undefined)));
  }

  async function resetWorkspace() {
    await destroySources();
    setSourceFile(null);
    setPages([]);
    setSelectedPageId(null);
    setProgress(0);
    setError("");
    setNotice("");
    setPendingFiles([]);
    setShowInsertDialog(false);
    setAnchorPageNumber("1");
    if (inputRef.current) inputRef.current.value = "";
    if (addPdfRef.current) addPdfRef.current.value = "";
    if (addOfficeRef.current) addOfficeRef.current.value = "";
    if (addImageRef.current) addImageRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Keep the existing Organize PDF header and page background unchanged. */}
      <header className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden py-10 px-4 text-center">
        <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 bg-pink-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center text-xs font-medium text-white/80 hover:text-white mb-6 transition-colors bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 drop-shadow-md">Organize PDF</h1>
          <p className="text-sm md:text-base text-white/90 max-w-xl mx-auto">Preview every page and insert PDF, Word documents or images exactly where you need them.</p>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 pb-24 relative z-20 -mt-6">
        {!sourceFile && !loading && (
          <div
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleUploadDrop}
            className={`mx-auto mt-4 flex min-h-[330px] max-w-2xl flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center shadow-xl transition-all bg-background ${dragOver ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Upload className="h-8 w-8" /></div>
            <h2 className="mb-2 text-2xl font-bold">Upload your main PDF</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Upload the PDF you want to organize. You can add pages from another PDF, Word/Writer document or image exactly where you need them.</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-12 items-center gap-2 rounded-xl gradient-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"><FilePlus2 className="h-5 w-5" /> Choose main PDF</button>
            <p className="mt-5 text-xs text-muted-foreground">PDF only · Maximum 2 GB · Drag and drop supported</p>
          </div>
        )}

        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />
        <input ref={addPdfRef} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={handleStagedFilesChange} />
        <input ref={addOfficeRef} type="file" accept=".docx,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text" multiple className="hidden" onChange={handleStagedFilesChange} />
        <input ref={addImageRef} type="file" accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp" multiple className="hidden" onChange={handleStagedFilesChange} />

        {loading && (
          <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-border bg-background p-8 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3 text-sm font-bold"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin text-primary" /> {processingMessage}</span><span className="tabular-nums text-primary">{progress}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {error && <div role="alert" className="mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-600"><X className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
        {notice && !loading && <div role="status" className="mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700"><Check className="mt-0.5 h-5 w-5 shrink-0" />{notice}</div>}

        {sourceFile && !loading && pages.length > 0 && (
          <div className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex w-full flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4 shadow-lg md:flex-row md:p-5">
              <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-500"><FileText className="h-6 w-6" /></div>
                <div className="min-w-0"><h2 className="max-w-[260px] truncate text-base font-bold text-foreground md:max-w-md">{sourceFile.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">Main PDF · {(sourceFile.size / (1024 * 1024)).toFixed(2)} MB · {pages.length} pages in workspace</p></div>
              </div>
              <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-4 md:w-auto md:justify-end md:border-t-0 md:pt-0">
                <span className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">{pages.length} total pages</span>
                <button type="button" onClick={() => void resetWorkspace()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500/10 px-3 text-sm font-bold text-red-500 transition hover:bg-red-500/20"><X className="h-4 w-4" /> Clear all</button>
              </div>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="min-w-0 rounded-2xl border border-border bg-background p-4 shadow-sm md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">PDF preview</h3>
                    <p className="text-xs text-muted-foreground">Select any page to use it as the insertion point. Drag thumbnails to reorder.</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">{pages.length} pages</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {pages.map((page, index) => {
                    const isSelected = page.id === selectedPageId;
                    const sourceIcon = page.sourceKind === "image" ? <ImageIcon className="h-3 w-3" /> : page.sourceKind === "office" ? <FileType2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />;
                    return (
                      <article key={page.id} draggable onDragStart={(event) => handlePageDragStart(event, page.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handlePageDrop(event, page.id)} onDragEnd={() => { draggedPageId.current = null; }} className={`group relative min-w-0 rounded-2xl border bg-background p-2.5 shadow-sm transition ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
                        <div className="mb-2 flex items-center justify-between gap-1">
                          <button type="button" onClick={() => { setSelectedPageId(page.id); setError(""); }} className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}><GripVertical className="h-3.5 w-3.5 shrink-0" /> Page {index + 1}</button>
                          <button type="button" onClick={() => deletePage(page.id)} aria-label={`Delete page ${index + 1}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"><X className="h-4 w-4" /></button>
                        </div>
                        <button type="button" onClick={() => setSelectedPageId(page.id)} className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary sm:h-56"><img src={page.thumbnail} alt={`Preview of page ${index + 1}`} className="max-h-full max-w-full select-none object-contain shadow-sm" draggable={false} /></button>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <button type="button" onClick={() => moveByOne(page.id, -1)} disabled={index === 0} aria-label={`Move page ${index + 1} earlier`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-30"><ArrowLeft className="h-3.5 w-3.5" /></button>
                          <div className="flex items-center gap-1"><button type="button" onClick={() => void rotatePage(page.id, -1)} aria-label={`Rotate page ${index + 1} left`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><RotateCcw className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void rotatePage(page.id, 1)} aria-label={`Rotate page ${index + 1} right`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><RotateCw className="h-3.5 w-3.5" /></button></div>
                          <button type="button" onClick={() => moveByOne(page.id, 1)} disabled={index === pages.length - 1} aria-label={`Move page ${index + 1} later`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-30"><ArrowRight className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="mt-2 flex min-w-0 items-center gap-1 truncate text-[10px] font-medium text-muted-foreground" title={page.sourceName}>{sourceIcon}<span className="truncate">{page.sourceName}</span></div>
                        {isSelected && <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary"><Check className="h-3 w-3" /> Selected insertion page</div>}
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="space-y-4 xl:sticky xl:top-5">
                <section className="rounded-2xl border border-border bg-background p-4 shadow-sm md:p-5">
                  <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /><div><h3 className="font-extrabold">Add pages</h3><p className="text-xs text-muted-foreground">Choose the file type to insert.</p></div></div>
                  <div className="space-y-3">
                    <button type="button" onClick={() => addPdfRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-primary/5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600"><FileText className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">PDF</span><span className="block text-xs text-muted-foreground">Insert pages from another PDF</span></span>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                    <button type="button" onClick={() => addOfficeRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-primary/5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600"><FileSpreadsheet className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">DOCX &amp; ODT</span><span className="block text-xs text-muted-foreground">Word / LibreOffice Writer document</span></span>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                    <button type="button" onClick={() => addImageRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-primary/5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><FileImage className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">Image</span><span className="block text-xs text-muted-foreground">JPG, JPEG, PNG or WebP</span></span>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                  <div onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleAddDrop} className={`mt-4 rounded-2xl border-2 border-dashed p-4 text-center text-xs transition ${dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20 text-muted-foreground"}`}>
                    Drop a PDF, DOCX, ODT or image here
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-muted-foreground">After choosing a file, select the current page number and choose Before or After. DOCX/ODT import uses Convia's configured LibreOffice/Gotenberg engine.</p>
                </section>

                <section className="rounded-2xl border border-border bg-background p-4 shadow-sm md:p-5">
                  <div className="mb-3"><h3 className="font-extrabold">Export PDF</h3><p className="mt-1 text-xs text-muted-foreground">Your preview order, rotations, added pages and deletions will be saved.</p></div>
                  <button type="button" onClick={() => void exportPdf()} disabled={exporting || pages.length === 0} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-primary px-6 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60">{exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating PDF...</> : <><Download className="h-4 w-4" /> Download Organized PDF</>}</button>
                </section>
              </aside>
            </div>
          </div>
        )}

        {showInsertDialog && pendingFiles.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowInsertDialog(false); setPendingFiles([]); } }}>
            <section role="dialog" aria-modal="true" aria-labelledby="insert-pages-title" className="w-full max-w-lg rounded-3xl border border-border bg-background p-5 shadow-2xl md:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary"><FilePlus2 className="h-3.5 w-3.5" /> Insert pages</span><h2 id="insert-pages-title" className="text-xl font-extrabold">Where should these pages go?</h2><p className="mt-1 text-sm text-muted-foreground">Choose a page from your current PDF, then insert the selected file before or after it.</p></div>
                <button type="button" aria-label="Close" onClick={() => { setShowInsertDialog(false); setPendingFiles([]); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>

              <div className="mb-4 rounded-2xl bg-muted/40 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected file{pendingFiles.length === 1 ? "" : "s"}</p>
                <div className="max-h-28 space-y-1 overflow-auto">{pendingFiles.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{file.name}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span></div>)}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold">Current page number
                  <select value={anchorPageNumber} onChange={(event) => { setAnchorPageNumber(event.target.value); const page = pages[Number.parseInt(event.target.value, 10) - 1]; if (page) setSelectedPageId(page.id); }} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    {pages.map((page, index) => <option key={page.id} value={String(index + 1)}>Page {index + 1}{page.id === selectedPageId ? " · selected" : ""}</option>)}
                  </select>
                </label>
                <fieldset className="block text-sm font-bold"><legend>Insert position</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setInsertPosition("before")} aria-pressed={insertPosition === "before"} className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${insertPosition === "before" ? "border-primary bg-primary text-white" : "border-border bg-background hover:bg-muted"}`}><MoveLeft className="h-4 w-4" /> Before</button>
                    <button type="button" onClick={() => setInsertPosition("after")} aria-pressed={insertPosition === "after"} className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${insertPosition === "after" ? "border-primary bg-primary text-white" : "border-border bg-background hover:bg-muted"}`}><MoveRight className="h-4 w-4" /> After</button>
                  </div>
                </fieldset>
              </div>

              <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
                {insertPosition === "after"
                  ? `The selected file will be inserted immediately after page ${anchorPageNumber || "—"}. For example, after page 3 means the new pages become page 4 onward.`
                  : `The selected file will be inserted immediately before page ${anchorPageNumber || "—"}.`}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setShowInsertDialog(false); setPendingFiles([]); }} className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-bold hover:bg-muted">Cancel</button>
                <button type="button" onClick={confirmInsertFiles} disabled={!anchorPageNumber || pages.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl gradient-primary px-5 text-sm font-extrabold text-white shadow-md shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> Insert {pendingFiles.length === 1 ? "file" : `${pendingFiles.length} files`}</button>
              </div>
            </section>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Browser-based page arranging</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Original PDF stays unchanged</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> DOCX / ODT conversion uses private server engine</span></div>
      </main>
    </div>
  );
}
