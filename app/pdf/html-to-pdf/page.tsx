"use client";

import * as React from "react";
import { Code, Download, Loader2, CheckCircle2 } from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";

export default function HtmlToPdfPage() {
  const [html, setHtml] = React.useState("<!DOCTYPE html>\n<html>\n<head>\n  <style>body { font-family: sans-serif; padding: 20px; } h1 { color: #4f46e5; }</style>\n</head>\n<body>\n  <h1>My Document</h1>\n  <p>Write your HTML here.</p>\n</body>\n</html>");
  const [isConverting, setIsConverting] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      
      // हम HTML को एक अदृश्य div में रेंडर करेंगे ताकि CSS सही से काम करे
      const element = document.createElement("div");
      element.innerHTML = html;
      
      // अगर यूज़र ने पूरा HTML दिया है, तो उसमें से body निकालें
      if (html.includes("<body")) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        element.innerHTML = doc.body.innerHTML;
      }

      element.style.padding = "20px";
      document.body.appendChild(element); // स्टाइल्स के लिए DOM में जोड़ें

      const opt = {
        margin: 0.5,
        filename: `convia-html-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      
      document.body.removeChild(element); // काम खत्म होने पर हटा दें
      
      const url = URL.createObjectURL(pdfBlob);
      setResult(url);
    } catch (err) {
      alert("Failed to convert HTML. Check your code.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <ToolHeader title="HTML to PDF" description="Convert raw HTML code into a clean PDF document." icon={Code} />
      <main className="container max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-background rounded-3xl border border-border/60 shadow-xl p-6 md:p-8">
          {result ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-6">PDF Generated!</h2>
              <Button onClick={() => setResult(null)} variant="outline" className="mr-4">Convert Another</Button>
              <Button asChild className="gradient-primary text-white">
                <a href={result} download="convia-html.pdf">Download PDF</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Paste your HTML code here:</label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-green-400 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  spellCheck={false}
                />
              </div>
              <Button onClick={handleConvert} disabled={isConverting} className="w-full gradient-primary text-white h-12">
                {isConverting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                {isConverting ? "Generating PDF..." : "Convert to PDF"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}