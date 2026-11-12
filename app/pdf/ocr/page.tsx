"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Download,
  FileSearch,
  FileText,
  Languages,
  Loader2,
  RefreshCw,
  ScanText,
  UploadCloud,
  X,
} from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";

type OcrStatus = "idle" | "loading" | "processing" | "done" | "error";
type OcrLanguage = "eng" | "hin" | "eng+hin";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileBaseName(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/[^a-z0-9-_]+/gi, "-") || "document";
}

function getSelectedPages(input: string, totalPages: number): number[] {
  const value = input.trim();
  if (!value) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const selected = new Set<number>();
  for (const part of value.split(",")) {
    const item = part.trim();
    const match = item.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("Page range format galat hai. Example: 1, 3-5, 8");

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end > totalPages || start > end) {
      throw new Error(`Pages 1 se ${totalPages} ke beech honi chahiye.`);
    }
    for (let page = start; page <= end; page += 1) selected.add(page);
  }

  return [...selected].sort((a, b) => a - b);
}

export default function OcrPdfPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<OcrLanguage>("eng+hin");
  const [pageRange, setPageRange] = useState("");
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [activity, setActivity] = useState("Ready when you are");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [processedPages, setProcessedPages] = useState(0);
  const [resultText, setResultText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const busy = status === "loading" || status === "processing";

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a PDF file.");
      setStatus("error");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setErrorMessage("File size 50 MB se kam honi chahiye.");
      setStatus("error");
      return;
    }
    setFile(nextFile);
    setStatus("idle");
    setProgress(0);
    setActivity("PDF ready for OCR");
    setPageCount(null);
    setProcessedPages(0);
    setResultText("");
    setErrorMessage("");
    setCopied(false);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function runOcr() {
    if (!file || busy) return;

    setStatus("loading");
    setProgress(0);
    setProcessedPages(0);
    setResultText("");
    setErrorMessage("");
    setActivity("Loading PDF engine…");

    let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
    let pdfDocument: any = null;

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const { createWorker } = await import("tesseract.js");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const fileData = new Uint8Array(await file.arrayBuffer());
      pdfDocument = await pdfjs.getDocument({ data: fileData }).promise;
      const totalPages = pdfDocument.numPages as number;
      setPageCount(totalPages);

      const pages = getSelectedPages(pageRange, totalPages);
      if (pages.length === 0) throw new Error("OCR ke liye kam se kam ek page select karein.");

      setStatus("processing");
      setActivity("Loading language data…");
      worker = await createWorker(language, 1, {
        logger: (message: { status?: string; progress?: number }) => {
          if (message.status === "recognizing text" && typeof message.progress === "number") {
            const overall = ((pageProgressIndex + message.progress) / pages.length) * 100;
            setProgress(Math.min(99, Math.round(overall)));
          }
        },
      });

      const pageOutputs: string[] = [];
      let pageProgressIndex = 0;
      for (let index = 0; index < pages.length; index += 1) {
        pageProgressIndex = index;
        const pageNumber = pages[index];
        setActivity(`Reading page ${pageNumber} of ${totalPages}…`);
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Browser canvas start nahi ho paya. Please try another browser.");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: context, viewport }).promise;

        const recognition = await worker.recognize(canvas);
        const pageText = (recognition.data.text || "").trim();
        pageOutputs.push(`========== PAGE ${pageNumber} ==========\n${pageText || "[No readable text detected on this page]"}`);

        setProcessedPages(index + 1);
        setProgress(Math.round(((index + 1) / pages.length) * 100));
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup?.();
      }

      setResultText(pageOutputs.join("\n\n"));
      setStatus("done");
      setProgress(100);
      setActivity(`OCR completed · ${pages.length} page${pages.length === 1 ? "" : "s"} processed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR process complete nahi ho paya.";
      setErrorMessage(message);
      setStatus("error");
      setActivity("OCR could not be completed");
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore worker cleanup errors; the OCR result is already handled above.
        }
      }
      if (pdfDocument) {
        try {
          await pdfDocument.destroy();
        } catch {
          // Ignore PDF.js cleanup errors.
        }
      }
    }
  }

  function downloadText() {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileBaseName(file?.name ?? "document")}-ocr.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function copyText() {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMessage("Clipboard access blocked. Text ko select karke manually copy karein.");
    }
  }

  function resetTool() {
    if (busy) return;
    setFile(null);
    setPageRange("");
    setStatus("idle");
    setProgress(0);
    setPageCount(null);
    setProcessedPages(0);
    setResultText("");
    setErrorMessage("");
    setActivity("Ready when you are");
    setCopied(false);
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolHeader
        title="OCR PDF"
        description="Turn scanned and image-based PDF pages into selectable text. Choose English, Hindi, or both."
        icon={ScanText}
      />
      <main className="container mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><FileSearch className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold">Upload your PDF</h2>
                <p className="text-sm text-muted-foreground">Maximum file size: 50 MB</p>
              </div>
            </div>

            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-9 ${isDragging ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border bg-muted/20 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"}`}
            >
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={onFileChange} className="hidden" />
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><UploadCloud className="h-7 w-7" /></div>
              <p className="font-semibold">Drag and drop your PDF here</p>
              <p className="mt-1 text-sm text-muted-foreground">or choose a file from your device</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} className="mt-5 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">Browse PDF</button>
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}{pageCount ? ` · ${pageCount} pages` : " · PDF document"}</p>
                </div>
                <button type="button" onClick={resetTool} disabled={busy} aria-label="Remove PDF" className="rounded-lg p-2 text-muted-foreground transition hover:bg-background hover:text-foreground disabled:opacity-40"><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Languages className="h-4 w-4 text-violet-600" /> OCR language</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value as OcrLanguage)} disabled={busy} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60">
                  <option value="eng+hin">English + Hindi</option>
                  <option value="eng">English</option>
                  <option value="hin">Hindi</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Pages to process <span className="font-normal text-muted-foreground">(optional)</span></span>
                <input value={pageRange} onChange={(event) => setPageRange(event.target.value)} disabled={busy} placeholder="All pages, or 1, 3-5, 8" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60" />
              </label>
            </div>

            <button type="button" onClick={runOcr} disabled={!file || busy} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-700/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing PDF…</> : <><ScanText className="h-4 w-4" /> Start OCR</>}
            </button>

            {busy && (
              <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900 dark:bg-violet-950/30" aria-live="polite">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-violet-900 dark:text-violet-100">{activity}</span><span className="font-bold tabular-nums text-violet-700 dark:text-violet-200">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-900"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-xs text-violet-800/80 dark:text-violet-200/80">Keep this tab open while pages are being recognized.</p>
              </div>
            )}

            {status === "error" && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" role="alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p>{errorMessage}</p>
              </div>
            )}
          </section>

          <section className="min-h-[720px] rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Extracted text</h2>
                <p className="text-sm text-muted-foreground">Your OCR result will appear here.</p>
              </div>
              {status === "done" && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</span>}
            </div>

            {status === "done" ? (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{processedPages} page(s) processed</span><span>{resultText.length.toLocaleString()} characters</span></div>
                <textarea readOnly value={resultText} spellCheck={false} className="min-h-[580px] w-full resize-y rounded-2xl border border-border bg-muted/20 p-5 text-sm leading-7 outline-none focus:border-violet-400 sm:min-h-[640px]" aria-label="OCR result text" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={copyText} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-muted"><Clipboard className="h-4 w-4" /> {copied ? "Copied" : "Copy text"}</button>
                  <button type="button" onClick={downloadText} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"><Download className="h-4 w-4" /> Download TXT</button>
                </div>
                <button type="button" onClick={resetTool} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"><RefreshCw className="h-4 w-4" /> Start another PDF</button>
              </>
            ) : (
              <div className="flex min-h-[620px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/15 px-6 py-10 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><FileText className="h-8 w-8" /></div>
                <p className="font-semibold">Nothing extracted yet</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Upload a scanned PDF and click Start OCR. Extracted text will be displayed in this panel.</p>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { title: "Works with scans", detail: "Recognizes text from image-only PDF pages." },
            { title: "Choose page range", detail: "Process the full file or selected pages." },
            { title: "Your file stays local", detail: "PDF pages are processed in your browser." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">OCR accuracy depends on scan quality, resolution, handwriting, and language. First use may download language data and can take longer. Convia does not upload your selected PDF to its server in this browser-based OCR flow.</p>
      </main>
    </div>
  );
}
