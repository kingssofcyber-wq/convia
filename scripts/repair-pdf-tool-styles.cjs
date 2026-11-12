#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const appDir = path.join(root, 'app');
const scriptsDir = __dirname;
const layoutPath = path.join(appDir, 'layout.tsx');
const globalsPath = path.join(appDir, 'globals.css');
const designPath = path.join(appDir, 'convia-design-system.css');
const bundledDesignPath = path.join(scriptsDir, 'assets', 'convia-design-system.css');
const postcssPath = path.join(root, 'postcss.config.mjs');
const packagePath = path.join(root, 'package.json');

function backup(file) {
  if (!fs.existsSync(file)) return;
  const backupPath = `${file}.before-style-repair-${Date.now()}.bak`;
  fs.copyFileSync(file, backupPath);
  console.log(`[backup] ${path.relative(root, file)} -> ${path.basename(backupPath)}`);
}
function writeIfChanged(file, next) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current === next) return false;
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, 'utf8');
  return true;
}
function ensureImport(source, importLine) {
  if (source.split(/\r?\n/).some(line => line.trim() === importLine)) return source;
  const lines = source.split(/\r?\n/);
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport >= 0) lines.splice(lastImport + 1, 0, importLine);
  else lines.unshift(importLine);
  return lines.join('\n');
}

if (!fs.existsSync(appDir)) {
  console.error('ERROR: app/ folder nahi mila. CMD ko project root (D:\\convia) me chalao.');
  process.exit(1);
}

// Restore the known Convia design stylesheet only when the active file is missing
// or lacks the shared PDF tool header styles. Keep a backup before replacement.
if (!fs.existsSync(designPath) || !fs.readFileSync(designPath, 'utf8').includes('.tool-page-hero')) {
  if (!fs.existsSync(bundledDesignPath)) {
    console.error('ERROR: bundled Convia stylesheet is missing from scripts/assets/.');
    process.exit(1);
  }
  backup(designPath);
  fs.copyFileSync(bundledDesignPath, designPath);
  console.log('[fixed] app/convia-design-system.css restored with shared premium PDF header styles.');
} else {
  console.log('[ok] Existing app/convia-design-system.css already contains PDF tool header styles.');
}

// Ensure Tailwind v4 is part of the global CSS pipeline.
let globals = fs.existsSync(globalsPath) ? fs.readFileSync(globalsPath, 'utf8') : '';
if (!/@import\s+["']tailwindcss["']\s*;/.test(globals)) {
  globals = `@import "tailwindcss";\n@config "../tailwind.config.ts";\n\n${globals}`;
  writeIfChanged(globalsPath, globals);
  console.log('[fixed] Tailwind v4 import added to app/globals.css.');
} else {
  let nextGlobals = globals;
  if (!/@config\s+["']\.\.\/tailwind\.config\.ts["']\s*;/.test(nextGlobals)) {
    nextGlobals = nextGlobals.replace(/(@import\s+["']tailwindcss["']\s*;)/, '$1\n@config "../tailwind.config.ts";');
  }
  if (nextGlobals !== globals) {
    writeIfChanged(globalsPath, nextGlobals);
    console.log('[fixed] Tailwind config directive restored in app/globals.css.');
  } else {
    console.log('[ok] Tailwind v4 global import already present.');
  }
}

if (!fs.existsSync(layoutPath)) {
  console.error('ERROR: app/layout.tsx nahi mila. Root layout ko manually check karo.');
  process.exit(1);
}
let layout = fs.readFileSync(layoutPath, 'utf8');
let nextLayout = ensureImport(layout, 'import "./globals.css";');
nextLayout = ensureImport(nextLayout, 'import "./convia-design-system.css";');
if (nextLayout !== layout) {
  writeIfChanged(layoutPath, nextLayout);
  console.log('[fixed] app/layout.tsx now imports both global stylesheets.');
} else {
  console.log('[ok] Root layout already imports both global stylesheets.');
}

if (!fs.existsSync(postcssPath) || !fs.readFileSync(postcssPath, 'utf8').includes('@tailwindcss/postcss')) {
  console.warn('[warning] postcss.config.mjs me @tailwindcss/postcss plugin nahi mila. Is file ko manually check karein; automatic overwrite nahi kiya.');
} else {
  console.log('[ok] Tailwind PostCSS plugin found.');
}
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (!allDeps.tailwindcss || !allDeps['@tailwindcss/postcss']) {
    console.warn('[warning] package.json me Tailwind v4 dependencies missing hain. npm install tailwindcss @tailwindcss/postcss --save-dev chalao.');
  } else {
    console.log('[ok] Tailwind v4 dependencies found.');
  }
}

console.log('\nStyle repair complete. Ab npm run build chalao.');
