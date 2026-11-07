CONVIA ADSENSE SETUP - COPY/PASTE PACKAGE
Publisher ID configured: ca-pub-7776844434912624

PUT THESE FILES AT THESE EXACT PATHS (relative to the folder containing package.json):
1) lib/adsense.ts
2) app/layout.tsx
3) components/ads/adsense.tsx

If the lib or components/ads folders do not exist, create them.
The app/layout.tsx in this package preserves the ThemeProvider, Navbar and Footer
imports from the code you supplied. It loads the AdSense script exactly once.

IMPORTANT:
- Keep only ONE global adsbygoogle.js script in the application.
- Do not add the global script inside individual ad components or pages.
- In each <AdSense adSlot="..." /> use the Ad Unit slot ID, not the publisher ID.
- Your existing slot 4116852365 remains a slot ID. Confirm it is an active ad unit
  in the same AdSense account before using it.
- Do not upload .env files or secret credentials to GitHub. The publisher ID is
  public by design in the browser-side AdSense integration.
- After replacing files, stop and restart the development server.

Run:
  npm run build

If the build reports an error, share the exact terminal output.
Ad delivery still depends on AdSense site approval, policy status, ad unit setup,
consent requirements where applicable, and Google's ad fill.
