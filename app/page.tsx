
import { Hero } from "@/components/home/hero";
import { ToolGrid } from "@/components/home/tool-grid";
import { AdSense } from "@/components/ads/adsense";
import { DesktopAdRail } from "@/components/ads/desktop-ad-rail";

// Your existing AdSense banner slot
const HEADER_AD_SLOT = "4116852365";

// Create two separate responsive ad units in AdSense
// and enter their actual slot IDs here later.
const LEFT_RAIL_AD_SLOT = "";
const RIGHT_RAIL_AD_SLOT = "";

export default function Home() {
  return (
    <div className="w-full min-w-0">

      {/* =====================================
          HEADER BANNER AD
          Below Navbar, above Hero
      ====================================== */}

      <section className="w-full min-w-0 px-4 py-5">
        <div className="mx-auto w-full min-w-0 max-w-[970px]">

          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Advertisement
          </p>

          <AdSense
            adSlot={HEADER_AD_SLOT}
            className="convia-top-ad"
          />

        </div>
      </section>


      {/* =====================================
          DESKTOP SIDE RAILS + MAIN CONTENT
      ====================================== */}

      <div
        className="
          mx-auto
          grid
          w-full
          min-w-0
          max-w-[1500px]
          grid-cols-1
          gap-6
          px-4
          xl:grid-cols-[160px_minmax(0,1fr)_160px]
        "
      >

        {/* LEFT DESKTOP AD */}

        <DesktopAdRail
          side="left"
          adSlot={LEFT_RAIL_AD_SLOT}
        />


        {/* MAIN HOMEPAGE CONTENT */}

        <div className="w-full min-w-0">

          {/* Hero */}

          <section className="w-full min-w-0">
            <Hero />
          </section>


          {/* PDF Tools */}

          <section
            id="pdf-tools"
            className="w-full min-w-0 pb-20"
          >
            <ToolGrid />
          </section>

        </div>


        {/* RIGHT DESKTOP AD */}

        <DesktopAdRail
          side="right"
          adSlot={RIGHT_RAIL_AD_SLOT}
        />

      </div>

    </div>
  );
}
