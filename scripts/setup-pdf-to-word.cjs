const { spawnSync } = require('node:child_process');
const path = require('node:path');

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
console.log('[Convia PDF to Word] Installing only the missing document/OCR packages...');
const install = spawnSync(npm, ['install', 'docx', 'tesseract.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: isWindows,
});
if (install.status !== 0) {
  console.error('[Convia PDF to Word] Dependency installation failed. Check the npm error above.');
  process.exit(install.status || 1);
}
const copyWorker = spawnSync(process.execPath, [path.join('scripts', 'copy-pdf-worker.cjs')], {
  cwd: process.cwd(),
  stdio: 'inherit',
});
if (copyWorker.status !== 0) process.exit(copyWorker.status || 1);
console.log('[Convia PDF to Word] Setup completed. Now run: npx tsc --noEmit && npm run build');
