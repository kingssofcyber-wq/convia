const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
const checks = [
  ["app/layout.tsx", (s) => s.includes('import "./convia-navigation.css";') && !s.includes('import "./convia-brand-v5.css";')],
  ["components/brand/convia-logo.tsx", (s) => s.includes("export function ConviaLogo") && s.includes("export function ConviaMark") && s.includes("<svg")],
  ["components/layout/site-header.tsx", (s) => s.includes("cv-site-header") && s.includes("cv-mega-panel") && s.includes("pdfCategories")],
  ["components/layout/navbar.tsx", (s) => s.includes("SiteHeader as Navbar")],
  ["components/layout/tool-header.tsx", (s) => s.includes("ToolPageHeader")],
  ["components/pdf/tool-page-header.tsx", (s) => s.includes("tool-page-hero") && s.includes("ConviaMark")],
  ["app/convia-navigation.css", (s) => s.includes(".cv-mega-panel") && s.includes(".convia-shared-tool-hero")],
  ["app/icon.svg", (s) => s.includes("<svg") && s.includes("gradient")],
  ["app/apple-icon.png", (s) => fs.statSync(path.join(root, "app/apple-icon.png")).size > 1000],
  ["app/favicon.ico", (s) => fs.statSync(path.join(root, "app/favicon.ico")).size > 500],
  ["public/brand/convia-logo.svg", (s) => s.includes("convia")],
  ["public/brand/convia-mark.svg", (s) => s.includes("<svg")],
  ["public/brand/convia-logo.png", (s) => fs.statSync(path.join(root, "public/brand/convia-logo.png")).size > 1000],
  ["public/brand/convia-mark.png", (s) => fs.statSync(path.join(root, "public/brand/convia-mark.png")).size > 1000],
  ["public/brand/convia-social-card.png", (s) => fs.statSync(path.join(root, "public/brand/convia-social-card.png")).size > 1000],
];
let failed = 0;
for (const [relative, test] of checks) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    console.error(`FAIL  ${relative} (missing)`);
    failed++;
    continue;
  }
  const content = relative.endsWith(".png") || relative.endsWith(".ico") ? "" : fs.readFileSync(file, "utf8");
  const passed = test(content);
  console.log(`${passed ? "PASS" : "FAIL"}  ${relative}`);
  if (!passed) failed++;
}
const header = fs.readFileSync(path.join(root, "components/layout/site-header.tsx"), "utf8");
const linkCount = (header.match(/href:\s*["']\/pdf\//g) || []).length;
console.log(`${linkCount >= 20 ? "PASS" : "WARN"}  PDF mega menu routes found in catalogue: ${linkCount}`);
if (failed) process.exit(1);
console.log("Convia header/logo verification passed. Run npx tsc --noEmit and npm run build next.");
