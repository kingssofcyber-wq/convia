'use client';

import Link from "next/link";
import { ToolHeader } from "@/components/layout/tool-header";
import { Table, ArrowLeft, ArrowRight, Clock, Sparkles, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExcelToPdfPage() {
  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      
      {/* 1. सही किया हुआ हेडर */}
      <ToolHeader 
        title="Excel to PDF" 
        description="Convert spreadsheets into shareable PDF documents." 
        icon={Table} 
      />

      {/* 2. मुख्य कंटेंट */}
      <main className="container max-w-4xl mx-auto px-4 mt-12">
        
        <div className="relative bg-background border border-border/60 rounded-[2rem] p-10 md:p-16 text-center shadow-xl overflow-hidden">
          
          {/* बैकग्राउंड ग्लो */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          
          {/* घड़ी का आइकॉन */}
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse relative z-10">
            <Clock className="w-12 h-12 text-primary" />
          </div>

          {/* बैज */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs font-bold tracking-widest uppercase mb-6 relative z-10">
            <Sparkles className="w-4 h-4" /> In the Workspace Roadmap
          </div>

          {/* टाइटल और डिस्क्रिप्शन */}
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 relative z-10">
            Excel to PDF is coming soon.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 relative z-10">
            We are preparing this tool with a clear workflow and reliable output. This page is a preview; file processing is not enabled yet.
          </p>

          {/* बटन्स */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 mb-12">
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-xl gradient-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-xl border-border/60 hover:bg-muted/50">
              Check back for updates
            </Button>
          </div>

          {/* इन्फो बॉक्स */}
          <div className="max-w-md mx-auto p-4 bg-muted/40 border border-border/50 rounded-xl flex items-start gap-3 text-left relative z-10">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              We will mark this tool as <span className="font-bold text-green-600">Available</span> when its processing flow is completely ready.
            </p>
          </div>
        </div>

        {/* अन्य टूल्स का लिंक */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between p-6 bg-background border border-border/60 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Need another PDF tool?</h3>
              <p className="text-sm text-muted-foreground">Explore the tools that are already available.</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-primary font-bold">
              Explore tools <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}