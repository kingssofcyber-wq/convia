"use client";

import * as React from "react";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, LockKeyhole, Download, Loader2, CheckCircle2, ShieldCheck, X, Eye, EyeOff } from "lucide-react";

type Output = { url: string; name: string; size: number };

export function UnlockPdfWorkspace() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [engineReady, setEngineReady] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [result, setResult] = React.useState<Output | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/pdf/engine", { cache: "no-store" }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (active) setEngineReady(Boolean(data.configured && data.reachable));
    }).catch(() => { if (active) setEngineReady(false); });
    return () => { active = false; };
  }, []);
  React.useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result?.url]);

  const choose = (next?: File) => {
    if (!next) return;
    setError(""); setNotice(""); setResult(null); setPassword("");
    if (!/\.pdf$/i.test(next.name) || next.size > 60 * 1024 * 1024) { setFile(null); setError("Choose a PDF file up to 60 MB."); return; }
    setFile(next);
  };

  const unlock = async () => {
    if (!file || busy) return;
    if (!password) { setError("Enter the correct PDF opening password."); return; }
    setBusy(true); setError(""); setNotice(""); setResult(null);
    try {
      const body = new FormData();
      body.append("action", "unlock");
      body.append("file", file, file.name);
      body.append("password", password);
      const response = await fetch("/api/pdf/engine", { method: "POST", body, cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Unlock failed (${response.status}). Check the password and document-engine connection.`);
      }
      const blob = await response.blob();
      if (blob.size < 8 || blob.type && !blob.type.includes("pdf")) throw new Error("The PDF engine did not return a valid PDF.");
      const name = `${file.name.replace(/\.pdf$/i, "")}-unlocked.pdf`;
      setResult({ url: URL.createObjectURL(blob), name, size: blob.size });
      setNotice("The PDF was opened with the password you supplied and saved without its opening password.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not unlock this PDF.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  };

  const reset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null); setFile(null); setPassword(""); setError(""); setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <ToolHeader title="Unlock PDF" description="Remove PDF opening encryption when you have the correct password and permission to modify the file." icon={LockKeyhole}/>
      <main className="container mx-auto mt-8 grid max-w-5xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-border/60 bg-background p-5 shadow-xl sm:p-7">
          {!file ? <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files?.[0]); }} className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-7 text-center hover:border-primary/60 hover:bg-primary/5"><span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadCloud size={32}/></span><h2 className="text-2xl font-extrabold">Upload protected PDF</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Choose the PDF you are authorized to unlock. Maximum 60 MB.</p><Button type="button" className="mt-6 gradient-primary text-white" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Choose PDF file</Button></div> : <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-red-500/10 text-red-500"><FileText/></span><div className="min-w-0 flex-1"><p className="truncate font-bold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={reset} aria-label="Remove PDF" className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><X size={18}/></button></div>
            <label className="block text-sm font-bold">PDF opening password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12" placeholder="Enter the correct password"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
            {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700">{notice}</p>}
            <Button type="button" disabled={busy || !password} onClick={() => void unlock()} className="h-13 w-full gradient-primary text-white">{busy ? <><Loader2 className="mr-2 animate-spin"/>Unlocking PDF…</> : <><LockKeyhole className="mr-2"/>Unlock with password</>}</Button>
          </div>}
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => choose(e.target.files?.[0])}/>
          {result && <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600"/><div><p className="font-extrabold">Unlocked PDF is ready</p><p className="text-xs text-muted-foreground">{result.name} · {(result.size / 1024 / 1024).toFixed(2)} MB</p></div></div><a href={result.url} download={result.name} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 font-bold text-white"><Download size={17}/>Download unlocked PDF</a><Button variant="outline" className="mt-2 w-full" onClick={reset}>Unlock another PDF</Button></div>}
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-background p-5"><ShieldCheck className="mb-2 text-emerald-600"/><h3 className="font-extrabold">Private, password-based processing</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">The opening password is sent only to your configured Convia PDF engine over the server route. It is not stored in the page or added to the output name.</p><p className="mt-3 text-xs text-muted-foreground">Engine status: {engineReady === null ? "Checking…" : engineReady ? "Connected" : "Not configured or unavailable"}.</p></div>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5"><h3 className="font-extrabold text-amber-800 dark:text-amber-300">Password required</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Convia does not guess, crack or bypass an unknown password. If you do not know it, request access from the document owner or creator.</p></div>
        </aside>
      </main>
    </div>
  );
}
