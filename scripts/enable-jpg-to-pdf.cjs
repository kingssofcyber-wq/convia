const fs = require("node:fs");
const path = require("node:path");

const target = path.join(process.cwd(), "lib", "tool-status.ts");
if (!fs.existsSync(target)) {
  console.error("[Convia JPG to PDF] lib/tool-status.ts was not found. Run this command from the project root.");
  process.exit(1);
}

const source = fs.readFileSync(target, "utf8");
const match = source.match(/(READY_TOOL_IDS\s*=\s*new\s+Set\s*\(\s*\[)([\s\S]*?)(\s*\]\s*\)\s*;?)/);
if (!match) {
  console.error("[Convia JPG to PDF] Could not locate READY_TOOL_IDS. No file was changed.");
  process.exit(1);
}

if (/["']jpg2pdf["']/.test(match[2])) {
  console.log("[Convia JPG to PDF] Homepage card is already marked Available.");
  process.exit(0);
}

const updatedBody = `${match[2].trimEnd()}\n  "jpg2pdf",\n`;
const updated = source.replace(match[0], `${match[1]}${updatedBody}${match[3]}`);
fs.writeFileSync(target, updated, "utf8");
console.log("[Convia JPG to PDF] Added jpg2pdf to READY_TOOL_IDS. Existing statuses were preserved.");
