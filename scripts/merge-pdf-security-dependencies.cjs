const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('[Convia PDF Security] Run this script from the folder containing package.json.');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.dependencies ||= {};
const required = {
  'pdf-lib': '^1.17.1',
  '@pdf-lib/fontkit': '^1.1.1',
};
const added = [];
for (const [name, version] of Object.entries(required)) {
  if (!pkg.dependencies[name] && !pkg.devDependencies?.[name]) {
    pkg.dependencies[name] = version;
    added.push(`${name}@${version}`);
  }
}
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log(`[Convia PDF Security] package.json merged. Added: ${added.length ? added.join(', ') : 'none; dependencies already present'}`);
console.log('[Convia PDF Security] Existing scripts, Supabase, AdSense and other dependencies were preserved. Run npm install to refresh package-lock.json.');
