"use client";

import * as React from "react";
import { ArrowLeft, Loader2, Download, CheckCircle2, Image as ImageIcon, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { convertImagesToPDF } from "@/lib/pdf/jpg-to-pdf";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/layout/tool-header";

export default function JpgToPdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ url: string; name: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const MAX_FREE_IMAGES = 5;
  const isOverLimit = files.length > MAX_FREE_IMAGES;

  const handleConvert = async () => {
    if (files.length === 0 || isOverLimit) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 150);

    try {
      const converted = await convertImagesToPDF(files);
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        const blob = new Blob([new Uint8Array(converted.bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setResult({ url, name: converted.fileName });
        setIsProcessing(false);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      
      {/* कॉम्पैक्ट हेडर */}
      <ToolHeader 
        title="JPG to PDF" 
        description="Turn multiple images into one clean PDF document." 
        icon={ImageIcon} 
      />

      <main className="container max-w-3xl mx-auto px-4 mt-12">
        <div className="bg-background rounded-3xl border border-border/60 shadow-xl p-6 md:p-10">
          
          {isProcessing ? (
            /* प्रोसेसिंग स्क्रीन */
            <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-muted rounded-full"></div>
                <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <ImageIcon className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-2xl font-bold mb-6">Converting images...</h2>
              
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
            /* रिज़ल्ट स्क्रीन */
            <div className="flex flex-col items-center text-center py-16 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Successfully Converted!</h2>
              <p className="text-muted-foreground mb-8">Your images have been combined into a PDF.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button size="lg" className="flex-1 gradient-primary text-white shadow-lg shadow-primary/30" asChild>
                  <a href={result.url} download={result.name}>
                    <Download className="mr-2 h-5 w-5" /> Download PDF
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={() => { setFiles([]); setResult(null); }}>
                  Convert Another
                </Button>
              </div>
            </div>
          ) : (
            /* अपलोड स्क्रीन */
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              <FileDropzone 
                files={files} 
                onFilesChange={setFiles} 
                maxFiles={MAX_FREE_IMAGES} 
                acceptType="image"
                title="Upload JPG or PNG images"
                subtitle={`Drag & drop your images here. Max ${MAX_FREE_IMAGES} for free.`}
              />

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 text-red-600 rounded-xl text-sm border border-red-500/20 flex items-center gap-2">
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-8 flex flex-col items-center border-t border-border/50 pt-8">
                  
                  {isOverLimit && (
                    <div className="w-full mb-6 p-5 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-bold text-primary flex items-center gap-2">
                          <Lock className="w-5 h-5" /> Free Limit Exceeded
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You selected {files.length} images. Free users can only convert up to {MAX_FREE_IMAGES}.
                        </p>
                      </div>
                      <Button onClick={() => alert("Redirecting to Pricing Page...")} className="gradient-primary text-white shrink-0 w-full sm:w-auto">
                        Buy Now
                      </Button>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full md:w-auto min-w-[250px] h-14 text-lg gradient-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    disabled={isOverLimit}
                    onClick={handleConvert}
                  >
                    <Sparkles className="mr-2 h-6 w-6" /> Convert {files.length} Images to PDF
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