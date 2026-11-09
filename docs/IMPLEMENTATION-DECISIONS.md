# Implementation decisions

## Why Supabase rather than MongoDB for this manager?

Supabase is recommended for this specific feature because ad units are structured relational records with route, device, zone, priority and enabled-state fields. Supabase also provides PostgreSQL, Auth and RLS in the same project. MongoDB Atlas is technically compatible with Next.js and is flexible for document-shaped data, but it would add separate admin-auth and access-control implementation decisions for this small dashboard.

This is not a statement that MongoDB is inferior. If Convia later stores mostly flexible documents or uses MongoDB for its main product data, a MongoDB design could also be appropriate. For this isolated ad manager, Supabase is the simpler integrated choice.

## What the manager does

- Stores sanitized ad-unit attributes in `public.convia_ad_units`.
- Parses the `<ins class="adsbygoogle">` tag from one pasted snippet.
- Ignores pasted scripts and arbitrary JavaScript.
- Uses Supabase Auth email/password for the admin sign-in.
- Enforces an explicit `CONVIA_ADS_ADMIN_EMAILS` allowlist on the server.
- Uses a service-role/secret key only in Node.js API routes.
- Uses database RLS with no browser policies; browser cannot query the table directly.
- Public API returns only enabled and route-matching ad attributes.
- `AdZone` creates a new `ins.adsbygoogle` DOM node per configured unit and calls push after it can measure a non-zero visible width.

## What it does not do

- It does not turn Auto Ads into manual code units. Anchor/Vignette must be enabled in the AdSense dashboard.
- It does not guarantee Google fills every slot.
- It does not execute arbitrary JavaScript pasted into the admin page.
- It does not add content-specific placements magically without the corresponding `<AdZone>` component being present in that page.
- It does not use MySQL or MongoDB.
