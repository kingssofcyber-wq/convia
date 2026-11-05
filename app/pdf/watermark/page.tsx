"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, CheckCircle2, Droplet, Lock } from "lucide-react";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { addWatermark } from "@/lib/pdf/watermark";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WatermarkPdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [pdfPages, setPdfPages] = React.useState<number>(0);
  
  // वॉटरमार्क सेटिंग्स
  const [text, setText] = React.useState("CONFIDENTIAL");
  const [opacity, setOpacity] = React.useState(0.3);
  const [fontSize, setFontSize] = React.useState(60);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ url: string; name: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const MAX_FREE_PAGES = 5;
  const isOverLimit = pdfPages > MAX_FREE_PAGES;

  // जब फाइल अपलोड हो तो पेज काउंट चेक करें
  React.useEffect(() => {
    const getPageCount = async () => {
      if (files.length === 0) {
        setPdfPages(0);
        return;
      }
      try {
        const arrayBuffer = await files[0].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setPdfPages(pdf.getPageCount());
      } catch (err) {
        setError("Could not read the PDF. It might be password protected.");
      }
    };
    getPageCount();
  }, [files]);

  const handleWatermark = async () => {
    if (files.length === 0 || isOverLimit || !text) return;

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
      const watermarked = await addWatermark(files[0], text, opacity, fontSize);
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        const blob = new Blob([new Uint8Array(watermarked.bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setResult({ url, name: watermarked.fileName });
        setIsProcessing(false);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10 min-h-[80vh]">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Add Watermark</h1>
        <p className="text-muted-foreground">Stamp your PDF with a custom text or logo.</p>
      </div>

      <div className="bg-muted/30 border border-border p-6 md:p-8 rounded-3xl shadow-sm">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in duration-300">
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-muted-foreground">Adding watermark...</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                </div>
              </div>
            </div>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !result ? (
          <>
            <FileDropzone files={files} onFilesChange={setFiles} maxFiles={1} />
            
            {files.length > 0 && !isOverLimit && (
              <div className="mt-6 space-y-4 animate-in fade-in">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Watermark Text</label>
                  <Input
                    type="text"
                    placeholder="e.g. CONFIDENTIAL"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={20}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Opacity ({Math.round(opacity * 100)}%)</label>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1" 
                      value={opacity} 
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Font Size ({fontSize}px)</label>
                    <input 
                      type="range" 
                      min="20" 
                      max="100" 
                      step="10" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>

                <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg text-sm font-medium">
                  Ready to watermark. This PDF has {pdfPages} pages.
                </div>
              </div>
            )}

            {isOverLimit && (
              <div className="mt-6 p-5 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-primary flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Free Limit Exceeded
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your PDF has {pdfPages} pages. Free users can only watermark up to {MAX_FREE_PAGES} pages.
                  </p>
                </div>
                <Button onClick={() => alert("Redirecting to Pricing Page...")} className="gradient-primary text-white shrink-0 w-full sm:w-auto">
                  Buy Now to Upgrade
                </Button>
              </div>
            )}

            {error && <div className="mt-4 p-3 bg-red-500/10 text-red-600 rounded-lg text-sm">{error}</div>}
            
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="w-full md:w-auto min-w-[250px] text-base gradient-primary text-white"
                disabled={files.length === 0 || isOverLimit || !text}
                onClick={handleWatermark}
              >
                <Droplet className="mr-2 h-5 w-5" /> Add Watermark
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Watermark Added!</h2>
            <p className="text-muted-foreground mb-8">Your PDF has been successfully stamped.</p>
            
            <div className="flex gap-4">
              <Button size="lg" className="gradient-primary text-white" asChild>
                <a href={result.url} download={result.name}>
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => { setFiles([]); setResult(null); setPdfPages(0); }}>
                Watermark Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}