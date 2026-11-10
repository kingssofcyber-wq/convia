"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Download, CheckCircle2, FileText, X, Plus, Lock, Combine 
} from "lucide-react";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { mergePDFs } from "@/lib/pdf/merge";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/layout/tool-header";

interface CustomFile {
  file: File;
  id: string;
  pageCount: number;
}

export default function MergePdfPage() {
  const [files, setFiles] = React.useState<CustomFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  
  const [result, setResult] = React.useState<{ url: string; name: string; totalPages: number; size: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const MAX_FREE_FILES = 7;

  // फाइलें अपलोड होने पर उनके पेज काउंट करें
  const handleFilesChange = async (newFiles: File[]) => {
    setIsAnalyzing(true);
    const processedFiles: CustomFile[] = [];

    for (const file of newFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        processedFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          pageCount: pdf.getPageCount(),
        });
      } catch (err) {
        setError(`Could not read "${file.name}". It might be password protected.`);
      }
    }

    setFiles((prev) => [...prev, ...processedFiles]);
    setIsAnalyzing(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 150);

    try {
      const rawFiles = files.map((f) => f.file);
      const merged = await mergePDFs(rawFiles);
      
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        const blob = new Blob([new Uint8Array(merged.bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setResult({
          url,
          name: merged.fileName,
          totalPages: merged.totalPages,
          size: blob.size,
        });
        setIsProcessing(false);
      }, 600);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  const totalPages = files.reduce((acc, curr) => acc + curr.pageCount, 0);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* नया कॉम्पैक्ट हेडर */}
      <ToolHeader 
        title="Merge PDF" 
        description="Combine multiple PDFs into one seamless file." 
        icon={Combine} 
      />

      <main className="container max-w-4xl mx-auto px-4 pb-24 mt-8">
        <div className="bg-background rounded-3xl border border-border shadow-xl shadow-black/5 overflow-hidden">
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-muted rounded-full"></div>
                <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <FileText className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-2xl font-bold mb-6">Merging your files...</h2>
              
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm font-semibold mb-2 text-muted-foreground">
                  <span>Processing</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-primary rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center text-center py-20 px-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Successfully Merged!</h2>
              <p className="text-muted-foreground mb-8">Your new PDF is ready for download.</p>
              
              <div className="flex items-center gap-4 p-5 bg-muted/40 border border-border rounded-2xl w-full max-w-md mb-8 text-left">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{result.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="bg-background px-2 py-0.5 rounded border">{result.totalPages} Pages</span>
                    <span>{(result.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button size="lg" className="flex-1 gradient-primary text-white shadow-lg shadow-primary/30" asChild>
                  <a href={result.url} download={result.name}>
                    <Download className="mr-2 h-5 w-5" /> Download PDF
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={() => { setFiles([]); setResult(null); }}>
                  Merge More Files
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-10">
              {files.length < MAX_FREE_FILES && (
                <div className="mb-8">
                  <FileDropzone 
                    files={[]} 
                    onFilesChange={handleFilesChange} 
                    maxFiles={MAX_FREE_FILES - files.length} 
                  />
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center py-6 text-primary">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  <span className="font-medium">Reading file pages...</span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 text-red-600 rounded-xl text-sm border border-red-500/20 flex items-center gap-2">
                  <X className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Selected Files ({files.length}/{MAX_FREE_FILES})</h3>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Total: {totalPages} Pages
                    </span>
                  </div>

                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div 
                        key={file.id} 
                        className="group flex items-center gap-4 p-4 bg-background border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all animate-in slide-in-from-right-8 fade-in duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                          {index + 1}
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{file.file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {file.pageCount} Pages
                        </div>
                        <button 
                          onClick={() => removeFile(file.id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 mt-6 border-t border-border flex flex-col items-center">
                    <Button
                      size="lg"
                      className="w-full md:w-auto min-w-[300px] h-14 text-lg gradient-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                      disabled={files.length < 2 || isAnalyzing}
                      onClick={handleMerge}
                    >
                      <Plus className="mr-2 h-6 w-6" /> Merge {files.length} PDFs
                    </Button>
                    {files.length < 2 && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Add at least 2 files to merge.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {files.length >= MAX_FREE_FILES && (
                <div className="mt-6 p-5 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-bold text-primary flex items-center gap-2">
                      <Lock className="w-5 h-5" /> Free Limit Reached
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have reached the limit of {MAX_FREE_FILES} files.
                    </p>
                  </div>
                  <Button onClick={() => alert("Redirecting to Pricing Page...")} className="gradient-primary text-white shrink-0 w-full sm:w-auto">
                    Buy Now to Upgrade
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}