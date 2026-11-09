# Convia AdSense integration addendum

Project: Convia, Next.js App Router application
Domain: https://convia.saanwariyasethfashion.com
Publisher ID: ca-pub-7776844434912624

Four supplied manual ad units:
- Multiplex/autorelaxed: 5509141619
- 728x90 fixed leaderboard: 2354911961
- In-article fluid: 7311509571
- Responsive display auto: 2443937103

Implementation files:
- components/ads/adsense-unit.tsx
- components/ads/sitewide-ad-placements.tsx
- app/adsense-layout.css
- merged app/layout.tsx

A single native async AdSense loader is installed in the root layout. SitewideAdPlacements renders one desktop-only 728x90 ad under the Navbar and three responsive units after page content before the Footer. The route component suppresses ads on login/signup/admin/API and the known unimplemented/Coming Soon PDF routes.

The old homepage ad slot 4116852365 should be removed if the four new units are used, unless the owner intentionally wants a fifth ad and has checked ad density.

Auto Ads overlay formats (Anchor, Vignette, Side Rail) are configured separately in AdSense dashboard; no custom pop-up is coded.

Before production:
1. Verify all four slot IDs are active in AdSense.
2. Check whether the site has a required consent message / CMP for its visitor regions.
3. Test mobile and desktop ad widths.
4. Verify each slot is pushed once per DOM element.
5. Do not place ads beside Upload, Compress, Extract or Download controls.
6. Do not render ads on no-content or Coming Soon pages.
7. Run the full project build and test after merging, because this patch package does not contain the user's latest full repository.
