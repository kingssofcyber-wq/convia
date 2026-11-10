# CONVIA PREMIUM REDESIGN — HINDI INSTALLATION

## ZIP के बारे में

यह एक **PATCH package** है, पूरा original repository नहीं। इसका उद्देश्य Convia के लिए एक जैसा visual system देना है: transparent logo, नया homepage, shared header/footer, compact PDF hero, processing bars, loading/error pages और missing PDF routes के लिए Coming Soon.

## 0. सबसे पहले backup

1. `D:\convia` का अलग backup लें।
2. CMD में `cd /d D:\convia` चलाएँ।
3. यदि Git working tree साफ़ है तो current state commit करें।

## 1. PATCH folder merge करें

ZIP extract करें। अंदर `PATCH` folder की files उसी relative path पर `D:\convia` में copy करें।

**ध्यान दें:** यह package `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/layout` और `components/home` के कुछ files को बदलने/जोड़ने के लिए है। पहले अपने पुराने files का backup रखें।

## 2. Existing components को सुरक्षित रखें

- `app/globals.css` को replace न करें। नई `app/convia-design-system.css` अलग file है और layout इसे import करता है।
- अपने मौजूदा Supabase Ad Manager की API files, SQL, `components/ads/ad-zone.tsx`, `lib/ads/*` और `.env.local` को सुरक्षित रखें।
- Layout में AdSense global script केवल एक बार रखें। यदि Supabase Ad Manager layout already loader जोड़ता है तो duplicate script हटाएँ।
- Existing PDF processors की working logic को replace न करें। विशेषकर `app/pdf/compress/page.tsx` और worker-fix scripts को backup रखें।

## 3. Dependencies

इस package में `lucide-react`, `next-themes` और Next.js पहले से project में मौजूद होने चाहिए। यदि `next-themes` या `lucide-react` missing हो तो:

```cmd
npm install lucide-react next-themes
```

## 4. Logo

- `public/brand/convia-logo.png` — high-resolution transparent logo.
- `public/brand/convia-logo.svg` — lightweight scalable vector logo.
- `components/brand/convia-logo.tsx` — React inline brand lockup; light/dark variant and tagline.

Root layout header/footer में inline SVG logo use करता है।

## 5. PDF tool pages

`app/pdf/[slug]/page.tsx` only missing routes के लिए Coming Soon fallback है। Static pages (`compress`, `merge`, `split`, `organize`, `extract`, `watermark`) Next.js में dynamic `[slug]` route से पहले resolve होते हैं।

Existing pages के बड़े hero को standard बनाने के लिए `docs/TOOL-PAGE-MIGRATION.md` देखें। उसमें केवल hero block को `ToolPageHeader` से replace करना है; file processing code न हटाएँ।

## 6. Processing bar

`components/pdf/processing-progress.tsx` और `processing-overlay.tsx` reusable components हैं। इन्हें actual processor state/progress से connect करें। अगर PDF library progress callback नहीं देती तो fake 100% animation न दिखाएँ—indeterminate state इस्तेमाल करें।

## 7. AdSense / Supabase Ad Manager

इस package का Root Layout global AdSense script `ca-pub-7776844434912624` के साथ रखता है। **अगर existing layout में पहले से AdSense loader है, duplicate न रखें।**

यदि Supabase Ad Manager installed है, integration guide देखें:

`docs/ADS-MANAGER-INTEGRATION.md`

वहाँ after-header, side rails और before-footer zones को merge करने का तरीका है। Homepage पर `home-after-hero` zone optional है।

## 8. Build / local test

```cmd
cd /d D:\convia
npm run build
npm run dev
```

Test these:
- `/`
- `/pdf/compress`
- `/pdf/organize`
- `/pdf/extract`
- `/pdf/merge`
- `/pdf/split`
- `/pdf/watermark`
- `/pdf/ocr` (Coming Soon)
- `/login` and `/signup` (Coming Soon)
- `/robots.txt` and `/sitemap.xml`

## 9. GitHub push

Check secrets first: `.env.local` must not be staged.

```cmd
git status
git add -A
git status
git commit -m "Apply Convia premium design system"
git push origin main
```

Then deploy from Hostinger.

## Important limitation

The ZIP includes a new design system and route shells. It does not rebuild the internal processing algorithms of PDF tools. Existing working processor logic must be retained and wrapped with the shared header/progress components. The entire package has not been tested inside your private `D:\convia` repository or deployed to Hostinger.
