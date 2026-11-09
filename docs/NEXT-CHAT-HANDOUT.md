# CONVIA — COMPLETE PROJECT HANDOUT FOR THE NEXT CHAT

Paste or upload this file at the start of a new chat, along with the latest source ZIP or repository files. This handout records the known project facts and unfinished work. Do not assume every listed tool is implemented.

## Project identity
- Product: **Convia**
- Public app URL: `https://convia.saanwariyasethfashion.com`
- GitHub: `https://github.com/kingssofcyber-wq/convia`
- Repository branch: `main`
- Owner/creator credit shown in footer: **Mivaan Jangra**
- Tagline: **Every need, one place.**
- Purpose: PDF tools plus planned Loans & EMI, Insurance and Health utilities.

## Hosting / domain separation
- Root domain `saanwariyasethfashion.com` hosts the separate Saanwariya Seth Fashion HTML/PHP company/e-commerce website.
- Subdomain `convia.saanwariyasethfashion.com` hosts Convia as a Next.js Node.js application.
- Do not reset DNS, overwrite root `public_html`, or change the root site's A/CNAME records while working on Convia.
- Hostinger Business Plan, Node.js 22 used for Convia deployment.
- Build command previously used: `npm run build` with `next build --webpack`.
- Standalone output in `next.config.mjs`; start command previously used: `node .next/standalone/server.js`.

## Stack observed in public source
- Next.js 16.4.3, React 19.3.0, TypeScript 5, Tailwind CSS 4, App Router.
- `pdf-lib`, `lucide-react`, `next-themes`, `react-dropzone`, JSZip and other UI dependencies.
- Compression page source imports `pdfjs-dist` and `@fileslim/compress`; confirm both are included in the current `package.json` and lockfile.
- PDF.js worker uses a CDN URL for page preview in the current public compress source.
- The earlier `@fileslim/compress` worker URL patch is version-specific; keep `scripts/fix-fileslim-worker.cjs` synced with installed package version.

## Existing layout / design
- Premium indigo / violet / blue styling, Inter font, responsive navbar, theme toggle.
- Navbar labels: PDF Tools, Loans & EMI, Insurance, Health.
- Footer center signature: Convia logo/name and “Created by Mivaan Jangra”.
- Homepage components: `components/home/hero.tsx`, `components/home/tool-grid.tsx`, `components/home/tool-card.tsx`, `lib/tools-data.ts`.
- Root layout includes Navbar, Footer, ThemeProvider and one global AdSense script.

## PDF tools currently treated as available
These pages existed / returned page content during the most recent source and earlier route audit. This does not certify all functional test cases:
1. `/pdf/merge`
2. `/pdf/split`
3. `/pdf/organize`
4. `/pdf/extract`
5. `/pdf/compress`
6. `/pdf/watermark`

## Remaining PDF tools marked Coming Soon
The repair patch adds a dynamic `/pdf/[slug]` route so these links no longer land on 404 pages:
- `/pdf/page-numbers`
- `/pdf/ocr`
- `/pdf/repair`
- `/pdf/jpg-to-pdf`
- `/pdf/word-to-pdf`
- `/pdf/excel-to-pdf`
- `/pdf/ppt-to-pdf`
- `/pdf/html-to-pdf`
- `/pdf/pdf-to-word`
- `/pdf/pdf-to-excel`
- `/pdf/pdf-to-jpg`
- `/pdf/pdf-to-ppt`
- `/pdf/pdf-to-pdfa`
- `/pdf/edit`
- `/pdf/annotate`
- `/pdf/rotate`
- `/pdf/fill-sign`
- `/pdf/protect`
- `/pdf/unlock`
- `/pdf/sign`
- `/pdf/chat`
- `/pdf/summarize`
- `/pdf/translate`

`/login` and `/signup` are Coming Soon until real authentication is implemented. Do not add dummy forms that pretend to authenticate users.

## Repair patch included in this handout
- Dynamic Coming Soon pages for missing PDF routes, with noindex metadata.
- Coming Soon badges on ToolCards for unimplemented tools.
- Login and signup Coming Soon routes.
- Friendly app-level not-found page.
- Homepage anchors / sections for Loans & EMI, Insurance and Health; these are clearly marked Coming Soon and are not calculators/quotes yet.
- SEO `app/robots.ts`, `app/sitemap.ts`, root metadata defaults.
- `public/ads.txt` with the supplied publisher record for the Convia subdomain.
- AdSense component corrected to use its `adSlot` prop instead of hard-coding one slot ID.
- Contact form now opens an email draft instead of showing a demo alert.
- Privacy page no longer makes a blanket “100% private” claim for every planned feature.
- Terms page clarifies general educational nature of finance/insurance/health information and asks users to retain backups.
- Watermark page removes the old artificial five-page cap and fake pricing alert; processing still needs testing on multi-page files.

## AdSense details
- Publisher ID supplied by user: `ca-pub-7776844434912624`.
- Existing homepage manual slot supplied by user: `4116852365`.
- Global AdSense script must appear once in `app/layout.tsx`.
- `components/ads/adsense.tsx` must use `data-ad-slot={adSlot}` for each manual unit. Use unique active slot IDs for additional manual placements.
- Auto Ads formats (in-page, anchor, vignette, side rail) are controlled in AdSense dashboard. The script alone does not guarantee every ad format on every route.
- Do not programmatically create popups or repeatedly call `adsbygoogle.push({})` on every route change.
- Parent domain ads.txt: if the AdSense site entry is `saanwariyasethfashion.com`, confirm the authorised ads.txt record also exists at the parent domain's actual root website. The Convia `public/ads.txt` only serves the subdomain URL.
- AdSense approval/ad fill is never guaranteed by the code alone.

## Known issue / required owner verification
- The current source uses `support@convia.com`. Confirm it is a real monitored inbox. If not, replace it in `app/contact/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx` and the contact link config before launch.
- The contact form uses `mailto:`. It opens the visitor's email app and does not send through a server. A real backend form requires a mail service / API route and its credentials.
- Verify whether all PDF tools process entirely in browser before claiming that files never leave the device.
- Verify dependencies present in both `package.json` and `package-lock.json`; do not depend on manually installed `node_modules` only.
- Check Next.js 16 compatibility of `next.config.mjs`, its `eslint` key and the `lint` script before claiming lint passes.

## Deployment / validation checklist
1. Back up the current project or commit a checkpoint.
2. Apply `docs/APPLY-REPAIR.md` patch files into `D:\convia`.
3. Verify support email and ads.txt ownership.
4. `npm ci` (or `npm install` if lockfile needs intentional update).
5. `npm run build`.
6. Run `npm run dev` and smoke-test all paths in `docs/ROUTE-STATUS.md`.
7. Verify `/robots.txt`, `/sitemap.xml`, `/ads.txt`.
8. Test six available PDF tools with test files and verify downloaded outputs.
9. Test responsive layout, dark mode, navigation and keyboard accessibility.
10. `git status`, `git add -A`, commit and push to `main`.
11. Deploy Convia Node.js app in Hostinger; do not disturb root Saanwariya website.

## Prompt for the next chat
“Read this complete Convia handout and inspect the attached repair ZIP and current source files. Continue from the exact existing Next.js 16.4.3 App Router project; do not replace the entire site or break the six available PDF tools. First apply and validate the repair patch, compare it with my actual current repository, run a production build, and report any unresolved issues honestly. Keep the 23 missing PDF tools and login/signup as Coming Soon until they are genuinely implemented. Then work on the next PDF tool one at a time, with full working source and a test checklist.”
