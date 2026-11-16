const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const candidates = [
  path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
];
const source = candidates.find((candidate) => fs.existsSync(candidate));
if (!source) {
  console.error('[Convia PDF to JPG] Could not find the PDF.js worker. Run npm install first.');
  process.exit(1);
}
const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });
const destination = path.join(publicDir, 'pdf.worker.min.mjs');
fs.copyFileSync(source, destination);
console.log(`[Convia PDF to JPG] Copied ${path.relative(root, source)} -> public/pdf.worker.min.mjs`);
