import fs from "node:fs/promises";
import process from "node:process";
import wabtInit from "wabt";

async function readInput() {
  const path = process.argv[2];
  if (path && path !== "-") {
    return fs.readFile(path, "utf8");
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function extractModule(text) {
  const start = text.indexOf("(module");
  const end = text.lastIndexOf("\n)");
  if (start < 0 || end < start) {
    throw new Error("input does not contain a complete wat module");
  }
  return text.slice(start, end + 2);
}

try {
  const raw = await readInput();
  const wat = extractModule(raw);
  const wabt = await wabtInit();
  const parsed = wabt.parseWat("bootstrap.wat", wat);
  parsed.resolveNames();
  parsed.validate();
  const { buffer } = parsed.toBinary({ write_debug_names: true });
  const instance = await WebAssembly.instantiate(buffer, {});
  const main = instance.instance.exports.main;

  if (typeof main !== "function") {
    throw new Error("wat module does not export main");
  }

  const result = main();
  console.log(String(result));
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  console.error(message.split("\n").slice(0, 12).join("\n"));
  process.exit(1);
}
