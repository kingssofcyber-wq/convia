# Convia: Install the four AdSense units site-wide

## Your four supplied ad units

Publisher ID: `ca-pub-7776844434912624`

| Type | Slot | Placement in this patch |
|---|---:|---|
| Responsive 728x90 leaderboard | `2354911961` | Below Navbar on desktop (1024px+) |
| Responsive display auto | `2443937103` | After page content |
| In-article fluid | `7311509571` | After page content |
| Multiplex / autorelaxed | `5509141619` | After page content, near Footer |

The supplied fixed 728x90 ad is deliberately hidden below 1024px to avoid overflow on mobile. The other three are responsive.

## Install

1. Make a backup / Git checkpoint before replacing files.
2. Copy `PATCH/components/ads/adsense-unit.tsx` into `D:\convia\components\ads\adsense-unit.tsx`.
3. Copy `PATCH/components/ads/sitewide-ad-placements.tsx` into `D:\convia\components\ads\sitewide-ad-placements.tsx`.
4. Copy `PATCH/app/adsense-layout.css` into `D:\convia\app\adsense-layout.css`.
5. Replace `D:\convia\app\layout.tsx` with the included `PATCH/app/layout.tsx` only if your current layout still uses the same ThemeProvider, Navbar and Footer imports as this file. If yours has additional providers, metadata, consent management or scripts, merge the AdSense additions instead of overwriting those existing features.
6. Remove `import Script from "next/script"` and any previous AdSense loader `<Script ...>` from the old layout. The included layout has one native async script tag. Do not load `adsbygoogle.js` again in individual ad components or pages.
7. Remove the old homepage manual `<AdSense adSlot="4116852365" />` block and its import if you intend to use these four new units. Otherwise an extra fifth unit will appear.
8. Run `npm run build`, then test with `npm run dev`.

## Where ads appear

On eligible routes, the root layout places:
- The fixed 728x90 unit after the Navbar on desktop.
- The responsive display, in-article and multiplex units after the page content and before the Footer.

This automatically covers the Homepage and other eligible routes without adding ad code to each `page.tsx`.

## Routes excluded from manual ad units

The component intentionally suppresses ads on Login, Signup, known Coming Soon / unimplemented routes, admin and API routes. Do not put manual ads on empty/error pages or pages with no meaningful publisher content. If you later complete one of the currently excluded tools, remove its exact route from `NO_ADS_ROUTES` in `sitewide-ad-placements.tsx`.

## Important

- These are the user's exact four publisher / slot values. The code cannot verify whether each slot is still active in the AdSense account.
- The same unit is rendered at most once per route view.
- There is one global AdSense script for the whole application.
- Google decides whether an ad fills. A blank slot does not necessarily indicate a code fault.
- AdSense Auto ads (Anchor / Vignette / Side rail) are configured separately in AdSense → Ads → By site. They are not created by these four manual units.
- Do not create your own forced popup or pop-under ad. Use Google's own Vignette Auto ads if enabled in the account.
- Ads must be visually separated from upload, process, preview and download controls. Never label ads as tools, downloads, resources or buttons.
- Four manual units on every route may be excessive on short utility pages. Monitor AdSense policy / coverage and reduce placements on pages with little useful content. Google only shows Auto ads when they are likely to perform well and provide a good experience.

## Testing checklist

- [ ] The browser Network tab shows one request to `adsbygoogle.js` per full document load.
- [ ] Each eligible page contains only one `ins.adsbygoogle` for each of the four slot IDs.
- [ ] No `availableWidth=0` error occurs.
- [ ] No duplicate `adsbygoogle.push()` occurs for the same `ins` element.
- [ ] Leaderboard is hidden on mobile widths.
- [ ] Coming Soon / Login / Signup pages do not render manual ads.
- [ ] Ad units are not adjacent to file upload, process or download buttons.
- [ ] Production build succeeds.

## AdSense delivery note

An ad slot can remain blank because of no-fill, consent, ad blockers, account restrictions, invalid/inactive slot, limited inventory or content eligibility. Do not click your own ads to test them.
