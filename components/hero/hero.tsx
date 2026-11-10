import { Search, ShieldCheck, Zap, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-28 pb-16 text-center overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full animate-pulse duration-10000" />
        <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[130px] rounded-full animate-pulse delay-1000 duration-10000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="container max-w-6xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="w-4 h-4" />
          <span>All-in-One Digital Toolkit</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          Every tool you need.
          <br />
          <span className="gradient-text">Zero hassle.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 leading-relaxed">
          Merge PDFs, calculate loans, and check your health — all in one place. Fast, free, and completely private.
        </p>

        {/* Huge Premium Search Bar */}
        <div className="relative max-w-3xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl overflow-hidden p-2">
            <Search className="w-6 h-6 text-muted-foreground ml-4" />
            <input 
              type="text" 
              placeholder="Search for any tool... (e.g. Merge, EMI, BMI)" 
              className="w-full bg-transparent px-4 py-4 outline-none text-lg placeholder:text-muted-foreground/60"
            />
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold transition-all flex items-center gap-2">
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground animate-in fade-in duration-1000">
          <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" /> 100% Private</div>
          <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Lightning Fast</div>
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> No Watermarks</div>
        </div>
      </div>
    </section>
  );
}