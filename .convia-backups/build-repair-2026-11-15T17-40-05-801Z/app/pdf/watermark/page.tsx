"use client";

import * as React from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { CheckCircle2, Download, Droplet, FileImage, FileText, Image as ImageIcon, Loader2, RefreshCw, Type, UploadCloud, X } from "lucide-react";

type Mode = "text" | "image";
type Position = "diagonal" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tile";
type Output = { url: string; name: string; size: number };

function parsePages(value: string, total: number): number[] {
  const raw = value.trim().toLowerCase();
  if (!raw || raw === "all") return Array.from({ length: total }, (_, i) => i);
  const result = new Set<number>();
  for (const tokenRaw of raw.split(",")) {
    const token = tokenRaw.trim();
    if (!token) throw new Error("Remove the empty page selection item.");
    if (token === "odd" || token === "even") {
      for (let i = token === "odd" ? 0 : 1; i < total; i += 2) result.add(i);
      continue;
    }
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]); const end = Number(range[2]);
      if (start < 1 || end > total || start > end) throw new Error(`Invalid page range: ${token}.`);
      for (let i = start; i <= end; i += 1) result.add(i - 1);
      continue;
    }
    if (!/^\d+$/.test(token)) throw new Error(`Invalid page selection: ${token}.`);
    const page = Number(token);
    if (page < 1 || page > total) throw new Error(`Page ${page} is outside this PDF.`);
    result.add(page - 1);
  }
  if (!result.size) throw new Error("No pages were selected.");
  return [...result].sort((a, b) => a - b);
}

function hexRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function drawAtPosition(
  page: ReturnType<PDFDocument["getPages"]>[number],
  boxWidth: number,
  boxHeight: number,
  position: Position,
  rotation: number,
  draw: (x: number, y: number) => void,
) {
  const { width, height } = page.getSize();
  const margin = Math.max(24, Math.min(width, height) * 0.045);
  if (position === "tile") {
    const stepX = Math.max(boxWidth * 1.8, width / 3.2);
    const stepY = Math.max(boxHeight * 2.2, height / 4.5);
    for (let y = margin; y < height - margin; y += stepY) {
      for (let x = margin; x < width - margin; x += stepX) draw(x, y);
    }
    return;
  }
  let x = (width - boxWidth) / 2;
  let y = (height - boxHeight) / 2;
  if (position === "top-left") { x = margin; y = height - boxHeight - margin; }
  if (position === "top-right") { x = width - boxWidth - margin; y = height - boxHeight - margin; }
  if (position === "bottom-left") { x = margin; y = margin; }
  if (position === "bottom-right") { x = width - boxWidth - margin; y = margin; }
  if (position === "diagonal") { x = (width - boxWidth) / 2; y = (height - boxHeight) / 2; }
  draw(x, y);
  void rotation;
}

