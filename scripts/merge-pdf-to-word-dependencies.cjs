const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packagePath = path.join(root, "package.json");
if (!fs.existsSync(packagePath)) {
  console.error("[Convia PDF to Word] Run this script from the folder containing package.json.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.dependencies ||= {};
pkg.scripts ||= {};
const required = {
  docx: "^9.15.3",
  "pdfjs-dist": "^6.5.438",
  "tesseract.js": "^7.0.0",
};
const added = [];
for (const [name, version] of Object.entries(required)) {
  if (!pkg.dependencies[name]) {
    pkg.dependencies[name] = version;
    added.push(`${name}@${version}`);
  }
}

const workerScript = path.join(root, "scripts", "copy-pdf-worker.cjs");
const workerCommand = "node scripts/copy-pdf-worker.cjs";
if (fs.existsSync(workerScript) && !(pkg.scripts.postinstall || "").includes(workerCommand)) {
  pkg.scripts.postinstall = pkg.scripts.postinstall
    ? `${pkg.scripts.postinstall} && ${workerCommand}`
    : workerCommand;
}

fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`[Convia PDF to Word] Dependencies merged. Added: ${added.length ? added.join(", ") : "none (already present)"}`);
console.log("Existing dependencies and npm scripts were preserved. Run npm install next.");
