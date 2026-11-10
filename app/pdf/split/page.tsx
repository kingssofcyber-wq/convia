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
  Scissors,
  UploadCloud,
  X,
  Sparkles,
  Lock
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";

type ParsedSelection = {
  pages: number[];
  error: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// पेज नंबर और रेंज को पार्स करने का फंक्शन (जैसे "1, 3-5")
function parsePageSelection(value: string, totalPages: number): ParsedSelection {
  const input = value.trim();
  if (!input) return { pages: [], error: "Enter at least one page number or page range." };

  const tokens = input.split(",").map((part) => part.trim());
  if (tokens.some((token) => token.length === 0)) {
    return { pages: [], error: "There is an empty item. Use a format like 1, 3-5, 8." };
  }

  const selected: number[] = [];
  const seen = new Set<number>();

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page < 1 || page > totalPages) return { pages: [], error: `Page ${page} is outside this PDF. Enter pages from 1 to ${totalPages}.` };
      if (!seen.has(page)) { selected.push(page); seen.add(page); }
      continue;
    }

    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!rangeMatch) return { pages: [], error: `“${token}” is not valid. Use ranges like 2 or 4-7.` };

    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    if (start < 1 || end > totalPages || start > totalPages || end < 1) return { pages: [], error: `Range ${token} is outside this PDF.` };
    if (start > end) return { pages: [], error: `Range ${token} is backwards.` };

    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) { selected.push(page); seen.add(page); }
    }
  }

  if (selected.length === 0) return { pages: [], error: "No pages were selected." };
  return { pages: selected, error: null };
}

