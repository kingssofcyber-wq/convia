"use client";

import * as React from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Languages,
  Loader2,
  RefreshCw,
  ScanText,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { extractPdfForWord, type PdfOcrLanguage, type WordLine } from "@/lib/pdf/pdf-to-word-extract";

type WordResult = { url: string; name: string; size: number; pages: number; ocrPages: number[] };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function paragraphText(line: WordLine) {
  return line.cells.length > 1 ? line.cells.join("    ") : line.text;
}

function detectTableBlocks(lines: WordLine[]) {
  const blocks: Array<{ type: "line"; line: WordLine } | { type: "table"; rows: string[][] }> = [];
  let pending: WordLine[] = [];
  const flush = () => {
    if (pending.length >= 2) {
      const columnCount = Math.max(2, ...pending.map((line) => line.cells.length));
      blocks.push({
        type: "table",
        rows: pending.map((line) => Array.from({ length: columnCount }, (_, index) => line.cells[index] ?? "")),
      });
    } else if (pending.length === 1) {
      blocks.push({ type: "line", line: pending[0] });
    }
    pending = [];
  };

  for (const line of lines) {
    if (line.cells.length >= 2 && line.cells.some(Boolean)) pending.push(line);
    else {
      flush();
      blocks.push({ type: "line", line });
    }
  }
  flush();
  return blocks;
}

