"use client";

import * as React from "react";
import { extractPositionedPages } from "@/lib/pdf/positioned-extract";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { CheckCircle2, Download, FileText, Languages, Loader2, MessageCircle, Sparkles, UploadCloud } from "lucide-react";

type AssistantMode = "chat" | "summarize" | "translate";
type OcrLanguage = "eng" | "hin" | "eng+hin";
const LANGUAGES = ["Hindi", "English", "Punjabi", "Urdu", "Bengali", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "French", "German", "Spanish", "Arabic", "Chinese", "Japanese"];

export function PdfAssistantWorkspace({ mode }: { mode: AssistantMode }) {
  const input = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [question, setQuestion] = React.useState("");
  const [targetLanguage, setTargetLanguage] = React.useState("Hindi");
  const [useOcr, setUseOcr] = React.useState(true);
  const [ocrLanguage, setOcrLanguage] = React.useState<OcrLanguage>("eng+hin");
  const [answer, setAnswer] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [model, setModel] = React.useState("");
  const [aiConfigured, setAiConfigured] = React.useState<boolean | null>(null);

  const isChat = mode === "chat";
  const isTranslate = mode === "translate";
  const title = isChat ? "Chat with PDF" : isTranslate ? "AI Translate PDF" : "AI Summarize PDF";
  const description = isChat ? "Ask questions about your document and get answers grounded in page references." : isTranslate ? "Translate your PDF text into another language while preserving page order and headings." : "Create an AI-generated overview, key points, names, dates and action items from your PDF.";

  React.useEffect(() => {
    let active = true;
    fetch("/api/pdf/assistant", { method: "GET", cache: "no-store" }).then((response) => response.json()).then((data) => { if (active) setAiConfigured(Boolean(data.configured)); }).catch(() => { if (active) setAiConfigured(false); });
    return () => { active = false; };
  }, []);

  const selectFile = (next?: File) => {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith(".pdf") || next.size > 60 * 1024 * 1024) { setError("Choose a PDF up to 60 MB."); return; }
    setFile(next); setError(""); setAnswer(""); setProgress(0);
  };

  const process = async () => {
    if (!file || busy) return;
    if (isChat && !question.trim()) { setError("Enter a question about your PDF."); return; }
    setBusy(true); setError(""); setAnswer(""); setProgress(2); setPhase("Opening the PDF");
    try {
      const pages = await extractPositionedPages(file, {
        useOcr,
        ocrLanguage,
        onProgress: (value, message) => { setProgress(Math.min(78, Math.max(3, value))); setPhase(message); },
      });
      const text = pages.map((page) => `Page ${page.page}:\n${page.lines.map((line) => line.cells.length > 1 ? line.cells.join(" | ") : line.text).join("\n")}`).join("\n\n").trim();
      if (text.length < 20) throw new Error("No readable text was found. Try another OCR language or a clearer scan.");
      setPhase(isChat ? "Finding an answer in the PDF" : isTranslate ? `Translating into ${targetLanguage}` : "Preparing a grounded summary");
      setProgress(82);
      const response = await fetch("/api/pdf/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: mode, question, targetLanguage, text: text.slice(0, 65000) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `AI processing failed (${response.status}).`);
      setAnswer(String(data.text ?? "")); setModel(String(data.model ?? "Configured AI model")); setProgress(100); setPhase("Result ready");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not process this PDF."); }
    finally { setBusy(false); }
  };

  const downloadText = () => {
    const blob = new Blob([answer], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url;
    link.download = `${file?.name.replace(/\.pdf$/i, "") || "convia"}-${mode}.md`;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return <div className="min-h-screen bg-muted/20">
    <ToolPageHeader title={title} description={description}/>
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
      <section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8">
        <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])}/>
        {!file ? <button type="button" onClick={() => input.current?.click()} className="flex min-h-[230px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-6 text-center hover:border-primary/50"><UploadCloud className="mb-4 text-primary" size={36}/><b className="text-2xl">Upload your PDF</b><span className="mt-2 text-sm text-muted-foreground">Searchable or scanned/image PDFs · up to 60 MB</span><span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose PDF</span></button> : <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4"><FileText className="text-primary" size={24}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={() => { setFile(null); setAnswer(""); if (input.current) input.current.value = ""; }} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold">Change</button></div>}

        {file && <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-muted/10 p-4 sm:grid-cols-2"><div><p className="text-sm font-extrabold">Scanned PDF / OCR</p><label className="mt-3 flex items-start gap-2 text-xs font-semibold"><input type="checkbox" checked={useOcr} onChange={(event) => setUseOcr(event.target.checked)} className="mt-0.5 accent-primary"/>Run OCR automatically on scanned or image-only pages</label><label className="mt-3 block text-xs font-bold">OCR languages<select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value as OcrLanguage)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"><option value="eng+hin">English + Hindi</option><option value="eng">English</option><option value="hin">Hindi</option></select></label></div><div className="rounded-xl bg-primary/[0.04] p-3 text-xs leading-5 text-muted-foreground"><b className="text-foreground">Privacy & AI processing</b><p className="mt-1">Text extracted from your PDF is sent to the site owner's configured AI provider for this request. Do not submit sensitive files unless authorized and comfortable with that processing.</p></div></div>}

        {isChat && <label className="mt-6 block text-xs font-extrabold">Your question<textarea value={question ?? ""} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Example: What are the payment terms and due dates?" className="mt-2 w-full rounded-xl border border-border bg-background p-4 text-sm font-medium"/></label>}
        {isTranslate && <label className="mt-6 block max-w-md text-xs font-extrabold">Translate into<select value={targetLanguage ?? "Hindi"} onChange={(event) => setTargetLanguage(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm">{LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}</select></label>}

        {aiConfigured === false && <div role="status" className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800"><b>AI is not configured on this website yet.</b><p className="mt-1">The site owner must add OPENAI_API_KEY to the server environment and redeploy. The key must never be placed in browser code or a NEXT_PUBLIC variable.</p></div>}
        {busy && <div className="mt-6 rounded-xl bg-primary/5 p-4"><div className="flex justify-between gap-3 text-sm"><span className="font-bold"><Loader2 size={16} className="mr-2 inline animate-spin"/>{phase}</span><b>{progress}%</b></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-primary to-violet-600 transition-all" style={{ width: `${progress}%` }}/></div></div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">{error}</div>}
        {answer && <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.035] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-extrabold"><Sparkles className="text-primary" size={18}/>{isChat ? "Answer from your PDF" : isTranslate ? `Translation · ${targetLanguage}` : "Document summary"}</h3><span className="text-[10px] font-bold text-muted-foreground">{model}</span></div><div className="mt-4 whitespace-pre-wrap text-sm leading-7">{answer}</div><button type="button" onClick={downloadText} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold"><Download size={15}/>Download result</button></div>}
        <button type="button" onClick={() => void process()} disabled={!file || busy || aiConfigured === false || (isChat && !question.trim())} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 p-4 font-extrabold text-white disabled:opacity-50">{busy ? <Loader2 size={18} className="animate-spin"/> : isChat ? <MessageCircle size={18}/> : isTranslate ? <Languages size={18}/> : <Sparkles size={18}/>} {busy ? "Processing…" : isChat ? "Ask PDF" : isTranslate ? "Translate PDF" : "Generate summary"}</button>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">OCR may contain errors on low-quality scans. Check names, figures and dates against the original. AI output may also make mistakes; verify important information.</p>
      </section>
    </main>
  </div>;
}