export default function ExtractPdfPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [pageSelection, setPageSelection] = React.useState("");
  const [fileError, setFileError] = React.useState("");
  const [selectionError, setSelectionError] = React.useState("");
  const [isReading, setIsReading] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);

  const MAX_FREE_PAGES = 5;
  const isOverLimit = pageCount ? pageCount > MAX_FREE_PAGES : false;

  const parsed = React.useMemo(
    () => (pageCount ? parsePageSelection(pageSelection, pageCount) : { pages: [], error: null }),
    [pageSelection, pageCount],
  );

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;

    setFileError("");
    setSelectionError("");
    setSuccessMessage("");
    setPageCount(null);
    setPageSelection("");

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setFileError("Please choose a PDF file.");
      return;
    }

    setIsReading(true);
    try {
      const bytes = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const total = pdf.getPageCount();
      setFile(selectedFile);
      setPageCount(total);
    } catch (error) {
      setFile(null);
      setFileError("We couldn't read this PDF. It may be damaged or password-protected.");
    } finally {
      setIsReading(false);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setPageCount(null);
    setPageSelection("");
    setFileError("");
    setSelectionError("");
    setSuccessMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExtract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !pageCount || isOverLimit) return;

    setSelectionError("");
    setSuccessMessage("");

    const selection = parsePageSelection(pageSelection, pageCount);
    if (selection.error) {
      setSelectionError(selection.error);
      return;
    }

    setIsExtracting(true);
    try {
      const sourceBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const outputPdf = await PDFDocument.create();
      const zeroBasedIndices = selection.pages.map((page) => page - 1);
      const copiedPages = await outputPdf.copyPages(sourcePdf, zeroBasedIndices);
      copiedPages.forEach((page) => outputPdf.addPage(page));

      const outputBytes = await outputPdf.save();
      const blob = new Blob([new Uint8Array(outputBytes)], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const originalName = file.name.replace(/\.pdf$/i, "");
      
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${originalName}-extracted.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

      setSuccessMessage(`Done! ${selection.pages.length} pages extracted. Your download should begin automatically.`);
    } catch (error) {
      setSelectionError("The PDF could not be extracted. Try another PDF.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* नया कॉम्पैक्ट हेडर */}
      <ToolHeader 
        title="Split PDF" 
        description="Extract specific pages from your PDF." 
        icon={Scissors} 
      />

      <main className="container max-w-5xl mx-auto px-4 pb-24 mt-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        {!file && (
          <div
            role="button"
            tabIndex={0}
            onClick={openFilePicker}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFilePicker(); } }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mx-auto flex min-h-[350px] max-w-2xl flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all bg-background shadow-xl mt-10 cursor-pointer ${
              isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50"
            }`}
          >
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              {isReading ? <Loader2 className="h-8 w-8 animate-spin" /> : <UploadCloud className="h-8 w-8" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isReading ? "Reading your PDF..." : "Upload a PDF to split"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground mb-6">
              Drag and drop your file here, or click below to browse. Your files stay private.
            </p>
            <button type="button" className="inline-flex h-12 items-center gap-2 rounded-xl gradient-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:scale-105">
              <Scissors className="h-5 w-5" /> Select PDF file
            </button>
          </div>
        )}

        {fileError && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-600 shadow-sm max-w-4xl mx-auto">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="font-medium">{fileError}</span>
          </div>
        )}

        {file && pageCount && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            
            {/* Full Width File Info Strip */}
            <div className="w-full bg-background rounded-2xl shadow-lg border border-border p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="min-w-0 text-left flex-1 md:flex-none">
                  <h2 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                    {file.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div className={`font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${isOverLimit ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"}`}>
                  <FileText className="w-4 h-4" /> {pageCount} Pages
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex h-9 items-center gap-2 rounded-lg text-red-500 bg-red-500/10 px-3 text-sm font-bold transition hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
            </div>

            {/* Limit Exceeded Warning */}
            {isOverLimit ? (
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-primary flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Free Limit Exceeded
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your PDF has {pageCount} pages. Free users can only split up to {MAX_FREE_PAGES} pages.
                  </p>
                </div>
                <Button onClick={() => alert("Redirecting to Pricing Page...")} className="gradient-primary text-white shrink-0 w-full sm:w-auto h-12 px-8">
                  Buy Now to Upgrade
                </Button>
              </div>
            ) : (
              <div className="bg-background rounded-3xl shadow-xl border border-border p-6 md:p-10">
                <form onSubmit={handleExtract}>
                  <div className="mb-8">
                    <label htmlFor="page-selection" className="block text-lg font-bold text-foreground mb-2">
                      Pages to extract
                    </label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter page numbers separated by commas, or use a hyphen for a range (e.g., 1, 3-5, 8).
                    </p>

                    <input
                      id="page-selection"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      value={pageSelection}
                      onChange={(e) => {
                        setPageSelection(e.target.value);
                        setSelectionError("");
                        setSuccessMessage("");
                      }}
                      placeholder="Example: 1, 3-5, 8"
                      className="h-16 w-full rounded-2xl border-2 border-border bg-background px-5 text-xl font-bold outline-none transition placeholder:font-normal placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-center tracking-wider"
                    />
                    
                    <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Example: <strong>1, 3-5, 8</strong> extracts pages 1, 3, 4, 5 and 8. The order you enter is kept in the new PDF.</span>
                    </div>
                  </div>

                  {selectionError || parsed.error ? (
                    <p role="alert" className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-bold text-red-600 animate-in slide-in-from-top-2">
                      {selectionError || parsed.error}
                    </p>
                  ) : pageSelection.trim() && parsed.pages.length > 0 ? (
                    <p className="mb-6 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm font-bold text-green-600 animate-in slide-in-from-top-2">
                      {parsed.pages.length} pages selected: {parsed.pages.join(", ")}
                    </p>
                  ) : null}

                  {successMessage && (
                    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 px-6 py-4 text-sm font-bold text-green-600 shadow-sm animate-in zoom-in-95">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      {successMessage}
                    </div>
                  )}

                  {/* Huge Bottom Button */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      disabled={isExtracting || isReading || !pageSelection.trim()}
                      className="group relative inline-flex h-16 w-full max-w-md items-center justify-center gap-3 rounded-full gradient-primary px-8 text-xl font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isExtracting ? (
                        <><Sparkles className="h-6 w-6 animate-spin" /> Extracting...</>
                      ) : (
                        <><Download className="h-6 w-6 group-hover:animate-bounce" /> Submit & Download</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}