# Implementation notes and verification status

## Design decisions

- Hostinger Business Node.js deployments can use Hostinger MySQL. This implementation uses `mysql2/promise` and `DB_HOST=127.0.0.1` per Hostinger's current Node.js/MySQL guidance.
- Ad unit settings are stored server-side in MySQL, not browser localStorage, so visitors and devices see the same configuration.
- The admin panel authenticates with an environment-based password and a signed, HTTP-only, SameSite=Strict session cookie.
- Pasted code is parsed to extract only `<ins class="adsbygoogle">` data attributes. Script elements and arbitrary JavaScript are discarded and are never stored/executed.
- A single global `adsbygoogle.js` loader remains in the existing root layout.
- Manual placements are separate from AdSense Auto Ads. Anchor/Vignette must be enabled in the AdSense dashboard.

## Local checks performed for this patch

- TypeScript/TSX transpile syntax check: all 13 `.ts`/`.tsx` files passed.
- Four ad-unit snippets supplied in the conversation were tested against the parser:
  - Multiplex `autorelaxed` slot 5509141619
  - Fixed 728x90 slot 2354911961
  - Fluid in-article slot 7311509571
  - Responsive display slot 2443937103
- The included worker fix script was tested with a mock package: it rewrote a Vite-style worker URL, copied the worker to `public/assets`, and succeeded a second time without error.
- ZIP archive integrity is checked after packaging.

## Not verified

- No full build was run against the user's actual `D:\convia` repository because the latest complete project source/package files were not uploaded in this turn.
- No Hostinger database or live deployment was accessed from here.
- No actual AdSense ad fill can be guaranteed; Google controls demand, policy eligibility, consent and serving.

## Before production

- Set Hostinger database credentials and strong admin secrets in the Node.js app environment variables.
- Ensure the AdSense account is owned and administered by an adult account holder. The adult must control the admin password and payments.
- Check that the publisher ID configured in the root AdSense loader matches the publisher ID inside every ad-unit snippet.
- Do not place ads adjacent to PDF upload/process/download controls, and do not use forced pop-ups/pop-unders or automatic refresh.
