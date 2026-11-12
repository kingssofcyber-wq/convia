"use client";

import * as React from "react";
import { extractPositionedPages } from "@/lib/pdf/positioned-extract";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { CheckCircle2, Download, FileSpreadsheet, FileText, Loader2, UploadCloud } from "lucide-react";

function triggerDownload(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2500); }
function safeName(name: string) { return name.replace(/\.pdf$/i, "").replace(/[^\w-]+/g, "-") || "convia"; }

export function PdfToExcelWorkspace() {
  const input = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [useOcr, setUseOcr] = React.useState(false);
  const [language, setLanguage] = React.useState<"eng" | "hin" | "eng+hin">("eng");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [preview, setPreview] = React.useState<string[][]>([]);
  const [stats, setStats] = React.useState<{ pages: number; rows: number; columns: number; ocrPages: number } | null>(null);
  const [result, setResult] = React.useState<{ url: string; name: string; size: number } | null>(null);

  React.useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);
  const chooseFile = (next?: File) => {
    if (!next) return;
    setError(""); setSuccess(""); setPreview([]); setStats(null); setResult(null);
    if (!next.name.toLowerCase().endsWith(".pdf")) { setError("Please select a PDF file."); return; }
    if (next.size > 60 * 1024 * 1024) { setError("Please use a PDF file under 60 MB."); return; }
    setFile(next);
  };

  const convert = async () => {
    if (!file || busy) return;
    setBusy(true); setError(""); setSuccess(""); setProgress(3); setPhase("Reading PDF text and layout"); setResult(null);
    try {
      const pages = await extractPositionedPages(file, {
        useOcr, ocrLanguage: language,
        onProgress: (value, message) => { setProgress(Math.min(90, value)); setPhase(message); },
      });
      const usablePages = pages.filter((page) => page.lines.length > 0);
      const textCount = usablePages.reduce((sum, page) => sum + page.lines.length, 0);
      if (!textCount) throw new Error("No text or table data could be read. This PDF may be blank, damaged, or contain an unsupported scan.");
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      let maxColumns = 1;
      let totalRows = 0;
      const previewRows: string[][] = [];
      const allPageRows: Array<{ page: number; cells: string[] }> = [];
      setPhase("Detecting rows and aligned columns"); setProgress(93);

      for (const page of usablePages) {
        const rows = page.lines.map((line) => line.cells.length ? line.cells.map((cell) => cell.trim()) : [line.text.trim()]).filter((row) => row.some(Boolean));
        if (!rows.length) continue;
        const columnCount = Math.max(1, ...rows.map((row) => row.length));
        maxColumns = Math.max(maxColumns, columnCount); totalRows += rows.length;
        const normalized = rows.map((row) => [...row, ...Array(Math.max(0, columnCount - row.length)).fill("")]);
        normalized.forEach((row) => allPageRows.push({ page: page.page, cells: row.map(String) }));
        const sheet = XLSX.utils.aoa_to_sheet(normalized);
        sheet["!cols"] = Array.from({ length: columnCount }, (_, column) => ({ wch: Math.max(12, Math.min(42, ...normalized.map((row) => String(row[column] ?? "").length + 2))) }));
        sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, normalized.length - 1), c: columnCount - 1 } }) };
        XLSX.utils.book_append_sheet(workbook, sheet, `Page ${page.page}`.slice(0, 31));
        if (previewRows.length < 16) previewRows.push(...normalized.slice(0, 16 - previewRows.length).map((row) => row.map(String)));
      }

      if (allPageRows.length) {
        const combinedHeaders = ["Page", ...Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`)];
        const combinedRows = [combinedHeaders, ...allPageRows.map((row) => [String(row.page), ...row.cells, ...Array(Math.max(0, maxColumns - row.cells.length)).fill("")])];
        const combinedSheet = XLSX.utils.aoa_to_sheet(combinedRows);
        combinedSheet["!cols"] = [{ wch: 9 }, ...Array.from({ length: maxColumns }, (_, column) => ({ wch: Math.max(12, Math.min(42, ...allPageRows.map((row) => String(row.cells[column] ?? "").length + 2))) }))];
        combinedSheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, combinedRows.length - 1), c: maxColumns } }) };
        XLSX.utils.book_append_sheet(workbook, combinedSheet, "All pages");
      }
      const array = XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true });
      const blob = new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const name = `${safeName(file.name)}-tables.xlsx`;
      const url = URL.createObjectURL(blob);
      setResult({ url, name, size: blob.size }); setPreview(previewRows);
      setStats({ pages: usablePages.length, rows: totalRows, columns: maxColumns, ocrPages: usablePages.filter((page) => page.ocrUsed).length });
      setSuccess("Excel workbook created with an All pages sheet plus individual page sheets. Review detected headers, merged cells and totals before using the data in calculations or reports.");
      setProgress(100); setPhase("Workbook ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not extract this PDF.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolPageHeader title="PDF to Excel" description="Detect table rows and aligned columns, then export an editable Excel workbook." />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8">
            <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])}/>
            {!file ? (
              <button type="button" onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }} className="flex min-h-[270px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-6 text-center transition hover:border-primary/50"><span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadCloud size={30}/></span><span className="text-2xl font-extrabold">Upload PDF to Excel</span><span className="mt-2 text-sm text-muted-foreground">Text PDFs and digital tables work best. Scanned pages can be processed with OCR.</span><span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose PDF</span></button>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><FileSpreadsheet size={23}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={() => { setFile(null); setResult(null); setStats(null); setPreview([]); if (input.current) input.current.value = ""; }} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold">Change</button></div>
            )}
            <div className="mt-6 rounded-2xl border border-border p-4 sm:p-5">
              <div className="flex items-start gap-3"><input id="pdf-excel-ocr" type="checkbox" checked={useOcr} onChange={(event) => setUseOcr(event.target.checked)} className="mt-1 h-4 w-4 accent-primary"/><div><label htmlFor="pdf-excel-ocr" className="text-sm font-extrabold">Run OCR on scanned pages</label><p className="mt-1 text-xs leading-5 text-muted-foreground">Uses word positions to estimate rows and columns on scanned or very low-text pages. OCR needs a first-time language-data download. The workbook includes an All pages sheet plus individual page sheets.</p></div></div>
              {useOcr && <label className="mt-4 block max-w-xs text-xs font-bold">OCR language<select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="eng">English</option><option value="hin">Hindi</option><option value="eng+hin">English + Hindi</option></select></label>}
            </div>
            {busy && <div className="mt-6 rounded-xl bg-primary/5 p-4"><div className="flex items-center justify-between text-sm"><span className="font-bold"><Loader2 size={16} className="mr-2 inline animate-spin"/>{phase}</span><span className="font-extrabold tabular-nums">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-600 transition-all" style={{ width: `${progress}%` }}/></div></div>}
            {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}
            {success && <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700"><CheckCircle2 size={18}/>{success}</div>}
            {stats && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Pages",stats.pages],["Rows",stats.rows],["Detected columns",stats.columns],["OCR pages",stats.ocrPages]].map(([label,value]) => <div key={String(label)} className="rounded-xl bg-muted/30 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xl font-extrabold tabular-nums">{value}</p></div>)}</div>}
            {preview.length > 0 && <div className="mt-6 overflow-hidden rounded-2xl border border-border"><div className="border-b border-border bg-muted/30 px-4 py-3 text-sm font-extrabold">Detected data preview</div><div className="max-h-[420px] overflow-auto"><table className="w-full border-collapse text-left text-xs"><tbody>{preview.map((row,index)=><tr key={index} className={index===0?"bg-primary/5 font-extrabold":""}>{row.map((cell,col)=><td key={col} className="max-w-[240px] border-b border-r border-border px-3 py-2 align-top">{cell}</td>)}</tr>)}</tbody></table></div></div>}
            {result && <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><p className="font-extrabold">Excel workbook ready</p><p className="mt-1 text-xs text-muted-foreground">{result.name} · {(result.size / 1024).toFixed(1)} KB</p><a href={result.url} download={result.name} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 py-3.5 font-extrabold text-white"><Download size={18}/> Download XLSX</a></div>}
            <button type="button" onClick={() => void convert()} disabled={!file || busy} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-5 py-4 font-extrabold text-white shadow-xl shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"><FileSpreadsheet size={19}/>{busy ? "Extracting tables…" : "Extract tables to Excel"}</button>
          </section>
          <aside className="space-y-4"><div className="rounded-2xl border border-border bg-background p-5"><FileText className="text-primary" size={20}/><h3 className="mt-3 font-extrabold">Table-aware extraction</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">The extractor groups words by baseline, measures horizontal gaps, detects recurring column starts across rows and creates a separate sheet for each page.</p></div><div className="rounded-2xl border border-border bg-background p-5"><h3 className="font-extrabold">Accuracy note</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">This improves structured extraction but is not the proprietary Solid Documents engine used by iLovePDF. Multi-line cells, merged columns, complex border-only tables and irregular financial statements still need review. Scanned tables depend on OCR quality.</p></div><div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5"><h3 className="font-extrabold">Before using the workbook</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Check decimal points, dates, negative values and merged rows against the source PDF before calculations or reporting.</p></div></aside>
        </div>
      </main>
    </div>
  );
}
