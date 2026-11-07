// One-shot rebrand 9router -> 44router. Safe: exact-case, longest-first, skips binary.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SKIP = /\\\.git\\|\\node_modules\\|\\\.evrax|\\\.serena|\\\.build-home|\\\.next\\|\\\.tray-build|\\\.script\\/;
const BIN = /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot|webp|mp4|wasm|node|dll|exe|zip|gz|sqlite|sqlite-shm|sqlite-wal|avif|pdf|snap)$/i;

// Longest-first. 9Remote is a different product's name — shield it with a sentinel
// so the bare "9R" rule below cannot chew it into "44Remote".
const SENTINEL = "\u0000NINEREMOTE\u0000";
const MAP = [
  ["9Remote", SENTINEL],
  ["Another 9router", "Another 44router"],
  ["Another 9Router", "Another 44Router"],
  ["9Router", "44Router"],
  ["9router", "44router"],
  ["9R", "44R"],
  [SENTINEL, "9Remote"],
];

const files = execSync("git ls-files -z", { maxBuffer: 1 << 28 })
  .toString()
  .split("\0")
  .filter(Boolean)
  .filter((f) => !SKIP.test(f) && !BIN.test(f) && !f.endsWith("package-lock.json"));

let touched = 0;
let total = 0;
for (const f of files) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  let out = src;
  for (const [from, to] of MAP) {
    if (from === to) continue;
    out = out.split(from).join(to);
  }
  if (out !== src) {
    const n = src.length - out.length;
    writeFileSync(f, out);
    touched++;
    total++;
    console.log(`  ${f}`);
  }
}
console.log(`\ntouched ${touched} files`);
