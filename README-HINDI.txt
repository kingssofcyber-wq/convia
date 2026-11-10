CONVIA PREMIUM REDESIGN V1

Is ZIP me complete design-system patch hai:
- Transparent Convia logo PNG + SVG
- Shared global header and footer
- Footer center me Convia logo aur uske niche Created by Mivaan Jangra
- Premium homepage, search/filter aur 30 PDF tools list
- Same compact PDF tool hero/header
- Reusable processing progress bar and processing overlay
- Upload dropzone
- Missing PDF routes ke liye Coming Soon page
- Login / Signup placeholder
- Loading, error, not-found pages
- robots.ts and sitemap.ts
- Complete next-chat handout

INSTALL:
1. D:\convia ka backup lein.
2. ZIP extract karein.
3. PATCH folder ke andar ki files ko D:\convia me same paths par merge karein.
4. Existing working PDF tool processors ko overwrite na karein. Unhe common ToolPageHeader/ProcessingProgress se migrate karne ke liye docs/TOOL-PAGE-MIGRATION.md dekhein.
5. Existing Supabase Ad Manager aur global AdSense script ko preserve karein. Duplicate global ads script na add karein.
6. npm run build
7. Local test: npm run dev
8. git status me .env.local ya secrets staged na hon, tab hi push karein.

NOTE: Yeh design patch hai, 30 PDF processors ka replacement nahi. 6 existing processor files package me jaan-bujhkar include nahi ki gayi, taki unki working logic overwrite na ho.
