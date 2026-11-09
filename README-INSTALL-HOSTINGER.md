# Convia Central AdSense Manager — Hostinger Business + GitHub

This is an additive patch for the existing Convia Next.js App Router project. It adds a password-protected `/admin/ads` control panel, stores ad-unit settings in Hostinger MySQL, and renders saved units at configured site-wide placements.

## Important boundaries

- Keep the existing single AdSense loader script in `app/layout.tsx`. Do not paste the loader script into each page or each ad unit.
- The manager accepts one AdSense `<ins class="adsbygoogle">` ad-unit snippet at a time. It parses only safe attributes from the `<ins>` element. It ignores and never stores/executes pasted JavaScript.
- Auto Ads overlay formats (Anchor/Vignette) are configured in the AdSense dashboard. They are not ordinary `<ins>` ad units and cannot be added by pasting a unit snippet here.
- Google decides whether an ad is filled. A saved placement does not guarantee an ad on every page view.
- Do not place ads next to PDF upload, process, delete, or download buttons; do not use forced pop-ups, pop-unders, or automatic refresh.
- Use this only with an AdSense account legitimately owned and administered by an adult account holder. Do not share that person's Google password or payment credentials.

## 1. Add the patch files

Merge the `PATCH` folder into the root of your existing `D:\convia` project. Do not replace your existing `app/layout.tsx`; use `layout-ad-manager-snippet.tsx.txt` to add the imports and components to your current layout.

New files added:

- `lib/ads-types.ts`
- `lib/ads-parser.ts`
- `lib/ads-db.ts`
- `lib/ads-auth.ts`
- `scripts/fix-fileslim-worker.cjs` (safe, repeatable replacement for the prior worker patch that was failing on a second run)
- `components/ads/ad-zone.tsx`
- `app/admin/ads/page.tsx`
- `app/api/ads/admin/login/route.ts`
- `app/api/ads/admin/logout/route.ts`
- `app/api/ads/admin/session/route.ts`
- `app/api/ads/admin/units/route.ts`
- `app/api/ads/admin/units/[id]/route.ts`
- `app/api/ads/config/route.ts`
- `app/ads-manager.css`

## 2. Merge the worker helper, then install the MySQL driver

This patch includes a safe, repeatable `scripts/fix-fileslim-worker.cjs`. If your current `postinstall` points to this file, it can run repeatedly without failing just because the worker URL was already patched. Merge this helper before installing the database driver. Keep your existing `postinstall` entry if it uses this same script.

From the project root:

```cmd
cd /d D:\convia
npm install mysql2
```

This updates `package.json` and the lockfile. Commit both to GitHub after local testing.

## 3. Create a MySQL database in Hostinger

In hPanel, open the Node.js website dashboard for `convia.saanwariyasethfashion.com`, then open Databases → Management (wording may vary by hPanel view). Create a MySQL database and database user. Save the full database name, username, and password.

For Hostinger's Node.js-to-MySQL connection, use:

- Host: `127.0.0.1` (not `localhost`)
- Port: `3306`
- Database: your Hostinger database name
- User: your Hostinger database username
- Password: the database password

The application creates the `convia_adsense_units` table automatically on first use. The SQL is also included at `database/adsense-units.sql` if you prefer to create it through phpMyAdmin.

## 4. Add environment variables

Copy `.env.example` as `.env.local` for local development. Fill in your own database credentials and create strong admin secrets. Do not commit `.env.local` to GitHub.

Generate a session secret on Windows using:

```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the printed 64-character value for `CONVIA_ADS_SESSION_SECRET`. Choose a separate strong password for `CONVIA_ADS_ADMIN_PASSWORD`.

In Hostinger, open the Convia Node.js website dashboard → Environment variables and add the same values there. Hostinger's dashboard variables are not stored in GitHub. Apply changes, then redeploy/restart the app.

Required server variables:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
CONVIA_ADS_ADMIN_PASSWORD=YOUR_LONG_RANDOM_ADMIN_PASSWORD
CONVIA_ADS_SESSION_SECRET=YOUR_64_CHARACTER_RANDOM_SECRET
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-7776844434912624
```

