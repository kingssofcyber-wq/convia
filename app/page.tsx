import { Hero } from "@/components/home/hero";
import { ToolGrid } from "@/components/home/tool-grid";
import { AdSense } from "@/components/ads/adsense"; // <-- इम्पोर्ट करें

export default function Home() {
  return (
    <>
      <Hero />
      
      {/* हीरो सेक्शन के नीचे एक Ad */}
      <div className="container max-w-5xl">
         <AdSense adSlot="4116852365" /> {/* यहाँ AdSense डैशबोर्ड से मिली Slot ID डालें */}
      </div>

      <section className="container pb-20">
        <ToolGrid />
      </section>
    </>
  );
}