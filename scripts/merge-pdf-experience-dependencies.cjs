const fs = require('node:fs');
const path = require('node:path');
const packagePath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('Run this script from the Convia folder that contains package.json.');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.dependencies ||= {};
const required = {
  '@pdf-lib/fontkit': '^1.1.1',
  'pdf-lib': '^1.17.1',
  'pdfjs-dist': '^6.5.438',
  'tesseract.js': '^7.0.0',
};
const added = [];
for (const [name, version] of Object.entries(required)) {
  if (!pkg.dependencies[name]) { pkg.dependencies[name] = version; added.push(`${name}@${version}`); }
}
const copyWorker = path.join(process.cwd(), 'scripts', 'copy-pdf-worker.cjs');
const command = 'node scripts/copy-pdf-worker.cjs';
pkg.scripts ||= {};
if (fs.existsSync(copyWorker) && !(pkg.scripts.postinstall || '').includes(command)) {
  pkg.scripts.postinstall = pkg.scripts.postinstall ? `${pkg.scripts.postinstall} && ${command}` : command;
}
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log(`Convia dependencies merged. Added: ${added.length ? added.join(', ') : 'none (already present)'}.`);
console.log('Existing dependencies and scripts were preserved. Run npm install next.');
