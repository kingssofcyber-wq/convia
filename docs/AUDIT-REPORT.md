# Convia website audit & repair report

**Audit date:** 9 November 2026  
**Project:** `github.com/kingssofcyber-wq/convia`, branch `main`  
**Production URL:** `https://convia.saanwariyasethfashion.com`

## Scope and evidence

This repair is based on the public GitHub source paths that were retrievable during the audit, the tool route registry in `lib/tools-data.ts`, and the previously observed live-route checks shared in this conversation. The live origin did not return content to the web inspection tool in this run, so this report does not claim a fresh full browser/device/functional test against production.

## Findings addressed by this patch

| Finding | Evidence / risk | Patch |
|---|---|---|
| 23 PDF links reached 404 | `lib/tools-data.ts` registered the routes, while earlier live checks reported 404 | Added `/pdf/[slug]` Coming Soon fallback for the 23 unimplemented tools; no fake processing |
| Homepage nav anchors `#loans`, `#insurance`, `#health` had no matching sections in the public `app/page.tsx` | Navbar links existed, homepage only rendered Hero, one ad and ToolGrid | Added anchored, clearly labelled Coming Soon service sections |
| Login and signup returned 404 | No `app/login/page.tsx` or `app/signup/page.tsx` found in the public source | Added informative Coming Soon pages with no fake auth UI and noindex metadata |
| Contact form was a demo alert | Existing `app/contact/page.tsx` prevented submit and showed “demo form” alert | Replaced with a truthful mailto-draft form; it tells users that they must press Send in their email app |
| Contact addresses used `support@convia.com` and `business@convia.com` without verification | Existing contact source | Patch uses `support@convia.com`; owner must confirm this mailbox is active or replace it in the page and Privacy/Terms pages |
| Privacy page claimed every tool was “100% private” and that all files are never uploaded | Existing `app/privacy/page.tsx` blanket claim; not safe when not all 29 tools exist / not all implementations audited | Replaced with a scoped, tool-specific processing notice; disclose AdSense/third-party resource use |
| About page implied all services are already available | Existing source copy | Updated to clearly describe a growing platform and distinguish available vs planned features |
| AdSense component ignored its `adSlot` prop and hard-coded slot `4116852365` | Public `components/ads/adsense.tsx` lines showed both prop and hard-coded attribute | `data-ad-slot={adSlot}` now uses the supplied slot ID |
| SEO crawl files were missing in the public source | `public/robots.txt`, `public/sitemap.xml`, `public/ads.txt`, `app/robots.ts`, `app/sitemap.ts` were not found at inspected paths | Added metadata routes for robots/sitemap and `public/ads.txt` for the Convia subdomain |
| No site-wide metadata base / OG defaults | Existing `app/layout.tsx` lacked metadataBase / OG defaults | Added metadataBase, title template, description, Open Graph and robots defaults |
| No custom not-found page | No `app/not-found.tsx` found in public source | Added helpful site-level 404 |
| Watermark tool had a five-page cap and a fake “Buy Now” alert | Existing watermark source blocked files over five pages and showed an alert rather than a real pricing route | Replaced with no artificial page cap, honest processing state and output download |

## Not claimed as fixed / owner actions required

1. **Support mailbox:** Verify `support@convia.com` is a real, monitored inbox. If not, update `app/contact/page.tsx`, `app/privacy/page.tsx` and `app/terms/page.tsx` to a working support address.
2. **AdSense approval and ad fill:** The code keeps the publisher ID `ca-pub-7776844434912624` and manual slot `4116852365`. Auto Ads formats must be configured in AdSense. Google chooses placements and does not guarantee an ad on every route or every view. Never call `adsbygoogle.push()` on every navigation as a substitute for Auto Ads.
3. **Parent-domain ads.txt:** `public/ads.txt` in this patch serves the Convia subdomain. If AdSense account setup is for `saanwariyasethfashion.com` as the parent domain, also ensure the authorised ads.txt record is present at the parent root site's `/ads.txt`.
4. **Compression dependencies:** The public `app/pdf/compress/page.tsx` imports `pdfjs-dist` and `@fileslim/compress`. Ensure these exact dependencies and any encoder dependencies used by the local code are in `package.json` and `package-lock.json` before deploying. Do not rely on untracked local `node_modules` changes.
5. **Compression worker:** The earlier `@fileslim/compress` Worker patch is package-version-specific. Confirm the `postinstall` patch succeeds on a clean install and check `/assets/<actual-worker-filename>` returns 200 in the browser.
6. **Tool functionality:** The six pages marked Available were present during the audit, but every one must still be tested with normal, large, password-protected, malformed and multi-page files as applicable.
7. **Financial, insurance and health sections:** The homepage sections added here are informative placeholders only. They do not provide live calculators, insurance quotes or medical advice.
8. **Google AdSense policies:** This patch improves navigation, disclosures and crawl files but does not guarantee approval. Ensure the site has substantial original, useful content and all required account/site checks.

## Smoke-test checklist after deployment

- [ ] `/` loads and all main navigation anchors scroll to matching sections
- [ ] All six available PDF routes load and each operation produces a valid output file
- [ ] Every Coming Soon PDF route loads a 200 response and displays “Coming Soon”, not 404
- [ ] `/login` and `/signup` display Coming Soon and are not included in sitemap
- [ ] `/about`, `/contact`, `/privacy`, `/terms` load
- [ ] Contact form opens a mail draft and does not claim server submission
- [ ] `/robots.txt` and `/sitemap.xml` return valid generated output
- [ ] `/ads.txt` returns the correct publisher record on Convia subdomain
- [ ] `data-ad-slot` in each manual ad element equals the configured slot ID
- [ ] Manual ad slots have unique, active slot IDs; global AdSense script appears once
- [ ] Test on mobile and desktop, with and without ad blocker
- [ ] `npm run build` succeeds on a clean dependency install
- [ ] Hostinger Node.js app remains mapped to `convia.saanwariyasethfashion.com`; Saanwariya root site is untouched
