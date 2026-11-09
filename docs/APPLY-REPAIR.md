# Apply the Convia repair patch safely

## Before copying

1. Keep a backup of `D:\convia` or create a Git checkpoint commit.
2. Extract this ZIP to a temporary directory.
3. Copy the contents of `PATCH/` into `D:\convia\`, preserving folder structure. Merge folders when Windows asks.
4. Do not copy the `PATCH` folder itself as a nested folder named `D:\convia\PATCH`.

## Files to add/replace

New files:
- `app/pdf/[slug]/page.tsx`
- `app/loading.tsx`
- `app/error.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/convia-ux-overrides.css`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/not-found.tsx`
- `components/home/home-service-sections.tsx`
- `components/home/tool-card.tsx`
- `lib/tool-status.ts`
- `public/ads.txt`
- `scripts/apply-convia-ux-fixes.cjs`

Updated templates/components:
- `app/page.tsx`
- `app/layout.tsx`
- `app/about/page.tsx`
- `app/contact/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/pdf/watermark/page.tsx`
- `components/ads/adsense.tsx`
- `components/layout/navbar.tsx`

Compare these with your latest local files before replacing. The patch intentionally does not include `app/pdf/compress/page.tsx`, merge, split, organize or extract pages.

## Compact page headers

After copying the files, run from `D:\convia`:

```cmd
node scripts/apply-convia-ux-fixes.cjs
```

This script creates a backup in `.convia-repair-backup/`, imports the compact CSS from `app/layout.tsx`, and reduces oversized PDF tool hero backgrounds/headings. It does not alter PDF processing logic.

## AdSense when your account is active through Blogger

An approved Blogger-linked AdSense account can also monetize your own website, but Convia must be added to the AdSense Sites list and reviewed. Blogger Layout gadgets do not transfer to a Next.js site. See `docs/BLOGGER-ADSENSE-CONVIA.md`.

Keep the AdSense global script once in `app/layout.tsx` and the supplied publisher ID. Do not paste the script into each individual tool page. Auto Ads are configured in AdSense → Ads → By site. Google decides eligible locations; ads are not guaranteed on every URL or visit.

## Contact email verification

The repair Contact page uses `support@convia.com` as the support address and opens a `mailto:` draft. Confirm that this mailbox exists and is monitored. It does not submit messages to a Convia server.

## Build and smoke-test

From `D:\convia`:

```cmd
npm run build
npm run dev
```

Test the homepage, mobile navigation, all six available PDF tools, all Coming Soon routes, Login/Signup Coming Soon, About, Contact, Privacy, Terms, `/robots.txt`, `/sitemap.xml` and `/ads.txt`.

Do not commit `.env.local`, API keys or credentials. Do not modify the Saanwariya root-domain `public_html` or DNS while deploying Convia.
