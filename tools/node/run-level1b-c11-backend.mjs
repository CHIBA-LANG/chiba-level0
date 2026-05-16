import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const ROOT = "level-1b/compiler/backend";
const OUT = ".scratch/level-1b/c11";
const REQUIRED_FILES = [
  "core.chiba",
  "driver.chiba",
  "layout.chiba",
  "validate_core.chiba",
  "wat_emit.chiba",
];
const REQUIRED_TEXT = [
  "data WasmGcLayoutKind",
  "type WasmGcLayoutTable",
  "data CoreOpKind",
  "CoreOpContinuationPackage",
  "CoreOpTailCall",
  "data CoreValidationError",
  "CoreDanglingLayout",
  "CoreIllegalTailCall",
  "CoreIllegalContinuationPackage",
  "def validate_wasm_gc_core",
  "def emit_wat",
  "def run_wasm_gc_wat",
];

function fail(message) {
  console.error("[FAIL] level-1b C11 backend");
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
  if (/\beffect\b/i.test(code)) errors.push(`${file}: backend must not introduce effect naming`);
  if (/\bmetalstd\b|Ptr\s*\[|UnsafeRef\s*\[|heap_alloc\s*\(|load(?:8|16|32|64)\s*\(/.test(code)) {
    errors.push(`${file}: backend contract leaks Metal/raw memory implementation`);
  }
  if (/\bL[0-9]+Op|\bL[0-9]+Item|\bbackend\.cir\b/.test(code)) {
    errors.push(`${file}: level-1b backend must not copy old CIR level tags`);
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (isPublicItem(lines[i]) && previousDocBlock(lines, i).length === 0) {
      errors.push(`${file}:${i + 1}: public item is missing /// doc comment`);
    }
  }
  return errors;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

function generateWat(name, source) {
  fs.mkdirSync(OUT, { recursive: true });
  const result = run("timeout", ["10", "./target/debug/level1c.o", "wat", source]);
  const out = `${result.stdout}${result.stderr}`;
  if (result.status !== 0) fail(`${name} wat generation failed\n${out}`);
  const wat = path.join(OUT, `${name}.wat`);
  fs.writeFileSync(wat, result.stdout);
  return { wat, text: result.stdout };
}

function compileWat(name, wat) {
  const wasm = path.join(OUT, `${name}.wasm`);
  const result = run("timeout", ["30", process.execPath, "tools/node/compile-wat.mjs", wat, "-o", wasm, "--opt"]);
  if (result.status !== 0) fail(`${name} Binaryen compile failed\n${result.stdout}${result.stderr}`);
  if (!fs.existsSync(wasm) || fs.statSync(wasm).size === 0) fail(`${name} did not produce wasm bytes`);
  return wasm;
}

function runWatNode(name, wat, expect) {
  const result = run("timeout", ["30", process.execPath, "--no-warnings", "tools/node/run-wat.mjs", wat, "--opt"]);
  const out = `${result.stdout}${result.stderr}`;
  if (result.status !== 0 || !out.includes(expect)) fail(`${name} node wat run failed\n${out}`);
}

function instantiateWatNode(name, wat) {
  const result = run("timeout", [
    "30",
    process.execPath,
    "--no-warnings",
    "tools/node/run-wat.mjs",
    wat,
    "--opt",
    "--instantiate-only",
  ]);
  const out = `${result.stdout}${result.stderr}`;
  if (result.status !== 0 || !out.includes("instantiate ok")) fail(`${name} node wat instantiate failed\n${out}`);
}

function runWasmtime(name, wasm) {
  const found = run("which", ["wasmtime"]);
  if (found.status !== 0) {
    console.log("[SKIP] wasmtime direct backend smoke: wasmtime not found in PATH");
    return;
  }
  const result = run("timeout", ["30", "wasmtime", wasm]);
  if (result.status !== 0) fail(`${name} wasmtime run failed\n${result.stdout}${result.stderr}`);
}

function main() {
  const files = listChiba(ROOT);
  const seen = new Set(files.map((file) => path.basename(file)));
  const missing = REQUIRED_FILES.filter((file) => !seen.has(file));
  if (missing.length !== 0) fail(`missing C11 files:\n${missing.join("\n")}`);

  const joined = files.map(read).join("\n");
  const missingText = REQUIRED_TEXT.filter((needle) => !joined.includes(needle));
  if (missingText.length !== 0) fail(`missing C11 contract text:\n${missingText.join("\n")}`);

  const errors = files.flatMap((file) => checkSource(file, read(file)));
  if (errors.length !== 0) fail(errors.join("\n"));
  pass("backend source contract");

  const tail = generateWat("tailcall", "supports/bootstrap/wat-tailcall-smoke.chiba");
  if (!tail.text.includes("return_call $countdown")) fail("tailcall WAT is missing return_call");
  runWatNode("tailcall", tail.wat, "0");
  runWasmtime("tailcall", compileWat("tailcall", tail.wat));

  const chibac = generateWat("chibac-next", "level-1b/src/level1b_main.chiba");
  if (!chibac.text.includes("(export \"main\"")) fail("chibac-next WAT is missing main export");
  runWatNode("chibac-next", chibac.wat, "42");
  runWasmtime("chibac-next", compileWat("chibac-next", chibac.wat));

  const continuation = generateWat("continuation", "supports/bootstrap/continuation-multi-resume.chiba");
  if (!continuation.text.includes("(type $array_u8") || !continuation.text.includes("(type $slice_u8")) {
    fail("continuation WAT is missing managed Wasm-GC runtime layouts");
  }
  instantiateWatNode("continuation", continuation.wat);
  runWasmtime("continuation", compileWat("continuation", continuation.wat));
  pass("backend wat/toolchain oracle");
}

main();
