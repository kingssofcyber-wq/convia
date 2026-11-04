"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, CheckCircle2 } from "lucide-react";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { mergePDFs } from "@/lib/pdf/merge";
import { Button } from "@/components/ui/button";

export default function MergePdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ url: string; name: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleMerge = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // प्रोग्रेस बार सिमुलेशन (शुरुआती 95% तक)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 150);

    try {
      const merged = await mergePDFs(files);
      clearInterval(interval);
      setProgress(100);

      // थोड़ा इंतज़ार करके रिज़ल्ट दिखाएँ ताकि 100% दिखे
      setTimeout(() => {
        const blob = new Blob([new Uint8Array(merged.bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setResult({ url, name: merged.fileName });
        setIsProcessing(false);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10 min-h-[80vh]">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Merge PDF</h1>
        <p className="text-muted-foreground">Combine multiple PDF files into one in seconds.</p>
      </div>

      <div className="bg-muted/30 border border-border p-6 md:p-8 rounded-3xl shadow-sm">
        {/* अगर प्रोसेसिंग चल रही है तो प्रोग्रेस बार दिखाएँ */}
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in duration-300">
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-muted-foreground">Merging your files...</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                </div>
              </div>
            </div>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !result ? (
          <>
            <FileDropzone files={files} onFilesChange={setFiles} maxFiles={7} />
            
            {error && <div className="mt-4 p-3 bg-red-500/10 text-red-600 rounded-lg text-sm">{error}</div>}
            
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="w-full md:w-auto min-w-[250px] text-base gradient-primary text-white"
                disabled={files.length < 2}
                onClick={handleMerge}
              >
                Merge PDFs
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Successfully Merged!</h2>
            <p className="text-muted-foreground mb-8">Your PDF files have been combined.</p>
            
            <div className="flex gap-4">
              <Button size="lg" className="gradient-primary text-white" asChild>
                <a href={result.url} download={result.name}>
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => { setFiles([]); setResult(null); setProgress(0); }}>
                Merge Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}