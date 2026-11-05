"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2, Download, CheckCircle2, RotateCw, Trash2, ArrowRight, ArrowLeft as ArrowLeftIcon, LayoutGrid, Lock } from "lucide-react";
import { FileDropzone } from "@/components/pdf/file-dropzone";
import { organizePDF } from "@/lib/pdf/organize";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";

// react-pdf को Dynamic Import करें ताकि Next.js में SSR एरर न आए
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

// Worker सेटअप
import { pdfjs } from "react-pdf";
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PageData {
  id: string;
  originalIndex: number;
  rotation: number;
}

export default function OrganizePdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [numPages, setNumPages] = React.useState<number>(0);
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ url: string; name: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const MAX_FREE_PAGES = 5;
  const isOverLimit = numPages > MAX_FREE_PAGES;

  const onFileLoad = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];
    setFile(selectedFile);
    setPdfUrl(URL.createObjectURL(selectedFile));
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setNumPages(pdf.getPageCount());
    } catch (err) {
      setError("Could not read the PDF.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    const initialPages = Array.from({ length: numPages }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      originalIndex: i,
      rotation: 0,
    }));
    setPages(initialPages);
  };

  const movePage = (index: number, direction: "left" | "right") => {
    const newPages = [...pages];
    if (direction === "left" && index > 0) {
      [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
    } else if (direction === "right" && index < newPages.length - 1) {
      [newPages[index + 1], newPages[index]] = [newPages[index], newPages[index + 1]];
    }
    setPages(newPages);
  };

  const rotatePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + 90) % 360;
    setPages(newPages);
  };

  const removePage = (index: number) => {
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
  };

  const handleOrganize = async () => {
    if (!file || pages.length === 0) return;

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
      const organized = await organizePDF(file, pages);
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        const blob = new Blob([new Uint8Array(organized.bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setResult({ url, name: organized.fileName });
        setIsProcessing(false);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-5xl py-10 min-h-[80vh]">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Organize PDF</h1>
        <p className="text-muted-foreground">Sort, rotate, and delete pages to create your perfect PDF.</p>
      </div>

      <div className="bg-muted/30 border border-border p-6 md:p-8 rounded-3xl shadow-sm">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-300">
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-muted-foreground">Organizing pages...</span>
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
            {!file ? (
              <FileDropzone 
                files={file ? [file] : []} 
                onFilesChange={onFileLoad} 
                maxFiles={1} 
              />
            ) : isOverLimit ? (
               <div className="mt-6 p-5 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-primary flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Free Limit Exceeded
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your PDF has {numPages} pages. Free users can only organize up to {MAX_FREE_PAGES} pages.
                  </p>
                </div>
                <Button onClick={() => alert("Redirecting to Pricing Page...")} className="gradient-primary text-white shrink-0 w-full sm:w-auto">
                  Buy Now to Upgrade
                </Button>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                  {pages.map((page, index) => (
                    <div key={page.id} className="relative group bg-background border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                      
                      <div className="aspect-[1/1.4] bg-white flex items-center justify-center overflow-hidden pointer-events-none p-1">
                        {pdfUrl && (
                          <Document 
                            file={pdfUrl} 
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<Loader2 className="animate-spin text-primary w-6 h-6" />}
                          >
                            <Page 
                              pageNumber={page.originalIndex + 1} 
                              width={150} 
                              rotate={page.rotation}
                              renderTextLayer={false} 
                              renderAnnotationLayer={false} 
                            />
                          </Document>
                        )}
                      </div>
                      
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {index + 1}
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => rotatePage(index)} title="Rotate">
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => movePage(index, "left")} disabled={index === 0} title="Move Left">
                            <ArrowLeftIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => movePage(index, "right")} disabled={index === pages.length - 1} title="Move Right">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removePage(index)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center border-t border-border pt-6">
                  <Button
                    size="lg"
                    className="w-full md:w-auto min-w-[250px] text-base gradient-primary text-white"
                    disabled={pages.length === 0}
                    onClick={handleOrganize}
                  >
                    <LayoutGrid className="mr-2 h-5 w-5" /> Save Organised PDF
                  </Button>
                </div>
              </div>
            )}

            {error && <div className="mt-4 p-3 bg-red-500/10 text-red-600 rounded-lg text-sm">{error}</div>}
          </>
        ) : (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 py-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">PDF Organized!</h2>
            <p className="text-muted-foreground mb-8">Your pages have been successfully rearranged.</p>
            
            <div className="flex gap-4">
              <Button size="lg" className="gradient-primary text-white" asChild>
                <a href={result.url} download={result.name}>
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => { setFile(null); setPdfUrl(null); setResult(null); setNumPages(0); setPages([]); }}>
                Organize Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}