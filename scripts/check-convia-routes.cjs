const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
const toolsFile = path.join(root, "lib", "tools.ts");
if (!fs.existsSync(toolsFile)) { console.error("Missing lib/tools.ts"); process.exit(1); }
const routes = ["compress", "merge", "split", "organize", "extract", "watermark", "pdf-to-word", "word-to-pdf", "pdf-to-jpg", "jpg-to-pdf", "excel-to-pdf", "ppt-to-pdf", "rotate", "delete-pages", "crop", "page-numbers", "protect", "unlock", "sign", "edit", "ocr", "repair", "flatten", "redact", "compare", "annotate", "add-image", "html-to-pdf", "text-to-pdf", "metadata"];
const dynamicFallback = path.join(root, "app", "pdf", "[slug]", "page.tsx");
console.log(`Catalogue entries: ${routes.length}`);
console.log(`Dynamic Coming Soon fallback: ${fs.existsSync(dynamicFallback) ? "present" : "MISSING"}`);
for (const slug of routes) { const staticPage = path.join(root, "app", "pdf", slug, "page.tsx"); console.log(`${fs.existsSync(staticPage) ? "STATIC" : "FALLBACK"} /pdf/${slug}`); }
