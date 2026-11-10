# CONVIA — COMPLETE NEXT-CHAT PROJECT HANDOUT

## Project identity
- Name: Convia
- Domain: https://convia.saanwariyasethfashion.com
- GitHub: https://github.com/kingssofcyber-wq/convia
- Branch: `main`
- Hosting: Hostinger Business Plan, Node.js application
- Stack: Next.js 16.4.3, React 19, TypeScript, npm, Webpack build
- Owner/creator credit requested in footer: Mivaan Jangra
- Brand tagline in new logo: “PDF Tools • Smart Solutions • Endless Possibilities”

## Architecture
- Root domain `saanwariyasethfashion.com` is a separate HTML/PHP website. Do not change it while working on Convia.
- Convia is the Node.js Next.js subdomain.
- Root layout owns the one global Header and Footer.
- Shared `ToolPageHeader` should be used on all PDF tool pages, with one compact uniform gradient header, same title size, same back action and same spacing.
- Shared processing components: `ProcessingProgress` and `ProcessingOverlay`. Connect them to each actual processor's progress state; do not fake progress if library does not provide it.
- New logo assets are under `public/brand/` (PNG transparent and SVG vector). `ConviaLogo` component supports default/inverse appearance and optional tagline.

## Current package status
This redesign patch provides:
- New premium homepage with 30 PDF tool cards, search and category filters.
- Shared header and footer, with Convia logo centered in footer and “Created by Mivaan Jangra” underneath.
- Light/dark theme toggle.
- Compact, consistent PDF tool page hero.
- Reusable upload dropzone, progress bar and processing overlay.
- Coming Soon route fallback for not-yet-built PDF tools.
- Login and signup placeholders (not real authentication).
- Loading, error and not-found pages.
- Sitemap and robots metadata routes.

## Existing PDF processors to preserve
The user has previously worked on:
- `/pdf/compress` — custom `@fileslim/compress` engine, `pdfjs-dist`, JPEG/PNG/WebP/AVIF/JXL codec dependencies, worker-copy/patch script, and percentage compression UI. It has previously produced issues around Worker asset path, `pdf.destroy is not a function`, missing `FilePdf` icon, missing `@jsquash/jxl`, and mismatch between displayed estimate and downloaded Blob. Do not overwrite this page or its worker repair scripts without inspecting the latest local source.
- `/pdf/organize` — upload PDF, page thumbnails, select, rotate, reorder, delete, export.
- `/pdf/extract` — page range input such as `1, 3-5, 8`, export selected pages as one new PDF.
- `/pdf/merge`, `/pdf/split`, `/pdf/watermark` — existing routes were previously reachable.

The redesign ZIP intentionally does not include these six source pages because the newest local working versions were not provided in this turn. Add the new `ToolPageHeader` and `ProcessingProgress` to their existing page bodies without deleting processor state or file logic.

## Tool catalogue
`lib/tools.ts` lists 30 PDF routes. Six are marked Available: compress, merge, split, organize, extract and watermark. Other PDF tools use the `[slug]` dynamic fallback and appear as Coming Soon rather than showing 404. Only mark a tool Available after it has a real working processor.

Finance, Insurance and Health overview sections are present. In this package, their listed deeper routes are consistent Coming Soon pages; real calculations/content still need to be built. Do not claim them as functional until built and tested.

## AdSense details
- Publisher ID: `ca-pub-7776844434912624`
- Existing slot IDs: `5509141619` (Multiplex), `2354911961` (728x90), `7311509571` (In-article), `2443937103` (Responsive Display); old header slot `4116852365` was previously used too.
- User also created a Supabase Central AdSense Manager package. If installed, preserve its API routes, `components/ads/ad-zone.tsx`, `lib/ads/*`, Supabase SQL and env variables.
- Keep exactly one global AdSense script. Do not add repeated `adsbygoogle.push()` calls in RootLayout or arbitrary components.
- Auto Ads (Anchor/Vignette/Side Rail) are configured in AdSense dashboard and do not become manual unit snippets in the admin manager.
- If using Supabase AdZone, preserve the zones: `after-header`, `before-footer`, `side-left`, `side-right`, `home-after-hero`, `pdf-after-tool`.

## Supabase / security
The user said Hostinger dashboard presents Supabase and MongoDB and chose Supabase for the Central Ad Manager. Do not put Supabase Secret/Service Role key in `NEXT_PUBLIC_` variables. `.env.local` must be ignored by `.gitignore`; never stage or upload secrets. Public publishable/anon key is allowed client-side but requires RLS policies.

## Brand/UI requirements
- Premium but clean technology SaaS style; indigo/blue/violet gradients, light background, dark theme supported.
- Same header and footer globally.
- Footer center logo + “Created by Mivaan Jangra”.
- Compact same-size tool hero/header on every PDF page. Avoid huge colored background height.
- Consistent card dimensions, typography and spacing.
- Subtle animations; respect `prefers-reduced-motion`.
- Every real processing tool should expose a status and progress indicator based on real library progress (or indeterminate state where progress is unknown).
- Keep upload, processing and download controls visually distinct; do not place ads too close to file controls.

## Current install steps
1. Backup the current `D:\convia` project.
2. Merge PATCH files to the same relative paths. Do not blindly replace existing working PDF processors or the Supabase Manager files.
3. Keep existing `app/globals.css`; Root Layout imports a separate `app/convia-design-system.css`.
4. Ensure `lucide-react` and `next-themes` are dependencies.
5. Build locally: `npm run build`.
6. Test `/`, the six working PDF routes, multiple Coming Soon routes, `/login`, `/signup`, `/robots.txt`, `/sitemap.xml`.
7. Push only after `git status` confirms no `.env.local`, secrets or keys are staged.
8. Deploy to Hostinger's Convia Node.js app, not the Saanwariya PHP site.

## Important honesty note
The ZIP is a source patch/template package. It has not been built inside the user's private current repository. Existing PDF processors have not been end-to-end tested here. Do not tell the user all 30 tools work. The Coming Soon routes deliberately avoid false claims. The user should provide the latest repository ZIP when asking for a fully merged production package.