Keep the current AdSense global script in your root layout and ensure it appears only once. If your current layout uses a hard-coded publisher ID, it can stay as-is as long as it matches the publisher ID in the AdSense snippets.

## 5. Integrate placements into app/layout.tsx

Open `layout-ad-manager-snippet.tsx.txt`. Add its imports:

```tsx
import { AdZone, AdRail } from "@/components/ads/ad-zone";
import "./ads-manager.css";
```

Then place the components in your existing layout like this (keep your existing ThemeProvider and Navbar/Footer wrappers):

```tsx
<Navbar />
<AdZone zone="after-header" />
<AdRail side="left" />
<AdRail side="right" />
<main className="flex-1">{children}</main>
<AdZone zone="before-footer" />
<Footer />
```

For additional placements within a page, import `AdZone` and insert:

```tsx
<AdZone zone="home-after-hero" />
```

immediately after `<Hero />` in `app/page.tsx`, or:

```tsx
<AdZone zone="pdf-after-tool" />
```

at the end of a PDF tool page's main content. These two zones are optional and only render units assigned to those zones.

Remove old manual AdSense placements from pages where you do not want duplicate ads. Do not remove the single global loader script.

## 6. Open the admin dashboard

Start locally:

```cmd
npm run dev
```

Open:

`http://localhost:3000/admin/ads`

Sign in with `CONVIA_ADS_ADMIN_PASSWORD`.

For each ad unit:

1. Give it a label.
2. Paste one full AdSense ad-unit snippet. The `<script>` part is ignored; only the `<ins class="adsbygoogle">` attributes are parsed.
3. Choose a placement.
4. Choose page scope: All public pages, Homepage only, all PDF routes, or one exact route.
5. Choose device: All, Desktop, or Mobile.
6. Save.

You can add multiple ad units over time. Each is stored in MySQL. Enable, disable, or delete units in the same dashboard. Changes are available without a GitHub push or redeployment.

### Supported placements

- After header — in the shared root layout, across eligible public routes.
- Before footer — in the shared root layout, across eligible public routes.
- Left desktop rail — wide screens only.
- Right desktop rail — wide screens only.
- Homepage after hero — requires the optional `AdZone` in `app/page.tsx`.
- PDF tool after tool — requires the optional `AdZone` on the relevant tool page.

### Supported pasted ad-unit formats

- Responsive display (`data-ad-format="auto"`)
- In-article/fluid (`data-ad-format="fluid"` and `data-ad-layout="in-article"`)
- Multiplex (`data-ad-format="autorelaxed"`)
- Fixed-size units such as 728×90 (dimensions are read from inline style)

Paste one unit at a time. Do not add the same ad slot multiple times on the same page. Use Google's own AdSense dashboard for Auto Ads, Anchor, and Vignette formats.

## 7. Build and push to GitHub

```cmd
npm run build
git status
git add -A
git commit -m "Add central AdSense manager"
git push origin main
```

Do not stage `.env.local`, passwords, or database credentials. Hostinger will deploy from GitHub using your existing settings. Add the environment variables in Hostinger before opening `/admin/ads` in production.

## 8. Troubleshooting

- `Ad manager database is not configured`: add all DB_* variables in Hostinger and restart/redeploy.
- `Access denied ... @'::1'`: set `DB_HOST=127.0.0.1`, not `localhost`.
- Dashboard login fails: check `CONVIA_ADS_ADMIN_PASSWORD` and `CONVIA_ADS_SESSION_SECRET`, then restart the app.
- Ad unit saves but no ad appears: verify the Site is approved/Ready, the slot belongs to the configured publisher, the ad unit is active, the global script loads once, consent/ad blockers do not block it, and Google has demand for the placement.
- A unit is not displayed on mobile: check its Device selection. Fixed 728×90 units should normally be Desktop only.
- Auto Ads: turn them on and configure their formats in AdSense → Ads → By site. They are independent of the manual unit manager.

## Security notes

The dashboard is protected by an HTTP-only, SameSite=Strict, signed session cookie. Password and signing secret are server-only environment variables. The manager does not execute pasted arbitrary JavaScript. Keep the Node.js app and dependencies updated, protect your Hostinger account, and do not share admin credentials.
