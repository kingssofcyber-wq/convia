"use client";

import * as React from "react";
import {
  FileText,
  Loader2,
  UploadCloud,
  Download,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Languages,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";

type OCRLanguage = "eng" | "hin" | "eng+hin";
type ConversionResult = {
  url: string;
  filename: string;
  size: number;
  pages: number;
  ocrPages: number;
  characters: number;
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  hasEOL?: boolean;
};

const MAX_FILE_BYTES = 60 * 1024 * 1024;
const MAX_PAGES = 80;
const MIN_TEXT_CHARACTERS = 24;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeBaseName(filename: string): string {
  return filename.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim() || "convia-document";
}

function explainError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  if (/password|encrypted/i.test(message)) {
    return "This PDF is password-protected. Remove its password first, then try again.";
  }
  if (/worker|fake worker|pdf\.worker/i.test(message)) {
    return "The PDF.js worker could not load. Run the worker setup command from the installation guide and try again.";
  }
  if (/tesseract|traineddata|language|fetch|network|load .*core/i.test(message)) {
    return "The OCR engine or language data could not load. Check your internet connection and try again. The first OCR run downloads language data.";
  }
  if (/docx|packer|zip|compress/i.test(message)) {
    return "The Word document could not be packaged. Check that the 'docx' dependency is installed, then run npm install again.";
  }
  return `Conversion failed: ${message}`;
}

function extractReadableLines(items: unknown[]): string[] {
  const textItems = (items as PdfTextItem[])
    .filter((item) => typeof item?.str === "string" && item.str.trim().length > 0 && Array.isArray(item.transform));

  if (!textItems.length) return [];

  const sorted = [...textItems].sort((a, b) => {
    const ay = Number(a.transform?.[5] ?? 0);
    const by = Number(b.transform?.[5] ?? 0);
    if (Math.abs(by - ay) > 2.5) return by - ay;
    return Number(a.transform?.[4] ?? 0) - Number(b.transform?.[4] ?? 0);
  });

  const lines: Array<{ y: number; items: PdfTextItem[] }> = [];
  for (const item of sorted) {
    const y = Number(item.transform?.[5] ?? 0);
    let line = lines.find((candidate) => Math.abs(candidate.y - y) <= 2.5);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push(item);
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => line.items
      .sort((a, b) => Number(a.transform?.[4] ?? 0) - Number(b.transform?.[4] ?? 0))
      .map((item) => item.str?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean)
      .join(" ")
      .trim())
    .filter(Boolean);
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n|\n/)
    .map((part) => part.replace(/[\t ]+/g, " ").trim())
    .filter(Boolean);
}

