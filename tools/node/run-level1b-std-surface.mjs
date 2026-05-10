import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DOC = "level-1b/supports/std-surface.md";
const REQUIRED = [
  "String == Array[u8]",
  "str == Slice[u8]",
  "String[index]",
  ".char_at(n)",
  "#![Metal]",
  "Ref[T]",
  "UnsafeRef[T]",
  "Ptr[T]",
  "Atomic[T]",
  "Pre-C01 Smoke Matrix",
];

function fail(message) {
  console.error("[FAIL] level-1b std surface");
  console.error(message);
  process.exit(1);
}

const doc = fs.readFileSync(DOC, "utf8");
for (const needle of REQUIRED) {
  if (!doc.includes(needle)) fail(`missing required surface text: ${needle}`);
}

function listChiba(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listChiba(file));
    else if (entry.isFile() && entry.name.endsWith(".chiba")) out.push(file);
  }
  return out.sort();
}

const rawPointerPatterns = [
  /\bload(?:8|16|32|64)\s*\(/,
  /\bstore(?:8|16|32|64)\s*\(/,
  /\bheap_alloc\s*\(/,
  /\bas\s+Ptr\[/,
];

const errors = [];
for (const file of listChiba("level-1b/src")) {
  const source = fs.readFileSync(file, "utf8");
  const metal = source.includes("#![Metal]");
  if (metal) continue;
  for (const pattern of rawPointerPatterns) {
    if (pattern.test(source)) errors.push(`${file}: non-Metal source uses ${pattern}`);
  }
}

if (errors.length !== 0) fail(errors.join("\n"));
console.log("[PASS] level-1b std surface");
