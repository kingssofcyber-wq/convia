const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const publicDir = path.join(root, 'public');
const candidates = [
  path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
  path.join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs'),
  path.join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs'),
];

const source = candidates.find((candidate) => fs.existsSync(candidate));
if (!source) {
  console.error('[Convia PDF Worker] Could not find pdf.worker*.mjs in node_modules/pdfjs-dist. Run npm install first.');
  process.exit(1);
}

fs.mkdirSync(publicDir, { recursive: true });
const destination = path.join(publicDir, 'pdf.worker.min.mjs');
fs.copyFileSync(source, destination);
console.log(`[Convia PDF Worker] Copied ${path.relative(root, source)} -> public/pdf.worker.min.mjs`);
