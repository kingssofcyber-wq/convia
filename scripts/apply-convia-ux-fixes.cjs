const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const appDir = path.join(root, "app");
const scriptDir = __dirname;
const cssSource = path.join(scriptDir, "..", "app", "convia-ux-overrides.css");
const cssTarget = path.join(appDir, "convia-ux-overrides.css");
const layoutPath = path.join(appDir, "layout.tsx");
const backupRoot = path.join(root, ".convia-repair-backup");

function fail(message) {
  console.error(`\n[Convia UX Fix] ERROR: ${message}\n`);
  process.exit(1);
}

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, item.name);
    if (item.isDirectory()) walk(absolute, output);
    else if (item.isFile() && item.name.endsWith(".tsx")) output.push(absolute);
  }
  return output;
}

function backupFile(file) {
  const relative = path.relative(root, file);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
}

function compactClassList(classList) {
  let value = classList;
  value = value.replace(/\bsm:py-(?:7|8|9|10|12|14|16)\b/g, "sm:py-6");
  value = value.replace(/\bmd:py-(?:7|8|9|10|12|14|16)\b/g, "md:py-6");
  value = value.replace(/\bpy-(?:7|8|9|10|12|14|16)\b/g, "py-5");
  value = value.replace(/\bsm:px-(?:9|10|12)\b/g, "sm:px-7");
  value = value.replace(/\bpx-6\b/g, "px-5");
  value = value.replace(/\b(?:h|w)-64\b/g, (token) => token[0] + "-40");
  value = value.replace(/\b(?:h|w)-56\b/g, (token) => token[0] + "-40");
  return value;
}

