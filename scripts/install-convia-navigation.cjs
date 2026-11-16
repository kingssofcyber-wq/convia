const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const layoutPath = path.join(root, "app", "layout.tsx");
const cssPath = path.join(root, "app", "convia-navigation.css");
const importLine = 'import "./convia-navigation.css";';

if (!fs.existsSync(layoutPath)) {
  console.error("[Convia Navigation] app/layout.tsx was not found. Run this script from the project root.");
  process.exit(1);
}
if (!fs.existsSync(cssPath)) {
  console.error("[Convia Navigation] app/convia-navigation.css was not found. Copy the ZIP folders first.");
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
if (!source.includes(importLine)) {
  const designSystemImport = 'import "./convia-design-system.css";';
  const globalsImport = 'import "./globals.css";';
  if (source.includes(designSystemImport)) {
    source = source.replace(designSystemImport, `${designSystemImport}\n${importLine}`);
  } else if (source.includes(globalsImport)) {
    source = source.replace(globalsImport, `${globalsImport}\n${importLine}`);
  } else {
    source = `${importLine}\n${source}`;
  }
  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("[Convia Navigation] Added stylesheet import to app/layout.tsx");
} else {
  console.log("[Convia Navigation] Stylesheet import already exists; no duplicate added");
}

console.log("[Convia Navigation] Done. Header component and stylesheet are ready.");
