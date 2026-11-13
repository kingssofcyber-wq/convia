"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";

type PageSize = "a4" | "letter" | "legal";
type Orientation = "portrait" | "landscape";
type ConversionQuality = "standard" | "high";

type MammothModule = {
  convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{
    value: string;
    messages?: Array<{ type?: string; message?: string }>;
  }>;
};

type Html2PdfWorker = {
  toContainer: () => Promise<unknown>;
  toCanvas: () => Promise<unknown>;
  toPdf: () => Promise<unknown>;
  outputPdf: (type: "blob") => Promise<Blob>;
};

type Html2PdfFactory = () => {
  set: (options: Record<string, unknown>) => {
    from: (element: HTMLElement) => Html2PdfWorker;
  };
};

const MAX_FILE_SIZE = 40 * 1024 * 1024;
const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "H1", "H2", "H3", "H4", "H5", "H6",
  "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH",
  "BLOCKQUOTE", "IMG", "A", "DIV", "SPAN", "SUB", "SUP", "HR",
]);
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON", "VIDEO", "AUDIO"]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeDocxHtml(source: string): string {
  const parsed = new DOMParser().parseFromString(source, "text/html");
  const elements = Array.from(parsed.body.querySelectorAll("*"));

  for (const element of elements) {
    const tag = element.tagName;
    if (DROP_TAGS.has(tag)) {
      element.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      const permitted = ["src", "alt", "title", "width", "height", "colspan", "rowspan", "start", "href", "target", "rel"].includes(name);
      if (!permitted || name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (tag === "IMG" && name === "src" && !/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) {
        element.removeAttribute("src");
      }
      if (tag === "A" && name === "href") {
        try {
          const url = new URL(value, window.location.origin);
          if (!["http:", "https:", "mailto:"].includes(url.protocol)) element.removeAttribute("href");
        } catch {
          element.removeAttribute("href");
        }
      }
    }

    if (tag === "A" && element.hasAttribute("href")) {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
    if (tag === "IMG") {
      element.setAttribute("loading", "eager");
      element.setAttribute("alt", element.getAttribute("alt") || "Document image");
    }
  }

  return parsed.body.innerHTML;
}

function getWordFileName(name: string): string {
  return name.replace(/\.docx$/i, "");
}

export default function WordToPdfPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const previewContentRef = React.useRef<HTMLDivElement>(null);
  const downloadUrlRef = React.useRef<string | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [isReading, setIsReading] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [downloadName, setDownloadName] = React.useState("convia-document.pdf");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [pageSize, setPageSize] = React.useState<PageSize>("a4");
  const [orientation, setOrientation] = React.useState<Orientation>("portrait");
  const [margin, setMargin] = React.useState("10");
  const [quality, setQuality] = React.useState<ConversionQuality>("high");
  const [showSettings, setShowSettings] = React.useState(true);

  React.useEffect(() => {
    return () => {
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  const clearOutput = React.useCallback(() => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownloadUrl(null);
    setDownloadName("convia-document.pdf");
  }, []);

  const loadFile = React.useCallback(async (selected: File | undefined) => {
    if (!selected) return;
    setError("");
    setNotice("");
    setPreviewHtml("");
    clearOutput();

    if (!selected.name.toLowerCase().endsWith(".docx")) {
      setFile(null);
      setError("Please upload a .docx file. Older .doc files are not supported in this browser converter.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("This file is larger than 40 MB. Please choose a smaller DOCX document.");
      return;
    }
    if (selected.size < 8) {
      setFile(null);
      setError("The selected file is empty or invalid.");
      return;
    }

    setFile(selected);
    setIsReading(true);
    try {
      const header = new Uint8Array(await selected.slice(0, 4).arrayBuffer());
      if (header[0] !== 0x50 || header[1] !== 0x4b) {
        throw new Error("This file does not look like a valid DOCX archive.");
      }

      const mammothModule = await import("mammoth");
      const mammoth = ((mammothModule as unknown as { default?: MammothModule }).default ?? mammothModule) as unknown as MammothModule;
      const result = await mammoth.convertToHtml({ arrayBuffer: await selected.arrayBuffer() });
      const sanitized = safeDocxHtml(result.value || "");
      const plainText = new DOMParser().parseFromString(sanitized, "text/html").body.textContent?.trim() || "";
      const hasImage = /<img\b/i.test(sanitized);
      if (!plainText && !hasImage) {
        throw new Error("No readable text or images were found in this DOCX file.");
      }
      setPreviewHtml(sanitized);
      const warningCount = result.messages?.filter((message) => message.type === "warning").length ?? 0;
      if (warningCount > 0) {
        setNotice(`${warningCount} formatting note(s): some advanced Word styling may be simplified in the PDF preview.`);
      } else {
        setNotice("Document preview is ready. Review the layout before creating the PDF.");
      }
    } catch (cause) {
      setFile(null);
      setError(cause instanceof Error ? cause.message : "Could not read this DOCX file. Please try another document.");
    } finally {
      setIsReading(false);
    }
  }, [clearOutput]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void loadFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void loadFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setPreviewHtml("");
    setError("");
    setNotice("");
    setProgress(0);
    clearOutput();
  };

  const handleConvert = async () => {
    if (!file || !previewContentRef.current || !previewHtml || isConverting) return;
    setError("");
    setIsConverting(true);
    setProgress(5);
    clearOutput();

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = ((html2pdfModule as unknown as { default?: Html2PdfFactory }).default ?? html2pdfModule) as unknown as Html2PdfFactory;
      const content = previewContentRef.current;
      // Wait for embedded DOCX images to finish decoding before html2canvas captures them.
      const images = Array.from(content.querySelectorAll("img"));
      await Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      }));

      const selectedMargin = Math.max(5, Math.min(25, Number(margin) || 10));
      const scale = quality === "high" ? 2 : 1.35;
      const options = {
        margin: selectedMargin,
        filename: `${getWordFileName(file.name)}.pdf`,
        image: { type: "jpeg", quality: quality === "high" ? 0.97 : 0.88 },
        html2canvas: {
          scale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: content.scrollWidth || 794,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: pageSize, orientation, compress: true },
        pagebreak: { mode: ["css", "legacy"], avoid: ["img", "tr", "h1", "h2", "h3"] },
      };

      setProgress(15);
      const worker = html2pdf().set(options).from(content);
      await worker.toContainer();
      setProgress(35);
      await worker.toCanvas();
      setProgress(68);
      await worker.toPdf();
      setProgress(88);
      const blob = await worker.outputPdf("blob");
      if (!(blob instanceof Blob) || blob.size < 100 || (blob.type && blob.type !== "application/pdf")) {
        throw new Error("The PDF engine returned an empty or invalid file. Please try Standard quality or a smaller DOCX file.");
      }

      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownloadUrl(url);
      setDownloadName(`${getWordFileName(file.name)}.pdf`);
      setProgress(100);
    } catch (cause) {
      console.error("Convia Word to PDF conversion failed:", cause);
      setError(cause instanceof Error ? cause.message : "PDF creation failed. Please try again with a simpler DOCX file.");
    } finally {
      setIsConverting(false);
    }
  };

  const paperWidth = orientation === "portrait" ? (pageSize === "a4" ? 794 : pageSize === "letter" ? 816 : 816) : 1123;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <ToolHeader
        title="Word to PDF"
        description="Convert DOCX documents into clean PDFs. Preview your pages and choose paper size, orientation and output quality before downloading."
        icon={FileText}
      />

      <main className="container mx-auto mt-7 max-w-7xl px-4 pb-10 sm:mt-9">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 via-white to-indigo-50 p-4 shadow-sm dark:border-violet-900/50 dark:from-violet-950/30 dark:via-background dark:to-indigo-950/30 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Convia Document Workspace</p>
              <p className="mt-0.5 text-sm text-muted-foreground">DOCX to PDF · Live document preview · Local browser processing</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Files stay in this browser</span>
            <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">DOCX only</span>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
              <div className="border-b border-border/70 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-600"><FileUp className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Upload Word file</h2>
                    <p className="text-sm text-muted-foreground">Choose a DOCX document</p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <input ref={fileInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleInputChange} />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }}
                  onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`group flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-all ${dragging ? "scale-[1.01] border-violet-500 bg-violet-500/10" : "border-violet-300/80 bg-violet-500/[0.025] hover:border-violet-500 hover:bg-violet-500/[0.06] dark:border-violet-900"}`}
                >
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/20 transition-transform group-hover:-translate-y-1">
                    {isReading ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{isReading ? "Reading your document…" : "Drop your DOCX file here"}</h3>
                  <p className="mt-1 max-w-[250px] text-sm leading-6 text-muted-foreground">or click to browse your computer. Images, tables and headings are included where supported.</p>
                  <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700">
                    <FileUp className="h-4 w-4" /> Browse DOCX
                  </span>
                  <p className="mt-4 text-xs text-muted-foreground">Maximum file size: 40 MB · .docx format</p>
                </div>

                {file && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600"><FileText className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} · Word document</p>
                    </div>
                    <button type="button" onClick={removeFile} aria-label="Remove document" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600"><X className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
              <button type="button" onClick={() => setShowSettings((value) => !value)} className="flex w-full items-center justify-between p-5 text-left sm:p-6">
                <span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600"><Settings2 className="h-5 w-5" /></span><span><span className="block text-base font-bold text-foreground">PDF settings</span><span className="block text-xs text-muted-foreground">Customize the output</span></span></span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showSettings ? "rotate-180" : ""}`} />
              </button>
              {showSettings && (
                <div className="space-y-4 border-t border-border/70 p-5 sm:p-6">
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page size</span>
                    <select value={pageSize} onChange={(event) => setPageSize(event.target.value as PageSize)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10">
                      <option value="a4">A4</option><option value="letter">US Letter</option><option value="legal">Legal</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Orientation</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setOrientation("portrait")} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${orientation === "portrait" ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-border bg-background text-muted-foreground hover:border-violet-300"}`}><span className="mx-auto mb-2 block h-7 w-5 rounded border-2 border-current" />Portrait</button>
                      <button type="button" onClick={() => setOrientation("landscape")} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${orientation === "landscape" ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-border bg-background text-muted-foreground hover:border-violet-300"}`}><span className="mx-auto mb-2 block h-5 w-7 rounded border-2 border-current" />Landscape</button>
                    </div>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PDF margins</span>
                    <select value={margin} onChange={(event) => setMargin(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10">
                      <option value="5">Narrow · 5 mm</option><option value="10">Normal · 10 mm</option><option value="15">Wide · 15 mm</option><option value="20">Extra wide · 20 mm</option><option value="25">Maximum · 25 mm</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output quality</span>
                    <select value={quality} onChange={(event) => setQuality(event.target.value as ConversionQuality)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10">
                      <option value="standard">Standard · Smaller file</option><option value="high">High · Better clarity</option>
                    </select>
                  </label>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    Note: browser rendering may simplify complex Word layouts. This converter creates a visual PDF, so text may not remain selectable/searchable.
                  </div>
                </div>
              )}
            </section>

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-300/70 bg-red-500/5 p-4 text-sm text-red-700 dark:border-red-900 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span>
              </div>
            )}

            {notice && !error && (
              <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><span>{notice}</span>
              </div>
            )}

            {isConverting && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-violet-800 dark:text-violet-200">Creating your PDF…</span><span className="font-extrabold tabular-nums text-violet-700 dark:text-violet-300">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-900"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-xs text-violet-700/80 dark:text-violet-300/80">Rendering document pages in your browser. Keep this tab open.</p>
              </div>
            )}

            {previewHtml && !isConverting && (
              <Button type="button" onClick={handleConvert} className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-105 disabled:opacity-50" disabled={!file || isReading}>
                <FileText className="mr-2 h-5 w-5" /> Create PDF <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}

            {downloadUrl && !isConverting && (
              <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" /> PDF is ready to download</div>
                <a href={downloadUrl} download={downloadName} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700"><Download className="h-4 w-4" /> Download {downloadName}</a>
              </div>
            )}
          </aside>

          <section className="min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/10 text-blue-600"><Eye className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-bold text-foreground">Document preview</h2><p className="text-sm text-muted-foreground">Review the content before exporting</p></div>
              </div>
              {previewHtml && <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Preview loaded</span>}
            </div>

            <div className="min-h-[650px] bg-slate-100/80 p-3 dark:bg-slate-950/40 sm:p-5 lg:p-7">
              {isReading ? (
                <div className="flex min-h-[610px] flex-col items-center justify-center text-center"><Loader2 className="mb-4 h-10 w-10 animate-spin text-violet-600" /><h3 className="font-bold text-foreground">Preparing document preview</h3><p className="mt-1 text-sm text-muted-foreground">Reading paragraphs, tables and embedded images…</p></div>
              ) : previewHtml ? (
                <div className="max-h-[980px] overflow-auto rounded-xl border border-slate-200 bg-slate-200/70 p-2 shadow-inner dark:border-slate-800 sm:p-4">
                  <div
                    ref={previewContentRef}
                    className="convia-word-preview mx-auto min-h-[1056px] bg-white text-slate-800 shadow-xl"
                    style={{ width: `min(100%, ${paperWidth}px)`, padding: `${Math.round((Number(margin) || 10) * 3.2)}px` }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              ) : (
                <div className="flex min-h-[610px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 text-center dark:border-slate-700 dark:bg-slate-900/30">
                  <div className="mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-100 to-blue-100 text-violet-600 dark:from-violet-950 dark:to-blue-950"><FileText className="h-9 w-9" /></div>
                  <h3 className="text-xl font-extrabold text-foreground">Your document preview will appear here</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Upload a DOCX file to see its text, headings, tables and embedded images before making your PDF.</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-background px-5 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950"><UploadCloud className="h-4 w-4" /> Choose a Word file</button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-4 text-xs text-muted-foreground sm:px-6">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Processed locally in your browser</span>
              <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Update settings and regenerate anytime</span>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .convia-word-preview { box-sizing: border-box; color: #1f2937; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.58; overflow-wrap: anywhere; }
        .convia-word-preview h1 { font-size: 2em; line-height: 1.2; font-weight: 700; margin: 0.35em 0 0.55em; }
        .convia-word-preview h2 { font-size: 1.55em; line-height: 1.25; font-weight: 700; margin: 0.45em 0 0.55em; }
        .convia-word-preview h3, .convia-word-preview h4 { font-size: 1.2em; line-height: 1.3; font-weight: 700; margin: 0.5em 0; }
        .convia-word-preview p { margin: 0 0 0.8em; }
        .convia-word-preview ul, .convia-word-preview ol { margin: 0.5em 0 1em 1.6em; padding: 0; }
        .convia-word-preview ul { list-style: disc; }
        .convia-word-preview ol { list-style: decimal; }
        .convia-word-preview li { margin: 0.2em 0; }
        .convia-word-preview table { width: 100%; border-collapse: collapse; margin: 1em 0; table-layout: auto; }
        .convia-word-preview td, .convia-word-preview th { border: 1px solid #cbd5e1; padding: 7px 9px; vertical-align: top; }
        .convia-word-preview th { background: #f1f5f9; font-weight: 700; }
        .convia-word-preview img { max-width: 100%; height: auto; object-fit: contain; }
        .convia-word-preview blockquote { border-left: 3px solid #a78bfa; margin: 1em 0; padding: 0.2em 0 0.2em 1em; color: #475569; }
        .convia-word-preview a { color: #4f46e5; text-decoration: underline; }
        .convia-word-preview hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1.4em 0; }
        .convia-word-preview h1, .convia-word-preview h2, .convia-word-preview h3, .convia-word-preview img, .convia-word-preview tr { break-inside: avoid; }
      `}</style>
    </div>
  );
}
