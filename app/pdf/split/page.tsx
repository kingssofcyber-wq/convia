"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, CheckCircle2, Scissors, Lock, FileText, X, ChevronRight } from "lucide-react";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { splitPDF } from "@/lib/pdf/split";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";

export default function SplitPdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [pdfPages, setPdfPages] = React.useState<number>(0);
  const [fileSize, setFileSize] = React.useState<number>(0);
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ url: string; name: string; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const MAX_FREE_PAGES = 5;
  const isOverLimit = pdfPages > MAX_FREE_PAGES;

  // फाइल अपलोड होने पर उसके पेज और साइज़ चेक करें
  React.useEffect(() => {
    const getPageCount = async () => {
      if (files.length === 0) {
        setPdfPages(0);
        setFileSize(0);
        return;
      }
      try {
        const arrayBuffer = await files[0].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setPdfPages(pdf.getPageCount());
        setFileSize(files[0].size);
      } catch (err) {
        setError("Could not read the PDF. It might be password protected.");
      }
    };
    getPageCount();
  }, [files]);

  const handleSplit = async () => {
    if (files.length === 0 || isOverLimit) return;

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
      const splitResult = await splitPDF(files[0]);
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        const url = URL.createObjectURL(splitResult.blob);
        setResult({ url, name: splitResult.fileName, total: splitResult.totalPages });
        setIsProcessing(false);
      }, 600);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Premium Colorful Header */}
      <header className="relative bg-gradient-to-r from-primary to-violet-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full"></div>
        
        <div className="container max-w-5xl mx-auto px-4 py-12 relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors bg-black/10 hover:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tools
          </Link>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md shadow-inner border border-white/20">
              <Scissors className="w-10 h-10 text-white" />
            </div>
            {/* Large Tool Name */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-sm">
              Split PDF
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl">
              Extract individual pages from your PDF and download them as a single ZIP file.
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12 -mt-8 relative z-20">
        <div className="bg-background rounded-3xl border border-border shadow-2xl shadow-primary/5 overflow-hidden">
          
          {isProcessing ? (
            /* Processing State */
            <div className="flex flex-col items-center justify-center py-32 px-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-muted rounded-full"></div>
                <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <Scissors className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-2xl font-bold mb-6">Splitting pages...</h2>
              
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm font-semibold mb-2 text-muted-foreground">
                  <span>Creating ZIP file</span>
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
            /* Success State */
            <div className="flex flex-col items-center text-center py-20 px-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Successfully Split!</h2>
              <p className="text-muted-foreground mb-8">Your PDF was split into {result.total} individual pages.</p>
              
              <div className="flex items-center gap-4 p-5 bg-muted/40 border border-border rounded-2xl w-full max-w-md mb-8 text-left">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{result.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="bg-background px-2 py-0.5 rounded border">{result.total} Files (ZIP)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button size="lg" className="flex-1 gradient-primary text-white shadow-lg shadow-primary/30" asChild>
                  <a href={result.url} download={result.name}>
                    <Download className="mr-2 h-5 w-5" /> Download ZIP
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={() => { setFiles([]); setResult(null); setPdfPages(0); }}>
                  Split Another
                </Button>
              </div>
            </div>
          ) : (
            /* Upload & File Details State */
            <div className="p-6 md:p-10">
              
              {files.length === 0 ? (
                <div className="animate-in fade-in duration-500">
                  <FileDropzone 
                    files={files} 
                    onFilesChange={setFiles} 
                    maxFiles={1} 
                    title="Select 1 PDF file to split"
                    subtitle="or drag and drop it here"
                  />
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  
                  {/* File Info Card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-muted/30 border border-border rounded-2xl gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="w-7 h-7 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-lg text-foreground truncate">{files[0].name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{(fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="font-semibold text-primary">{pdfPages} Pages</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={() => setFiles([])}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Free Limit Check */}
                  {isOverLimit ? (
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
                      <div>
                        <p className="text-lg font-bold text-primary flex items-center gap-2">
                          <Lock className="w-5 h-5" /> Free Limit Exceeded
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your PDF has {pdfPages} pages. Free users can only split up to {MAX_FREE_PAGES} pages.
                        </p>
                      </div>
                      <Button onClick={() => alert("Redirecting to Pricing...")} className="gradient-primary text-white shrink-0 w-full sm:w-auto h-12 px-8">
                        Upgrade to Pro
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> 
                      Ready to split! This will create {pdfPages} separate PDF files.
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4 flex justify-center border-t border-border mt-6">
                    <Button
                      size="lg"
                      className="w-full md:w-auto min-w-[300px] h-14 text-lg gradient-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                      disabled={isOverLimit}
                      onClick={handleSplit}
                    >
                      <Scissors className="mr-2 h-6 w-6" /> Split into {pdfPages} PDFs
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 text-red-600 rounded-xl text-sm border border-red-500/20">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}