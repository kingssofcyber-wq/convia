# If you do not want to replace app/layout.tsx

Keep your existing providers, Navbar, Footer, metadata, fonts and other scripts. Merge only these changes.

## Add imports

```tsx
import { SitewideAdPlacements } from "@/components/ads/sitewide-ad-placements";
import "./adsense-layout.css";
```

## Add the AdSense script once, inside `<head>`

```tsx
<head>
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7776844434912624"
    crossOrigin="anonymous"
  />
</head>
```

React 19 supports async external script resources and deduplicates scripts with the same `src`. Do not also keep a second `next/script` loader for the same AdSense URL.

## Place the four ads around the app content

```tsx
<Navbar />
<SitewideAdPlacements position="top" />
<main className="flex-1">{children}</main>
<SitewideAdPlacements position="bottom" />
<Footer />
```

The top placement contains the 728x90 leaderboard. The bottom placement contains responsive display, in-article and multiplex units.

If the existing homepage still has this old manual unit, remove it to avoid an unintended fifth ad:

```tsx
<AdSense adSlot="4116852365" />
```
