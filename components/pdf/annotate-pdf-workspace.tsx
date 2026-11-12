"use client";

import * as React from "react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { PDFDocument, rgb } from "pdf-lib";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Eraser, FileText, Highlighter, ImagePlus, Loader2, MessageSquare, MousePointer2, Pencil, RotateCcw, Shapes, Type, Underline, X } from "lucide-react";

type MarkType = "highlight" | "underline" | "strike" | "pen" | "line" | "arrow" | "rect" | "ellipse" | "text" | "note" | "image";
type Point = { x: number; y: number };
type Mark = { id: string; page: number; type: MarkType; x: number; y: number; x2?: number; y2?: number; points?: Point[]; text?: string; color: string; width: number; viewWidth: number; viewHeight: number; imageData?: string; imageMime?: "image/png" | "image/jpeg" };

const TOOLBAR: Array<{ type: MarkType; label: string; icon: React.ElementType }> = [
  { type: "highlight", label: "Highlight", icon: Highlighter },
  { type: "underline", label: "Underline", icon: Underline },
  { type: "strike", label: "Strike", icon: Type },
  { type: "pen", label: "Freehand", icon: Pencil },
  { type: "line", label: "Line", icon: Pencil },
  { type: "arrow", label: "Arrow", icon: Pencil },
  { type: "rect", label: "Rectangle", icon: Shapes },
  { type: "ellipse", label: "Circle / Ellipse", icon: Shapes },
  { type: "text", label: "Text", icon: Type },
  { type: "note", label: "Comment", icon: MessageSquare },
];

function hexRgb(hex: string) {
  const value = hex.replace("#", "");
  return rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255);
}
function id() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2500); }