export function PdfToWordWorkspace() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState("Ready when you are");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [language, setLanguage] = React.useState<PdfOcrLanguage>("eng+hin");
  const [autoOcr, setAutoOcr] = React.useState(true);
  const [forceOcr, setForceOcr] = React.useState(false);
  const [result, setResult] = React.useState<WordResult | null>(null);

  React.useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result]);

  const selectFile = (next?: File) => {
    if (!next) return;
    const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Please choose a PDF file.");
      return;
    }
    if (next.size > 60 * 1024 * 1024) {
      setError("PDF file size must be 60 MB or less for browser conversion.");
      return;
    }
    setFile(next);
    setError("");
    setNotice("");
    setProgress(0);
    setPhase("PDF ready for conversion");
    setResult(null);
  };

  const buildWord = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setProgress(2);
    setResult(null);

    try {
      const extracted = await extractPdfForWord(file, {
        language,
        autoOcrScannedPages: autoOcr,
        forceOcrAllPages: forceOcr,
        onProgress: (value, message) => {
          setProgress(Math.max(0, Math.min(94, value)));
          setPhase(message);
        },
      });

      setPhase("Building editable Word document");
      setProgress(95);
      const {
        Document,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        WidthType,
        BorderStyle,
        PageBreak,
        Packer,
        AlignmentType,
      } = await import("docx");

      const children: any[] = [];
      extracted.pages.forEach((page, pageIndex) => {
        if (pageIndex > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
        const blocks = detectTableBlocks(page.lines);
        const normalSizes = page.lines.flatMap((line) => line.chunks.map((chunk) => chunk.fontSize)).filter((size) => size > 0);
        const typicalSize = normalSizes.length ? normalSizes.sort((a, b) => a - b)[Math.floor(normalSizes.length / 2)] : 11;

        for (const block of blocks) {
          if (block.type === "table") {
            const columnCount = Math.max(1, ...block.rows.map((row) => row.length));
            const cellWidth = Math.floor(9360 / columnCount);
            const rows = block.rows.map((row, rowIndex) => new TableRow({
              children: Array.from({ length: columnCount }, (_, columnIndex) => new TableCell({
                width: { size: cellWidth, type: WidthType.DXA },
                margins: { top: 70, bottom: 70, left: 90, right: 90 },
                children: [new Paragraph({ children: [new TextRun({
                  text: row[columnIndex] ?? "",
                  bold: rowIndex === 0,
                  size: 18,
                  font: "Arial",
                })] })],
              })),
            }));
            children.push(new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              columnWidths: Array(columnCount).fill(cellWidth),
              rows,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 3, color: "D8DEEA" },
                bottom: { style: BorderStyle.SINGLE, size: 3, color: "D8DEEA" },
                left: { style: BorderStyle.SINGLE, size: 3, color: "D8DEEA" },
                right: { style: BorderStyle.SINGLE, size: 3, color: "D8DEEA" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E8ECF3" },
                insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "E8ECF3" },
              },
            }));
            children.push(new Paragraph({ children: [], spacing: { after: 90 } }));
            continue;
          }

          const line = block.line;
          const text = paragraphText(line).trim();
          if (!text) continue;
          const sourceSize = line.chunks[0]?.fontSize ?? typicalSize;
          const isHeading = text.length < 110 && sourceSize > typicalSize * 1.28;
          const fontName = line.chunks[0]?.fontName ?? "";
          const isBold = /bold|black|heavy|demi/i.test(fontName);
          const indent = Math.max(0, Math.min(3600, Math.round((line.chunks[0]?.x ?? 0) * 9)));
          children.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({
              text,
              bold: isBold || isHeading,
              italics: /italic|oblique/i.test(fontName),
              size: isHeading ? Math.round(Math.min(30, Math.max(24, sourceSize * 2.25))) : Math.round(Math.min(26, Math.max(17, sourceSize * 2))),
              font: "Arial",
              color: isHeading ? "1E2A4A" : "222B3A",
            })],
            indent: { left: indent },
            spacing: { after: isHeading ? 130 : 55, line: 276 },
            keepNext: isHeading,
          }));
        }
      });

      const document = new Document({
        creator: "Convia",
        title: file.name.replace(/\.pdf$/i, ""),
        subject: "Converted from PDF using selectable text extraction and OCR where required",
        sections: [{
          properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
          children,
        }],
      });
      const blob = await Packer.toBlob(document);
      const baseName = file.name.replace(/\.pdf$/i, "").replace(/[\\/:*?\"<>|]/g, "_");
      const name = `${baseName}-converted.docx`;
      const url = URL.createObjectURL(blob);
      setResult({ url, name, size: blob.size, pages: extracted.totalPages, ocrPages: extracted.scannedPages });
      setProgress(100);
      setPhase("Word document ready");
      setNotice(
        extracted.scannedPages.length
          ? `Converted ${extracted.totalPages} pages. OCR was used on ${extracted.scannedPages.length} scanned/image page(s): ${extracted.scannedPages.join(", ")}.`
          : `Converted ${extracted.totalPages} pages using the PDF text layer. No scanned pages needed OCR.`,
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "PDF to Word conversion failed.";
      setError(message);
      setPhase("Conversion could not be completed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (busy) return;
    setFile(null);
    setResult(null);
    setError("");
    setNotice("");
    setProgress(0);
    setPhase("Ready when you are");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolPageHeader
        title="PDF to Word"
        description="Convert regular and scanned PDFs into editable Word documents. Image-only pages are detected and OCR is applied automatically."
      />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <section className="rounded-3xl border border-border/70 bg-background p-5 shadow-xl shadow-slate-200/40 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Upload your PDF</h2>
                <p className="text-xs text-muted-foreground">Text PDFs and scanned/image PDFs supported</p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }}
            />

            {!file ? (
              <div
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files?.[0]); }}
                className={`flex min-h-[290px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-7 text-center transition ${isDragging ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border bg-muted/20 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"}`}
              >
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm dark:bg-violet-950 dark:text-violet-200">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold">Drop your PDF here</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Upload a searchable PDF or a scanned document. Convia checks each page and runs OCR where text is missing.</p>
                <button type="button" onClick={() => inputRef.current?.click()} className="mt-6 rounded-xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-700/20 transition hover:-translate-y-0.5">
                  Choose PDF file
                </button>
                <p className="mt-4 text-[11px] text-muted-foreground">PDF only · Maximum 60 MB · Up to 80 pages</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600"><FileText className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{file.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatBytes(file.size)} · PDF document</p>
                  </div>
                  <button type="button" onClick={reset} disabled={busy} aria-label="Remove PDF" className="rounded-lg p-2 text-muted-foreground transition hover:bg-background hover:text-red-600 disabled:opacity-40"><X className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 shrink-0" /> Your PDF is processed in this browser. OCR language data may download on first use.
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 rounded-2xl border border-border bg-muted/10 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><ScanText className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-sm font-extrabold">Scanned PDF OCR</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Automatic detection is ON. Pages without a usable text layer are read from their page images.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                <input type="checkbox" checked={autoOcr} onChange={(event) => setAutoOcr(event.target.checked)} disabled={busy} className="mt-0.5 h-4 w-4 accent-violet-600" />
                <span><b className="block text-xs">Automatically OCR scanned pages</b><span className="mt-1 block text-[11px] leading-5 text-muted-foreground">Recommended. Existing selectable text is retained; image-only pages are OCR processed.</span></span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                <input type="checkbox" checked={forceOcr} onChange={(event) => setForceOcr(event.target.checked)} disabled={busy} className="mt-0.5 h-4 w-4 accent-violet-600" />
                <span><b className="block text-xs">Force OCR on every page</b><span className="mt-1 block text-[11px] leading-5 text-muted-foreground">Use when a PDF has a broken or incorrect text layer. This takes longer.</span></span>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-extrabold"><Languages className="h-4 w-4 text-violet-600" /> OCR language</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value as PdfOcrLanguage)} disabled={busy} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60">
                  <option value="eng+hin">English + Hindi (Recommended)</option>
                  <option value="eng">English</option>
                  <option value="hin">Hindi</option>
                </select>
              </label>
            </div>

            {busy && (
              <div className="mt-5 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                <div className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 font-bold"><Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" />{phase}</span><b className="tabular-nums">{progress}%</b></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary via-violet-600 to-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</div>}
            {notice && <div role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span></div>}

            <button type="button" onClick={() => void buildWord()} disabled={!file || busy} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 p-4 text-sm font-extrabold text-white shadow-xl shadow-violet-700/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              {busy ? "Converting PDF…" : "Convert to editable Word"}
            </button>
            {file && !busy && <button type="button" onClick={reset} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold text-muted-foreground transition hover:text-foreground"><RefreshCw className="h-3.5 w-3.5" /> Reset</button>}
          </section>

          <section className="min-h-[460px] rounded-3xl border border-border/70 bg-background p-5 shadow-xl shadow-slate-200/40 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-600">Conversion output</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">Editable Word document</h2>
                <p className="mt-1 text-xs text-muted-foreground">Text is reconstructed as editable paragraphs and detected tables.</p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"><FileText className="h-6 w-6" /></div>
            </div>

            {!result ? (
              <div className="mt-7 flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 px-6 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"><FileText className="h-8 w-8" /></div>
                <h3 className="mt-5 text-base font-extrabold">Your Word file will appear here</h3>
                <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">After conversion, download the .docx file and open it in Microsoft Word or a compatible editor. Review OCR spelling and table alignment.</p>
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"><FileText className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{result.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(result.size)}</p></div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background p-3"><p className="text-[10px] text-muted-foreground">Pages converted</p><p className="mt-1 text-xl font-extrabold tabular-nums">{result.pages}</p></div>
                  <div className="rounded-xl border border-border bg-background p-3"><p className="text-[10px] text-muted-foreground">Pages read with OCR</p><p className="mt-1 text-xl font-extrabold tabular-nums">{result.ocrPages.length}</p></div>
                </div>
                {result.ocrPages.length > 0 && <p className="mt-3 text-[11px] leading-5 text-muted-foreground">OCR pages: {result.ocrPages.join(", ")}</p>}
                <a href={result.url} download={result.name} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-700/20"><Download className="h-4 w-4" /> Download Word (.docx)</a>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-border bg-muted/10 p-4">
              <h3 className="text-xs font-extrabold">What this converter preserves</h3>
              <ul className="mt-3 space-y-2 text-[11px] leading-5 text-muted-foreground">
                <li>• Searchable PDF text is extracted directly, without OCR.</li>
                <li>• Scanned/image pages are rendered and recognized by OCR automatically.</li>
                <li>• English and Hindi OCR are supported.</li>
                <li>• Text position, paragraph order, basic emphasis and likely table columns are reconstructed.</li>
              </ul>
            </div>
            <p className="mt-4 text-[10px] leading-5 text-muted-foreground">Privacy: PDF processing takes place in your browser. Tesseract may download OCR language data from its configured CDN on first use. OCR accuracy depends on scan resolution, rotation, handwriting, fonts and image quality.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