export default function PdfToWordPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState<OCRLanguage>("eng+hin");
  const [forceOCR, setForceOCR] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [stage, setStage] = React.useState("Ready to convert");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<ConversionResult | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const resultUrlRef = React.useRef<string | null>(null);

  const clearResult = React.useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  }, []);

  React.useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const acceptFile = (candidate?: File) => {
    if (!candidate) return;
    setError("");
    clearResult();

    const isPdf = candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setError("Please choose a PDF file.");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setError(`This file is ${formatBytes(candidate.size)}. The maximum supported upload size is 60 MB.`);
      return;
    }
    setFile(candidate);
    setProgress(0);
    setStage("Ready to convert");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
    setProgress(0);
    setStage("Ready to convert");
    clearResult();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = () => {
    if (!result?.url) return;
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleConvert = async () => {
    if (!file || isConverting) return;

    setError("");
    clearResult();
    setIsConverting(true);
    setProgress(0);
    setStage("Loading PDF engine...");

    let loadingTask: any = null;
    let ocrWorker: any = null;
    let totalCharacters = 0;
    let ocrPageCount = 0;

    try {
      // Load PDF.js only after the user starts conversion.
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      setStage("Opening your PDF...");
      const bytes = new Uint8Array(await file.arrayBuffer());
      loadingTask = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      if (!totalPages || totalPages > MAX_PAGES) {
        throw new Error(`This PDF has ${totalPages} pages. The current limit is ${MAX_PAGES} pages.`);
      }

      setStage(`Preparing Word document (${totalPages} pages)...`);
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const children: any[] = [];
      let hasAnyText = false;
      let activePage = 1;

      const getOCRWorker = async () => {
        if (ocrWorker) return ocrWorker;
        setStage("Starting OCR engine and loading language data...");
        const { createWorker } = await import("tesseract.js");
        ocrWorker = await createWorker(language, 1, {
          logger: (message: { status?: string; progress?: number }) => {
            if (message.status === "recognizing text" && typeof message.progress === "number") {
              const overall = ((activePage - 1 + Math.max(0, Math.min(1, message.progress))) / totalPages) * 100;
              setProgress(Math.min(99, Math.round(overall)));
              setStage(`Reading image text · page ${activePage} of ${totalPages}`);
            }
          },
        });
        return ocrWorker;
      };

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        activePage = pageNumber;
        setStage(`Reading page ${pageNumber} of ${totalPages}...`);
        setProgress(Math.round(((pageNumber - 1) / totalPages) * 100));

        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const extractedLines = extractReadableLines(textContent.items as unknown[]);
        const extractedText = extractedLines.join("\n").trim();
        const extractedCharacters = extractedText.replace(/\s/g, "").length;
        const shouldRunOCR = forceOCR || extractedCharacters < MIN_TEXT_CHARACTERS;

        let finalText = extractedText;
        if (shouldRunOCR) {
          setStage(`Preparing OCR for page ${pageNumber} of ${totalPages}...`);
          const worker = await getOCRWorker();

          // Keep the render size high enough for OCR, but cap memory usage on large pages.
          const baseViewport = page.getViewport({ scale: 1 });
          const maxDimension = 4200;
          const maxPixels = 16_000_000;
          const dimensionScale = maxDimension / Math.max(baseViewport.width, baseViewport.height);
          const pixelScale = Math.sqrt(maxPixels / (baseViewport.width * baseViewport.height));
          const scale = Math.max(1, Math.min(2.25, dimensionScale, pixelScale));
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error(`Could not prepare the page image for OCR (page ${pageNumber}).`);

          setStage(`Rendering image for OCR · page ${pageNumber} of ${totalPages}`);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const recognition = await worker.recognize(canvas);
          const ocrText = typeof recognition?.data?.text === "string" ? recognition.data.text.trim() : "";
          canvas.width = 0;
          canvas.height = 0;

          if (ocrText.length > extractedText.length || forceOCR) {
            finalText = ocrText || extractedText;
          }
          ocrPageCount += 1;
        }

        const paragraphs = splitIntoParagraphs(finalText);
        if (paragraphs.length) {
          hasAnyText = true;
          totalCharacters += finalText.length;
          paragraphs.forEach((paragraphText, paragraphIndex) => {
            children.push(new Paragraph({
              children: [new TextRun({ text: paragraphText, size: 22 })],
              spacing: { after: 140, line: 300 },
              ...(pageNumber > 1 && paragraphIndex === 0 ? { pageBreakBefore: true } : {}),
            }));
          });
        } else {
          // Keep the page boundary and make empty/unreadable pages visible to the user.
          children.push(new Paragraph({
            children: [new TextRun({ text: `[No readable text detected on page ${pageNumber}]`, italics: true, color: "777777" })],
            ...(pageNumber > 1 ? { pageBreakBefore: true } : {}),
          }));
        }

        page.cleanup();
        setProgress(Math.round((pageNumber / totalPages) * 100));
      }

      if (!hasAnyText) {
        throw new Error("No readable text was found. Try a clearer scan or select the correct OCR language.");
      }

      setStage("Building editable Word document...");
      const doc = new Document({
        creator: "Convia PDF Workspace",
        title: `${safeBaseName(file.name)} - Word document`,
        description: "Converted by Convia PDF to Word",
        sections: [{ properties: {}, children }],
      });

      const blob = await Packer.toBlob(doc);
      if (!(blob instanceof Blob) || blob.size < 100) {
        throw new Error("The Word document was generated empty. Please retry with another PDF.");
      }

      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      const filename = `${safeBaseName(file.name)}.docx`;
      setResult({
        url,
        filename,
        size: blob.size,
        pages: totalPages,
        ocrPages: ocrPageCount,
        characters: totalCharacters,
      });
      setProgress(100);
      setStage("Conversion complete");
    } catch (conversionError) {
      console.error("Convia PDF to Word conversion failed:", conversionError);
      setError(explainError(conversionError));
      setStage("Conversion stopped");
    } finally {
      // Always close workers/tasks, including when OCR or DOCX generation fails.
      if (ocrWorker) {
        try { await ocrWorker.terminate(); } catch (terminateError) {
          console.warn("Could not terminate OCR worker cleanly:", terminateError);
        }
      }
      if (loadingTask) {
        try { await loadingTask.destroy(); } catch (destroyError) {
          console.warn("Could not destroy PDF loading task cleanly:", destroyError);
        }
      }
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <ToolHeader
        title="PDF to Word"
        description="Convert regular and scanned PDFs into editable Word documents. Image-only pages are detected and OCR is applied automatically."
        icon={FileText}
      />

      <main className="container mx-auto mt-8 max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/60 bg-background p-6 shadow-sm md:p-8">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Upload your PDF</h2>
                <p className="text-sm text-muted-foreground">Text PDFs and scanned/image PDFs supported</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />

            <div
              role="button"
              tabIndex={0}
              onClick={() => !isConverting && fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (!isConverting && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${isDragging ? "border-violet-500 bg-violet-50" : "border-border bg-muted/10 hover:bg-muted/30"} ${isConverting ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Drop your PDF here</h3>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Upload a searchable PDF or a scanned document. Convia checks each page and runs OCR only when needed.
              </p>
              {file ? (
                <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                  <span className="max-w-[220px] truncate text-left text-sm font-semibold">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                </div>
              ) : (
                <Button type="button" className="h-12 rounded-xl bg-violet-600 px-8 text-base text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700">
                  Choose PDF file
                </Button>
              )}
              <p className="mt-6 text-xs text-muted-foreground">PDF only · Maximum 60 MB · Up to 80 pages</p>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Languages className="h-4 w-4 text-violet-600" /> OCR language
              </div>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as OCRLanguage)}
                disabled={isConverting}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              >
                <option value="eng+hin">English + Hindi (recommended)</option>
                <option value="eng">English</option>
                <option value="hin">Hindi</option>
              </select>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={forceOCR} onChange={(event) => setForceOCR(event.target.checked)} disabled={isConverting} className="mt-1 accent-violet-600" />
                <span><strong className="text-foreground">Force OCR on every page</strong><br />Use this when a PDF has an incomplete or incorrect hidden text layer.</span>
              </label>
            </div>

            {file && !isConverting && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={handleConvert} className="h-14 flex-1 rounded-xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700">
                  Convert to Word <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button onClick={removeFile} variant="outline" className="h-14 rounded-xl px-4" aria-label="Remove PDF">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </section>

          <section className="flex flex-col rounded-3xl border border-border/60 bg-background p-6 shadow-sm md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-500">Conversion Output</p>
                <h2 className="mb-1 text-xl font-bold text-foreground">Editable Word document</h2>
                <p className="text-sm text-muted-foreground">Text is reconstructed as editable paragraphs, with page breaks.</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/5 p-8 text-center">
              {isConverting ? (
                <div className="flex w-full max-w-sm flex-col items-center">
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-violet-500" />
                  <h3 className="mb-2 text-lg font-bold">Converting your PDF...</h3>
                  <p className="mb-5 text-sm text-muted-foreground">{stage}</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-violet-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-violet-600">{progress}%</p>
                  <p className="mt-4 text-xs text-muted-foreground">Keep this tab open until the Word file is ready.</p>
                </div>
              ) : result ? (
                <div className="flex w-full flex-col items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Conversion complete!</h3>
                  <p className="mb-5 max-w-sm text-sm text-muted-foreground">Your editable Word document is ready to download.</p>
                  <div className="mb-5 grid w-full max-w-sm grid-cols-2 gap-2 text-left">
                    <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">PDF pages</p><p className="font-bold">{result.pages}</p></div>
                    <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">OCR pages</p><p className="font-bold">{result.ocrPages}</p></div>
                    <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Extracted characters</p><p className="font-bold">{result.characters.toLocaleString()}</p></div>
                    <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Word file size</p><p className="font-bold">{formatBytes(result.size)}</p></div>
                  </div>
                  <p className="mb-3 w-full max-w-sm truncate text-xs text-muted-foreground">{result.filename}</p>
                  <Button onClick={handleDownload} className="h-12 w-full max-w-xs rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                    <Download className="mr-2 h-5 w-5" /> Download Word File
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">Your Word file will appear here</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">After conversion, download the .docx file and open it in Microsoft Word or a compatible editor.</p>
                </>
              )}
            </div>

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="font-bold">Conversion error</p><p className="mt-1 break-words">{error}</p></div>
              </div>
            )}

            {result && (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700">
                <ShieldCheck className="h-4 w-4" /> File generated in your browser; it was not uploaded to Convia servers.
              </div>
            )}
            {!result && !error && !isConverting && (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <RefreshCw className="h-4 w-4" /> Upload a PDF to start conversion.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
