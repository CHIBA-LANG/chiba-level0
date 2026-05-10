import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const PROJECT = "level-1b";
const ENTRY = "level1b_main.chiba";
const SOURCE = path.join(PROJECT, "src", ENTRY);
const ARTIFACT_DIR = ".scratch/level-1b";
const WAT = path.join(ARTIFACT_DIR, "level1b-main.wat");

function run(name, command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    console.error(`[FAIL] ${name}`);
    console.error(`${result.stdout || ""}${result.stderr || ""}`.split("\n").slice(0, 40).join("\n"));
    process.exit(result.status || 1);
  }
  console.log(`[PASS] ${name}`);
  return result;
}

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

run("level-1b seed compile", "timeout", [
  "10",
  "./chibac_amd64-unknown-linux_chiba_dev.o",
  "--project",
  PROJECT,
  "--entry",
  ENTRY,
  "--output",
  "level1b.o",
]);

const generated = run("level-1b wat emit", "./target/debug/level1c.o", ["wat", SOURCE]);
if (!generated.stdout.includes("(module")) {
  console.error("[FAIL] level-1b wat emit");
  console.error("output does not contain a WAT module");
  process.exit(1);
}
fs.writeFileSync(WAT, generated.stdout);

const executed = run("level-1b node wat run", process.execPath, [
  "--no-warnings",
  "tools/node/run-wat.mjs",
  WAT,
]);
if (!executed.stdout.split(/\s+/).includes("42")) {
  console.error("[FAIL] level-1b node wat run");
  console.error(`expected result 42, got: ${executed.stdout}`);
  process.exit(1);
}

console.log(`[PASS] level-1b smoke artifact ${WAT}`);
