# CONVIA — COMPLETE PROJECT HANDOUT (Supabase Ad Manager Edition)

Updated: 9 November 2026

## 1. Project identity

- Product: Convia
- Website: https://convia.saanwariyasethfashion.com
- GitHub: https://github.com/kingssofcyber-wq/convia
- Branch: `main`
- Framework: Next.js 16.4.3, React 19, TypeScript
- Runtime: Node.js 22 on Hostinger Business Plan
- Build: `npm run build` (the current project has used `next build --webpack`)
- Start: existing standalone Node.js start script; preserve current package scripts unless deliberately changing them.
- Existing app uses `app/` App Router, Tailwind CSS v4, `lucide-react`, `pdf-lib`, `pdfjs-dist`, and `@fileslim/compress` in the compression feature.

## 2. Domains and hosting

- Root domain `saanwariyasethfashion.com` is the separate Saanwariya Seth Fashion HTML/PHP website.
- `convia.saanwariyasethfashion.com` is the separate Convia Next.js/Node.js application.
- Keep their website entries, document roots, DNS hostnames and deployments separate. A matching server IP is not itself a problem.
- Deploy Convia through Hostinger Node.js app connected to GitHub `main`.

## 3. Database decision

Hostinger Node.js Database Connect Wizard offers Supabase and MongoDB Atlas. For the Central AdSense Manager, use **Supabase** because its PostgreSQL tables fit structured ad-unit records and it includes Auth and Row Level Security. MongoDB is not selected for this manager.

Hostinger's Supabase wizard connects the existing/new Supabase project and applies environment variables, but does not modify application code. The SQL table and code patch still need to be applied.

Official guide: https://www.hostinger.com/support/connecting-a-supabase-database-to-a-hostinger-node-js-application/

## 4. AdSense account and existing units

- Publisher ID: `ca-pub-7776844434912624`
- Existing slot 1 Multiplex: `5509141619` (`data-ad-format="autorelaxed"`)
- Existing slot 2 fixed leaderboard: `2354911961` (728x90; use desktop only)
- Existing slot 3 In-article: `7311509571` (`data-ad-layout="in-article"`, `data-ad-format="fluid"`)
- Existing slot 4 Responsive display: `2443937103` (`data-ad-format="auto"`, responsive)
- One global `adsbygoogle.js` loader belongs in `app/layout.tsx` only once.
- Paste one complete ad-unit snippet at a time in `/admin/ads`; the manager parses only the `<ins>` attributes. Do not paste Auto Ads-only scripts there.
- Auto Ads formats such as Anchor and Vignette remain configured in the Google AdSense dashboard.
- Google may not serve every format on every page. Do not place ads near upload/process/download buttons or make fake/forced popups.

## 5. Supabase environment variables

Expected names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` (server only)
- `CONVIA_ADS_ADMIN_EMAILS` (comma-separated exact email allowlist)
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-7776844434912624`

Hostinger wizard may set provider-specific environment variable names. Inspect the Hostinger environment page and map them to the expected names. The publishable/anon key is public but must be protected by appropriate RLS. The service-role/secret key must never have a `NEXT_PUBLIC_` prefix and must never be committed to Git.

Local `.env.local` stays in `.gitignore` and out of GitHub.

## 6. Central Ad Manager routes and architecture

- Admin dashboard: `/admin/ads`
- Public ad config API: `/api/ads/config?zone=after-header&pathname=/`
- Admin CRUD APIs:
  - `GET/POST /api/ads/admin/units`
  - `PATCH/DELETE /api/ads/admin/units/[id]`
- Database table: `public.convia_ad_units`
- Supabase Auth authenticates the admin; API verifies token, then checks `CONVIA_ADS_ADMIN_EMAILS` allowlist.
- Server service-role client reads/writes database. Browser does not get the service key.
- Public routes see only enabled, route-matched ad attributes.
- Zones: `after-header`, `before-footer`, `side-left`, `side-right`, `home-after-hero`, `pdf-after-tool`.
- Scopes: all eligible public pages, homepage, all PDF pages, exact route.
- Device: all, desktop, mobile.

## 7. Existing PDF tools and known development history

