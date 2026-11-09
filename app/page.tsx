import { Hero } from "@/components/home/hero";
import { ToolGrid } from "@/components/home/tool-grid";
import { HomeServiceSections } from "@/components/home/home-service-sections";
import { AdSense } from "@/components/ads/adsense";

const HOME_BANNER_SLOT = "4116852365";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-background">
      <section aria-label="Convia introduction">
        <Hero />
      </section>

      {/* Keep this manual unit only if this slot is active in your AdSense account. */}
      <div className="mx-auto mb-10 w-full min-w-0 max-w-5xl px-4">
        <AdSense adSlot={HOME_BANNER_SLOT} className="mx-auto w-full" />
      </div>

      <section className="relative w-full min-w-0 pb-16" aria-labelledby="toolbox-heading">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto w-full min-w-0 max-w-6xl px-4 pt-12 sm:pt-16">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">PDF & document workspace</p>
            <h2 id="toolbox-heading" className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">Explore our toolbox</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Choose an available tool or preview what is coming next. Tools marked Coming Soon are not yet enabled.</p>
          </div>
          <ToolGrid />
        </div>
      </section>

      <HomeServiceSections />
    </div>
  );
}
