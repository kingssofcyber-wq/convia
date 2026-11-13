const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('package.json was not found. Run this command from the Convia project root.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.dependencies = pkg.dependencies || {};
const required = {
  mammoth: '^1.13.0',
  'html2pdf.js': '^0.14.0',
};
const added = [];
for (const [name, version] of Object.entries(required)) {
  if (!pkg.dependencies[name]) {
    pkg.dependencies[name] = version;
    added.push(`${name}@${version}`);
  }
}
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(added.length ? `Added: ${added.join(', ')}` : 'Required dependencies are already present.');
console.log('Existing dependencies, scripts, devDependencies and other package settings were preserved.');
console.log('Now run: npm install');
