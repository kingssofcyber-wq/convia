const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.cwd();
const patchRoot = path.resolve(__dirname, "..", "patch-files");
const layoutFile = path.join(projectRoot, "app", "layout.tsx");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(projectRoot, ".convia-backups", `brand-refresh-v5-${stamp}`);

const files = [
  "components/brand/convia-logo.tsx",
  "components/layout/site-header.tsx",
  "components/layout/navbar.tsx",
  "components/layout/tool-header.tsx",
  "components/pdf/tool-page-header.tsx",
  "app/convia-brand-v5.css",
  "app/icon.svg",
  "app/favicon.ico",
  "app/apple-icon.png",
  "public/brand/convia-mark.png",
  "public/brand/convia-mark-192.png",
  "public/brand/convia-logo.png",
  "public/brand/convia-logo.svg",
  "public/brand/convia-social-card.png",
];

function fail(message) {
  console.error(`[Convia Brand Refresh v5] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(layoutFile)) fail("app/layout.tsx not found. Run from the Convia project root, e.g. cd /d D:\\convia.");
for (const rel of files) {
  if (!fs.existsSync(path.join(patchRoot, rel))) fail(`Patch source missing: ${path.join(patchRoot, rel)}`);
}

const existingLayout = fs.readFileSync(layoutFile, "utf8");
const siteHeaderMounted = /<SiteHeader\s*\/?\s*>/.test(existingLayout) || /<Navbar\s*\/?\s*>/.test(existingLayout);
if (!siteHeaderMounted) {
  fail("app/layout.tsx does not visibly mount SiteHeader or Navbar. No project files were changed. Check the actual root header mount first.");
}

// Back up every existing destination before replacing any project file.
for (const rel of [...files, "components/layout/footer.tsx", "app/layout.tsx"]) {
  const source = path.join(projectRoot, rel);
  if (fs.existsSync(source)) {
    const destination = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

for (const rel of files) {
  const source = path.join(patchRoot, rel);
  const destination = path.join(projectRoot, rel);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`[Convia Brand Refresh v5] Updated ${rel}`);
}

// Add our scoped CSS last, without removing any existing design-system or navigation imports.
let layout = fs.readFileSync(layoutFile, "utf8");
const cssImport = 'import "./convia-brand-v5.css";';
if (!layout.includes(cssImport)) {
  const anchors = [
    'import "./convia-navigation.css";',
    'import "./convia-design-system.css";',
    'import "./globals.css";',
  ];
  const anchor = anchors.find((candidate) => layout.includes(candidate));
  if (!anchor) fail("Could not find a global CSS import in app/layout.tsx. Files were copied; add import './convia-brand-v5.css' after your global styles manually.");
  layout = layout.replace(anchor, `${anchor}\n${cssImport}`);
  fs.writeFileSync(layoutFile, layout, "utf8");
  console.log("[Convia Brand Refresh v5] Added global brand stylesheet import");
}

// Keep the existing metadata intact while attaching brand icons and social preview.
if (!/\bicons\s*:/.test(layout)) {
  const metadataAnchor = /applicationName\s*:\s*["']Convia["']\s*,/;
  if (metadataAnchor.test(layout)) {
    layout = layout.replace(metadataAnchor, (match) => `${match}\n  icons: { icon: "/brand/convia-mark-192.png", shortcut: "/brand/convia-mark-192.png", apple: "/brand/convia-mark-192.png" },`);
  } else {
    console.warn("[Convia Brand Refresh v5] Could not safely locate applicationName in metadata; icon files are still installed.");
  }
}
if (/openGraph\s*:\s*\{/.test(layout) && !/openGraph\s*:\s*\{[^}]*\bimages\s*:/.test(layout)) {
  layout = layout.replace(/openGraph\s*:\s*\{/, 'openGraph: { images: [{ url: "/brand/convia-social-card.png", width: 1200, height: 630, alt: "Convia — Every need, one place" }],');
}
fs.writeFileSync(layoutFile, layout, "utf8");

// Optional legacy footer: if it still uses its hand-built brand lockup, swap only that lockup.
const legacyFooterPath = path.join(projectRoot, "components", "layout", "footer.tsx");
if (fs.existsSync(legacyFooterPath)) {
  let footer = fs.readFileSync(legacyFooterPath, "utf8");
  if (footer.includes("footer-logo-lockup") && !footer.includes("ConviaLogo")) {
    if (!footer.includes('from "@/components/brand/convia-logo"')) {
      footer = footer.replace(/import\s+\{\s*ArrowUpRight\s*\}\s+from\s+["']lucide-react["'];/, (line) => `${line}\nimport { ConviaLogo } from "@/components/brand/convia-logo";`);
    }
    footer = footer.replace(/<div className="footer-logo-lockup">[\s\S]*?<\/div>/, '<ConviaLogo variant="inverse" tagline />');
    fs.writeFileSync(legacyFooterPath, footer, "utf8");
    console.log("[Convia Brand Refresh v5] Updated legacy Footer logo lockup");
  }
}

console.log(`[Convia Brand Refresh v5] Complete. Backup: ${backupRoot}`);
console.log("[Convia Brand Refresh v5] Main logo, footer logo, PDF workspace mark, app icons, favicon and social preview updated.");
console.log("[Convia Brand Refresh v5] Mega menu is click-to-open on desktop; mobile uses category accordions.");
