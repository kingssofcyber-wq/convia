# Convia Mega Menu v3 – Hindi Install

## Is version mein kya fix hua
- PDF Tools menu ab click, hover aur keyboard focus par khulta hai.
- Header par laga `onMouseLeave` auto-close hata diya gaya hai, jo pointer menu tak pahunchne se pehle panel ko band kar sakta tha.
- Close button, outside click aur Escape key se menu band hoga.
- Mega menu ka z-index aur overflow visibility strong ki gayi hai.
- `site-header.tsx` aur `navbar.tsx` dono update hote hain; root layout jis component ko mount karta hai woh available rahega.
- Mobile par hamburger kholkar PDF Tools accordion expand karein.

## Install
1. ZIP extract karein.
2. CMD: `cd /d D:\convia`
3. Extracted folder ke actual path ke saath chalayein, example:
   `node "D:\Downloads\Convia_Header_MegaMenu_Patch_v3\scripts\install-convia-mega-menu-v3.cjs"`
4. Verify:
   `node "D:\Downloads\Convia_Header_MegaMenu_Patch_v3\scripts\verify-convia-mega-menu-v3.cjs"`
5. Build: `npx tsc --noEmit` phir `npm run build`.

Installer existing files ka backup `.convia-backups` mein banata hai. Yeh `package.json`, `package-lock.json`, `.env`, PDF processing logic, Supabase ya AdSense ko modify nahi karta.
