"use client";

import * as React from "react";
import { extractPositionedPages } from "@/lib/pdf/positioned-extract";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { CheckCircle2, Download, FileText, Loader2, MessageCircle, Sparkles, UploadCloud } from "lucide-react";

export function PdfAssistantWorkspace({ mode }: { mode: "chat" | "summarize" }) {
  const input = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [model, setModel] = React.useState("");
  const isChat = mode === "chat";
  const title = isChat ? "Chat with PDF" : "AI Summarize";
  const process = async () => {
    if (!file || busy) return;
    if (isChat && !question.trim()) { setError("Enter a question about your PDF."); return; }
    setBusy(true); setError(""); setAnswer(""); setProgress(4); setPhase("Extracting text from PDF");
    try {
      const pages = await extractPositionedPages(file, { onProgress: (value, message) => { setProgress(Math.min(70, value)); setPhase(message); } });
      const text = pages.map((page) => `Page ${page.page}:\n${page.lines.map((line) => line.cells.join(" | ") || line.text).join("\n")}`).join("\n\n").trim();
      if (text.length < 20) throw new Error("No selectable text was found. Run OCR on a scanned PDF, then use this tool.");
      setPhase(isChat ? "Finding an answer in the PDF" : "Preparing a grounded summary"); setProgress(78);
      const response = await fetch("/api/pdf/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: mode, question, text: text.slice(0, 65000) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "AI processing failed.");
      setAnswer(data.text); setModel(data.model || "Configured AI model"); setProgress(100); setPhase("Result ready");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not process this PDF."); }
    finally { setBusy(false); }
  };
  const downloadText = () => { const blob = new Blob([answer], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${file?.name.replace(/\.pdf$/i, "") || "convia"}-${mode}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2500); };
  return <div className="min-h-screen bg-muted/20"><ToolPageHeader title={title} description={isChat ? "Ask grounded questions and receive answers with page references." : "Create an AI-generated overview, key points and action items from your PDF."}/><main className="mx-auto max-w-5xl px-4 pb-24 pt-8"><section className="rounded-3xl border border-border bg-background p-5 shadow-xl sm:p-8"><input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event)=>{const next=event.target.files?.[0];if(next){if(next.size>60*1024*1024){setError("PDF must be 60 MB or less.");return;}setFile(next);setError("");setAnswer("");}}}/>{!file?<button type="button" onClick={()=>input.current?.click()} className="flex min-h-[250px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10 p-6 text-center hover:border-primary/50"><UploadCloud className="mb-4 text-primary" size={34}/><b className="text-2xl">Upload your PDF</b><span className="mt-2 text-sm text-muted-foreground">Searchable text PDFs under 60 MB.</span><span className="mt-5 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 font-bold text-white">Choose PDF</span></button>:<div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4"><FileText className="text-primary" size={24}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size/1024/1024).toFixed(2)} MB</p></div><button type="button" onClick={()=>{setFile(null);setAnswer("");}} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold">Change</button></div>}
      {isChat&&<label className="mt-6 block text-xs font-extrabold">Your question<textarea value={question} onChange={(event)=>setQuestion(event.target.value)} rows={3} placeholder="Example: What are the payment terms and due dates?" className="mt-2 w-full rounded-xl border border-border bg-background p-4 text-sm font-medium"/></label>}
      {busy&&<div className="mt-6 rounded-xl bg-primary/5 p-4"><div className="flex justify-between text-sm"><span className="font-bold"><Loader2 size={16} className="mr-2 inline animate-spin"/>{phase}</span><b>{progress}%</b></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-primary to-violet-600" style={{width:`${progress}%`}}/></div></div>}
      {error&&<div role="alert" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}
      {answer&&<div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.035] p-5"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-extrabold"><Sparkles className="text-primary" size={18}/>{isChat?"Answer from your PDF":"Document summary"}</h3><span className="text-[10px] font-bold text-muted-foreground">{model}</span></div><div className="mt-4 whitespace-pre-wrap text-sm leading-7">{answer}</div><button type="button" onClick={downloadText} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold"><Download size={15}/>Download result</button></div>}
      <button type="button" onClick={()=>void process()} disabled={!file||busy} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 p-4 font-extrabold text-white disabled:opacity-50">{busy?<Loader2 size={18} className="animate-spin"/>:isChat?<MessageCircle size={18}/>:<Sparkles size={18}/>} {busy?"Processing…":isChat?"Ask PDF":"Generate summary"}</button>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Privacy notice: this tool sends the extracted PDF text (not the original PDF file) to the AI provider configured by the site owner. Do not submit sensitive documents unless you are comfortable with that provider's data handling.</p>
    </section></main></div>;
}
