# Existing Supabase Ad Manager integration

This redesign does not include a second AdSense loader or a second admin system.

If you have already installed the Supabase Central AdSense Manager, keep these files as-is:
- `components/ads/ad-zone.tsx`
- `app/api/ads/config/route.ts`
- `app/api/ads/admin/units/route.ts`
- `app/api/ads/admin/units/[id]/route.ts`
- `lib/ads/*` and `lib/supabase/*`
- Supabase SQL schema and Hostinger environment variables

Merge the existing zones into the new `app/layout.tsx` root wrapper like this:

```tsx
import { AdZone } from "@/components/ads/ad-zone";

<div className="app-root">
  <SiteHeader />
  <AdZone zone="after-header" />
  <main id="main-content" className="app-main">{children}</main>
  <AdZone zone="before-footer" />
  <SiteFooter />
</div>
```

The side-left and side-right zones can be inserted in a desktop grid around `<main>`, but ensure their CSS has a real width and they are not rendered while hidden. On the homepage, add `<AdZone zone="home-after-hero" />` after the hero. In an existing PDF processor, add `<AdZone zone="pdf-after-tool" />` only once at a sensible position, away from upload/process/download controls.

The global AdSense script must exist exactly once. Auto Ads formats such as Anchor and Vignette remain controlled in AdSense → Ads → By site, not by pasting Auto Ads scripts into this manager.
