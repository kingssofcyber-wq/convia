"use client";

import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { BadgeCheck, CheckCircle2, Download, FileSignature, FileText, ImagePlus, Loader2, ShieldCheck, UploadCloud, X } from "lucide-react";

type FieldInfo = { name: string; type: string; options: string[] };
type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function FillSignWorkspace({ mode }: { mode: "fill-sign" | "sign" }) {
  const pdfInput = React.useRef<HTMLInputElement>(null);
  const signatureInput = React.useRef<HTMLInputElement>(null);
  const certInput = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [signatureImage, setSignatureImage] = React.useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = React.useState("");
  const [certificate, setCertificate] = React.useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = React.useState("");
  const [fields, setFields] = React.useState<FieldInfo[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [flatten, setFlatten] = React.useState(true);
  const [signerName, setSignerName] = React.useState("");
  const [reason, setReason] = React.useState("Document approval");
  const [location, setLocation] = React.useState("");
  const [page, setPage] = React.useState("1");
  const [position, setPosition] = React.useState<Position>("bottom-right");
  const [signatureWidth, setSignatureWidth] = React.useState(30);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [status, setStatus] = React.useState("");

  const isFill = mode === "fill-sign";
  const title = isFill ? "Fill & Sign" : "Sign PDF";
  const description = isFill
    ? "Complete interactive PDF fields, upload your signature image and optionally add a certificate-backed digital signature."
    : "Place your signature image and apply an authorized PAdES digital signature using your PFX / P12 certificate.";

  React.useEffect(() => () => { if (signaturePreview) URL.revokeObjectURL(signaturePreview); }, [signaturePreview]);

  const pickPdf = async (next?: File) => {
    if (!next) return;
    setError(""); setNotice(""); setFile(null); setFields([]); setValues({});
    if (!next.name.toLowerCase().endsWith(".pdf") || next.size > 60 * 1024 * 1024) {
      setError("Choose a PDF file up to 60 MB."); return;
    }
    try {
      const pdf = await PDFDocument.load(await next.arrayBuffer());
      setFile(next); setPage("1"); setPageCount(pdf.getPageCount());
      if (isFill) {
        const form = pdf.getForm();
        const detected = form.getFields().map((field) => {
          const raw = field as unknown as { constructor: { name: string }; getOptions?: () => string[] };
          return { name: field.getName(), type: raw.constructor.name, options: raw.getOptions?.() ?? [] };
        }).filter((field) => !["PDFSignature", "PDFButton"].includes(field.type));
        setFields(detected);
        setValues(Object.fromEntries(detected.map((field) => [field.name, ""])));
        if (!detected.length) setNotice("No interactive AcroForm fields were found. You can still place the uploaded signature image.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This PDF could not be opened. It may be encrypted or damaged."); }
  };

  const pickSignature = (next?: File) => {
    if (!next) return;
    const isPng = next.type === "image/png" || next.name.toLowerCase().endsWith(".png");
    const isJpg = next.type === "image/jpeg" || /\.(jpe?g)$/i.test(next.name);
    if (!isPng && !isJpg) { setError("Signature image must be PNG or JPG/JPEG."); return; }
    if (next.size > 8 * 1024 * 1024) { setError("Signature image must be 8 MB or smaller."); return; }
    setError(""); setSignatureImage(next);
    setSignaturePreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(next); });
  };

  const pickCertificate = (next?: File) => {
    if (!next) return;
    if (!/\.(p12|pfx)$/i.test(next.name)) { setError("Choose a PKCS#12 certificate file with .p12 or .pfx extension."); return; }
    if (next.size > 8 * 1024 * 1024) { setError("The PFX/P12 certificate must be 8 MB or smaller."); return; }
    setError(""); setCertificate(next);
  };

  const reset = () => {
    setFile(null); setSignatureImage(null); setCertificate(null); setCertificatePassword(""); setFields([]); setValues({}); setPageCount(0); setError(""); setNotice("");
    setSignaturePreview((old) => { if (old) URL.revokeObjectURL(old); return ""; });
    if (pdfInput.current) pdfInput.current.value = "";
    if (signatureInput.current) signatureInput.current.value = "";
    if (certInput.current) certInput.current.value = "";
  };

  const process = async () => {
    if (!file || busy) return;
    if (!signatureImage) { setError("Upload a PNG or JPG image of the signer's signature."); return; }
    if (mode === "sign" && !certificate) { setError("Sign PDF requires an authorized .p12/.pfx certificate for a cryptographic PAdES signature."); return; }
    if (certificate && !certificatePassword) { setError("Enter the password for the uploaded P12/PFX certificate."); return; }
    if (!Number.isInteger(Number(page)) || Number(page) < 1 || Number(page) > pageCount) { setError(`Enter a page number from 1 to ${pageCount}.`); return; }
    setBusy(true); setError(""); setNotice(""); setStatus("Preparing the PDF and signature image");
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = pdf.getPages();
      const target = pages[Number(page) - 1];
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

      setStatus("Embedding visible signature image");
      const imageBytes = new Uint8Array(await signatureImage.arrayBuffer());
      const signature = signatureImage.type === "image/png" || signatureImage.name.toLowerCase().endsWith(".png")
        ? await pdf.embedPng(imageBytes)
        : await pdf.embedJpg(imageBytes);
      const { width, height } = target.getSize();
      const targetWidth = Math.max(75, Math.min(width * (signatureWidth / 100), 360));
      const targetHeight = targetWidth * signature.height / signature.width;
      const margin = 34;
      const x = position.endsWith("right") ? Math.max(margin, width - targetWidth - margin) : margin;
      const y = position.startsWith("top") ? Math.max(margin, height - targetHeight - margin) : margin;
      target.drawImage(signature, { x, y, width: targetWidth, height: targetHeight });

      const bytes = await pdf.save({ useObjectStreams: true });
      let blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      if (!blob.size) throw new Error("The filled PDF output is empty.");
      let outputName = `${file.name.replace(/\.pdf$/i, "")}-${isFill ? "filled-signed" : "signed"}.pdf`;

      if (certificate) {
        setStatus("Applying certificate-backed PAdES digital signature");
        const body = new FormData();
        body.append("action", "sign");
        body.append("file", new File([blob], outputName, { type: "application/pdf" }));
        body.append("certificate", certificate, certificate.name);
        body.append("certificatePassword", certificatePassword);
        body.append("signerName", signerName.trim() || "Authorized signer");
        body.append("reason", reason);
        body.append("location", location);
        const response = await fetch("/api/pdf/engine", { method: "POST", body });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || `PAdES signing failed (HTTP ${response.status}). Check the PDF engine and certificate.`);
        }
        blob = await response.blob();
        if (blob.size < 8 || blob.type && !blob.type.includes("pdf")) throw new Error("The signing engine did not return a valid PDF.");
        outputName = `${file.name.replace(/\.pdf$/i, "")}-pades-signed.pdf`;
        setNotice("A certificate-backed PAdES signature was applied after the visible signature image. Validate the signature panel in a PDF reader. Trust depends on the issuing certificate chain and recipient's trust store.");
      } else {
        setNotice("A visible signature image was placed on the PDF. This is not a cryptographic digital signature; use an authorized PFX/P12 certificate for PAdES signing.");
      }
      saveBlob(blob, outputName);
      setStatus("Download started");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not process this PDF."); }
    finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-muted/20">
    <ToolPageHeader title={title} description={description}/>
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8">
        <input ref={pdfInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void pickPdf(event.target.files?.[0])}/>
        <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => pdfInput.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 py-3 text-sm font-extrabold text-white"><UploadCloud size={18}/>Choose PDF</button>{file && <div className="min-w-0 flex-1 rounded-xl bg-muted/30 px-4 py-3"><p className="truncate text-sm font-bold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · {pageCount} pages</p></div>}{file && <button type="button" onClick={reset} aria-label="Reset" className="rounded-lg border border-border p-3 text-muted-foreground hover:text-red-600"><X size={17}/></button>}</div>
        {isFill && fields.length > 0 && <div className="mt-6 rounded-2xl border border-border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">Interactive PDF form fields</h3><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">{fields.length} fields</span></div><div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <label key={field.name} className="block text-xs font-bold">{field.name}<div className="mt-2">{field.type === "PDFCheckBox" ? <select value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="">Leave unchanged</option><option value="true">Checked</option><option value="false">Unchecked</option></select> : (field.type === "PDFDropdown" || field.type === "PDFRadioGroup" || field.type === "PDFOptionList") && field.options.length ? <select value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="">Choose…</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="Enter value"/>}</div></label>)}</div><label className="mt-4 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={flatten} onChange={(event) => setFlatten(event.target.checked)} className="accent-primary"/>Flatten filled form fields after filling</label></div>}

        <div className="mt-6 rounded-2xl border border-border p-4"><div className="flex items-center gap-2"><ImagePlus className="text-primary" size={19}/><h3 className="font-extrabold">Upload visible signature image</h3></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Use a transparent PNG for the cleanest result, or a JPG/JPEG signature image. This replaces the old typed/drawn signature pad.</p><input ref={signatureInput} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event) => pickSignature(event.target.files?.[0])} className="mt-4 block w-full text-xs"/>{signaturePreview && <div className="mt-4 flex min-h-32 items-center justify-center rounded-xl border border-border bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] p-4"><img src={signaturePreview} alt="Uploaded signature preview" className="max-h-24 max-w-full object-contain"/></div>}{signatureImage && <p className="mt-2 text-xs font-bold text-emerald-700">{signatureImage.name} · {(signatureImage.size / 1024).toFixed(0)} KB</p>}</div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Signer name (certificate metadata)<input value={signerName ?? ""} onChange={(event) => setSignerName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="Certificate holder's name"/></label><label className="text-xs font-bold">Page number<input value={page ?? "1"} onChange={(event) => setPage(event.target.value)} type="number" min="1" max={pageCount || 1} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label><label className="text-xs font-bold">Signature position<select value={position ?? "bottom-right"} onChange={(event) => setPosition(event.target.value as Position)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option></select></label><label className="text-xs font-bold">Signature width: {signatureWidth}%<input type="range" min="15" max="55" step="1" value={signatureWidth} onChange={(event) => setSignatureWidth(Number(event.target.value))} className="mt-3 w-full accent-primary"/></label></div>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5"><div className="flex items-center gap-2"><BadgeCheck className="text-primary" size={19}/><h3 className="font-extrabold">Certificate-backed PAdES digital signature</h3></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{isFill ? "Optional for Fill & Sign." : "Required for Sign PDF."} Upload the authorized signer's PKCS#12 certificate. The private key is processed by the configured server PDF engine; use HTTPS and only a certificate you are authorized to use.</p><input ref={certInput} type="file" accept=".p12,.pfx,application/x-pkcs12" className="mt-4 block w-full text-xs" onChange={(event) => pickCertificate(event.target.files?.[0])}/>{certificate && <p className="mt-2 text-xs font-bold text-emerald-700">{certificate.name} · {(certificate.size / 1024).toFixed(0)} KB</p>}<label className="mt-4 block text-xs font-bold">Certificate password<input value={certificatePassword ?? ""} onChange={(event) => setCertificatePassword(event.target.value)} type="password" autoComplete="off" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" placeholder="Password for P12 / PFX"/></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Signing reason<input value={reason ?? "Document approval"} onChange={(event) => setReason(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label><label className="text-xs font-bold">Signing location<input value={location ?? ""} onChange={(event) => setLocation(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"/></label></div></div>

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}{notice && <div role="status" className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">{notice}</div>}{busy && <p className="mt-5 text-sm font-bold text-primary"><Loader2 size={16} className="mr-2 inline animate-spin"/>{status}</p>}
        <button type="button" onClick={() => void process()} disabled={!file || !signatureImage || busy || (mode === "sign" && !certificate)} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-5 py-4 font-extrabold text-white shadow-xl shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"><FileSignature size={19}/>{busy ? "Processing…" : certificate ? "Apply visible signature + PAdES" : "Place signature image & download"}</button>
      </section>
      <aside className="space-y-4"><div className="rounded-2xl border border-border bg-background p-5"><ShieldCheck size={20} className="text-primary"/><h3 className="mt-3 font-extrabold">Visible vs digital signature</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">The uploaded image is visible page artwork. The PFX/P12 certificate adds a cryptographic PAdES signature that PDF readers can validate. A visible image alone is not a digital certificate signature.</p></div><div className="rounded-2xl border border-border bg-background p-5"><h3 className="font-extrabold">Certificate trust</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Trust depends on the issuing certificate chain and PDF reader. A self-signed certificate is normally shown as untrusted. PAdES does not by itself guarantee acceptance by every authority or replace a regulated eSign/DSC process.</p></div><div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5"><p className="font-extrabold">Protect your certificate</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Only the certificate holder or an authorized person should use the PFX and password. Ask the certificate owner/adult supervisor to oversee signing and billing where required. Do not send certificate files or passwords through chat or commit them to Git.</p></div></aside>
    </div></main>
  </div>;
}