export function AnnotatePdfWorkspace() {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const imageInput = React.useRef<HTMLInputElement>(null);
  const pdfRef = React.useRef<any>(null);
  const renderTask = React.useRef<any>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [viewSize, setViewSize] = React.useState({ width: 595, height: 842 });
  const [baseCanvas, setBaseCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const [tool, setTool] = React.useState<MarkType>("highlight");
  const [color, setColor] = React.useState("#ffdf35");
  const [lineWidth, setLineWidth] = React.useState(3);
  const [noteText, setNoteText] = React.useState("Review this section");
  const [marks, setMarks] = React.useState<Mark[]>([]);
  const [draft, setDraft] = React.useState<Mark | null>(null);
  const [textPlacement, setTextPlacement] = React.useState<Point | null>(null);
  const [textValue, setTextValue] = React.useState("");
  const [imageData, setImageData] = React.useState<{ data: string; mime: "image/png" | "image/jpeg" } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const currentMarks = React.useMemo(() => marks.filter((mark) => mark.page === pageNumber), [marks, pageNumber]);

  const loadFile = async (next: File) => {
    setError(""); setSuccess(""); setLoading(true); setMarks([]); setPageNumber(1); setFile(null);
    try {
      if (!next.name.toLowerCase().endsWith(".pdf")) throw new Error("Choose a PDF file.");
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) });
      const pdf = await task.promise;
      pdfRef.current = pdf;
      setPageCount(pdf.numPages);
      setFile(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open this PDF. It may be damaged or password protected.");
    } finally { setLoading(false); }
  };

  React.useEffect(() => {
    let active = true;
    const render = async () => {
      if (!pdfRef.current || !file) return;
      try {
        if (renderTask.current) { try { renderTask.current.cancel(); } catch {} }
        const page = await pdfRef.current.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.3 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Your browser cannot render this page.");
        renderTask.current = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.current.promise;
        if (!active) return;
        setViewSize({ width: viewport.width, height: viewport.height });
        setBaseCanvas(canvas);
        page.cleanup();
      } catch (cause) {
        if (active && !(cause instanceof Error && cause.name === "RenderingCancelledException")) setError("Could not render this page preview.");
      }
    };
    void render();
    return () => { active = false; if (renderTask.current) { try { renderTask.current.cancel(); } catch {} } };
  }, [file, pageNumber]);

  const coords = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(viewSize.width, (event.clientX - rect.left) * viewSize.width / rect.width)), y: Math.max(0, Math.min(viewSize.height, (event.clientY - rect.top) * viewSize.height / rect.height)) };
  };

  const startMark = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!file || tool === "text" || tool === "note" || tool === "image") {
      const point = coords(event);
      if (tool === "text" || tool === "note") { setTextPlacement(point); setTextValue(tool === "note" ? noteText : ""); }
      if (tool === "image" && imageData) setMarks((current) => [...current, { id: id(), page: pageNumber, type: "image", x: point.x, y: point.y, x2: point.x + 170, y2: point.y + 110, color, width: lineWidth, viewWidth: viewSize.width, viewHeight: viewSize.height, imageData: imageData.data, imageMime: imageData.mime }]);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = coords(event);
    const next: Mark = { id: id(), page: pageNumber, type: tool, x: point.x, y: point.y, x2: point.x, y2: point.y, points: tool === "pen" ? [point] : undefined, color, width: lineWidth, viewWidth: viewSize.width, viewHeight: viewSize.height };
    setDraft(next);
  };

  const moveMark = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draft) return;
    const point = coords(event);
    setDraft((current) => current ? { ...current, x2: point.x, y2: point.y, points: current.type === "pen" ? [...(current.points ?? []), point] : current.points } : null);
  };

  const endMark = () => {
    if (!draft) return;
    const final = { ...draft };
    if (Math.abs((final.x2 ?? final.x) - final.x) + Math.abs((final.y2 ?? final.y) - final.y) < 4) {
      if (final.type === "highlight") final.y2 = final.y + 20;
      else if (final.type === "underline" || final.type === "strike") final.x2 = final.x + 80;
      else if (final.type === "rect" || final.type === "ellipse") { final.x2 = final.x + 100; final.y2 = final.y + 60; }
    }
    setMarks((current) => [...current, final]); setDraft(null);
  };

  const addText = () => {
    if (!textPlacement || !textValue.trim()) return;
    setMarks((current) => [...current, { id: id(), page: pageNumber, type: tool === "note" ? "note" : "text", x: textPlacement.x, y: textPlacement.y, text: textValue.trim(), color, width: lineWidth, viewWidth: viewSize.width, viewHeight: viewSize.height }]);
    setTextPlacement(null); setTextValue("");
  };

  const addImageFile = (next?: File) => {
    if (!next || !["image/png", "image/jpeg"].includes(next.type)) { setError("Use a PNG or JPG image."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setImageData({ data: reader.result, mime: next.type as "image/png" | "image/jpeg" }); setTool("image"); } };
    reader.readAsDataURL(next);
  };

  const savePdf = async () => {
    if (!file) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = pdf.getPages();
      const toPoints = (mark: Mark, x: number, y: number) => {
        const size = pages[mark.page - 1].getSize();
        return { x: x / mark.viewWidth * size.width, y: size.height - y / mark.viewHeight * size.height };
      };
      for (const mark of marks) {
        const page = pages[mark.page - 1];
        if (!page) continue;
        const size = page.getSize();
        const factorX = size.width / mark.viewWidth;
        const factorY = size.height / mark.viewHeight;
        const x1 = mark.x * factorX; const y1 = size.height - mark.y * factorY;
        const x2 = (mark.x2 ?? mark.x) * factorX; const y2 = size.height - (mark.y2 ?? mark.y) * factorY;
        const drawColor = hexRgb(mark.color);
        if (mark.type === "highlight") {
          const top = Math.min(mark.y, mark.y2 ?? mark.y + 20); const bottom = Math.max(mark.y, mark.y2 ?? mark.y + 20);
          page.drawRectangle({ x: Math.min(mark.x, mark.x2 ?? mark.x) * factorX, y: size.height - bottom * factorY, width: Math.max(12, Math.abs((mark.x2 ?? mark.x) - mark.x)) * factorX, height: Math.max(14, bottom - top) * factorY, color: drawColor, opacity: 0.34, borderWidth: 0 });
        } else if (mark.type === "underline" || mark.type === "strike") {
          const lineY = mark.type === "underline" ? y1 - 2 * factorY : y1 - 8 * factorY;
          page.drawLine({ start: { x: x1, y: lineY }, end: { x: x2, y: y2 - (mark.type === "underline" ? 2 : 8) * factorY }, color: drawColor, thickness: Math.max(1, mark.width) * factorX });
        } else if (mark.type === "pen") {
          const points = mark.points ?? [];
          for (let index = 1; index < points.length; index += 1) {
            const start = toPoints(mark, points[index - 1].x, points[index - 1].y);
            const end = toPoints(mark, points[index].x, points[index].y);
            page.drawLine({ start, end, color: drawColor, thickness: Math.max(1, mark.width) * factorX, opacity: 0.95 });
          }
        } else if (mark.type === "line" || mark.type === "arrow") {
          page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color: drawColor, thickness: Math.max(1, mark.width) * factorX });
          if (mark.type === "arrow") {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const head = 8 * factorX;
            page.drawLine({ start: { x: x2, y: y2 }, end: { x: x2 - head * Math.cos(angle - Math.PI / 6), y: y2 - head * Math.sin(angle - Math.PI / 6) }, color: drawColor, thickness: Math.max(1, mark.width) * factorX });
            page.drawLine({ start: { x: x2, y: y2 }, end: { x: x2 - head * Math.cos(angle + Math.PI / 6), y: y2 - head * Math.sin(angle + Math.PI / 6) }, color: drawColor, thickness: Math.max(1, mark.width) * factorX });
          }
        } else if (mark.type === "rect" || mark.type === "ellipse") {
          const left = Math.min(mark.x, mark.x2 ?? mark.x) * factorX;
          const top = Math.min(mark.y, mark.y2 ?? mark.y) * factorY;
          const width = Math.max(4, Math.abs((mark.x2 ?? mark.x) - mark.x)) * factorX;
          const height = Math.max(4, Math.abs((mark.y2 ?? mark.y) - mark.y)) * factorY;
          const options = { x: left, y: size.height - top - height, width, height, borderColor: drawColor, borderWidth: Math.max(1, mark.width) * factorX, color: drawColor, opacity: 0.08, borderOpacity: 0.95 };
          if (mark.type === "rect") page.drawRectangle(options); else page.drawEllipse({ ...options, x: left + width / 2, y: size.height - top - height / 2, xScale: width / 2, yScale: height / 2 });
        } else if ((mark.type === "text" || mark.type === "note") && mark.text) {
          // Rasterize text through the browser canvas so Hindi and other Unicode scripts are preserved.
          const canvas = document.createElement("canvas");
          const note = mark.type === "note";
          canvas.width = note ? 900 : 1200; canvas.height = note ? 300 : 130;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not render annotation text.");
          if (note) {
            ctx.fillStyle = "#fff4bf"; ctx.strokeStyle = "#d6a92d"; ctx.lineWidth = 4;
            ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4); ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            ctx.fillStyle = "#423510"; ctx.font = "bold 34px Arial, sans-serif";
            const words = mark.text.slice(0, 400).split(/\s+/); let line = ""; let y = 62;
            for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > 820 && line) { ctx.fillText(line, 28, y); line = word; y += 42; if (y > 260) break; } else line = test; }
            if (line && y <= 260) ctx.fillText(line, 28, y);
          } else {
            ctx.fillStyle = mark.color; ctx.font = "600 58px Arial, sans-serif"; ctx.textBaseline = "middle";
            ctx.fillText(mark.text.slice(0, 180), 8, 65, 1180);
          }
          const image = await pdf.embedPng(canvas.toDataURL("image/png"));
          const targetW = (note ? 210 : Math.min(380, Math.max(100, mark.text.length * 8))) * factorX;
          const targetH = (note ? 70 : 30) * factorY;
          page.drawImage(image, { x: x1, y: y1 - targetH, width: targetW, height: targetH });
          canvas.width = 1; canvas.height = 1;
        } else if (mark.type === "image" && mark.imageData) {
          const data = await (await fetch(mark.imageData)).arrayBuffer();
          const image = mark.imageMime === "image/png" ? await pdf.embedPng(data) : await pdf.embedJpg(data);
          const maxW = Math.min(170, size.width - x1 - 12); const maxH = 110 * factorY;
          const scale = Math.min(maxW / image.width, maxH / image.height);
          page.drawImage(image, { x: x1, y: y1 - image.height * scale, width: image.width * scale, height: image.height * scale });
        }
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      download(new Blob([bytes], { type: "application/pdf" }), `${file.name.replace(/\.pdf$/i, "")}-annotated.pdf`);
      setSuccess(`Saved ${marks.length} markup item(s) across ${new Set(marks.map((mark) => mark.page)).size} page(s).`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the annotated PDF."); }
    finally { setSaving(false); }
  };

  const visibleMarks = [...currentMarks, ...(draft ? [draft] : [])];

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolPageHeader title="Annotate PDF" description="Highlight, draw, add notes, shapes, images and text across every page." />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8">
        <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => { const picked = event.target.files?.[0]; if (picked) void loadFile(picked); }} />
        <input ref={imageInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(event) => addImageFile(event.target.files?.[0])} />
        {!file ? (
          <button type="button" onClick={() => fileInput.current?.click()} className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-background p-8 text-center shadow-xl transition hover:border-primary/60">
            <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadIcon /></span>
            <span className="text-2xl font-extrabold">Upload PDF to annotate</span><span className="mt-2 text-sm text-muted-foreground">Choose a PDF to open the multi-page annotation workspace.</span>
          </button>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 p-4">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-500"><FileText size={20}/></span><div className="min-w-0"><p className="max-w-[260px] truncate text-sm font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{pageCount} pages · {marks.length} markups</p></div></div>
              <button type="button" onClick={() => { setFile(null); setPageCount(0); setMarks([]); pdfRef.current = null; setError(""); }} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold"><X size={14} className="mr-1 inline"/>Change file</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              {TOOLBAR.map((item) => { const Icon = item.icon; return <button key={item.type} type="button" onClick={() => setTool(item.type)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold transition ${tool === item.type ? "bg-primary text-white shadow-md" : "bg-muted/60 text-foreground hover:bg-primary/10"}`}><Icon size={15}/>{item.label}</button>; })}
              <button type="button" onClick={() => imageInput.current?.click()} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold ${tool === "image" ? "bg-primary text-white" : "bg-muted/60 hover:bg-primary/10"}`}><ImagePlus size={15}/>Image</button>
              <label className="ml-auto flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs font-bold">Color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent"/></label>
              <label className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs font-bold">Width<input type="range" min="1" max="12" value={lineWidth} onChange={(event) => setLineWidth(Number(event.target.value))}/><span className="w-4 tabular-nums">{lineWidth}</span></label>
              <button type="button" onClick={() => setMarks((current) => current.filter((mark) => mark.page !== pageNumber))} className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600"><Eraser size={15}/>Clear page</button>
              <button type="button" onClick={() => setMarks((current) => current.slice(0, -1))} disabled={!marks.length} className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs font-bold disabled:opacity-40"><RotateCcw size={15}/>Undo</button>
            </div>
            <div className="grid min-h-[650px] lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="flex flex-col items-center gap-4 overflow-auto bg-slate-100 p-4 dark:bg-slate-900/40 sm:p-7">
                <div className="flex w-full max-w-[850px] items-center justify-between rounded-xl border border-border bg-background px-3 py-2"><button type="button" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={pageNumber <= 1} className="rounded-lg p-2 disabled:opacity-30"><ChevronLeft size={18}/></button><span className="text-sm font-extrabold">Page {pageNumber} of {pageCount}</span><button type="button" onClick={() => setPageNumber((page) => Math.min(pageCount, page + 1))} disabled={pageNumber >= pageCount} className="rounded-lg p-2 disabled:opacity-30"><ChevronRight size={18}/></button></div>
                <div className="relative w-fit max-w-full overflow-hidden bg-white shadow-2xl" style={{ width: "min(100%, 850px)" }}>
                  {baseCanvas ? <img src={baseCanvas.toDataURL("image/png")} alt={`PDF page ${pageNumber}`} className="block h-auto w-full select-none" draggable={false}/> : <div className="grid h-[500px] w-[360px] place-items-center"><Loader2 className="animate-spin text-primary"/></div>}
                  <svg viewBox={`0 0 ${viewSize.width} ${viewSize.height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full touch-none" onPointerDown={startMark} onPointerMove={moveMark} onPointerUp={endMark} onPointerCancel={endMark} style={{ cursor: tool === "text" || tool === "note" ? "text" : "crosshair" }}>
                    <defs><marker id="convia-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill={color}/></marker></defs>
                    {visibleMarks.map((mark) => {
                      const x = Math.min(mark.x, mark.x2 ?? mark.x); const y = Math.min(mark.y, mark.y2 ?? mark.y); const w = Math.max(2, Math.abs((mark.x2 ?? mark.x) - mark.x)); const h = Math.max(2, Math.abs((mark.y2 ?? mark.y) - mark.y));
                      if (mark.type === "highlight") return <rect key={mark.id} x={x} y={y} width={w} height={Math.max(16, h)} fill={mark.color} opacity="0.38"/>;
                      if (mark.type === "underline") return <line key={mark.id} x1={mark.x} y1={mark.y + 3} x2={mark.x2 ?? mark.x} y2={(mark.y2 ?? mark.y) + 3} stroke={mark.color} strokeWidth={mark.width * 1.5}/>;
                      if (mark.type === "strike") return <line key={mark.id} x1={mark.x} y1={mark.y - 8} x2={mark.x2 ?? mark.x} y2={(mark.y2 ?? mark.y) - 8} stroke={mark.color} strokeWidth={mark.width * 1.5}/>;
                      if (mark.type === "line" || mark.type === "arrow") return <line key={mark.id} x1={mark.x} y1={mark.y} x2={mark.x2 ?? mark.x} y2={mark.y2 ?? mark.y} stroke={mark.color} strokeWidth={mark.width * 1.5} markerEnd={mark.type === "arrow" ? "url(#convia-arrowhead)" : undefined}/>;
                      if (mark.type === "pen") return <polyline key={mark.id} points={(mark.points ?? []).map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={mark.color} strokeWidth={mark.width * 1.5} strokeLinecap="round" strokeLinejoin="round"/>;
                      if (mark.type === "rect") return <rect key={mark.id} x={x} y={y} width={w} height={h} fill={`${mark.color}18`} stroke={mark.color} strokeWidth={mark.width}/>;
                      if (mark.type === "ellipse") return <ellipse key={mark.id} cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={`${mark.color}18`} stroke={mark.color} strokeWidth={mark.width}/>;
                      if (mark.type === "text") return <text key={mark.id} x={mark.x} y={mark.y} fill={mark.color} fontSize="18" fontWeight="600">{mark.text}</text>;
                      if (mark.type === "note") return <g key={mark.id}><rect x={mark.x} y={mark.y} width="190" height="62" rx="5" fill="#fff4bf" stroke="#d6a92d"/><text x={mark.x + 8} y={mark.y + 21} fill="#423510" fontSize="13" fontWeight="600">{(mark.text ?? "").slice(0, 26)}</text><text x={mark.x + 8} y={mark.y + 39} fill="#423510" fontSize="11">{(mark.text ?? "").slice(26, 54)}</text></g>;
                      if (mark.type === "image" && mark.imageData) return <image key={mark.id} href={mark.imageData} x={mark.x} y={mark.y} width="170" height="110" preserveAspectRatio="xMidYMid meet"/>;
                      return null;
                    })}
                  </svg>
                </div>
                {textPlacement && <div className="w-full max-w-[850px] rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="mb-2 text-sm font-extrabold">{tool === "note" ? "Write a comment" : "Add text to page"}</div><textarea value={textValue} onChange={(event) => setTextValue(event.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background p-3 text-sm" placeholder="Type your note or text…"/><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setTextPlacement(null)} className="rounded-lg border border-border px-4 py-2 text-xs font-bold">Cancel</button><button type="button" onClick={addText} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white">Add to page</button></div></div>}
              </div>
              <aside className="border-t border-border p-5 lg:border-l lg:border-t-0"><div className="text-sm font-extrabold">Annotation settings</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Select a tool, then draw on the page. Text and comments are placed by clicking the page and entering the content.</p><div className="mt-5 rounded-2xl bg-muted/30 p-4"><p className="text-xs font-bold text-muted-foreground">CURRENT TOOL</p><p className="mt-1 font-extrabold">{TOOLBAR.find((item) => item.type === tool)?.label ?? (tool === "image" ? "Insert image" : tool)}</p>{tool === "image" && <p className="mt-2 text-xs text-muted-foreground">{imageData ? "Image selected. Click the page to place it." : "Choose a PNG or JPG image above."}</p>}</div><div className="mt-4 rounded-2xl border border-border p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold">Markups on this page</span><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-extrabold text-primary">{currentMarks.length}</span></div>{currentMarks.slice(-8).map((mark, index) => <div key={mark.id} className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="truncate">{index + 1}. {mark.type}{mark.text ? ` — ${mark.text.slice(0, 15)}` : ""}</span><button type="button" onClick={() => setMarks((current) => current.filter((entry) => entry.id !== mark.id))} className="rounded p-1 text-red-500" aria-label="Remove markup"><X size={13}/></button></div>)}</div><button type="button" onClick={() => void savePdf()} disabled={saving || !marks.length} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin"/> : <Download size={17}/>} Save annotated PDF</button><p className="mt-3 text-[11px] leading-5 text-muted-foreground">Markups are flattened into the PDF page content, so they display consistently in common PDF readers. They are not separate editable annotation objects after export.</p></aside>
            </div>
          </div>
        )}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}
        {success && <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700"><CheckCircle2 size={18}/>{success}</div>}
      </main>
    </div>
  );
}

function UploadIcon() { return <UploadCloudIcon/>; }
function UploadCloudIcon() { return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M20 16.5v2A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-2"/></svg>; }
