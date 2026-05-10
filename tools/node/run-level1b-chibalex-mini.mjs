import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const ROOT = "level-1b/supports/chibalex-mini";
const OUT = ".scratch/level-1b/chibalex-mini";
const CASES = [
  ["basic.chibalex", ["KwLet", "IntLit", "Ident", "Eq"]],
  ["longest.chibalex", ["EqEq", "Eq", "KwIf", "Ident"]],
  ["string-mode.chibalex", ["StringStart", "StringChunk", "StringEnd"]],
];

function run(name, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`[FAIL] ${name}`);
    console.error(`${result.stdout || ""}${result.stderr || ""}`.split("\n").slice(0, 40).join("\n"));
    process.exit(result.status || 1);
  }
  console.log(`[PASS] ${name}`);
  return result;
}

fs.mkdirSync(OUT, { recursive: true });

for (const [file, expected] of CASES) {
  const input = path.join(ROOT, file);
  const output = path.join(OUT, file.replace(/\.chibalex$/, ".chiba"));
  run(`native chibalex ${file}`, "timeout", ["10", "./chibalex.o", input, "-o", output]);
  const generated = fs.readFileSync(output, "utf8");
  for (const token of expected) {
    if (!generated.includes(token)) {
      console.error(`[FAIL] generated lexer ${file}`);
      console.error(`missing token ${token}`);
      process.exit(1);
    }
  }
}

run("level1c cps lexer backtracking fixture", "./target/debug/level1c.o", [
  "cps",
  "supports/bootstrap/continuation-multi-resume.chiba",
]);
