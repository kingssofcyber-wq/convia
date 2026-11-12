"use client";

import * as React from "react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { extractPositionedPages } from "@/lib/pdf/positioned-extract";
import { CheckCircle2, Download, FileText, Loader2, Presentation, UploadCloud } from "lucide-react";

export function PdfToPptWorkspace() {
  const input = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<"editable" | "visual">("editable");
  const [useOcr, setUseOcr] = React.useState(false);
  const [ocrLanguage, setOcrLanguage] = React.useState<"eng" | "hin" | "eng+hin">("eng");
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [result, setResult] = React.useState<{ url: string; name: string; size: number } | null>(null);
  React.useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);
  const convert = async () => {
    if (!file || busy) return;
    setBusy(true); setError(""); setNotice(""); setProgress(5); setPhase("Opening PDF"); setResult(null);
    try {
      const positioned = mode === "editable" && useOcr ? await extractPositionedPages(file, { useOcr: true, ocrLanguage, onProgress: (value, message) => { setProgress(Math.min(65, value)); setPhase(message); } }) : null;
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await task.promise;
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      const slideW = 13.333, slideH = 7.5;
      pptx.layout = "LAYOUT_WIDE"; pptx.author = "Convia"; pptx.subject = "Editable reconstruction from PDF";
      try {
        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
          setPhase(`Reconstructing slide ${pageNo} of ${pdf.numPages}`); setProgress(Math.round((pageNo - 1) / pdf.numPages * 88) + 5);
          const page = await pdf.getPage(pageNo);
          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.min(slideW / viewport.width, slideH / viewport.height);
          const offsetX = (slideW - viewport.width * scale) / 2;
          const offsetY = (slideH - viewport.height * scale) / 2;
          const slide = pptx.addSlide(); slide.background = { color: "FFFFFF" };
          if (mode === "visual") {
            const renderView = page.getViewport({ scale: 1.65 });
            const canvas = document.createElement("canvas"); canvas.width = Math.ceil(renderView.width); canvas.height = Math.ceil(renderView.height);
            const context = canvas.getContext("2d", { alpha: false }); if (!context) throw new Error("Cannot render PDF page image.");
            await page.render({ canvas, canvasContext: context, viewport: renderView }).promise;
            const renderScale = Math.min(slideW / viewport.width, slideH / viewport.height);
            const imageW = viewport.width * renderScale; const imageH = viewport.height * renderScale;
            slide.addImage({ data: canvas.toDataURL("image/jpeg", 0.94), x: (slideW - imageW) / 2, y: (slideH - imageH) / 2, w: imageW, h: imageH });
            canvas.width = 1; canvas.height = 1;
          } else {
            if (positioned) {
              const positionedPage = positioned[pageNo - 1];
              const chunks = positionedPage?.lines.flatMap((line) => line.chunks) ?? [];
              if (!chunks.length) slide.addText("No readable text found on this page. Choose Visual page images for the original appearance.", { x: 0.7, y: 3.4, w: 12, h: 0.5, fontSize: 17, color: "64748B", align: "center" });
              for (const chunk of chunks) {
                const pdfFontSize = Math.max(5, Math.min(36, chunk.fontSize || 10));
                const x = offsetX + chunk.x * scale;
                const y = offsetY + (viewport.height - chunk.y - chunk.height) * scale;
                const w = Math.max(0.12, Math.min(slideW - x, chunk.width * scale + 0.06));
                const h = Math.max(0.12, chunk.height * scale * 1.4);
                slide.addText(chunk.text, { x: Math.max(0, x), y: Math.max(0, y), w, h, fontFace: "Arial", fontSize: Math.max(5, pdfFontSize * scale * 72), color: "111827", margin: 0, breakLine: false, valign: "mid", bold: /bold|black|heavy/i.test(chunk.fontName), italic: /italic|oblique/i.test(chunk.fontName), fit: "shrink" as any });
              }
            } else {
              const content = await page.getTextContent();
              const items = (content.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>).filter((item) => item.str?.trim());
              if (!items.length) slide.addText("No selectable text on this page. Enable OCR above or choose Visual page images.", { x: 0.7, y: 3.4, w: 12, h: 0.5, fontSize: 17, color: "64748B", align: "center" });
              for (const item of items) {
                const transform = item.transform ?? [10, 0, 0, 10, 0, 0];
                const pdfFontSize = Math.max(5, Math.min(48, Math.hypot(transform[0], transform[1]) || item.height || 10));
                const x = offsetX + transform[4] * scale;
                const y = offsetY + (viewport.height - transform[5]) * scale - pdfFontSize * scale;
                const w = Math.max(0.12, Math.min(slideW - x, (item.width ?? item.str!.length * pdfFontSize * 0.48) * scale + 0.08));
                const h = Math.max(0.12, pdfFontSize * scale * 1.45);
                slide.addText(item.str ?? "", { x: Math.max(0, x), y: Math.max(0, y), w, h, fontFace: "Arial", fontSize: Math.max(5, pdfFontSize * scale * 72), color: "111827", margin: 0, breakLine: false, valign: "mid", bold: /bold|black|heavy/i.test(item.fontName ?? ""), italic: /italic|oblique/i.test(item.fontName ?? ""), fit: "shrink" as any });
              }
            }
          }
          page.cleanup();
        }
      } finally { await task.destroy(); }
      setPhase("Writing PowerPoint file"); setProgress(96);
      const output = await pptx.write({ outputType: "blob" } as any);
      const blob = output instanceof Blob ? output : new Blob([output as BlobPart], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const name = `${file.name.replace(/\.pdf$/i, "")}-${mode === "editable" ? "editable-text" : "visual"}.pptx`;
      const url = URL.createObjectURL(blob); setResult({ url, name, size: blob.size }); setProgress(100);
      setNotice(mode === "editable" ? "Created editable PowerPoint text boxes positioned from PDF text. Original photos, diagrams and vector artwork are not reconstructed in this mode." : "Created high-fidelity page-image slides. The slide background is an image, not individually editable objects.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create PowerPoint."); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-muted/20"><ToolPageHeader title="PDF to PowerPoint" description="Create editable text slides or full-page visual slides from your PDF."/><main className="mx-auto max-w-5xl px-4 pb-24 pt-8"><section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8"><input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event)=>{const next=event.target.files?.[0];if(next){if(next.size>60*1024*1024){setError("PDF must be 60 MB or less.");return;}setFile(next);setError("");setResult(null);}}}/>{!file?<button type="button" onClick={()=>input.current?.click()} className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-6 text-center hover:border-primary/50"><UploadCloud size={34} className="mb-4 text-primary"/><span className="text-2xl font-extrabold">Upload PDF</span><span className="mt-2 text-sm text-muted-foreground">Create an editable or visual PowerPoint.</span><span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose PDF</span></button>:<div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4"><FileText className="text-primary" size={24}/><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size/1024/1024).toFixed(2)} MB</p></div><button type="button" onClick={()=>{setFile(null);setResult(null);}} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold">Change</button></div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>setMode("editable")} className={`rounded-2xl border p-4 text-left ${mode==="editable"?"border-primary bg-primary/5":"border-border"}`}><b className="flex items-center gap-2"><Presentation size={18}/> Editable text</b><p className="mt-2 text-xs leading-5 text-muted-foreground">Rebuilds selectable text as PowerPoint text boxes with approximate positions.</p></button><button type="button" onClick={()=>setMode("visual")} className={`rounded-2xl border p-4 text-left ${mode==="visual"?"border-primary bg-primary/5":"border-border"}`}><b className="flex items-center gap-2"><FileText size={18}/> Original page appearance</b><p className="mt-2 text-xs leading-5 text-muted-foreground">Each PDF page is a crisp slide image; page content isn't editable individually.</p></button></div>
      {mode === "editable" && <div className="mt-5 rounded-2xl border border-border bg-muted/10 p-4"><label className="flex items-start gap-3"><input type="checkbox" checked={useOcr} onChange={(event)=>setUseOcr(event.target.checked)} className="mt-1 h-4 w-4 accent-primary"/><span><b className="text-sm">OCR scanned pages for editable text</b><span className="mt-1 block text-xs text-muted-foreground">OCR text is rebuilt as text boxes; original artwork is not reconstructed in editable mode.</span></span></label>{useOcr&&<label className="mt-4 block max-w-xs text-xs font-bold">OCR language<select value={ocrLanguage} onChange={(event)=>setOcrLanguage(event.target.value as typeof ocrLanguage)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="eng">English</option><option value="hin">Hindi</option><option value="eng+hin">English + Hindi</option></select></label>}</div>}
      {busy&&<div className="mt-6 rounded-xl bg-primary/5 p-4"><div className="flex justify-between text-sm"><span className="font-bold"><Loader2 size={16} className="mr-2 inline animate-spin"/>{phase}</span><b>{progress}%</b></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-primary to-violet-600" style={{width:`${progress}%`}}/></div></div>}
      {error&&<div role="alert" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}{notice&&<div role="status" className="mt-5 flex gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700"><CheckCircle2 size={18}/>{notice}</div>}
      {result&&<div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><b>{result.name}</b><p className="mt-1 text-xs text-muted-foreground">{(result.size/1024).toFixed(1)} KB</p><a href={result.url} download={result.name} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 p-3.5 font-extrabold text-white"><Download size={17}/>Download PPTX</a></div>}
      <button type="button" onClick={()=>void convert()} disabled={!file||busy} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 p-4 font-extrabold text-white disabled:opacity-50"><Presentation size={18}/>{busy?"Converting…":"Create PowerPoint"}</button></section></main></div>;
}
