"use client";

import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { BadgeCheck, CheckCircle2, Download, FileSignature, FileText, Loader2, ShieldCheck, UploadCloud } from "lucide-react";

type FieldInfo = { name: string; type: string; options: string[] };
function saveBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 2500); }

function SignatureCanvas({ canvasRef, onChange }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onChange: (drawn: boolean) => void }) {
  const drawing = React.useRef(false);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * event.currentTarget.width / rect.width, y: (event.clientY - rect.top) * event.currentTarget.height / rect.height };
  };
  return <div className="overflow-hidden rounded-2xl border border-border bg-white"><canvas ref={canvasRef} width={760} height={190} className="h-[150px] w-full touch-none bg-white" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); const ctx = event.currentTarget.getContext("2d"); if (!ctx) return; drawing.current = true; ctx.strokeStyle = "#172554"; ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(p.x, p.y); onChange(true); }} onPointerMove={(event) => { if (!drawing.current) return; const p = point(event); const ctx = event.currentTarget.getContext("2d"); if (!ctx) return; ctx.lineTo(p.x, p.y); ctx.stroke(); }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }}/><div className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">Draw your visible signature using mouse, trackpad or touch.</div></div>;
}

export function FillSignWorkspace({ mode }: { mode: "fill-sign" | "sign" }) {
  const pdfInput = React.useRef<HTMLInputElement>(null);
  const certInput = React.useRef<HTMLInputElement>(null);
  const signatureRef = React.useRef<HTMLCanvasElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [certificate, setCertificate] = React.useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = React.useState("");
  const [fields, setFields] = React.useState<FieldInfo[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [flatten, setFlatten] = React.useState(true);
  const [signerName, setSignerName] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState("Document approval");
  const [location, setLocation] = React.useState("");
  const [page, setPage] = React.useState("1");
  const [position, setPosition] = React.useState("bottom-right");
  const [drawn, setDrawn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [status, setStatus] = React.useState("");

  const isFill = mode === "fill-sign";
  const title = isFill ? "Fill & Sign" : "Sign PDF";
  const description = isFill ? "Fill interactive PDF fields, add a visible signature and optionally apply a certificate-backed PAdES signature." : "Sign a PDF with a visible signature and an optional certificate-backed PAdES digital signature.";

  const pickPdf = async (next?: File) => {
    if (!next) return;
    setError(""); setNotice(""); setFile(null); setFields([]); setValues({});
    if (!next.name.toLowerCase().endsWith(".pdf") || next.size > 60 * 1024 * 1024) { setError("Choose a PDF file under 60 MB."); return; }
    try {
      const pdf = await PDFDocument.load(await next.arrayBuffer());
      setFile(next); setPage("1"); setPageCount(pdf.getPageCount());
      if (isFill) {
        const form = pdf.getForm();
        const detected = form.getFields().map((field) => {
          const raw = field as unknown as { constructor: { name: string }; getOptions?: () => string[] };
          return { name: field.getName(), type: raw.constructor.name, options: raw.getOptions?.() ?? [] };
        }).filter((field) => !["PDFSignature", "PDFButton"].includes(field.type));
        setFields(detected); setValues(Object.fromEntries(detected.map((field) => [field.name, ""])));
        if (!detected.length) setNotice("No interactive AcroForm fields were found. You can still place a visible signature and certificate-backed digital signature.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This PDF could not be opened. It may be encrypted or damaged."); }
  };

  const clearSignature = () => { const canvas = signatureRef.current; const context = canvas?.getContext("2d"); if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height); setDrawn(false); };

  const process = async () => {
    if (!file || busy) return;
    if (!drawn && !signerName.trim()) { setError("Draw a signature or enter the signer's name."); return; }
    if (certificate && !certificatePassword) { setError("Enter the password for the uploaded .p12/.pfx certificate."); return; }
    if (!Number.isInteger(Number(page)) || Number(page) < 1 || Number(page) > pageCount) { setError(`Enter a page number from 1 to ${pageCount}.`); return; }
    setBusy(true); setError(""); setNotice(""); setStatus("Preparing the PDF");
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = pdf.getPages();
      const pageIndex = Math.min(pages.length - 1, Math.max(0, Number(page) - 1));
      const target = pages[pageIndex];
      if (isFill) {
        const form = pdf.getForm();
        for (const info of fields) {
          const value = (values[info.name] ?? "").trim();
          if (!value) continue;
          const field = form.getField(info.name) as unknown as { constructor: { name: string }; setText?: (value: string) => void; check?: () => void; uncheck?: () => void; select?: (value: string) => void };
          if (field.constructor.name === "PDFTextField") field.setText?.(value);
          else if (field.constructor.name === "PDFCheckBox") value.toLowerCase() === "true" || value.toLowerCase() === "yes" ? field.check?.() : field.uncheck?.();
          else if (["PDFDropdown", "PDFRadioGroup", "PDFOptionList"].includes(field.constructor.name)) field.select?.(value);
        }
        if (flatten && fields.length) form.flatten();
      }
      const { width, height } = target.getSize();
      if (drawn && signatureRef.current) {
        const png = await pdf.embedPng(signatureRef.current.toDataURL("image/png"));
        const targetW = Math.min(190, width * 0.36); const targetH = targetW * png.height / png.width;
        const x = position.endsWith("right") ? width - targetW - 46 : 46;
        const y = position.startsWith("top") ? height - targetH - 70 : 62;
        target.drawImage(png, { x, y, width: targetW, height: targetH });
      }
      if (signerName.trim()) {
        // Canvas rendering keeps non-Latin names (for example Hindi) from failing StandardFonts' WinAnsi encoding.
        const labelCanvas = document.createElement("canvas"); labelCanvas.width = 900; labelCanvas.height = 160;
        const context = labelCanvas.getContext("2d");
        if (!context) throw new Error("Could not render the signer label.");
        context.fillStyle = "#1f2937"; context.font = "600 38px Arial, sans-serif"; context.textBaseline = "middle";
        context.fillText(signerName.trim().slice(0, 120), 8, 52, 880);
        context.fillStyle = "#64748b"; context.font = "28px Arial, sans-serif"; context.fillText(date, 8, 120, 880);
        const labelImage = await pdf.embedPng(labelCanvas.toDataURL("image/png"));
        const labelW = Math.min(225, width * 0.42); const labelH = labelW * labelImage.height / labelImage.width;
        const x = position.endsWith("right") ? width - labelW - 46 : 46;
        const y = position.startsWith("top") ? height - labelH - 70 : 35;
        target.drawImage(labelImage, { x, y, width: labelW, height: labelH });
        labelCanvas.width = 1; labelCanvas.height = 1;
      }

      const bytes = await pdf.save({ useObjectStreams: true });
      let blob = new Blob([bytes], { type: "application/pdf" });
      let outputName = `${file.name.replace(/\.pdf$/i, "")}-${isFill ? "filled-signed" : "signed"}.pdf`;
      if (certificate) {
        setStatus("Applying certificate-backed PAdES digital signature");
        const body = new FormData();
        body.append("action", "sign");
        body.append("file", new File([blob], outputName, { type: "application/pdf" }));
        body.append("certificate", certificate, certificate.name);
        body.append("certificatePassword", certificatePassword);
        body.append("signerName", signerName || "Convia signer");
        body.append("reason", reason);
        body.append("location", location);
        const response = await fetch("/api/pdf/engine", { method: "POST", body });
        if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.error || "Certificate signing failed. Check the PDF engine and certificate."); }
        blob = await response.blob();
        outputName = `${file.name.replace(/\.pdf$/i, "")}-pades-signed.pdf`;
        setNotice("A certificate-backed PAdES signature was added. Open the file in a PDF reader and inspect its signature panel. A trusted status depends on the certificate chain and the reader's trust store.");
      } else {
        setNotice("A visible signature mark was added. This is not a cryptographic digital signature because no signing certificate was supplied.");
      }
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = outputName; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2500);
      setStatus("Download started");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not process this PDF."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToolPageHeader title={title} description={description}/>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8">
          <input ref={pdfInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void pickPdf(event.target.files?.[0])}/>
          <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => pdfInput.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 py-3 text-sm font-extrabold text-white"><UploadCloud size={18}/>Choose PDF</button>{file && <div className="min-w-0 flex-1 rounded-xl bg-muted/30 px-4 py-3"><p className="truncate text-sm font-bold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>}</div>
          {isFill && fields.length > 0 && <div className="mt-6 rounded-2xl border border-border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">Interactive form fields</h3><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">{fields.length} fields</span></div><div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <label key={field.name} className="block text-xs font-bold">{field.name}<div className="mt-2">{field.type === "PDFCheckBox" ? <select value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="">Leave unchanged</option><option value="true">Checked</option><option value="false">Unchecked</option></select> : (field.type === "PDFDropdown" || field.type === "PDFRadioGroup" || field.type === "PDFOptionList") && field.options.length ? <select value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="">Choose…</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="Enter value"/>}</div></label>)}</div><label className="mt-4 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={flatten} onChange={(event) => setFlatten(event.target.checked)} className="accent-primary"/>Flatten filled form fields after filling</label></div>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Signer name<input value={signerName} onChange={(event) => setSignerName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="Full name"/></label><label className="text-xs font-bold">Date<input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label><label className="text-xs font-bold">Page number<input value={page} onChange={(event) => setPage(event.target.value)} type="number" min="1" max={pageCount || 1} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label><label className="text-xs font-bold">Visible signature position<select value={position} onChange={(event) => setPosition(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option></select></label></div>
          <div className="mt-6"><div className="mb-2 flex items-center justify-between"><h3 className="font-extrabold">Visible signature</h3><button type="button" onClick={clearSignature} className="text-xs font-bold text-muted-foreground underline">Clear pad</button></div><SignatureCanvas canvasRef={signatureRef} onChange={setDrawn}/></div>
          <div className="mt-7 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5"><div className="flex items-center gap-2"><BadgeCheck className="text-primary" size={19}/><h3 className="font-extrabold">Certificate-backed digital signature (PAdES)</h3></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Optional: upload the signer's authorized PKCS#12 certificate. The certificate is uploaded to the Convia server route and forwarded to the configured PDF engine over the configured connection. Use only a certificate and key you are authorized to use.</p><input ref={certInput} type="file" accept=".p12,.pfx,application/x-pkcs12" className="mt-4 block w-full text-xs" onChange={(event) => setCertificate(event.target.files?.[0] ?? null)}/>{certificate && <p className="mt-2 text-xs font-bold text-emerald-700">{certificate.name} selected</p>}<label className="mt-4 block text-xs font-bold">Certificate password<input value={certificatePassword} onChange={(event) => setCertificatePassword(event.target.value)} type="password" autoComplete="off" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="Password for P12 / PFX"/></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Signing reason<input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label><label className="text-xs font-bold">Signing location<input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}{notice && <div role="status" className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">{notice}</div>}{busy && <p className="mt-5 text-sm font-bold text-primary"><Loader2 size={16} className="mr-2 inline animate-spin"/>{status}</p>}
          <button type="button" onClick={() => void process()} disabled={!file || busy} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-5 py-4 font-extrabold text-white shadow-xl shadow-primary/20 disabled:opacity-50"><FileSignature size={19}/>{busy ? "Processing…" : certificate ? "Fill and apply PAdES digital signature" : "Fill and create signed PDF"}</button>
        </section>
        <aside className="space-y-4"><div className="rounded-2xl border border-border bg-background p-5"><ShieldCheck size={20} className="text-primary"/><h3 className="mt-3 font-extrabold">Two signature layers</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">The drawn signature is visible page artwork. A PKCS#12 certificate adds a cryptographic PAdES signature that PDF readers can validate. Only the authorized certificate holder should provide the certificate and password.</p></div><div className="rounded-2xl border border-border bg-background p-5"><h3 className="font-extrabold">Certificate trust</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">For a trusted signer indicator, the certificate chain must be trusted by the recipient's PDF reader. A self-signed certificate normally appears untrusted. PAdES output alone does not guarantee legal acceptance in India or replace a regulated eSign/DSC workflow; check the receiving authority's requirements.</p></div><div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5"><p className="font-extrabold">Keep your private key safe</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Use only a certificate that belongs to the signer and that the signer is authorized to use. An adult certificate holder should supervise any certificate use and site billing. Ensure the PDF engine is yours or a service you trust, and use HTTPS for remote engine traffic.</p></div></aside>
        </div></main>
    </div>
  );
}
