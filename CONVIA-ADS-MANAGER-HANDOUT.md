# Convia Central AdSense Manager — Project Handout

## Project context
- App: Convia, Next.js App Router + React + TypeScript
- Next.js reported by owner: 16.4.3
- Hosting: Hostinger Business Plan, Node.js app deployed via GitHub main branch
- Local project path used by owner: `D:\convia`
- Main domain: `convia.saanwariyasethfashion.com`
- AdSense publisher identifier supplied by owner: `ca-pub-7776844434912624`
- Existing ad slots supplied by owner: `5509141619` (Multiplex/autorelaxed), `2354911961` (fixed 728x90), `7311509571` (fluid in-article), `2443937103` (responsive display); older header slot `4116852365` may still exist in project and should be checked for duplicate placement.

## What this package adds
- `/admin/ads` password-protected control panel.
- Paste one AdSense `<ins class="adsbygoogle">` unit at a time.
- Safe parser extracts Publisher ID, slot, format, layout key, and fixed dimensions. It ignores `<script>` tags; it never stores/execut es pasted arbitrary JavaScript.
- Store units in Hostinger MySQL using `mysql2` and environment variables.
- Enable/disable/delete saved units without GitHub push.
- Assign placements: after-header, before-footer, side-left, side-right, home-after-hero, pdf-after-tool.
- Route scopes: all public pages, homepage, all `/pdf/*` pages, exact route.
- Device scope: all, desktop, mobile.
- `AdZone` fetches enabled config from `/api/ads/config` based on current route and placement.
- `AdRail` displays configured desktop rail units on wide screens.
- Database table is auto-created by the server API; SQL schema is also provided.

## Hostinger setup
- Create a MySQL DB/user in hPanel.
- Host: `127.0.0.1` (not localhost); port `3306`.
- Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in the Convia Node.js app environment variables.
- Set `CONVIA_ADS_ADMIN_PASSWORD` and `CONVIA_ADS_SESSION_SECRET` (at least 32 chars; generate a 64-hex secret with Node crypto).
- Keep `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-7776844434912624` consistent with the single global script and pasted ad slots.
- Never commit `.env.local` or DB credentials to GitHub.

## Deployment
- `npm install mysql2`
- Merge PATCH files.
- Merge `layout-ad-manager-snippet.tsx.txt` imports/JSX into the existing layout. Do not overwrite existing ThemeProvider/Navbar/Footer or the existing global AdSense script; ensure only one global script exists.
- Optional page zones require explicit `AdZone` component insertion in homepage or PDF page.
- `npm run build`
- `git add -A && git commit && git push origin main`
- Configure Hostinger environment variables, then redeploy/restart.

## Limitations
- Auto Ads/Anchor/Vignette are enabled in the AdSense dashboard. They are not pasted into this unit manager.
- A saved manual ad unit is not guaranteed to fill on every page view. Google controls demand, eligibility, consent, and ad serving.
- Avoid duplicate slot IDs on the same page, excessive density, accidental-click placements, pop-ups/pop-unders, or auto-refresh.
- AdSense account/payment setup must be owned and administered by an adult account holder. Do not bypass age requirements or share payment credentials.

## Existing Convia project features to protect
- Existing PDF routes / tools such as merge, split, organize, extract, compress, watermark.
- Compress tool has used `@fileslim/compress`, `pdfjs-dist`, and a worker fix script; do not replace its page or `postinstall` worker patch while integrating this manager.
- Existing root layout includes ThemeProvider, Navbar, Footer, and one AdSense global loader. Merge changes carefully.
