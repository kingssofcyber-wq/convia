#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const backupDir = path.join(root, '.convia-backups', `build-repair-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const patchCss = path.resolve(__dirname, '..', 'patch-files', 'app', 'convia-tool-header-premium.css');
const changed = [];
const warnings = [];

function fail(message) {
  console.error(`\n[Convia Build Repair] ERROR: ${message}\n`);
  process.exit(1);
}
function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) return null;
  return { file, text: fs.readFileSync(file, 'utf8') };
}
function writeBackup(file, relative) {
  fs.mkdirSync(path.join(backupDir, path.dirname(relative)), { recursive: true });
  fs.copyFileSync(file, path.join(backupDir, relative));
}
function edit(relative, label, transform, options = {}) {
  const current = read(relative);
  if (!current) {
    if (options.required) warnings.push(`${relative}: file not found; skipped`);
    return false;
  }
  const next = transform(current.text);
  if (next === current.text) {
    if (options.warnUnchanged) warnings.push(`${relative}: no matching code pattern found for ${label}`);
    return false;
  }
  writeBackup(current.file, relative);
  fs.writeFileSync(current.file, next, 'utf8');
  changed.push(`${relative} — ${label}`);
  return true;
}
function addClientDirective(text) {
  if (/^\s*['"]use client['"];?\s*(?:\r?\n|$)/.test(text)) return text;
  return `'use client';\n\n${text}`;
}

if (!fs.existsSync(path.join(root, 'package.json')) || !fs.existsSync(path.join(root, 'app'))) {
  fail('Run this from the Convia project root (the folder containing package.json and app/).');
}

// 1) Restore the global premium tool-header stylesheet without replacing the existing root layout.
const layoutPath = path.join(root, 'app', 'layout.tsx');
const cssTarget = path.join(root, 'app', 'convia-tool-header-premium.css');
if (!fs.existsSync(cssTarget)) {
  if (fs.existsSync(patchCss)) {
    fs.copyFileSync(patchCss, cssTarget);
    changed.push('app/convia-tool-header-premium.css — restored missing stylesheet');
  } else {
    warnings.push('Premium tool-header stylesheet missing from project and patch package.');
  }
}
edit('app/layout.tsx', 'import premium PDF header CSS once', (text) => {
  if (text.includes('convia-tool-header-premium.css')) return text;
  const line = 'import "./convia-tool-header-premium.css";';
  const globalImport = /import\s+["']\.\/globals\.css["'];?/;
  if (globalImport.test(text)) return text.replace(globalImport, (match) => `${match}\n${line}`);
  return `${line}\n${text}`;
}, { required: true });

// 2) PowerPoint API: remove unsupported language properties and retain mid alignment with typed compatibility.
edit('app/api/pdf/to-ppt/route.ts', 'PptxGenJS type compatibility', (text) => text
  .replace(/^\s*pptx\.lang\s*=\s*["']en-US["'];?\s*\r?\n/gm, '')
  .replace(/^\s*lang\s*:\s*["']en-US["'],?\s*\r?\n/gm, '')
  .replace(/valign\s*:\s*["']mid["']\s*,/g, 'valign: "mid" as any,'), { required: true, warnUnchanged: true });

// 3) PowerPoint client workspace: make the PDF.js loading-task type include its promise and assert the loaded proxy after assignment.
edit('components/pdf/pdf-to-ppt-workspace.tsx', 'PDF.js loading-task and nullable document types', (text) => {
  let next = text.replace(
    /let\s+loadingTask\s*:\s*\{\s*destroy\s*:\s*\(\s*\)\s*=>\s*Promise<void>\s*;?\s*\}\s*\|\s*null\s*=\s*null\s*;/g,
    'let loadingTask: { promise: Promise<any>; destroy: () => Promise<void> } | null = null;'
  );
  next = next.replace(/\bpdfDocument\.(numPages|getPage)\b/g, 'pdfDocument!.$1');
  return next;
}, { required: true, warnUnchanged: true });

// 4) PDF.js v6: render calls require the originating canvas; isEvalSupported is no longer in DocumentInitParameters.
for (const relative of ['app/pdf/compress/page.tsx']) {
  edit(relative, 'PDF.js RenderParameters canvas + remove obsolete isEvalSupported', (text) => {
    let next = text.replace(/((?:page|sourcePage)\.render\(\{\s*)(?=canvasContext\s*:)/g, '$1canvas: canvas,\n        ');
    next = next.replace(/^\s*isEvalSupported\s*:\s*false\s*,?\s*\r?\n/gm, '');
    next = next.replace(/\s*,\s*isEvalSupported\s*:\s*false\s*,?/g, ',');
    next = next.replace(/isEvalSupported\s*:\s*false\s*,?/g, '');
    return next;
  }, { required: true, warnUnchanged: true });
}
edit('app/pdf/pdf-to-jpg/page.tsx', 'remove obsolete PDF.js isEvalSupported option', (text) =>
  text.replace(/^\s*isEvalSupported\s*:\s*false\s*,?\s*\r?\n/gm, '').replace(/\s*,\s*isEvalSupported\s*:\s*false\s*,?/g, ',').replace(/isEvalSupported\s*:\s*false\s*,?/g, ''), { required: true, warnUnchanged: true });

// 5) Watermark page uses the shared Button but the import was missing.
edit('app/pdf/watermark/page.tsx', 'add missing Button import', (text) => {
  if (/import\s+\{[^}]*\bButton\b[^}]*\}\s+from\s+["']@\/components\/ui\/button["']/.test(text)) return text;
  const reactImport = /^import\s+\*\s+as\s+React\s+from\s+["']react["'];?\s*$/m;
  if (reactImport.test(text)) return text.replace(reactImport, (match) => `${match}\nimport { Button } from "@/components/ui/button";`);
  return `import { Button } from "@/components/ui/button";\n${text}`;
}, { required: true, warnUnchanged: true });

// 6) Excel page passes a Lucide icon component through ToolHeader; mark page as a client entry.
edit('app/pdf/excel-to-pdf/page.tsx', 'make Excel converter page a client entry to allow icon component props', addClientDirective, { required: true, warnUnchanged: true });

// 7) AdSense HTMLIns ref and resize observer fallback typings.
edit('components/ads/adsense-unit.tsx', 'AdSense ins ref + safe resize observer fallback', (text) => {
  let next = text.replace(/useRef<HTMLElement\s*\|\s*null>/g, 'useRef<HTMLModElement | null>');
  next = next.replace(
    /if\s*\(\s*["']ResizeObserver["']\s+in\s+window\s*\)\s*\{\s*resizeObserver\s*=\s*new ResizeObserver\(tryPushAd\);\s*resizeObserver\.observe\(wrapper\);\s*\}\s*else\s*\{\s*window\.addEventListener\(["']resize["'],\s*tryPushAd\);\s*\}/,
    'if (typeof ResizeObserver !== "undefined") {\n      resizeObserver = new ResizeObserver(tryPushAd);\n      resizeObserver.observe(wrapper);\n    }\n    window.addEventListener("resize", tryPushAd);'
  );
  return next;
}, { required: true, warnUnchanged: true });

// 8) Tool card optional format label used by some catalogue entries.
edit('components/hero/tool-card.tsx', 'allow optional formatLabel on tool card model', (text) =>
  text.replace(/tool\s*:\s*Tool\s*;/, 'tool: Tool & { formatLabel?: string };'), { required: true, warnUnchanged: true });

// 9) BlobPart typing in TS 5.7+/React 19: copy the bytes into an ArrayBuffer.
edit('components/pdf/annotate-pdf-workspace.tsx', 'convert Uint8Array to ArrayBuffer for PDF Blob', (text) =>
  text.replace(/new\s+Blob\(\[bytes\]/g, 'new Blob([new Uint8Array(bytes).buffer as ArrayBuffer]'), { required: true, warnUnchanged: true });

// 10) react-dropzone accepts a strict Accept shape; cast the pre-built file accept map at the boundary.
edit('components/pdf/file-dropzone.tsx', 'react-dropzone Accept union compatibility', (text) =>
  text.replace(/accept\s*:\s*acceptConfig\s*,/g, 'accept: acceptConfig as unknown as import("react-dropzone").Accept,'), { required: true, warnUnchanged: true });

// 11) mysql2/promise is imported by the Ad Manager database module.
const packageInfo = read('package.json');
if (packageInfo) {
  try {
    const pkg = JSON.parse(packageInfo.text);
    if (!pkg.dependencies?.mysql2) warnings.push('Run `npm install mysql2` to satisfy lib/ads-db.ts.');
  } catch { warnings.push('Could not inspect package.json for mysql2 dependency.'); }
}

// 12) OCR/Tesseract return-type fixes.
edit('lib/pdf/pdf-to-word-extract.ts', 'use the supplied current-page callback in OCR progress', (text) =>
  text.replace(/OCR reading scanned page \$\{pageIndex \+ 1\} of \$\{totalPages\}/g, 'OCR reading scanned page ${getPageIndex() + 1} of ${totalPages}'), { required: true, warnUnchanged: true });

edit('lib/pdf/positioned-extract.ts', 'cast Tesseract word result to the documented runtime shape', (text) => {
  const oldLine = /^\s*const words\s*=.*result\.data\.words.*;\s*$/m;
  const newLine = '    const words = (((result.data as unknown as { words?: Array<{ text: string; confidence?: number; bbox: { x0: number; y0: number; x1: number; y1: number }; block?: number; paragraph?: number; line?: number }> }).words) ?? []);';
  return text.replace(oldLine, newLine);
}, { required: true, warnUnchanged: true });

// 13) Tailwind v4 config accepts the string form for class-based dark mode.
edit('tailwind.config.ts', 'normalize darkMode strategy for installed Tailwind types', (text) =>
  text.replace(/darkMode\s*:\s*\[\s*["']class["']\s*\]/g, 'darkMode: "class"'), { required: true, warnUnchanged: true });

if (changed.length) console.log(`\n[Convia Build Repair] Backing up ${changed.length} changed file(s) to ${backupDir}`);
console.log('\n[Convia Build Repair] Changes:');
for (const item of changed) console.log(`  PASS  ${item}`);
if (!changed.length) console.log('  No source changes were needed (files may already be fixed).');
if (warnings.length) {
  console.log('\n[Convia Build Repair] Notes:');
  for (const item of warnings) console.log(`  NOTE  ${item}`);
}
console.log('\nNext commands: npm install mysql2 && npx tsc --noEmit && npm run build');
