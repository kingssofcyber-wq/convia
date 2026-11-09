# Convia Step 5 — Responsive UX, Loading, Ads and SEO

This patch adds or updates:

- A compact PDF tool hero/header style. Large gradient headers are narrowed and their vertical padding, decorative glow circles and h1 size are reduced.
- A compact title row for pages such as Organize PDF.
- A mobile navbar that closes after navigation, supports Escape and exposes `aria-expanded` / `aria-controls`.
- `app/loading.tsx` for route loading feedback.
- `app/error.tsx` for a recoverable route error screen.
- `app/robots.ts` and `app/sitemap.ts` using Next.js App Router metadata conventions.
- A page list that keeps unimplemented Coming Soon routes out of the sitemap.
- AdSense setup guidance for an account that is already active through Blogger.
- Responsive AdSense container styling and one global script in the root layout.

## Apply the compact title/header fix

1. Copy the package's `PATCH/` folder contents into `D:\convia\`, merging folders.
2. Ensure `PATCH/app/convia-ux-overrides.css` is copied to `D:\convia\app\convia-ux-overrides.css`.
3. Ensure `PATCH/scripts/apply-convia-ux-fixes.cjs` is copied to `D:\convia\scripts\apply-convia-ux-fixes.cjs`.
4. From `D:\convia`, run:

```cmd
node scripts/apply-convia-ux-fixes.cjs
```

The script backs up changed page files to `.convia-repair-backup/`, adds the stylesheet import after `./globals.css`, and scans `app/pdf/**/page.tsx` to compact the first gradient tool hero (or a simple bordered title row such as Organize PDF). It does not edit PDF processing logic, compression SDK files, the worker patch, or ad slot IDs.

If a page uses a highly dynamic JSX class expression, the script may not find it. The compact CSS class can then be added manually to that page's outer hero section as `convia-compact-tool-hero`.

## Loading and route errors

`app/loading.tsx` is the App Router loading UI. `app/error.tsx` is a route-segment error boundary with Retry and Home actions. These do not replace page-specific loading indicators inside PDF tools.

## SEO checks

After deployment, open:

- `https://convia.saanwariyasethfashion.com/robots.txt`
- `https://convia.saanwariyasethfashion.com/sitemap.xml`
- `https://convia.saanwariyasethfashion.com/ads.txt`

The sitemap intentionally lists only public pages and currently available PDF tools. Coming Soon routes are noindex and omitted until they contain working content.

## Validation

Run locally:

```cmd
npm run build
npm run dev
```

Check desktop and mobile widths, dark/light theme, navigation anchors, all six existing working PDF pages, and every Coming Soon route. Then push to GitHub and deploy the Convia Node.js app in Hostinger.

Do not replace the latest working Compress PDF page, `scripts/fix-fileslim-worker.cjs`, `package.json`, or lockfile with an older file from another ZIP. This UX patch does not contain a replacement for those files.
