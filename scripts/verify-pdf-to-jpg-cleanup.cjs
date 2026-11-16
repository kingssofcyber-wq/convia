const fs = require('node:fs');
const path = require('node:path');
const target = path.join(process.cwd(), 'app', 'pdf', 'pdf-to-jpg', 'page.tsx');
if (!fs.existsSync(target)) {
  console.error(`Missing file: ${target}`);
  process.exit(1);
}
const source = fs.readFileSync(target, 'utf8');
const bad = /\bpdf\s*\.\s*destroy\s*\(/.test(source);
const good = /loadingTask\s*\.\s*destroy\s*\(/.test(source);
if (bad || !good) {
  console.error(`Cleanup check failed. pdf.destroy present: ${bad}; loadingTask.destroy present: ${good}`);
  process.exit(1);
}
console.log('OK: no pdf.destroy() call; loadingTask.destroy() cleanup is present.');
