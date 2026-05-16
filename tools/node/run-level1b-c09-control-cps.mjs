import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const ROOT = "level-1b/compiler/control";
const REQUIRED_FILES = [
  "answer_control.chiba",
  "answer_type.chiba",
  "continuation_boundary.chiba",
  "continuation_usage.chiba",
  "cps.chiba",
  "driver.chiba",
  "replay_safety.chiba",
  "usage_subject.chiba",
];
const REQUIRED_TEXT = [
  "data ControlBoundary",
  "data AnswerTypeCheck",
  "def check_answer_type",
  "def check_answer_control",
  "data UsageCount",
  "data UsageSubject",
  "def UsageCount.merge",
  "data ContinuationKind",
  "def analyze_usage",
  "data ContinuationBoundary",
  "def check_continuation_boundary",
  "data ControlBoundaryError",
  "ControlCrossWorld",
  "ControlCrossThread",
  "ControlNonReplayState",
  "def check_replay_safety",
  "def one_pass_cps",
  "def run_control_cps",
];

const VALID = [
  "supports/bootstrap/continuation-valid.chiba",
  "supports/bootstrap/continuation-nested.chiba",
  "supports/bootstrap/continuation-multi-resume.chiba",
  "supports/bootstrap/continuation-lexer-backtracking.chiba",
  "supports/bootstrap/continuation-parser-recovery.chiba",
  "supports/semantic-gates/continuation_scheme_multi.chiba",
];
const INVALID = [
  ["supports/bootstrap/continuation-answer-mismatch-invalid.chiba", "answer type mismatch"],
  ["supports/bootstrap/continuation-cross-world-invalid.chiba", "continuation crosses world/thread boundary"],
  ["supports/bootstrap/continuation-non-replay-invalid.chiba", "multi-resume captures non-replay state"],
];

function fail(message) {
  console.error("[FAIL] level-1b C09 control/cps");
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
  if (/\beffect\b/i.test(code)) errors.push(`${file}: C09 must not introduce effect naming`);
  if (/\bmetalstd\b|Ptr\s*\[|UnsafeRef\s*\[|heap_alloc\s*\(|load(?:8|16|32|64)\s*\(/.test(code)) {
    errors.push(`${file}: control pass leaks Metal/raw memory implementation`);
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (isPublicItem(lines[i]) && previousDocBlock(lines, i).length === 0) {
      errors.push(`${file}:${i + 1}: public item is missing /// doc comment`);
    }
  }
  return errors;
}

function runLevel1c(args) {
  return spawnSync("timeout", ["10", "./target/debug/level1c.o", ...args], { encoding: "utf8" });
}

function main() {
  const files = listChiba(ROOT);
  const seen = new Set(files.map((file) => path.basename(file)));
  const missing = REQUIRED_FILES.filter((file) => !seen.has(file));
  if (missing.length !== 0) fail(`missing C09 files:\n${missing.join("\n")}`);

  const joined = files.map(read).join("\n");
  const missingText = REQUIRED_TEXT.filter((needle) => !joined.includes(needle));
  if (missingText.length !== 0) fail(`missing C09 contract text:\n${missingText.join("\n")}`);

  const errors = files.flatMap((file) => checkSource(file, read(file)));
  if (errors.length !== 0) fail(errors.join("\n"));
  pass("control/cps source contract");

  for (const file of VALID) {
    const result = runLevel1c(["check", file]);
    if (result.status !== 0 || !`${result.stdout}${result.stderr}`.includes("check ok")) {
      fail(`valid continuation gate failed: ${file}\n${result.stdout || result.stderr}`);
    }
  }
  pass("valid continuation gates");

  for (const [file, expected] of INVALID) {
    const result = runLevel1c(["check", file]);
    if (result.status !== 0 || !`${result.stdout}${result.stderr}`.includes(expected)) {
      fail(`invalid continuation gate missing ${expected}: ${file}\n${result.stdout || result.stderr}`);
    }
  }
  pass("invalid continuation gates");
}

main();
