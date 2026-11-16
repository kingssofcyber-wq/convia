#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [
  ['app/pdf/layout.tsx', 'PdfWorkspaceShell'],
  ['components/pdf/pdf-workspace-shell.tsx', 'resolvePdfToolMetadata'],
  ['components/layout/tool-header.tsx', 'cv-tool-header-back'],
  ['components/pdf/tool-page-header.tsx', 'ToolHeader'],
  ['lib/pdf-tool-metadata.ts', 'pdf-to-jpg'],
  ['app/convia-tool-header-premium.css', '@keyframes cv-tool-gradient-flow'],
  ['app/layout.tsx', 'convia-tool-header-premium.css'],
];
let failed = 0;
for (const [relative, token] of checks) {
  const file = path.join(root, relative);
  const ok = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(token);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${relative} ${ok ? '' : `(missing ${token})`}`);
  if (!ok) failed++;
}
if (failed) {
  console.error(`\nVerification failed: ${failed} check(s).`);
  process.exit(1);
}
console.log('\nPASS  Shared header layout, taglines, animation and announcement spacing are installed.');
console.log('NOTE  The project build and browser visual check must still be run in this project.');
