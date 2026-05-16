import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const ROOT = "level-1b/compiler/closure";
const REQUIRED_FILES = [
  "continuation_simplify.chiba",
  "closure_convert.chiba",
  "driver.chiba",
  "env_simplify.chiba",
  "lambda_lift.chiba",
  "usage_cps.chiba",
];
const REQUIRED_TEXT = [
  "def analyze_cps_usage",
  "def simplify_continuations",
  "def convert_closures",
  "def lift_lambdas",
  "def simplify_closure_envs",
  "def run_closure_package",
  "ContinuationPackaged",
  "ClosureEnvLayout",
  "ClosureDirectFunction",
  "ClosureEnvErased",
  "ClosureDirectified",
  "CaptureWorldLocalRejected",
  "CaptureThreadLocalRejected",
  "CaptureUnsafeRejected",
];

function fail(message) {
  console.error("[FAIL] level-1b C10 closure package");
  console.error(message);
  process.exit(1);
}

function pass(name) {
  console.log(`[PASS] ${name}`);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listChiba(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listChiba(file));
    else if (entry.isFile() && entry.name.endsWith(".chiba")) out.push(file);
  }
  return out.sort();
}

function stripLineComments(source) {
  return source
    .split(/\n/)
    .filter((line) => !line.trimStart().startsWith("///") && !line.trimStart().startsWith("//"))
    .join("\n");
}

function previousDocBlock(lines, index) {
  const docs = [];
  let cursor = index - 1;
  while (cursor >= 0 && lines[cursor].trim() === "") cursor -= 1;
  while (cursor >= 0 && lines[cursor].trimStart().startsWith("///")) {
    docs.push(lines[cursor].trimStart());
    cursor -= 1;
  }
  return docs.reverse().join("\n");
}

function isPublicItem(line) {
  return /^(namespace|type|data|def)\b/.test(line.trimStart());
}

function checkSource(file, source) {
  const code = stripLineComments(source);
  const lines = source.split(/\n/);
  const errors = [];
  if (/\beffect\b/i.test(code)) errors.push(`${file}: closure pipeline must not introduce effect naming`);
  if (/\bmetalstd\b|Ptr\s*\[|UnsafeRef\s*\[|heap_alloc\s*\(|load(?:8|16|32|64)\s*\(/.test(code)) {
    errors.push(`${file}: closure pass leaks Metal/raw memory implementation`);
  }
  if (/\bL[0-9]+Op|\bL[0-9]+Item|\bbackend\.cir\b/.test(code)) {
    errors.push(`${file}: level-1b closure pass must not copy old CIR level tags`);
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (isPublicItem(lines[i]) && previousDocBlock(lines, i).length === 0) {
      errors.push(`${file}:${i + 1}: public item is missing /// doc comment`);
    }
  }
  return errors;
}

function runLevel1c(args) {
  return spawnSync("timeout", ["10", "./target/debug/level1c.o", ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function expectNanopass(name, file, expect, reject = []) {
  const result = runLevel1c(["nanopass", file]);
  const out = `${result.stdout}${result.stderr}`;
  if (result.status !== 0) fail(`${name} failed\n${out}`);
  for (const needle of expect) {
    if (!out.includes(needle)) fail(`${name} missing ${needle}`);
  }
  for (const needle of reject) {
    if (out.includes(needle)) fail(`${name} unexpectedly contains ${needle}`);
  }
}

function expectCheckError(name, file, expected) {
  const result = runLevel1c(["check", file]);
  const out = `${result.stdout}${result.stderr}`;
  if (result.status !== 0 || !out.includes(expected)) {
    fail(`${name} missing ${expected}\n${out}`);
  }
}

function main() {
  const files = listChiba(ROOT);
  const seen = new Set(files.map((file) => path.basename(file)));
  const missing = REQUIRED_FILES.filter((file) => !seen.has(file));
  if (missing.length !== 0) fail(`missing C10 files:\n${missing.join("\n")}`);

  const joined = files.map(read).join("\n");
  const missingText = REQUIRED_TEXT.filter((needle) => !joined.includes(needle));
  if (missingText.length !== 0) fail(`missing C10 contract text:\n${missingText.join("\n")}`);

  const errors = files.flatMap((file) => checkSource(file, read(file)));
  if (errors.length !== 0) fail(errors.join("\n"));
  pass("closure source contract");

  expectNanopass("no-capture closure directification", "supports/bootstrap/closure-no-capture.chiba", [
    "L8ValidatedCoreModule",
    "L1OpClosure",
    "validation ok",
    "0",
  ], ["L6OpClosureEnv"]);

  expectNanopass("capturing closure env", "supports/bootstrap/closure-capture.chiba", [
    "L8ValidatedCoreModule",
    "L6OpClosureEnv",
    "L1OpClosure",
    "L1RefLocal(#1 \"x\")",
    "validation ok",
    "0",
  ]);

  expectNanopass("multi-shot continuation package", "supports/bootstrap/continuation-multi-resume.chiba", [
    "core-op continuation-package",
    "L5OpContinuationPackage",
    "usage many",
    "validation ok",
    "0",
  ]);

  expectCheckError(
    "unsafe capture rejected before Core",
    "supports/bootstrap/continuation-non-replay-invalid.chiba",
    "multi-resume captures non-replay state",
  );
  pass("closure package oracle");
}

main();