Previously inspected live routes:
- `/pdf/merge`
- `/pdf/split`
- `/pdf/organize`
- `/pdf/extract`
- `/pdf/compress`
- `/pdf/watermark`

Other PDF tool cards may be marked Coming Soon until their route and real processing function are completed. A page loading successfully does not prove all its actions work; test each with sample files.

Compression history:
- User wants a 1–100% target-reduction slider and download bytes must equal the actual compressed blob, not the original input.
- Earlier `@fileslim/compress` versions had worker path issues and a missing `@jsquash/jxl` dependency warning.
- Preserve the existing `scripts/fix-fileslim-worker.cjs` postinstall repair if still needed. Do not overwrite the working Compress PDF page while applying this Ad Manager patch.
- Test actual downloaded file size and visual quality; compression targets are not guaranteed for every PDF.

Organize PDF:
- Upload PDF, page thumbnails, page rotate, drag/reorder and delete.

Extract PDF:
- Page ranges such as `1,3-5,8`, output a new PDF.

## 8. Apply the Supabase manager patch

1. Back up current `D:\convia` and commit a known-good Git checkpoint.
2. Run Hostinger Database Connect Wizard > Supabase for the Convia Node.js app.
3. Apply `database/supabase-ads-manager.sql` in Supabase SQL Editor.
4. Create the admin email/password user under Supabase Authentication > Users.
5. Set the environment variables listed above in local `.env.local` and Hostinger's Convia Node.js environment.
6. Run `npm install @supabase/supabase-js`.
7. Merge files in `PATCH/` to the matching paths. Review route/layout conflicts instead of blindly overwriting unrelated customizations.
8. Integrate `AdZone` components into the existing root layout while keeping Navbar, Footer, ThemeProvider, metadata and one global AdSense script.
9. Optionally add `home-after-hero` below Hero and `pdf-after-tool` below each PDF tool interface.
10. Run `npm run build`, then `npm run dev` and test `/admin/ads`.
11. Push to GitHub `main`, then redeploy Convia in Hostinger.

## 9. Admin workflow

- Open `/admin/ads`.
- Sign in with the Supabase Auth user whose email is on `CONVIA_ADS_ADMIN_EMAILS`.
- Paste one AdSense snippet.
- Name it, select placement, page scope, optional exact route, device and priority.
- Save.
- Enable/disable/delete units from the list.
- New unit changes are database-driven and do not need a GitHub push.

## 10. Security and content

- Never expose Supabase service-role/secret key in browser code.
- Never commit `.env.local`, API secrets, service-role keys or passwords.
- The ad manager accepts only AdSense `<ins>` metadata and ignores pasted JavaScript.
- Admin email allowlist is server-side.
- Make sure public Privacy Policy accurately describes each tool's real processing path; do not say all PDFs are browser-only unless verified.
- Don't imply every PDF tool is available if marked Coming Soon.
- Add ads only in placements that comply with AdSense policy and do not resemble download/process controls.

## 11. Next development roadmap

1. Complete Supabase database + Ad Manager deployment and verify admin login.
2. Test all four existing AdSense slots individually, then enable placements gradually.
3. Verify every PDF tool with representative PDFs, including large/scanned/password-protected files.
4. Finish missing routes one by one; until then use clear Coming Soon pages.
5. Verify Login/Signup only when authentication is actually implemented.
6. Run mobile/tablet/desktop layout tests and keyboard/accessibility checks.
7. Verify metadata, sitemap, robots, ads.txt and accurate privacy information.
8. Run clean production build and inspect Hostinger runtime logs after deployment.

## 12. Prompt for a future ChatGPT conversation

Read this entire handout and inspect the attached Supabase Ad Manager patch. Continue work on my existing Convia Next.js 16.4.3 project; do not rebuild it from scratch. Preserve all existing working PDF tools, especially Compress PDF and its current worker fix. First help me connect Supabase using Hostinger's Database Connect Wizard, run the SQL schema, configure server-side environment variables and set up the allowlisted Supabase Auth admin. Then merge the patch safely, run a production build, fix errors, test `/admin/ads`, verify ad placements, and update this handout. Never expose service-role/secret keys or commit `.env.local`.
