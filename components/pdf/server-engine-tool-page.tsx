"use client";

import * as React from "react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { CheckCircle2, Download, FileText, Info, Loader2, LockKeyhole, ShieldCheck, UploadCloud, X } from "lucide-react";

type EngineSlug = "word-to-pdf" | "excel-to-pdf" | "ppt-to-pdf" | "html-to-pdf" | "pdf-to-pdfa" | "protect" | "unlock";

const DETAILS: Record<EngineSlug, { title: string; description: string; accept: string; action: string; output: string; help: string }> = {
  "word-to-pdf": { title: "Word to PDF", description: "Convert Word documents with a full office rendering engine.", accept: ".doc,.docx,.odt,.rtf", action: "office-to-pdf", output: "PDF", help: "Uses LibreOffice through the configured Gotenberg engine. Complex fonts and page layout should still be reviewed." },
  "excel-to-pdf": { title: "Excel to PDF", description: "Convert workbooks while retaining sheet layouts and print settings.", accept: ".xls,.xlsx,.ods,.csv", action: "office-to-pdf", output: "PDF", help: "Workbook print areas, scaling, page orientation and hidden sheets can affect the output." },
  "ppt-to-pdf": { title: "PowerPoint to PDF", description: "Render your presentation slides as a shareable PDF.", accept: ".ppt,.pptx,.odp", action: "office-to-pdf", output: "PDF", help: "Slide animations and transitions are not part of a static PDF." },
  "html-to-pdf": { title: "HTML to PDF", description: "Print an HTML page to PDF with selectable text and browser layout.", accept: ".html,.htm,text/html", action: "html-to-pdf", output: "PDF", help: "The server-side Chromium engine renders HTML. Only upload HTML that you own or are authorized to convert." },
  "pdf-to-pdfa": { title: "PDF to PDF/A", description: "Remediate a PDF for long-term archival conformance.", accept: ".pdf,application/pdf", action: "pdfa", output: "PDF/A", help: "Conformance is not assumed from the download. The engine reports residual issues; use the PDF/A validation report for critical archives." },
  protect: { title: "Protect PDF", description: "Encrypt a PDF with AES-256 opening protection.", accept: ".pdf,application/pdf", action: "protect", output: "Protected PDF", help: "Choose a strong password and store it safely. Convia does not retain the password." },
  unlock: { title: "Unlock PDF", description: "Remove encryption using the correct opening password.", accept: ".pdf,application/pdf", action: "unlock", output: "Unlocked PDF", help: "This only works when you know the PDF password and are authorized to modify the document." },
};

function niceSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ServerEngineToolPage({ slug }: { slug: EngineSlug }) {
  const detail = DETAILS[slug];
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [ownerPassword, setOwnerPassword] = React.useState("");
  const [pdfaProfile, setPdfaProfile] = React.useState("PDF/A-2b");
  const [pdfaLanguage, setPdfaLanguage] = React.useState("en");
  const [pdfaAggressive, setPdfaAggressive] = React.useState(false);
  const [allowPrint, setAllowPrint] = React.useState(true);
  const [allowCopy, setAllowCopy] = React.useState(true);
  const [allowModify, setAllowModify] = React.useState(true);
  const [html, setHtml] = React.useState("<!doctype html><html><head><meta charset=\"utf-8\"><title>Convia document</title></head><body><h1>My document</h1><p>Write your HTML here.</p></body></html>");
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [result, setResult] = React.useState<{ url: string; name: string; size: number } | null>(null);
  const [engineReady, setEngineReady] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/pdf/engine", { cache: "no-store" }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (active) setEngineReady(Boolean(data.configured && data.reachable));
    }).catch(() => { if (active) setEngineReady(false); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const select = (next: File | undefined) => {
    if (!next) return;
    setError(""); setNotice(""); setResult(null);
    if (next.size > 60 * 1024 * 1024) { setError("File size must be 60 MB or less."); return; }
    const extension = `.${next.name.split(".").pop()?.toLowerCase()}`;
    if (!detail.accept.split(",").some((accepted) => accepted.startsWith(".") && accepted === extension) && slug !== "html-to-pdf") {
      setError(`This tool does not support ${extension}.`); return;
    }
    setFile(next);
  };

  const process = async () => {
    if (busy) return;
    if (slug === "html-to-pdf") {
      if (!html.trim()) { setError("Enter HTML before converting."); return; }
    } else if (!file) { setError("Choose a file first."); return; }
    if (slug === "protect" && (password.length < 8 || password !== confirm)) { setError("Enter matching passwords with at least 8 characters."); return; }
    if (slug === "unlock" && !password) { setError("Enter the correct opening password."); return; }

    setBusy(true); setError(""); setNotice(""); setResult(null); setPhase("Preparing secure conversion");
    try {
      const body = new FormData();
      body.append("action", detail.action);
      if (slug === "html-to-pdf") {
        const safe = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)/gi, "");
        body.append("file", new Blob([safe], { type: "text/html;charset=utf-8" }), "index.html");
      } else if (file) body.append("file", file, file.name);
      if (slug === "protect") {
        body.append("userPassword", password);
        body.append("ownerPassword", ownerPassword || password);
        body.append("permissions", JSON.stringify({ print: allowPrint, printHighQuality: allowPrint, extractText: allowCopy, modifyContent: allowModify, modifyAnnotations: allowModify, fillForms: allowModify, assemble: allowModify }));
      }
      if (slug === "pdf-to-pdfa") {
        body.append("profile", pdfaProfile);
        body.append("language", pdfaLanguage);
        body.append("aggressive", String(pdfaAggressive));
      }
      if (slug === "unlock") body.append("password", password);
      setPhase("Processing with the document engine");
      const response = await fetch("/api/pdf/engine", { method: "POST", body });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Conversion failed (${response.status}).`);
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The conversion engine returned an empty file.");
      const nameBase = (file?.name || "convia-document").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
      const outputName = `${nameBase}-${slug === "pdf-to-pdfa" ? "pdfa" : slug === "protect" ? "protected" : slug === "unlock" ? "unlocked" : "converted"}.pdf`;
      const url = URL.createObjectURL(blob);
      setResult({ url, name: outputName, size: blob.size });
      if (slug === "pdf-to-pdfa") {
        const residual = response.headers.get("X-Convia-Pdfa-Residual");
        const rolledBack = response.headers.get("X-Convia-Pdfa-Rolled-Back");
        setNotice(residual === "0" ? `The engine reports PDF/A conformance (0 remaining violations). Rolled-back fixes: ${rolledBack ?? "not reported"}.` : `PDF/A output generated, but conformance is not confirmed. Remaining violations: ${residual ?? "not reported"}; rolled-back fixes: ${rolledBack ?? "not reported"}. Run an independent validator for important archives.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not process this file.");
    } finally { setBusy(false); setPhase(""); }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolPageHeader title={detail.title} description={detail.description} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="rounded-3xl border border-border bg-background p-5 shadow-xl shadow-slate-900/5 sm:p-8">
            {slug === "html-to-pdf" ? (
              <div>
                <div className="mb-3 flex items-center gap-2"><FileText className="text-primary"/><h2 className="text-xl font-extrabold">HTML source</h2></div>
                <textarea value={html} onChange={(event) => setHtml(event.target.value)} spellCheck={false} className="min-h-[340px] w-full rounded-2xl border border-border bg-muted/20 p-4 font-mono text-sm outline-none focus:border-primary" />
              </div>
            ) : (
              <>
                <input ref={inputRef} type="file" accept={detail.accept} className="hidden" onChange={(event) => select(event.target.files?.[0])} />
                {!file ? (
                  <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files?.[0]); }} className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/10 hover:border-primary/50"}`}>
                    <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadCloud size={31}/></span>
                    <h2 className="text-2xl font-extrabold">Upload your file</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">Drag and drop here, or browse from your device. Maximum file size: 60 MB.</p>
                    <span className="mt-6 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose file</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/20 p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText size={23}/></span>
                    <div className="min-w-0 flex-1"><p className="truncate font-bold">{file.name}</p><p className="text-sm text-muted-foreground">{niceSize(file.size)}</p></div>
                    <button type="button" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; setResult(null); }} className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600" aria-label="Remove file"><X size={18}/></button>
                  </div>
                )}
              </>
            )}

            {slug === "pdf-to-pdfa" && <div className="mt-6 grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2">
              <label className="text-xs font-bold">Archival standard<select value={pdfaProfile} onChange={(event) => setPdfaProfile(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"><option>PDF/A-1a</option><option>PDF/A-1b</option><option>PDF/A-2a</option><option>PDF/A-2b</option><option>PDF/A-2u</option><option>PDF/A-3a</option><option>PDF/A-3b</option><option>PDF/A-3u</option><option>PDF/A-4</option><option>PDF/A-4e</option></select></label>
              <label className="text-xs font-bold">Document language (BCP 47)<input value={pdfaLanguage} onChange={(event) => setPdfaLanguage(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="en or hi-IN"/></label>
              <label className="flex items-start gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={pdfaAggressive} onChange={(event) => setPdfaAggressive(event.target.checked)} className="mt-0.5 accent-primary"/>Allow aggressive remediation (may change visual appearance to fix more conformance issues).</label>
            </div>}
            {slug === "protect" && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Opening password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="Minimum 8 characters"/></label><label className="text-xs font-bold">Confirm password<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="Repeat password"/></label><label className="text-xs font-bold sm:col-span-2">Owner password (optional)<input type="password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} autoComplete="new-password" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="Defaults to opening password"/></label></div>}
            {slug === "unlock" && <label className="mt-6 block text-xs font-bold">PDF opening password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="Enter the correct password"/></label>}

            {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">{error}</div>}
            {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">{notice}</div>}
            {busy && <div className="mt-5 rounded-xl bg-primary/5 p-4 text-sm font-semibold text-primary"><Loader2 className="mr-2 inline animate-spin" size={17}/>{phase}</div>}
            {result && <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600"/><div><p className="font-extrabold">Your {detail.output} is ready</p><p className="text-xs text-muted-foreground">{result.name} · {niceSize(result.size)}</p></div></div><a href={result.url} download={result.name} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 py-3.5 font-extrabold text-white"><Download size={18}/> Download file</a></div>}
            <button type="button" onClick={() => void process()} disabled={busy || (slug !== "html-to-pdf" && !file)} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-6 py-4 font-extrabold text-white shadow-xl shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"><LockKeyhole size={18}/>{busy ? "Processing…" : `Create ${detail.output}`}</button>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-background p-5"><div className="flex items-center gap-2 font-extrabold"><ShieldCheck className="text-primary" size={19}/> Protected processing</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Files are sent only to the PDF engine configured by the site owner. They are processed in memory by this API route and are not saved by Convia.</p></div>
            <div className="rounded-2xl border border-border bg-background p-5"><div className="flex items-center gap-2 font-extrabold"><Info className="text-primary" size={19}/> Engine status</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{engineReady === null ? "Checking engine…" : engineReady ? "Connected to the server-side document engine." : "Not connected. The site owner must configure the Gotenberg URL and credentials before this tool can process files."}</p></div>
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5"><p className="font-extrabold">{detail.title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail.help}</p></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
