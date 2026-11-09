# Convia audit and repair report

## Scope

This is a source-based repair overlay based on the previously inspected public Convia repository and the user-provided Next.js structure. It is not a fresh full repository checkout and cannot certify all live runtime behaviour.

## Issues addressed in the patch

1. Missing PDF tool routes: a dynamic Coming Soon page is provided for 23 unimplemented routes, so links have an intentional information page rather than a blank/broken endpoint, provided the card href slugs match the listed slugs.
2. Login and Signup: placeholder Coming Soon pages are provided; no false authentication form is presented.
3. Homepage completeness: Loans & EMI, Insurance and Health sections are clearly marked as planned and not represented as working calculators/quotes.
4. Tool discoverability: ToolCard uses Available / Coming Soon labels based on `lib/tool-status.ts`.
5. Contact page: the form opens a prefilled email draft and clearly says it does not send to a backend. Confirm `support@convia.com` is a real monitored mailbox.
6. Privacy and Terms: avoids an unverified blanket claim that every planned tool is 100% browser-only; review it against the actual data flow.
7. AdSense component: uses its `adSlot` prop, and global script is loaded once from the root layout.
8. SEO: Next.js `robots.ts` and `sitemap.ts` are provided. The sitemap excludes Coming Soon pages and placeholder account pages.
9. UX: route loading state, recoverable route error state, responsive navbar accessibility and compact PDF tool heroes are provided.
10. ads.txt: supplied publisher record is included for the Convia host. If AdSense's site entry is the parent domain, verify the record at the parent's actual `/ads.txt` as well.

## Not certified by this package

- All PDF processing edge cases or output fidelity.
- Compression target achievement or quality for every PDF.
- Payment/account authentication; Login/Signup are placeholders.
- Real backend message delivery; Contact uses mailto.
- Finance, insurance or health calculations; those sections are marked Coming Soon.
- AdSense approval, fill rate, or an ad appearing on every route.
- Production build on the owner's latest working repository.

## Six existing PDF tools to retest

- `/pdf/merge`
- `/pdf/split`
- `/pdf/organize`
- `/pdf/extract`
- `/pdf/compress`
- `/pdf/watermark`

The current Compress PDF source and its `@fileslim/compress` worker patch must be kept from the owner's latest working checkout; this package deliberately does not replace the compression page or worker script.

## Important account note

An AdSense account linked to Blogger can monetize another owned site only after that site is added to the AdSense Sites list, reviewed and configured. Blogger gadgets and Blogger post-ad settings are not Next.js components.
