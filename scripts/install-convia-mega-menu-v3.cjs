const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const patchRoot = path.resolve(__dirname, "..", "patch-files");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".convia-backups", `mega-menu-v3-${stamp}`);
const targets = [
  ["components/layout/site-header.tsx", "components/layout/site-header.tsx"],
  ["components/layout/navbar.tsx", "components/layout/navbar.tsx"],
  ["app/convia-navigation.css", "app/convia-navigation.css"],
];
function fail(message) { console.error(`[Convia Mega Menu v3] ${message}`); process.exit(1); }
const layoutPath = path.join(root, "app", "layout.tsx");
if (!fs.existsSync(layoutPath)) fail("app/layout.tsx not found. Run from D:\\convia project root.");
let layout = fs.readFileSync(layoutPath, "utf8");
const hasSiteHeaderImport = /import\s*\{\s*SiteHeader\s*\}\s*from\s*["']@\/components\/layout\/site-header["']/.test(layout);
const hasNavbarImport = /import\s*\{\s*Navbar\s*\}\s*from\s*["']@\/components\/layout\/navbar["']/.test(layout);
const hasSiteHeaderMount = /<SiteHeader\s*\/?\s*>/.test(layout);
const hasNavbarMount = /<Navbar\s*\/?\s*>/.test(layout);
if (!(hasSiteHeaderImport && hasSiteHeaderMount) && !(hasNavbarImport && hasNavbarMount)) {
  fail("Root layout does not visibly mount SiteHeader or Navbar. No files changed. Check app/layout.tsx.");
}
for (const [srcRel, dstRel] of targets) {
  const src = path.join(patchRoot, srcRel); const dst = path.join(root, dstRel);
  if (!fs.existsSync(src)) fail(`Missing patch file: ${src}`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
}
fs.mkdirSync(backupRoot, { recursive: true });
for (const rel of [...targets.map(x => x[1]), "app/layout.tsx"]) {
  const src = path.join(root, rel);
  if (fs.existsSync(src)) { const dst = path.join(backupRoot, rel); fs.mkdirSync(path.dirname(dst), {recursive:true}); fs.copyFileSync(src,dst); }
}
for (const [srcRel,dstRel] of targets) {
  fs.copyFileSync(path.join(patchRoot,srcRel),path.join(root,dstRel));
  console.log(`[Convia Mega Menu v3] Updated ${dstRel}`);
}
const cssImport = 'import "./convia-navigation.css";';
if (!layout.includes(cssImport)) {
  const after = 'import "./convia-design-system.css";';
  if (layout.includes(after)) layout = layout.replace(after, `${after}\n${cssImport}`);
  else if (layout.includes('import "./globals.css";')) layout = layout.replace('import "./globals.css";', `import "./globals.css";\n${cssImport}`);
  else layout = `${cssImport}\n${layout}`;
  fs.writeFileSync(layoutPath, layout, "utf8");
  console.log("[Convia Mega Menu v3] Added navigation CSS to app/layout.tsx");
}
console.log(`[Convia Mega Menu v3] Complete. Backup: ${backupRoot}`);
console.log("[Convia Mega Menu v3] On desktop click or hover PDF Tools. On mobile open hamburger > PDF Tools.");
