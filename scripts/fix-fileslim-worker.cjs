/*
 * Safe, idempotent helper for @fileslim/compress in Next.js/Webpack.
 * It only rewrites a Vite-style new URL('/assets/worker.js', import.meta.url)
 * to the same public URL string and copies the package's matching assets folder
 * into /public/assets. If the package layout has changed, it warns instead of
 * making npm install/postinstall fail.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packageRoot = path.join(root, "node_modules", "@fileslim", "compress");
const distDir = path.join(packageRoot, "dist");
const publicAssetsDir = path.join(root, "public", "assets");

function log(message) {
  console.log(`[Convia Worker Fix] ${message}`);
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else output.push(full);
  }
  return output;
}

function main() {
  if (!fs.existsSync(distDir)) {
    log("@fileslim/compress is not installed yet; skipping worker patch.");
    return;
  }

  const files = walk(distDir);
  const jsFiles = files.filter((file) => file.endsWith(".js") || file.endsWith(".mjs"));
  const entry = jsFiles.find((file) => path.basename(file) === "index.es.js");
  const references = new Set();
  let patchedCount = 0;

  if (entry) {
    const original = fs.readFileSync(entry, "utf8");
    const pattern = /new\s+URL\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?(["'])(\/assets\/[^"']+\.js)\1\s*,\s*import\.meta\.url\s*\)/g;
    const updated = original.replace(pattern, (_match, _quote, url) => {
      references.add(url);
      patchedCount += 1;
      return JSON.stringify(url);
    });

    // Also recognize a source file that was already patched on a prior run.
    const allReferenceMatches = original.match(/\/assets\/[^"'\s)]+\.js/g) || [];
    for (const ref of allReferenceMatches) {
      if (/compressionWorker/i.test(ref)) references.add(ref);
    }

    if (updated !== original) {
      fs.writeFileSync(entry, updated, "utf8");
      log(`Patched ${path.relative(root, entry)} (${patchedCount} worker reference(s)).`);
    } else if (references.size) {
      log("Worker URL is already a plain public path or package layout differs; no source rewrite needed.");
    } else {
      log("Could not identify the worker URL pattern in index.es.js; leaving package source unchanged.");
    }
  } else {
    log("index.es.js not found; checking package assets without modifying source.");
  }

  // Resolve the hashed worker filename referenced by the package, if present.
  const workerNames = new Set([...references].map((ref) => path.posix.basename(ref)));
  const workerFiles = files.filter((file) => /compressionWorker[^/\\]*\.js$/i.test(file));
  for (const file of workerFiles) workerNames.add(path.basename(file));

  if (!workerNames.size) {
    log("No compression worker asset was found. Package may have changed; install remains non-fatal.");
    return;
  }

  fs.mkdirSync(publicAssetsDir, { recursive: true });
  let copied = 0;
  for (const name of workerNames) {
    const source = files.find((file) => path.basename(file) === name);
    if (!source) {
      log(`Worker ${name} was referenced but not found in the installed package.`);
      continue;
    }
    const assetsAncestor = source.split(path.sep).slice(0, -1).reverse().findIndex((part) => part.toLowerCase() === "assets");
    if (assetsAncestor >= 0) {
      const parts = source.split(path.sep);
      const assetsIndex = parts.length - 2 - assetsAncestor;
      const assetsDir = parts.slice(0, assetsIndex + 1).join(path.sep);
      fs.cpSync(assetsDir, publicAssetsDir, { recursive: true, force: true });
    }
    const target = path.join(publicAssetsDir, name);
    if (path.resolve(source) !== path.resolve(target)) fs.copyFileSync(source, target);
    if (fs.existsSync(target)) {
      copied += 1;
      log(`Copied ${name} to public/assets.`);
    }
  }

  if (!copied) log("No worker file copied. Check the installed package's dist/assets folder manually.");
  else log("Worker asset check completed.");
}

try {
  main();
} catch (error) {
  // A worker patch should not block installing unrelated dependencies.
  // The build/runtime will still show a clear error if the SDK needs a missing asset.
  log(`Non-fatal warning: ${error instanceof Error ? error.message : String(error)}`);
}
