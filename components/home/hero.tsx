import { Sparkles, FileText, Combine, Lock } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 bg-background/50">
        <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/20 blur-[120px] rounded-full animate-pulse duration-10000" />
        <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-violet-500/20 blur-[100px] rounded-full animate-pulse delay-1000 duration-10000" />
      </div>

      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm text-xs font-bold text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-4 h-4" />
              <span>ONE WORKSPACE. INFINITE POSSIBILITIES.</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 leading-[1.1]">
              Every tool you need.<br />
              <span className="gradient-text">Zero hassle.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              Powerful PDF tools, financial calculators, and everyday utilities — thoughtfully brought together in one simple workspace.
            </p>
          </div>

          {/* Right Visual (Premium Logo & Creator Name) */}
          <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-10 duration-1000">
            
            {/* Main Glassmorphism Card */}
            <div className="relative z-10 bg-background/60 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center justify-center text-center overflow-hidden">
              
              {/* Internal Glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full pointer-events-none" />

              {/* Convia Logo Icon */}
              <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-6 animate-in zoom-in duration-700">
                <span className="text-5xl font-extrabold">C</span>
              </div>
              
              {/* Convia Text */}
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-12 text-foreground">
                convia
              </h2>
              
              {/* Creator Info */}
              <div className="mt-2 border-t border-border/50 pt-8 w-full">
                <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3">
                  Created by
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 tracking-tight">
                  MIVAAN JANGRA
                </p>
              </div>
            </div>

            {/* Floating Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl shadow-xl flex items-center justify-center rotate-12 animate-bounce duration-3000">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-xl flex items-center justify-center -rotate-12 animate-pulse duration-2000">
              <Combine className="w-6 h-6 text-white" />
            </div>
            
            {/* Glow Behind Mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-violet-500/30 blur-3xl -z-10 transform scale-95"></div>
          </div>

        </div>
      </div>
    </section>
  );
}