function addClassToOpeningTag(openingTag, className, requiredToken) {
  if (openingTag.includes(className)) return openingTag;
  const attr = openingTag.match(/\bclassName\s*=\s*(["'`])([\s\S]*?)\1/);
  if (!attr) return openingTag;
  if (requiredToken && !attr[2].includes(requiredToken)) return openingTag;
  const quote = attr[1];
  const updatedClasses = `${compactClassList(attr[2])} ${className}`.trim();
  return openingTag.replace(attr[0], `className=${quote}${updatedClasses}${quote}`);
}

function compactFirstH1(source, fromIndex, maxLength = 2400) {
  const end = Math.min(source.length, fromIndex + maxLength);
  const segment = source.slice(fromIndex, end);
  const h1Match = segment.match(/<h1\b[^>]*>/s);
  if (!h1Match) return source;
  const tag = h1Match[0];
  const attr = tag.match(/\bclassName\s*=\s*(["'`])([\s\S]*?)\1/);
  if (!attr) return source;
  const replacements = {
    "text-4xl": "text-2xl",
    "text-3xl": "text-2xl",
    "sm:text-5xl": "sm:text-3xl",
    "sm:text-4xl": "sm:text-3xl",
    "lg:text-5xl": "lg:text-3xl",
    "lg:text-4xl": "lg:text-3xl",
  };
  const classes = attr[2].split(/\s+/).map((token) => replacements[token] || token).join(" ");
  const newTag = tag.replace(attr[0], `className=${attr[1]}${classes}${attr[1]}`);
  const absoluteStart = fromIndex + h1Match.index;
  return source.slice(0, absoluteStart) + newTag + source.slice(absoluteStart + tag.length);
}

function patchPdfPage(file) {
  let source = fs.readFileSync(file, "utf8");
  const original = source;
  let patchedHeader = false;

  // First choice: the first gradient hero section on a tool page.
  const sections = /<section\b[^>]*>/gs;
  let sectionMatch;
  while ((sectionMatch = sections.exec(source)) !== null) {
    if (!sectionMatch[0].includes("bg-gradient")) continue;
    const updatedOpening = addClassToOpeningTag(
      sectionMatch[0],
      "convia-compact-tool-hero",
      "bg-gradient",
    );
    if (updatedOpening !== sectionMatch[0]) {
      source = source.slice(0, sectionMatch.index) + updatedOpening + source.slice(sectionMatch.index + sectionMatch[0].length);
      source = compactFirstH1(source, sectionMatch.index + updatedOpening.length, 2600);
      patchedHeader = true;
    }
    break;
  }

  // Some utility and Coming Soon pages use a gradient <div> instead of <section>.
  if (!patchedHeader) {
    const gradientDiv = /<div\b[^>]*>/gs;
    let divMatch;
    while ((divMatch = gradientDiv.exec(source)) !== null) {
      if (!divMatch[0].includes("bg-gradient")) continue;
      // Only treat it as the hero if an h1 appears soon after this opening tag.
      const nearby = source.slice(divMatch.index + divMatch[0].length, divMatch.index + divMatch[0].length + 2200);
      if (!/<h1\b/.test(nearby)) continue;
      const updatedOpening = addClassToOpeningTag(divMatch[0], "convia-compact-tool-hero", "bg-gradient");
      if (updatedOpening !== divMatch[0]) {
        source = source.slice(0, divMatch.index) + updatedOpening + source.slice(divMatch.index + divMatch[0].length);
        source = compactFirstH1(source, divMatch.index + updatedOpening.length, 2200);
        patchedHeader = true;
      }
      break;
    }
  }

  // Organize PDF and some simpler pages use a title row without a gradient card.
  if (!patchedHeader) {
    const headerDiv = /<div\b[^>]*>/gs;
    let divMatch;
    while ((divMatch = headerDiv.exec(source)) !== null) {
      if (!divMatch[0].includes("border-b") || !divMatch[0].includes("flex-col")) continue;
      const updatedOpening = addClassToOpeningTag(
        divMatch[0],
        "convia-compact-tool-header",
        "border-b",
      );
      if (updatedOpening !== divMatch[0]) {
        source = source.slice(0, divMatch.index) + updatedOpening + source.slice(divMatch.index + divMatch[0].length);
        source = compactFirstH1(source, divMatch.index + updatedOpening.length, 1800);
        patchedHeader = true;
      }
      break;
    }
  }

  if (source !== original) {
    backupFile(file);
    fs.writeFileSync(file, source, "utf8");
    return true;
  }
  return false;
}

if (!fs.existsSync(appDir)) fail("Run this script from the root of your Next.js project (the folder that contains app/).");
if (!fs.existsSync(layoutPath)) fail("app/layout.tsx was not found.");
if (!fs.existsSync(cssSource)) fail("The package CSS file app/convia-ux-overrides.css must be copied into your project before running this script.");

fs.mkdirSync(path.dirname(cssTarget), { recursive: true });
if (!fs.existsSync(cssTarget)) fs.copyFileSync(cssSource, cssTarget);

let layout = fs.readFileSync(layoutPath, "utf8");
const cssImport = 'import "./convia-ux-overrides.css";';
if (!layout.includes(cssImport)) {
  const globalsImport = /import\s+["']\.\/globals\.css["'];?/;
  if (!globalsImport.test(layout)) fail('Could not find `import "./globals.css";` in app/layout.tsx. Add the UX CSS import manually after the globals.css import.');
  backupFile(layoutPath);
  layout = layout.replace(globalsImport, (match) => `${match}\n${cssImport}`);
  fs.writeFileSync(layoutPath, layout, "utf8");
  console.log("[Convia UX Fix] Added compact header stylesheet to app/layout.tsx");
} else {
  console.log("[Convia UX Fix] Compact header stylesheet is already imported");
}

const pdfDir = path.join(appDir, "pdf");
const pdfPages = walk(pdfDir);
let changed = 0;
for (const file of pdfPages) {
  if (patchPdfPage(file)) {
    changed += 1;
    console.log(`[Convia UX Fix] Compacted header: ${path.relative(root, file)}`);
  }
}

const gitignore = path.join(root, ".gitignore");
const ignoreEntry = ".convia-repair-backup/";
if (fs.existsSync(gitignore)) {
  const current = fs.readFileSync(gitignore, "utf8");
  if (!current.split(/\r?\n/).includes(ignoreEntry)) {
    fs.appendFileSync(gitignore, `${current.endsWith("\n") || current.length === 0 ? "" : "\n"}${ignoreEntry}\n`);
  }
} else {
  fs.writeFileSync(gitignore, `${ignoreEntry}\n`, "utf8");
}

console.log(`\n[Convia UX Fix] Completed. Updated ${changed} PDF page header(s).`);
console.log(`[Convia UX Fix] Original files backed up to: ${path.relative(root, backupRoot)}`);
console.log("[Convia UX Fix] No PDF processing logic, compression engine or ad-unit IDs were modified.\n");
