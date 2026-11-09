CONVIA CENTRAL ADSENSE MANAGER — SUPABASE EDITION

Aapke Hostinger Business + Next.js setup ke liye is manager mein Supabase select kiya gaya hai, MongoDB nahi.

Kyun?
- Ad units ka data structured hota hai (slot, placement, route, device, enabled, priority).
- Supabase PostgreSQL + Auth + Row Level Security ek hi project mein deta hai.
- Hostinger Node.js Database Connect Wizard Supabase ko directly connect kar sakta hai.
- MongoDB bhi valid option hai, lekin is specific manager ke liye Supabase simpler hai.

Install karne se pehle:
1. D:\convia ka backup lo.
2. Hostinger > Convia Node.js app > Database > Connect > Supabase.
3. Supabase SQL Editor mein database/supabase-ads-manager.sql run karo.
4. Supabase Authentication > Users mein admin email/password user banao.
5. Hostinger environment variables configure karo (README docs dekho).
6. npm install @supabase/supabase-js
7. PATCH folder ko D:\convia mein merge karo. Layout snippet ko existing app/layout.tsx mein merge karo; poori file blindly replace mat karna.
8. npm run build, phir npm run dev.
9. /admin/ads open karke Supabase admin se login karo.

Important:
- SUPABASE_SERVICE_ROLE_KEY ya SUPABASE_SECRET_KEY kabhi NEXT_PUBLIC_ ke saath mat rakho.
- .env.local GitHub par upload mat karo.
- Global AdSense loader sirf app/layout.tsx mein ek baar.
- Auto Ads Anchor/Vignette Google AdSense dashboard mein enable hote hain; is dashboard mein manual ad unit code paste hota hai.
- Har page par ad guaranteed nahi hota; AdSense ki serving/policy decisions apply hoti hain.

Detailed Hindi/English setup: docs/SETUP-HOSTINGER-SUPABASE.md
Complete next-chat handout: docs/CONVIA-SUPABASE-ADS-MANAGER-HANDOUT.md