export default function WatermarkPdfPage() {
  const pdfInput = React.useRef<HTMLInputElement>(null);
  const imageInput = React.useRef<HTMLInputElement>(null);
  const fontInput = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [mode, setMode] = React.useState<Mode>("text");
  const [text, setText] = React.useState("CONFIDENTIAL");
  const [color, setColor] = React.useState("#64748B");
  const [fontSize, setFontSize] = React.useState(48);
  const [opacity, setOpacity] = React.useState(0.28);
  const [rotation, setRotation] = React.useState(-35);
  const [position, setPosition] = React.useState<Position>("diagonal");
  const [pageSelection, setPageSelection] = React.useState("all");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState("");
  const [imageScale, setImageScale] = React.useState(0.28);
  const [fontFile, setFontFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<Output | null>(null);

  React.useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);
  React.useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result?.url]);

  const selectPdf = async (next?: File) => {
    if (!next) return;
    setError(""); setResult(null); setFile(null); setPageCount(0);
    if (!next.name.toLowerCase().endsWith(".pdf") || next.size > 80 * 1024 * 1024) {
      setError("Choose a PDF file up to 80 MB.");
      return;
    }
    try {
      const doc = await PDFDocument.load(await next.arrayBuffer());
      setFile(next); setPageCount(doc.getPageCount()); setPageSelection("all");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the PDF. It may be damaged or password-protected.");
    }
  };

  const selectImage = (next?: File) => {
    if (!next) return;
    setError("");
    const type = next.type.toLowerCase();
    const isPng = type === "image/png" || next.name.toLowerCase().endsWith(".png");
    const isJpg = type === "image/jpeg" || /\.(jpe?g)$/i.test(next.name);
    if (!isPng && !isJpg) { setError("Watermark image must be PNG or JPG/JPEG."); return; }
    if (next.size > 12 * 1024 * 1024) { setError("Watermark image must be 12 MB or smaller."); return; }
    setImageFile(next);
    setImagePreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(next); });
  };

  const reset = () => {
    setFile(null); setPageCount(0); setImageFile(null); setFontFile(null); setError(""); setResult(null);
    setImagePreview((old) => { if (old) URL.revokeObjectURL(old); return ""; });
    if (pdfInput.current) pdfInput.current.value = "";
    if (imageInput.current) imageInput.current.value = "";
    if (fontInput.current) fontInput.current.value = "";
  };

  const addWatermark = async () => {
    if (!file || busy || !pageCount) return;
    if (mode === "text" && !text.trim()) { setError("Enter the watermark text."); return; }
    if (mode === "image" && !imageFile) { setError("Upload a PNG or JPG logo/image first."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const indexes = parsePages(pageSelection, pdf.getPageCount());
      let embeddedImage: Awaited<ReturnType<typeof pdf.embedPng>> | Awaited<ReturnType<typeof pdf.embedJpg>> | null = null;
      if (mode === "image" && imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        embeddedImage = imageFile.type === "image/png" || imageFile.name.toLowerCase().endsWith(".png")
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);
      }
      let embeddedFont: Awaited<ReturnType<typeof pdf.embedFont>> | undefined;
      if (mode === "text") {
        if (fontFile) {
          const fontkitModule = await import("@pdf-lib/fontkit");
          pdf.registerFontkit((fontkitModule as any).default ?? fontkitModule);
          embeddedFont = await pdf.embedFont(new Uint8Array(await fontFile.arrayBuffer()), { subset: true });
        } else {
          if (/[^\u0000-\u00ff]/.test(text)) throw new Error("For Hindi or other Unicode watermark text, upload a matching .TTF or .OTF font.");
          embeddedFont = await pdf.embedFont(StandardFonts.HelveticaBold);
        }
      }
      const pages = pdf.getPages();
      for (const index of indexes) {
        const page = pages[index];
        if (mode === "image" && embeddedImage) {
          const { width, height } = page.getSize();
          const maxW = width * imageScale;
          const maxH = height * imageScale;
          const scale = Math.min(maxW / embeddedImage.width, maxH / embeddedImage.height);
          const drawW = embeddedImage.width * scale;
          const drawH = embeddedImage.height * scale;
          drawAtPosition(page, drawW, drawH, position, rotation, (x, y) => page.drawImage(embeddedImage!, {
            x, y, width: drawW, height: drawH, opacity, rotate: degrees(rotation),
          }));
        } else if (embeddedFont) {
          const measured = embeddedFont.widthOfTextAtSize(text, fontSize);
          const boxH = embeddedFont.heightAtSize(fontSize);
          drawAtPosition(page, measured, boxH, position, rotation, (x, y) => page.drawText(text, {
            x, y, size: fontSize, font: embeddedFont, color: hexRgb(color), opacity, rotate: degrees(rotation),
          }));
        }
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      if (blob.size < 8) throw new Error("The generated PDF is empty.");
      const url = URL.createObjectURL(blob);
      setResult({ url, name: `${file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`, size: blob.size });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply the watermark. Try another PDF or image.");
    } finally { setBusy(false); }
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  return <div className="min-h-screen bg-muted/20">
    <ToolPageHeader title="Add Watermark" description="Stamp every page or selected pages with custom text or your logo."/>
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
        <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-7">
          <input ref={pdfInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void selectPdf(e.target.files?.[0])}/>
          {!file ? <button type="button" onClick={() => pdfInput.current?.click()} className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 p-6 text-center transition hover:border-primary/50 hover:bg-primary/5"><UploadCloud size={36} className="mb-4 text-primary"/><b className="text-xl">Upload PDF</b><span className="mt-2 text-sm text-muted-foreground">Select or drag in a PDF up to 80 MB</span><span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 text-sm font-extrabold text-white">Choose PDF</span></button> : <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><FileText className="shrink-0 text-emerald-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{formatSize(file.size)} · {pageCount} pages</p></div><button type="button" onClick={reset} className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600" aria-label="Remove PDF"><X size={17}/></button></div>}

          {file && <div className="mt-6 space-y-5">
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setMode("text")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "text" ? "bg-primary text-white" : "bg-muted text-foreground"}`}><Type size={16}/>Text watermark</button><button type="button" onClick={() => setMode("image")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "image" ? "bg-primary text-white" : "bg-muted text-foreground"}`}><ImageIcon size={16}/>Image / logo</button></div>
            {mode === "text" ? <div className="space-y-4">
              <label className="block text-sm font-bold">Watermark text<input value={text ?? ""} onChange={(e) => setText(e.target.value)} maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4" placeholder="CONFIDENTIAL"/></label>
              <label className="block text-sm font-bold">Text color<input type="color" value={color || "#64748B"} onChange={(e) => setColor(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background p-1"/></label>
              <label className="block text-xs font-bold">Optional Unicode font (.ttf/.otf)<input ref={fontInput} type="file" accept=".ttf,.otf,font/ttf,font/otf" onChange={(e) => setFontFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-xs"/>{fontFile && <span className="mt-1 block text-emerald-600">{fontFile.name}</span>}</label>
            </div> : <div className="space-y-4 rounded-2xl border border-border bg-muted/10 p-4">
              <input ref={imageInput} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(e) => selectImage(e.target.files?.[0])} className="block w-full text-xs"/>
              {imagePreview ? <div className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:20px_20px] p-4"><img src={imagePreview} alt="Watermark logo preview" className="max-h-36 max-w-full object-contain"/></div> : <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground"><FileImage size={28} className="mb-2 text-primary"/>Your watermark image preview appears here</div>}
              {imageFile && <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold">{imageFile.name}</span><button type="button" onClick={() => { setImageFile(null); setImagePreview((old) => { if (old) URL.revokeObjectURL(old); return ""; }); if (imageInput.current) imageInput.current.value = ""; }} className="text-red-600">Remove image</button></div>}
              <label className="block text-sm font-bold">Image size: {Math.round(imageScale * 100)}%<input type="range" min="0.1" max="0.7" step="0.02" value={imageScale} onChange={(e) => setImageScale(Number(e.target.value))} className="mt-2 w-full accent-primary"/></label>
            </div>}
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Opacity: {Math.round(opacity * 100)}%<input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="mt-2 w-full accent-primary"/></label><label className="block text-sm font-bold">Rotation: {rotation}°<input type="range" min="-90" max="90" step="5" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="mt-2 w-full accent-primary"/></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Position<select value={position ?? "diagonal"} onChange={(e) => setPosition(e.target.value as Position)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3"><option value="diagonal">Center diagonal</option><option value="center">Center</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option><option value="tile">Repeat / tile</option></select></label><label className="block text-sm font-bold">Pages<input value={pageSelection ?? "all"} onChange={(e) => setPageSelection(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4" placeholder="all or 1, 3-5, odd, even"/></label></div>
          </div>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">{error}</div>}
          {result && <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600"/><div className="min-w-0 flex-1"><b className="text-sm">Watermark added successfully</b><p className="truncate text-xs text-muted-foreground">{result.name} · {formatSize(result.size)}</p></div></div><a href={result.url} download={result.name} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 font-bold text-white"><Download size={17}/>Download watermarked PDF</a></div>}
          <Button type="button" onClick={() => void addWatermark()} disabled={!file || busy || (mode === "text" ? !text.trim() : !imageFile)} className="mt-6 h-14 w-full gradient-primary text-lg font-extrabold text-white">{busy ? <><Loader2 className="mr-2 animate-spin"/>Applying watermark…</> : <><Droplet className="mr-2"/>Add Watermark</>}</Button>
        </section>
        <aside className="space-y-4"><div className="rounded-2xl border border-border bg-background p-5"><h3 className="font-extrabold">Watermark settings</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Apply a text stamp or transparent logo to every page or only the pages you select. Your original PDF is never overwritten.</p></div><div className="rounded-2xl border border-border bg-background p-5"><h3 className="font-extrabold">Supported image formats</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">PNG with transparency and JPG/JPEG are supported. For Hindi or other Unicode text, attach a matching TTF/OTF font.</p></div><div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-5"><h3 className="font-extrabold">Quality & privacy</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">PDF pages remain vector-based. Watermark images are embedded at their source resolution and drawn without converting the whole PDF into images.</p></div></aside>
      </div>
    </main>
  </div>;
}
