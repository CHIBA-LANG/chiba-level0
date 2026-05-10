import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const PROJECT = "level-1b/supports/namespace-project";
const ENTRY = "use_both.chiba";
const ARTIFACT_DIR = ".scratch/level-1b/namespace";
const WAT = path.join(ARTIFACT_DIR, "use_both.wat");

function run(name, command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    console.error(`[FAIL] ${name}`);
    console.error(`${result.stdout || ""}${result.stderr || ""}`.split("\n").slice(0, 40).join("\n"));
    process.exit(result.status || 1);
  }
  console.log(`[PASS] ${name}`);
  return result;
}

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

run("level-1b namespace seed compile", "timeout", [
  "10",
  "./chibac_amd64-unknown-linux_chiba_dev.o",
  "--project",
  PROJECT,
  "--entry",
  ENTRY,
  "--output",
  "namespace-smoke.o",
]);

const source = path.join(PROJECT, "src", ENTRY);
const generated = run("level-1b namespace wat emit", "./target/debug/level1c.o", ["wat", source]);
if (!generated.stdout.includes("(module")) {
  console.error("[FAIL] level-1b namespace wat emit");
  console.error("output does not contain a WAT module");
  process.exit(1);
}
fs.writeFileSync(WAT, generated.stdout);

const executed = run("level-1b namespace wat run", process.execPath, [
  "--no-warnings",
  "tools/node/run-wat.mjs",
  WAT,
]);
if (!executed.stdout.split(/\s+/).includes("42")) {
  console.error("[FAIL] level-1b namespace wat run");
  console.error(`expected result 42, got: ${executed.stdout}`);
  process.exit(1);
}
