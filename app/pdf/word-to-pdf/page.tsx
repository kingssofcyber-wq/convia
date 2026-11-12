"use client";

import * as React from "react";
import { FileText, Loader2, UploadCloud, Download } from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";

export default function WordToPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    try {
      // @ts-ignore
      const mammoth = (await import("mammoth")).default;
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Mammoth Word को HTML में बदलता है (इमेजेस के साथ)
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      // हम एक अदृश्य div बनाते हैं ताकि स्टाइल्स लोड हो सकें
      const element = document.createElement("div");
      element.innerHTML = result.value;
      element.style.padding = "40px";
      element.style.fontFamily = "Arial, sans-serif";
      
      // इमेजेस को ब्लॉक साइज़ दें
      const images = element.querySelectorAll("img");
      images.forEach(img => {
        img.style.maxWidth = "100%";
        img.style.height = "auto";
      });

      document.body.appendChild(element);

      const opt = {
        margin: 0.5,
        filename: file.name.replace(".docx", ".pdf"),
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      
      document.body.removeChild(element);
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".docx", ".pdf");
      a.click();
    } catch (err) {
      console.error(err);
      alert("Error converting Word. Please ensure it is a valid .docx file.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <ToolHeader title="Word to PDF" description="Convert Word documents to PDF." icon={FileText} />
      <main className="container max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-background rounded-3xl border border-border/60 shadow-xl p-8 text-center">
          <div className="border-2 border-dashed border-border rounded-2xl p-10 mb-6">
            <UploadCloud className="w-12 h-12 text-primary mx-auto mb-4" />
            <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary cursor-pointer" />
          </div>
          <Button onClick={handleConvert} disabled={!file || isConverting} className="w-full gradient-primary text-white h-12">
            {isConverting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
            Convert to PDF
          </Button>
        </div>
      </main>
    </div>
  );
}