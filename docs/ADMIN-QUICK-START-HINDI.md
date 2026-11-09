# Convia AdSense Manager — Hindi Quick Start

## Dashboard URL

`https://convia.saanwariyasethfashion.com/admin/ads`

## Hostinger par kya banana hai?

1. Hostinger hPanel me Convia Node.js website select karein.
2. Databases → Management me MySQL database aur user banayein.
3. Host, port, full DB name, username, password save karein.
4. Hostinger Node.js app ke Environment variables me `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` set karein.
5. `CONVIA_ADS_ADMIN_PASSWORD` aur 64-character `CONVIA_ADS_SESSION_SECRET` bhi add karein.
6. Local project me `npm install mysql2` chalayein.
7. PATCH folder merge karein aur layout snippet ke mutabik AdZone components add karein.
9. Build karke GitHub par push karein, phir Hostinger deploy karein.

## Ads kaise add honge?

1. `/admin/ads` kholein.
2. Admin password se sign in karein.
3. Ek AdSense ad-unit ka poora code paste karein.
4. Placement, page scope aur device choose karein.
5. Save karein. Unit MySQL me save ho jayega.
6. Aage kisi ad ko add/disable/delete karne ke liye GitHub push ki zarurat nahi hogi.

## Important

- Ek baar root layout me global `adsbygoogle.js` script rakhein. Har ad unit me dobara script na jodein.
- Auto Ads, Anchor aur Vignette ko AdSense dashboard me enable karein. Is admin me manual `<ins class="adsbygoogle">` units paste hote hain.
- Google har page par ad dikhane ki guarantee nahi deta.
- Same slot ko same page par multiple times na lagayein; excessive ads user experience aur policy dono ke liye kharab ho sakte hain.
- Account adult account holder ke naam par owned/administered hona chahiye. Minor user ko account credentials/payment access manage nahi karna chahiye.
