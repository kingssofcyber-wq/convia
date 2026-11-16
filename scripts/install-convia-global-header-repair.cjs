const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const patchRoot = path.resolve(__dirname, "..", "patch-files");
const layoutPath = path.join(root, "app", "layout.tsx");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".convia-backups", `global-header-repair-${stamp}`);

const files = [
  "components/brand/convia-logo.tsx",
  "components/layout/site-header.tsx",
  "components/layout/navbar.tsx",
  "components/layout/tool-header.tsx",
  "components/pdf/tool-page-header.tsx",
  "app/convia-navigation.css",
  "app/icon.svg",
  "app/apple-icon.png",
  "app/favicon.ico",
  "public/brand/convia-mark.svg",
  "public/brand/convia-mark.png",
  "public/brand/convia-mark-192.png",
  "public/brand/convia-logo.svg",
  "public/brand/convia-logo.png",
  "public/brand/convia-social-card.png",
];

function fail(message) {
  console.error(`[Convia Global Header Repair] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(layoutPath)) {
  fail("app/layout.tsx was not found. Run this command from the Convia project root (D:\\convia).");
}
for (const relative of files) {
  if (!fs.existsSync(path.join(patchRoot, relative))) {
    fail(`Patch file is missing: ${path.join(patchRoot, relative)}`);
  }
}

let layout = fs.readFileSync(layoutPath, "utf8");
const importsSiteHeader = /import\s*\{[^}]*\bSiteHeader\b[^}]*\}\s*from\s*["']@\/components\/layout\/site-header["']/.test(layout);
const importsNavbar = /import\s*\{[^}]*\bNavbar\b[^}]*\}\s*from\s*["']@\/components\/layout\/navbar["']/.test(layout);
const mountsSiteHeader = /<SiteHeader\s*\/?\s*>/.test(layout);
const mountsNavbar = /<Navbar\s*\/?\s*>/.test(layout);
if (!((importsSiteHeader && mountsSiteHeader) || (importsNavbar && mountsNavbar))) {
  fail("The root layout does not clearly import and mount SiteHeader or Navbar. No files were changed. Check app/layout.tsx first.");
}

// Back up every file that will be replaced, plus the root layout before editing it.
fs.mkdirSync(backupRoot, { recursive: true });
for (const relative of [...files, "app/layout.tsx"]) {
  const source = path.join(root, relative);
  if (fs.existsSync(source)) {
    const destination = path.join(backupRoot, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

for (const relative of files) {
  const source = path.join(patchRoot, relative);
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`[Convia Global Header Repair] Replaced ${relative}`);
}

// Remove the v5-only stylesheet which was coupled to a different header markup.
layout = layout.replace(/^\s*import\s+["']\.\/convia-brand-v5\.css["'];?\s*\r?\n/gm, "\n");

// Ensure the stable mega-menu stylesheet loads after the existing design system.
const navImport = 'import "./convia-navigation.css";';
if (!layout.includes(navImport)) {
  const designImport = 'import "./convia-design-system.css";';
  const globalsImport = 'import "./globals.css";';
  if (layout.includes(designImport)) {
    layout = layout.replace(designImport, `${designImport}\n${navImport}`);
  } else if (layout.includes(globalsImport)) {
    layout = layout.replace(globalsImport, `${globalsImport}\n${navImport}`);
  } else {
    layout = `${navImport}\n${layout}`;
  }
}
// De-duplicate accidental repeated imports without disturbing other CSS imports.
const occurrences = layout.match(/import\s+["']\.\/convia-navigation\.css["'];?/g) || [];
if (occurrences.length > 1) {
  let seen = false;
  layout = layout.replace(/^\s*import\s+["']\.\/convia-navigation\.css["'];?\s*\r?\n/gm, (line) => {
    if (seen) return "";
    seen = true;
    return 'import "./convia-navigation.css";\n';
  });
}
fs.writeFileSync(layoutPath, layout, "utf8");

console.log(`[Convia Global Header Repair] Complete. Backup saved at: ${backupRoot}`);
console.log("[Convia Global Header Repair] Main logo, announcement bar, navbar mega menu, footer logo component and shared PDF headers now use one compatible design system.");
console.log("[Convia Global Header Repair] Existing homepage content, PDF processing logic, package files, Supabase, AdSense and environment variables were not replaced.");
