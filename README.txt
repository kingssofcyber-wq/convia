CONVIA AUTO ADS + COMPRESS PDF UPDATE

A) COMPRESS PDF
1. Replace app/pdf/compress/page.tsx with the file in this package.
2. Make sure @fileslim/compress is version 2.5.0 or newer:
   npm list @fileslim/compress
3. Optional encoder add-ons recommended by the SDK:
   npm install @jsquash/jpeg @jsquash/png @jsquash/webp @jsquash/avif @jsquash/oxipng
4. Run npm run dev, test a copy of a sample PDF, then run npm run build.

B) ADSENSE AUTO ADS
1. Your app/layout.tsx should load the global AdSense script once. A copy-paste snippet is in layout-adsense-snippet.tsx.
2. In AdSense: Ads > By site > Convia > Edit > Auto ads ON.
3. Configure in-page Banner/Multiplex and overlay Anchor/Vignette/Side rails as available.
4. Apply to site and Save.
5. Read AUTO-ADS-SETUP.md for Next.js Link/SPA navigation details.

IMPORTANT
- Auto Ads does not guarantee an ad on every route or every page view. Google chooses eligible positions and may not fill every request.
- Do not call adsbygoogle.push({}) to force Auto Ads on client-side route changes.
- 100% size reduction means a zero-byte file, so the compression page caps target reduction at 95%.
- Maximum compression can reduce image clarity. Keep the original PDF.
- The package was assembled from the previously supplied V3 page. A full build against your local Convia repository has not been run here.
