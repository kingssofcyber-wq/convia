// Idempotent Next.js compatibility patch for @fileslim/compress.
// Safe to run on every npm install/postinstall.
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packageRoot = path.join(root, "node_modules", "@fileslim", "compress");
const distDir = path.join(packageRoot, "dist");
const publicAssetsDir = path.join(root, "public", "assets");
const entryCandidates = [
  path.join(distDir, "index.es.js"),
  path.join(distDir, "index.js"),
];

function stop(message) {
  console.error("\n[Convia Worker Fix] ERROR:");
  console.error(message);
  process.exit(1);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

if (!fs.existsSync(distDir)) {
  stop("@fileslim/compress was not found. Run npm install first.");
}

const entryFile = entryCandidates.find((file) => fs.existsSync(file));
if (!entryFile) stop("Could not find the package browser entry in dist/.");

let source = fs.readFileSync(entryFile, "utf8");

// Match both the original Vite form and the direct URL form from a previous run.
const workerRefRegex = /["'](\/assets\/[^"']*Worker[^"']*\.js)["']/g;
const workerRefs = new Set();
let match;
while ((match = workerRefRegex.exec(source)) !== null) {
  workerRefs.add(match[1]);
}

if (workerRefs.size === 0) {
  stop(
    `No /assets/*Worker*.js URL was found in ${path.relative(root, entryFile)}. ` +
    "The installed SDK build may have changed. Inspect its worker reference before patching."
  );
}

const packageFiles = walk(packageRoot);
fs.mkdirSync(publicAssetsDir, { recursive: true });

// This pattern matches: new Worker(new URL(/* comment */ "/assets/x.js", import.meta.url), { ... })
const viteWorkerPattern = /new\s+Worker\s*\(\s*new\s+URL\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?(["'])(\/assets\/[^"']+\.js)\1\s*,\s*import\.meta\.url\s*\)\s*,\s*(\{[^}]*\})\s*\)/g;
// This identifies an already-patched constructor: new Worker("/assets/x.js", { ... })
const directWorkerPattern = /new\s+Worker\s*\(\s*(["'])(\/assets\/[^"']+\.js)\1\s*,/g;

let patchedSource = source.replace(
  viteWorkerPattern,
  (_whole, quote, workerUrl, options) => `new Worker(${quote}${workerUrl}${quote}, ${options})`
);
const sourceWasPatched = patchedSource !== source;

for (const workerUrl of workerRefs) {
  const workerName = path.posix.basename(workerUrl);
  const matches = packageFiles.filter((file) => path.basename(file) === workerName);

  if (matches.length === 0) {
    stop(`The bundle references ${workerName}, but it was not found inside node_modules/@fileslim/compress.`);
  }

  const workerFile = matches.find((file) => file.split(path.sep).includes("assets")) || matches[0];
  const sourceAssetsDir = path.dirname(workerFile);
  const targetWorker = path.join(publicAssetsDir, workerName);

  // Copy sibling runtime assets if the SDK keeps them beside the worker.
  if (path.basename(sourceAssetsDir).toLowerCase() === "assets") {
    fs.cpSync(sourceAssetsDir, publicAssetsDir, { recursive: true, force: true });
  }
  if (path.resolve(workerFile) !== path.resolve(targetWorker)) {
    fs.copyFileSync(workerFile, targetWorker);
  }
  if (!fs.existsSync(targetWorker)) {
    stop(`Worker copy verification failed for ${workerName}.`);
  }

  const hasDirectConstructor = [...patchedSource.matchAll(directWorkerPattern)]
    .some((item) => item[2] === workerUrl);

  const stillHasViteWrapper = [...patchedSource.matchAll(viteWorkerPattern)]
    .some((item) => item[2] === workerUrl);

  if (!hasDirectConstructor && !stillHasViteWrapper) {
    stop(
      `Copied ${workerName}, but could not confirm its Worker constructor. ` +
      "No unknown source code was changed. Share the surrounding bundle lines."
    );
  }

  const status = sourceWasPatched ? "worker URL patched" : "already patched";
  console.log(
    `[Convia Worker Fix] ${workerName}: ${status}; asset copied to public/assets.`
  );
}

if (patchedSource !== source) {
  fs.writeFileSync(entryFile, patchedSource, "utf8");
}

console.log(`[Convia Worker Fix] Checked ${path.relative(root, entryFile)}.`);
console.log("[Convia Worker Fix] Completed successfully. Safe to run repeatedly.");
