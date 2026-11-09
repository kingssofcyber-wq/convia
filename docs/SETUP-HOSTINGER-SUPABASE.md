# Convia Central AdSense Manager — Hostinger + Supabase setup

## Why Supabase was selected

For this manager, the stored data is structured: ad units have a publisher, slot, format, placement zone, route scope, device, priority and enabled state. Supabase provides PostgreSQL tables, Supabase Auth and Row Level Security in one managed service. MongoDB Atlas is also compatible with Next.js and can be a good fit for document-first data, but it would require a separate auth/security setup for this small relational admin manager. Hostinger's Node.js Database Connect Wizard currently supports both Supabase and MongoDB Atlas; this package is written for Supabase.

## A. Connect Supabase from Hostinger

1. Open Hostinger hPanel and select the Convia Node.js website (not the Saanwariya PHP/HTML site).
2. In the Node.js application dashboard, find Essentials > Database > Connect.
3. Select Supabase > Continue.
4. Sign in to Supabase and authorize Hostinger.
5. Choose an existing Supabase project or create a new one, then finish the wizard.
6. Hostinger can add the required environment variables and redeploy, but it does not change your application code. You still need to apply the SQL schema and install the package shown below.

Official Hostinger instructions: https://www.hostinger.com/support/connecting-a-supabase-database-to-a-hostinger-node-js-application/

If you already created a Supabase project through this wizard, use that same project. Do not create a second project unnecessarily.

## B. Apply the database table

1. Open the selected Supabase project.
2. Open SQL Editor > New query.
3. Copy all of `database/supabase-ads-manager.sql` and run it.
4. Check Table Editor; `public.convia_ad_units` should exist.

The table has Row Level Security enabled. Browser roles `anon` and `authenticated` receive no direct table privileges. The Next.js server uses the server-only service key after verifying the admin's Supabase Auth session and email allowlist.

## C. Create the administrator account

1. In Supabase Dashboard, open Authentication > Users.
2. Add an email/password user for the person who is authorized to manage ads.
3. Verify/confirm the email if Supabase asks.
4. In Hostinger Node.js Environment Variables, set `CONVIA_ADS_ADMIN_EMAILS` to that exact email. Multiple allowlisted emails can be comma-separated.
5. Only those email addresses can use `/admin/ads`.

Never put a service role or secret key in the browser or a `NEXT_PUBLIC_` variable.

## D. Environment variables

This package reads these names:

- `NEXT_PUBLIC_SUPABASE_URL` (or server alias `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_KEY`)
- `CONVIA_ADS_ADMIN_EMAILS`
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID`

Hostinger's wizard may add its own variable names. Open the Environment Variables page and check the actual names. If the expected `NEXT_PUBLIC_*` names are not present, add them manually from the same Supabase project's Connect/API settings. Add the server-only service-role/secret key separately. Do not publish it.

For local testing, copy `.env.supabase.example` to `.env.local` and fill in real values. `.env.local` must stay out of Git.

## E. Install the dependency

From `D:\convia`:

```cmd
npm install @supabase/supabase-js
```

Keep your existing dependencies and scripts. Do not remove your existing `scripts/fix-fileslim-worker.cjs` postinstall entry. If your `package.json` already has a `postinstall`, merge rather than overwrite it.

## F. Apply the PATCH folder

Merge the ZIP's `PATCH` folder into the root of `D:\convia`, preserving the folder structure. Review conflicts before replacing files:

- `app/api/ads/config/route.ts`
- `app/api/ads/admin/units/route.ts`
- `app/api/ads/admin/units/[id]/route.ts`
- `app/admin/ads/page.tsx`
- `components/ads/ad-zone.tsx`
- `app/ads-manager.css`
- `lib/ads-parser.ts`
- `lib/ads-types.ts`
- `lib/ads/require-admin.ts`
- `lib/supabase/browser.ts`
- `lib/supabase/admin.ts`

This is a Supabase replacement for the earlier MySQL-based Ad Manager. The old MySQL-specific `lib/ads-db.ts` is not used by this package. Only remove it if the rest of your site does not use it. Likewise, remove old password-cookie Ad Manager API routes only if they are no longer referenced.

## G. Integrate AdZone in the existing layout

See `components/ads/layout-integration.txt`. Do not replace your entire `app/layout.tsx`; merge the `AdZone` components around your existing Navbar, main content and Footer. Keep exactly one global AdSense loader script.

Global zones automatically apply to every matching public route. `home-after-hero` and `pdf-after-tool` need one explicit `<AdZone>` component in the corresponding page, as shown in the integration guide.

## H. Local test

```cmd
cd /d D:\convia
npm run build
npm run dev
```

Open:

- `http://localhost:3000/admin/ads` — sign in using the Supabase Auth user.
- `http://localhost:3000/api/ads/config?zone=after-header&pathname=/` — should return `{ "ads": [] }` until an ad unit is enabled and saved.

On the dashboard, paste one complete AdSense ad unit snippet at a time. The parser reads only the `<ins class="adsbygoogle">` attributes. It ignores `<script>` tags and does not store or execute pasted JavaScript.

## I. Configure the four existing slots

Use `docs/FOUR-EXISTING-ADS-TO-PASTE.txt`. Your publisher ID is `ca-pub-7776844434912624`. The slot IDs supplied earlier are:

- Multiplex: `5509141619`
- Fixed 728x90 banner: `2354911961` (manager automatically sets Desktop only if Device is All)
- In-article: `7311509571`
- Responsive display: `2443937103`

Suggested initial placements are only suggestions. Do not place the same slot repeatedly on the same page. Check the AdSense unit format and policy before enabling each one.

## J. GitHub and Hostinger deployment

Before pushing, review staged files and ensure `.env.local` or any secret key is not included.

```cmd
git status
git add -A
git commit -m "Switch Convia Ad Manager to Supabase"
git push origin main
```

Then allow Hostinger to deploy the `main` branch. Ensure the environment variables are present in the Convia Node.js app, not the Saanwariya PHP/HTML site.

## K. Security notes

- Supabase publishable/anon key may be used in the browser only with correct RLS and least-privilege policies.
- Supabase service role/secret key must remain server-only. It bypasses RLS.
- Admin API routes validate Supabase Auth user tokens and require the email to be on `CONVIA_ADS_ADMIN_EMAILS`.
- Public API returns only enabled ad-unit attributes; it does not return raw scripts or database secrets.
- Never allow an admin to paste arbitrary JavaScript and execute it. This manager intentionally parses only a single AdSense `<ins>` tag.
- Manual Display/In-article/Multiplex units are managed here. Anchor/Vignette Auto Ads are configured in the AdSense dashboard and do not belong in this code-paste form.
- No system can force AdSense to fill every slot or show every format on every page. Availability, consent, policy, viewport, content and Google serving decisions apply.
