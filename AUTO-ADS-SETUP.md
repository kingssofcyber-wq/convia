# Convia: Site-wide Google AdSense Auto Ads (Next.js App Router)

## 1) Keep the AdSense script in the root layout only

Your `app/layout.tsx` is shared by all App Router pages. Keep exactly one AdSense loader there. You already shared this layout earlier, so add/keep this once inside `<body>` (or `<head>` if your current layout places it there):

```tsx
import Script from "next/script";

// Inside RootLayout, only once:
<Script
  id="google-adsense"
  async
  strategy="afterInteractive"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7776844434912624"
  crossOrigin="anonymous"
/>
```

Do NOT put another copy in each `page.tsx`, `Navbar`, or ad component. Do NOT call `adsbygoogle.push({})` to trigger Auto Ads. `push({})` is for a manual `<ins class="adsbygoogle">` unit, not a documented Auto Ads route-change trigger.

## 2) Enable Auto Ads in AdSense

1. Open AdSense → Ads → By site.
2. Select the Convia site entry (the site that Google has approved).
3. Open Edit / Ad settings.
4. Turn **Auto ads** ON.
5. In-page formats: enable Banner and (if appropriate) Multiplex.
6. Overlay formats: enable Anchor and Vignette; enable Side rails for wide desktop screens if offered for your account/site.
7. If you already use manual `<AdSense adSlot=... />` components, enable **Allow Google to optimize existing ads** if you want Google to consider those placements with Auto Ads. Do not duplicate the same manual slot.
8. Review the preview, then choose **Apply to site → Apply now → Save**.

Auto Ads chooses eligible positions using page content, layout, available ad demand and your Ad settings. It does not guarantee an ad on every page or every visit. Very short utility/upload/result pages may receive fewer or no placements; avoid putting ads beside upload, download, or action buttons.

## 3) Next.js client-side navigation note

The root-layout script is present for every route, but Next.js `<Link>` transitions are client-side and do not reload the document. Google documents Auto Ads as a page-level script, but it does not document an `adsbygoogle.push()` call to re-run Auto Ads after each SPA route transition.

If testing shows Auto Ads only re-evaluates after a full page load, use ordinary same-origin anchors for the main route navigation links that should perform a full document navigation:

```tsx
// Instead of <Link href="/pdf/compress">Compress PDF</Link>
<a href="/pdf/compress">Compress PDF</a>
```

Use this only for actual page navigation links (navbar/tool cards). Keep `href="#pdf-tools"` for same-page anchors, and keep download buttons/forms as they are. Native anchors cause a full navigation, so the global AdSense script initializes on each destination page. This may make navigation slightly slower than Next.js client routing.

Never manually refresh or repeatedly push ad requests on each route just to force impressions. Follow AdSense policies and allow Google to decide whether and where an ad can be served.

## 4) Ad account age

AdSense account ownership and payment settings must be handled by an adult account holder (18+). Do not enter a minor's details as an adult or bypass Google's age checks.
