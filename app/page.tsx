import { Hero } from "@/components/home/hero";
import { ToolGrid } from "@/components/home/tool-grid";
import { AdSense } from "@/components/ads/adsense";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. AdSense Banner (Non-intrusive) */}
      <div className="container max-w-5xl mx-auto px-4 mb-12">
        <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-2 flex justify-center">
          {/* आपकी Slot ID यहाँ डाली गई है */}
          <AdSense adSlot="4116852365" /> 
        </div>
      </div>

      {/* 3. Tools Grid Section */}
      <section className="relative pb-24">
        {/* Decorative separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="container max-w-6xl mx-auto px-4 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Explore Our Toolbox</h2>
            <p className="text-muted-foreground">Everything you need, neatly organized in one place.</p>
          </div>
          
          <ToolGrid />
        </div>
      </section>
    </div>
  );
}