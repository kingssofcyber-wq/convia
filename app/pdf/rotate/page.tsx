"use client";

import * as React from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolHeader } from "@/components/layout/tool-header";
import { CheckCircle2, Download, FileText, Loader2, RotateCcw, RotateCw, UploadCloud, X } from "lucide-react";

type PagePreview = { page: number; src: string; originalRotation: number; width: number; height: number };
type Output = { url: string; name: string; size: number };

function formatSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`; }

export default function RotatePdfPage() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [previews, setPreviews] = React.useState<PagePreview[]>([]);
  const [rotations, setRotations] = React.useState<Record<number, number>>({});
  const [busy, setBusy] = React.useState(false);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<Output | null>(null);

  React.useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result?.url]);

  const clear = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null); setFile(null); setPreviews([]); setRotations({}); setProgress(0); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const loadPdf = async (next?: File) => {
    if (!next) return;
    setError(""); setResult(null); setPreviews([]); setRotations({});
    if (!next.name.toLowerCase().endsWith(".pdf") || next.size > 100 * 1024 * 1024) { setError("Choose a PDF up to 100 MB."); return; }
    setFile(next); setLoadingPreview(true); setProgress(0);
    let loadingTask: any;
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const data = new Uint8Array(await next.arrayBuffer());
      loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      if (pdf.numPages > 250) throw new Error("This preview supports up to 250 pages at once. Split the PDF into smaller files and try again.");
      const nextPreviews: PagePreview[] = [];
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const page = await pdf.getPage(pageNo);
        const natural = page.getViewport({ scale: 1 });
        const scale = Math.min(0.42, 220 / Math.max(natural.width, natural.height));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Could not create the page preview canvas.");
        await page.render({ canvasContext: context, viewport }).promise;
        nextPreviews.push({ page: pageNo, src: canvas.toDataURL("image/jpeg", 0.62), originalRotation: Number(page.rotate || 0), width: natural.width, height: natural.height });
        canvas.width = 1; canvas.height = 1; page.cleanup();
        setProgress(Math.round((pageNo / pdf.numPages) * 100));
      }
      setPreviews(nextPreviews);
    } catch (cause) {
      setFile(null); setPreviews([]);
      setError(cause instanceof Error ? cause.message : "Could not read this PDF. It may be encrypted or damaged.");
    } finally {
      try { if (loadingTask && typeof loadingTask.destroy === "function") await loadingTask.destroy(); } catch (cleanupError) { console.warn("PDF preview cleanup warning", cleanupError); }
      setLoadingPreview(false);
    }
  };

  const rotatePage = (pageNo: number, delta: number) => setRotations((current) => ({ ...current, [pageNo]: (((current[pageNo] ?? 0) + delta) % 360 + 360) % 360 }));
  const rotateAll = (delta: number) => setRotations((current) => {
    const next = { ...current };
    for (const preview of previews) next[preview.page] = (((next[preview.page] ?? 0) + delta) % 360 + 360) % 360;
    return next;
  });
  const hasChanges = Object.values(rotations).some((value) => value % 360 !== 0);

  const exportPdf = async () => {
    if (!file || busy || !hasChanges) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = pdf.getPages();
      for (let index = 0; index < pages.length; index += 1) {
        const delta = rotations[index + 1] ?? 0;
        if (!delta) continue;
        const current = pages[index].getRotation().angle;
        pages[index].setRotation(degrees(((current + delta) % 360 + 360) % 360));
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      if (blob.size < 8) throw new Error("The rotated PDF output is empty.");
      const url = URL.createObjectURL(blob);
      setResult({ url, name: `${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`, size: blob.size });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not rotate this PDF."); }
    finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-muted/20">
    <ToolHeader title="Rotate PDF" description="Preview every page and rotate only the pages you choose, without rasterizing the document." icon={RotateCw}/>
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-7">
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void loadPdf(event.target.files?.[0])}/>
        {!file ? <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-[230px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-6 text-center transition hover:border-primary/50 hover:bg-primary/5"><UploadCloud size={38} className="mb-4 text-primary"/><b className="text-2xl">Upload a PDF to rotate</b><span className="mt-2 text-sm text-muted-foreground">All pages will appear below with individual rotate controls · Up to 100 MB</span><span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose PDF</span></button> : <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4"><FileText className="text-primary" size={24}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{formatSize(file.size)} · {previews.length} pages</p></div><button type="button" onClick={clear} aria-label="Remove PDF" className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><X size={18}/></button></div>}
        {loadingPreview && <div className="mt-5 rounded-xl bg-primary/5 p-4"><div className="flex items-center justify-between text-sm font-bold text-primary"><span><Loader2 size={16} className="mr-2 inline animate-spin"/>Preparing page previews…</span><span>{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-600" style={{ width: `${progress}%` }}/></div></div>}
        {previews.length > 0 && <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/10 p-4"><div><h2 className="font-extrabold">Page rotation workspace</h2><p className="text-xs text-muted-foreground">Use the rotate icons on the exact page you want to turn.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => rotateAll(-90)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"><RotateCcw size={15}/>All left</button><button type="button" onClick={() => rotateAll(90)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"><RotateCw size={15}/>All right</button><button type="button" onClick={() => setRotations({})} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold">Reset angles</button></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{previews.map((preview) => {
            const delta = rotations[preview.page] ?? 0;
            return <article key={preview.page} className={`overflow-hidden rounded-2xl border bg-background p-3 shadow-sm ${delta ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}><div className="flex items-center justify-between pb-3"><span className="text-sm font-extrabold">Page {preview.page}</span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{((preview.originalRotation + delta) % 360 + 360) % 360}°</span></div><div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-2 dark:bg-slate-900"><img src={preview.src} alt={`PDF page ${preview.page}`} className="max-h-full max-w-full object-contain shadow" style={{ transform: `rotate(${delta}deg)`, transition: "transform 180ms ease" }}/></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => rotatePage(preview.page, -90)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 text-xs font-bold hover:border-primary/40"><RotateCcw size={15}/> Rotate left</button><button type="button" onClick={() => rotatePage(preview.page, 90)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 text-xs font-bold hover:border-primary/40"><RotateCw size={15}/> Rotate right</button></div></article>;
          })}</div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold">{Object.values(rotations).filter(Boolean).length} page(s) changed</p><p className="text-xs text-muted-foreground">Text, vector elements and image quality are preserved.</p></div><button type="button" disabled={!hasChanges || busy} onClick={() => void exportPdf()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><Loader2 className="animate-spin" size={18}/>Saving PDF…</> : <><Download size={18}/>Apply rotation & download</>}</button></div>
        </>}
        {result && <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600"/><div className="min-w-0 flex-1"><b className="text-sm">Rotated PDF ready</b><p className="truncate text-xs text-muted-foreground">{result.name} · {formatSize(result.size)}</p></div></div><a href={result.url} download={result.name} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 font-bold text-white"><Download size={17}/>Download rotated PDF</a></div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}
      </section>
    </main>
  </div>;
}
