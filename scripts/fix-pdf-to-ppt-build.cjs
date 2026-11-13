const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packagePath = path.join(root, "package.json");
const configPath = path.join(root, "next.config.mjs");

if (!fs.existsSync(packagePath) || !fs.existsSync(configPath)) {
  console.error("[Convia PDF to PPT] Run this script from the project root containing package.json and next.config.mjs.");
  process.exit(1);
}

const backupDir = path.join(root, ".convia-backups", "pdf-to-ppt-build");
fs.mkdirSync(backupDir, { recursive: true });

function backup(filePath) {
  const target = path.join(backupDir, path.basename(filePath) + ".before-ppt-fix");
  if (!fs.existsSync(target)) fs.copyFileSync(filePath, target);
}

try {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.dependencies ||= {};
  if (!pkg.dependencies.pptxgenjs) pkg.dependencies.pptxgenjs = "^4.0.1";
  backup(packagePath);
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  let config = fs.readFileSync(configPath, "utf8");
  if (!/serverExternalPackages\s*:/.test(config)) {
    const objectStart = /const\s+nextConfig\s*=\s*\{/;
    if (!objectStart.test(config)) throw new Error("Could not safely find `const nextConfig = {` in next.config.mjs. Add serverExternalPackages manually as described in the README.");
    backup(configPath);
    config = config.replace(objectStart, (match) => `${match}\n  serverExternalPackages: ["pptxgenjs"],`);
  } else {
    const property = /serverExternalPackages\s*:\s*\[([^\]]*)\]/s;
    const match = config.match(property);
    if (!match) throw new Error("serverExternalPackages exists but is not a simple array. Add `pptxgenjs` to that existing array manually.");
    if (!match[1].includes("pptxgenjs")) {
      backup(configPath);
      const nextArray = `serverExternalPackages: [${match[1].trim()}${match[1].trim() ? ", " : ""}"pptxgenjs"]`;
      config = config.replace(property, nextArray);
    }
  }
  fs.writeFileSync(configPath, config, "utf8");

  console.log("[Convia PDF to PPT] package.json checked and Next.js serverExternalPackages configured for pptxgenjs.");
  console.log("[Convia PDF to PPT] Existing scripts/dependencies preserved; backups saved in .convia-backups/pdf-to-ppt-build.");
  console.log("[Convia PDF to PPT] Copy the patch app/ and components/ folders before running this script, then run npm install and npm run build.");
} catch (error) {
  console.error(`[Convia PDF to PPT] ${error.message}`);
  process.exit(1);
}
