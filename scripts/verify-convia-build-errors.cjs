#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
function check(label, relative, test) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { checks.push({ label, ok: false, detail: `${relative} not found` }); return; }
  const text = fs.readFileSync(file, 'utf8');
  const ok = test(text);
  checks.push({ label, ok, detail: ok ? 'OK' : `Needs attention: ${relative}` });
}
check('Premium tool-header CSS imported by root layout', 'app/layout.tsx', (s) => s.includes('convia-tool-header-premium.css'));
check('PPTX route has no unsupported lang properties', 'app/api/pdf/to-ppt/route.ts', (s) => !/pptx\.lang\s*=|^\s*lang\s*:\s*["']en-US["']/m.test(s) && !/valign\s*:\s*["']mid["'],/.test(s));
check('PDF.js compress render calls pass canvas', 'app/pdf/compress/page.tsx', (s) => { const calls = [...s.matchAll(/(?:page|sourcePage)\.render\(\{([^}]*)\}/g)]; return !/isEvalSupported\s*:/.test(s) && calls.length > 0 && calls.every((match) => /\bcanvas\s*:/.test(match[1])); });
check('PDF.js JPG page has no removed init option', 'app/pdf/pdf-to-jpg/page.tsx', (s) => !/isEvalSupported\s*:/.test(s));
check('Watermark imports Button', 'app/pdf/watermark/page.tsx', (s) => /import\s+\{[^}]*\bButton\b[^}]*\}\s+from\s+["']@\/components\/ui\/button["']/.test(s));
check('AdSense ins ref uses HTMLModElement', 'components/ads/adsense-unit.tsx', (s) => /useRef<HTMLModElement\s*\|\s*null>/.test(s));
check('Tool card supports optional formatLabel', 'components/hero/tool-card.tsx', (s) => /tool\s*:\s*Tool\s*&\s*\{\s*formatLabel\?\s*:\s*string/.test(s));
check('Annotate PDF creates Blob from ArrayBuffer', 'components/pdf/annotate-pdf-workspace.tsx', (s) => /new Blob\(\[new Uint8Array\(bytes\)\.buffer as ArrayBuffer\]/.test(s));
check('Dropzone Accept value is type-safe', 'components/pdf/file-dropzone.tsx', (s) => /accept:\s*acceptConfig as unknown as import\("react-dropzone"\)\.Accept/.test(s));
check('PPTX workspace loading task exposes promise', 'components/pdf/pdf-to-ppt-workspace.tsx', (s) => /loadingTask\s*:\s*\{\s*promise:\s*Promise<any>/.test(s));
check('PDF-to-Word OCR progress uses page callback', 'lib/pdf/pdf-to-word-extract.ts', (s) => !/OCR reading scanned page \$\{pageIndex \+ 1\}/.test(s));
check('Tesseract words are safely typed', 'lib/pdf/positioned-extract.ts', (s) => !/result\.data\.words/.test(s));
check('Tailwind darkMode uses class string', 'tailwind.config.ts', (s) => /darkMode\s*:\s*["']class["']/.test(s));
check('Excel route is a client entry', 'app/pdf/excel-to-pdf/page.tsx', (s) => /^['"]use client['"];/.test(s.trimStart()));

const pkgPath = path.join(root, 'package.json');
let mysqlOk = false;
if (fs.existsSync(pkgPath)) {
  try { const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); mysqlOk = Boolean(pkg.dependencies?.mysql2); } catch {}
}
checks.push({ label: 'mysql2 dependency installed in package.json', ok: mysqlOk, detail: mysqlOk ? 'OK' : 'Run npm install mysql2' });

console.log('\n[Convia Build Repair] Verification');
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.label}${item.ok ? '' : ` — ${item.detail}`}`);
const failures = checks.filter((item) => !item.ok);
console.log(`\n${checks.length - failures.length}/${checks.length} checks passed.`);
if (failures.length) process.exitCode = 1;
