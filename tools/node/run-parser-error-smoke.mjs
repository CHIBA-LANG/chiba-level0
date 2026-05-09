import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const SPEC_DIR = "chiba-level1-grammar-error-spec";

function listSpecs() {
  return fs
    .readdirSync(SPEC_DIR)
    .filter((name) => name.endsWith("-test.chiba"))
    .sort()
    .map((name) => path.join(SPEC_DIR, name));
}

let failed = 0;
let checked = 0;

for (const file of listSpecs()) {
  checked += 1;
  const result = spawnSync("./target/debug/level1c.o", ["parse", file], {
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout.startsWith("Err(")) {
    failed += 1;
    console.error(`[UNEXPECTED OK] ${file}`);
    console.error(`${result.stdout}${result.stderr}`.split("\n").slice(0, 12).join("\n"));
  }
}

if (failed === 0) {
  console.log(`[PASS] parser error smoke ${checked} specs`);
} else {
  console.error(`[FAIL] parser error smoke ${failed}/${checked} specs`);
  process.exit(1);
}
