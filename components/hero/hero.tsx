import { Search, ShieldCheck, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 text-center overflow-hidden">
      {/* Premium Background Glow */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container max-w-5xl mx-auto px-4">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/50 border border-primary/20 backdrop-blur-md text-sm font-semibold text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="w-4 h-4" />
          <span>The only toolbox you'll ever need</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          One Platform.
          <br />
          <span className="gradient-text">Infinite Possibilities.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          Merge PDFs, calculate EMIs, check health scores, and more. 
          Fast, free, and completely private — all running securely in your browser.
        </p>

        {/* Premium Search Bar (Fake UI for now) */}
        <div className="relative max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative flex items-center bg-background border border-border/50 rounded-full shadow-2xl overflow-hidden p-2">
            <Search className="w-6 h-6 text-muted-foreground ml-4" />
            <input 
              type="text" 
              placeholder="Search for any tool... (e.g. Compress, EMI, BMI)" 
              className="w-full bg-transparent px-4 py-3 outline-none text-lg placeholder:text-muted-foreground/70"
            />
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-all">
              Search
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground animate-in fade-in duration-1000">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            100% Private
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Lightning Fast
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            No Watermarks
          </div>
        </div>
      </div>
    </section>
  );
}