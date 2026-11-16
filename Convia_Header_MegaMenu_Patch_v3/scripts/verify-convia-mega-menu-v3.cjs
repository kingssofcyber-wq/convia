const fs = require("node:fs"); const path = require("node:path"); const root = process.cwd();
const files = [
  ["app/layout.tsx", s => s.includes('import "./convia-navigation.css";') && (s.includes("<SiteHeader") || s.includes("<Navbar"))],
  ["components/layout/site-header.tsx", s => s.includes("convia-pdf-mega-menu") && s.includes("onMouseEnter={() => setPdfMenuOpen(true)}") && s.includes("pdfCategories.map") && s.includes("export function SiteHeader")],
  ["components/layout/navbar.tsx", s => s.includes("convia-pdf-mega-menu") && s.includes("export function Navbar")],
  ["app/convia-navigation.css", s => s.includes(".cv-site-header .cv-mega-panel") && s.includes("z-index:1100")],
]; let bad=false; for (const [f,check] of files) {const p=path.join(root,f); const ok=fs.existsSync(p)&&check(fs.readFileSync(p,"utf8")); console.log(`${ok?"PASS":"FAIL"} ${f}`); if(!ok)bad=true;} if(bad)process.exit(1);
