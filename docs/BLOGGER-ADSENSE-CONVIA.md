# Use the AdSense account linked to Blogger on Convia (Next.js)

Your AdSense account being active through Blogger does **not** automatically place Blogger gadgets on Convia. Google confirms that an AdSense account linked to an approved Blogger account can also monetize an owned website, but the website must be added to the AdSense Sites list, reviewed, and then configured for ads.

Official Google help: https://support.google.com/adsense/answer/9246927

## What to do

1. Sign in to the **same AdSense account** that is linked to your Blogger blog.
2. Open **Sites** in AdSense. Add the domain Google accepts for your Convia site. In this setup the app is `convia.saanwariyasethfashion.com`; if AdSense asks for the registrable/root domain, follow the AdSense prompt and use `saanwariyasethfashion.com`.
3. Complete the site connection/ownership check and wait for the site's review. An approved Blogger blog does not waive the review for a separate website.
4. In **Ads → By site → Convia/site → Edit**, turn on Auto ads and choose available formats such as in-page, anchor, vignette and side rail according to the layout. Save/apply the settings.
5. Keep the AdSense library script **once** in `app/layout.tsx`, which is the shared App Router root layout. The repair patch includes this single global script with the Publisher ID provided by the site owner: `ca-pub-7776844434912624`.
6. For manually placed ads, create individual ad units in AdSense and give each placement its own real slot ID. The `AdSense` component must receive the slot through its `adSlot` prop. Do not copy one slot ID into several different placements.

## What not to do

- Do not paste a Blogger HTML/JavaScript gadget or Blogger theme XML into Next.js. Blogger's Layout gadgets and “Show ads between posts” setting apply to Blogger templates only.
- Do not load `adsbygoogle.js` repeatedly from each page or each PDF tool. The global layout loads it once.
- Do not call `adsbygoogle.push({})` on every client-side route change to force ads. This can cause duplicate-slot errors.
- Do not build custom full-screen popups that imitate AdSense. Use Google's supported Vignette/Anchor/Side rail formats in the AdSense dashboard.
- Auto ads do not guarantee an ad on every route, every visit, or every viewport. Google chooses eligible locations and may not fill every request. Thin Coming Soon pages, error pages, login/signup placeholders and empty utility pages should not be treated as guaranteed ad placements.

## ads.txt

The patch's `public/ads.txt` is served from the Convia subdomain. If the AdSense Sites entry is the root domain `saanwariyasethfashion.com`, ensure the authorised ads.txt record is also available at the root domain's own `/ads.txt` URL. Do not replace the Saanwariya website files; add/verify the record in that site's actual web root if AdSense asks for it.

## Privacy / consent

AdSense may use cookies or similar technologies depending on visitor location and consent settings. Review Google's policy requirements and configure a consent solution where required for your visitors. Do not claim every PDF tool is 100% browser-only unless you have verified the processing path of each tool.

## Under-18 account note

An AdSense account holder must meet Google's age requirement. If the publisher is under 18, a parent/guardian must handle the AdSense account and payments under Google's rules.
