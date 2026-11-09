"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, Droplet, Loader2, RotateCcw } from "lucide-react";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { addWatermark } from "@/lib/pdf/watermark";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WatermarkResult = { url: string; name: string; size: number };

export default function WatermarkPdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [pdfPages, setPdfPages] = React.useState(0);
  const [text, setText] = React.useState("CONFIDENTIAL");
  const [opacity, setOpacity] = React.useState(0.3);
  const [fontSize, setFontSize] = React.useState(60);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<WatermarkResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function readPageCount() {
      setError(null);
      setPdfPages(0);
      if (!files.length) return;
      try {
        const buffer = await files[0].arrayBuffer();
        const pdf = await PDFDocument.load(buffer);
        if (!cancelled) setPdfPages(pdf.getPageCount());
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not read this PDF. It may be encrypted or damaged.");
        }
      }
    }
    void readPageCount();
    return () => { cancelled = true; };
  }, [files]);

  React.useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result?.url]);

  const clearResult = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const handleWatermark = async () => {
    if (!files.length || !text.trim() || isProcessing || !pdfPages) return;
    setIsProcessing(true);
    setError(null);
    clearResult();
    try {
      const watermarked = await addWatermark(files[0], text.trim(), opacity, fontSize);
      const bytes = new Uint8Array(watermarked.bytes);
      if (bytes.length < 8 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
        throw new Error("The watermark engine did not return a valid PDF.");
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult({ url, name: watermarked.fileName || files[0].name.replace(/\.pdf$/i, "") + "-watermarked.pdf", size: blob.size });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add the watermark. Please try another PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    clearResult();
    setFiles([]);
    setPdfPages(0);
    setError(null);
    setText("CONFIDENTIAL");
    setOpacity(0.3);
    setFontSize(60);
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <main className="container mx-auto min-h-[80vh] max-w-3xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Link>
      <header className="mb-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">PDF tool</p>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Add Watermark</h1>
        <p className="text-muted-foreground">Stamp your PDF with custom text. Your original file remains unchanged.</p>
      </header>

      <section className="rounded-3xl border border-border bg-muted/20 p-5 shadow-sm sm:p-8">
        {!result ? (
          <>
            <FileDropzone files={files} onFilesChange={(nextFiles) => { setFiles(nextFiles); setError(null); }} maxFiles={1} />
            {files.length > 0 && (
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">PDF loaded successfully</span>
                  <span className="text-muted-foreground">{pdfPages > 0 ? `${pdfPages} pages` : "Reading page count…"}</span>
                </div>
                <div>
                  <label htmlFor="watermark-text" className="mb-2 block text-sm font-semibold">Watermark text</label>
                  <Input id="watermark-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={60} placeholder="e.g. CONFIDENTIAL" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Opacity: {Math.round(opacity * 100)}%
                    <input aria-label="Watermark opacity" className="mt-3 w-full accent-primary" type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
                  </label>
                  <label className="block text-sm font-semibold">Font size: {fontSize}px
                    <input aria-label="Watermark font size" className="mt-3 w-full accent-primary" type="range" min="20" max="100" step="5" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">No artificial five-page limit is applied. Processing time depends on file size and page count.</p>
              </div>
            )}
            {error && <div role="alert" className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
            <div className="mt-7 flex justify-center">
              <Button size="lg" className="w-full max-w-sm gradient-primary text-white" disabled={!files.length || !pdfPages || !text.trim() || isProcessing} onClick={() => void handleWatermark()}>
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing PDF…</> : <><Droplet className="mr-2 h-5 w-5" /> Add Watermark</>}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
            <h2 className="text-2xl font-bold">Watermark added</h2>
            <p className="mt-2 text-sm text-muted-foreground">{result.name} · {formatSize(result.size)}</p>
            <div className="mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <a href={result.url} download={result.name} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-3 font-semibold text-white"><Download size={18} /> Download PDF</a>
              <Button type="button" variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Another PDF</Button>
            </div>
          </div>
        )}
      </section>
      <p className="mt-5 text-center text-xs text-muted-foreground">Keep a copy of the original PDF. Re-saving a digitally signed PDF may invalidate its signature.</p>
    </main>
  );
}
