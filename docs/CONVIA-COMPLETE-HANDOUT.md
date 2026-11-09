# CONVIA — COMPLETE PROJECT HANDOUT (UPDATED 9 NOV 2026)

Use this handout with the latest source ZIP/repository and the Convia Final UX + SEO + AdSense Repair ZIP in a new chat.

## Project identity
- Product: Convia
- Public app: https://convia.saanwariyasethfashion.com
- GitHub repository: https://github.com/kingssofcyber-wq/convia
- Branch: `main`
- Footer credit: Mivaan Jangra
- Tagline: Every need, one place.
- Scope: PDF tools, Loans & EMI, Insurance, Health.

## Hosting and domains
- Root `saanwariyasethfashion.com` is a separate Saanwariya Seth Fashion HTML/PHP website.
- `convia.saanwariyasethfashion.com` is the Convia Next.js Node.js app.
- Never overwrite root `public_html` or reset root DNS while working on Convia.
- Hostinger Business Plan; Node.js 22 used in deployment.
- Next.js standalone output; build command commonly `npm run build` with `next build --webpack`; start command previously `node .next/standalone/server.js`.

## Stack
- Next.js 16.4.3, React 19.3.0, TypeScript 5, Tailwind CSS 4, App Router.
- `pdf-lib`, `pdfjs-dist`, `lucide-react`, `next-themes`, `jszip`, `react-dropzone`.
- Compression page also uses `@fileslim/compress` (the local installation/version and worker patch must be checked). The custom script `scripts/fix-fileslim-worker.cjs` was created due to a worker asset resolution issue. Do not overwrite it with older files.
- Run `npm list @fileslim/compress pdfjs-dist` to check installed packages.

## Current design / UX
- Premium indigo/violet/blue theme, Inter font, responsive navbar, light/dark theme.
- Navbar links: PDF Tools, Loans & EMI, Insurance, Health.
- Footer includes Convia branding and Created by Mivaan Jangra.
- PDF page headers are being compacted: narrower gradient hero, less vertical padding, smaller heading and smaller decorative glow shapes.
- `app/loading.tsx` provides loading feedback; `app/error.tsx` provides a recoverable route error screen.

## Existing PDF pages treated as available
These routes have existing page source in the project. Test them after every integration; this list does not certify all edge cases.
1. `/pdf/merge`
2. `/pdf/split`
3. `/pdf/organize`
4. `/pdf/extract`
5. `/pdf/compress`
6. `/pdf/watermark`

### Compress PDF warning
- Preserve the latest user-tested `app/pdf/compress/page.tsx` from the current checkout. Do not replace it with any older ZIP's page.
- `@fileslim/compress` emitted missing JXL/worker/chunk warnings in earlier iterations. Confirm the current `package.json`, lockfile, worker asset and build before deployment.
- Do not claim 1–100% target reduction is guaranteed; the attainable size depends on the PDF's embedded content. Downloaded output must be the exact Blob whose size is shown.

## Remaining tools — Coming Soon
Use `/pdf/[slug]` with the following slugs, matched to `lib/tools-data.ts` card hrefs:
- page-numbers, ocr, repair, jpg-to-pdf, word-to-pdf, excel-to-pdf, ppt-to-pdf, html-to-pdf
- pdf-to-word, pdf-to-excel, pdf-to-jpg, pdf-to-ppt, pdf-to-pdfa
- edit, annotate, rotate, fill-sign, protect, unlock, sign
- chat, summarize, translate

These are not implemented tools. Keep them labelled Coming Soon until they actually work.

## Other unfinished product areas
- `/login` and `/signup` are Coming Soon; no authentication backend is implemented.
- Loans & EMI, Insurance and Health homepage sections are planned/Coming Soon unless real calculators/content have been added separately.

## AdSense / Blogger connection
- Publisher ID supplied by user: `ca-pub-7776844434912624`.
- Existing manual slot supplied: `4116852365` (confirm it remains active in AdSense before use).
- An AdSense account linked to approved Blogger can also monetize the owner's separate website, but the website must be added to AdSense Sites, connected/verified, reviewed, and then configured. Official help: https://support.google.com/adsense/answer/9246927
- Blogger Layout gadgets / “Show ads between posts” apply to Blogger only. Next.js uses the AdSense code in `app/layout.tsx` once.
- Auto Ads are enabled/configured in AdSense → Ads → By site. Do not add duplicate scripts or call `adsbygoogle.push({})` on every client navigation.
- Auto Ads do not guarantee ads on every URL, visit or screen size. Thin Coming Soon pages and error screens may not receive ads.
- `public/ads.txt` on the Convia subdomain is separate from the root domain's `/ads.txt`; check the host that AdSense uses in the Sites list.
- Ad serving and AdSense approval cannot be guaranteed by code.

## Repair package updates
The `Convia Final UX + SEO + AdSense Repair` patch includes:
- Missing PDF routes routed to Coming Soon rather than 404.
- Login/Signup Coming Soon pages.
- Homepage category sections and available/Coming Soon labels.
- Contact, Privacy and Terms updates (verify support email and actual processing disclosure).
- Correct AdSense component prop handling.
- `robots.ts`, `sitemap.ts`, `ads.txt`.
- Responsive navbar accessibility.
- `loading.tsx`, `error.tsx`.
- Compact page header CSS and a script to apply compact styles to `app/pdf/**/page.tsx`.
- Blogger AdSense instructions.

## Contact details to verify
- Repair template currently uses `support@convia.com`.
- Verify this is a real, monitored inbox before deployment. The Contact form uses mailto and does not send to a backend.

## Apply / validate
1. Back up the latest project or create a Git checkpoint.
2. Merge the ZIP's `PATCH/` files into `D:\convia`.
3. Preserve current Compress PDF and worker fix files.
4. Run `node scripts/apply-convia-ux-fixes.cjs` from `D:\convia` to compact headers and import the CSS.
5. `npm run build`.
6. Test all six existing PDF pages using sample PDFs and verify actual downloaded outputs.
7. Open all Coming Soon URLs, Login/Signup, About, Contact, Privacy and Terms.
8. Check `/robots.txt`, `/sitemap.xml`, `/ads.txt`.
9. Test mobile navigation, dark/light mode, responsive layout and error/loading UI.
10. Confirm AdSense site status and Auto Ads settings in the same Blogger-linked AdSense account.
11. `git status`, `git add -A`, commit and push; do not upload `.env.local`, secrets, or credentials.
12. Deploy only the Convia Node.js application. Do not alter the Saanwariya root website/DNS.

## Prompt for the next chat
“Read this updated Convia handout and inspect the repair ZIP plus my latest source ZIP. First compare the patch with my exact repository, preserve the latest working Compress PDF page and `scripts/fix-fileslim-worker.cjs`, apply compact PDF headers, responsive loading/error handling, route fixes, SEO and Blogger-linked AdSense setup. Run a complete production build and report any failures. Then smoke-test the six available PDF tools and all Coming Soon pages. Do not claim a tool works until it has actually been tested.”
