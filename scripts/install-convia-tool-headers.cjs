#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const patchRoot = path.resolve(__dirname, '..', 'patch-files');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = path.join(projectRoot, '.convia-backups', `tool-headers-${timestamp}`);

function fail(message) {
  console.error(`\n[Convia Tool Header] ERROR: ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, 'package.json')) || !fs.existsSync(path.join(projectRoot, 'app'))) {
  fail('Run this command from the Convia project root (the folder containing package.json and app/).');
}

const rootLayout = path.join(projectRoot, 'app', 'layout.tsx');
if (!fs.existsSync(rootLayout)) fail('app/layout.tsx was not found. Nothing was changed. Restore the root layout before installing this patch.');

const nestedLayout = path.join(projectRoot, 'app', 'pdf', 'layout.tsx');
if (fs.existsSync(nestedLayout)) {
  const current = fs.readFileSync(nestedLayout, 'utf8');
  if (!current.includes('PdfWorkspaceShell')) {
    fail('An existing app/pdf/layout.tsx was found. Nothing was changed. Please share that file so its current providers/layout can be preserved while adding the shared header.');
  }
}

const files = [
  'components/layout/tool-header.tsx',
  'components/pdf/tool-page-header.tsx',
  'components/pdf/pdf-workspace-shell.tsx',
  'lib/pdf-tool-metadata.ts',
  'app/convia-tool-header-premium.css',
  'app/pdf/layout.tsx',
];
for (const relative of files) {
  const source = path.join(patchRoot, relative);
  if (!fs.existsSync(source)) fail(`Patch file is missing: ${relative}`);
}

fs.mkdirSync(backupRoot, { recursive: true });
let backedUp = 0;
for (const relative of files) {
  const target = path.join(projectRoot, relative);
  if (!fs.existsSync(target)) continue;
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(target, backup);
  backedUp += 1;
}

for (const relative of files) {
  const source = path.join(patchRoot, relative);
  const target = path.join(projectRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

let layoutText = fs.readFileSync(rootLayout, 'utf8');
const cssImport = 'import "./convia-tool-header-premium.css";';
if (!layoutText.includes('convia-tool-header-premium.css')) {
  const directive = layoutText.match(/^(\s*["']use client["'];?\s*\r?\n)/);
  if (directive) {
    layoutText = directive[1] + cssImport + '\n' + layoutText.slice(directive[1].length);
  } else {
    layoutText = cssImport + '\n' + layoutText;
  }
  fs.writeFileSync(rootLayout, layoutText, 'utf8');
}

console.log('\n[Convia Tool Header] Installation completed.');
console.log(`Backups saved: ${backupRoot}`);
console.log(`Existing files backed up: ${backedUp}`);
console.log('Added one shared animated PDF header through app/pdf/layout.tsx.');
console.log('Updated ToolHeader + ToolPageHeader compatibility components.');
console.log('Added tool-specific centered taglines for 29 PDF routes.');
console.log('Fixed announcement-bar spacing for both cv5 and legacy markup.');
console.log('\nNext: run node scripts/verify-convia-tool-headers.cjs, then npx tsc --noEmit and npm run build.');
