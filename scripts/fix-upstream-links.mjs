// Fix upstream links + drop dead website. Operates on git-tracked text files only.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BIN = /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot|webp|mp4|wasm|node|dll|exe|zip|gz|sqlite|sqlite-shm|sqlite-wal|avif|pdf)$/i;

// decolua org == original upstream owner, NOT this fork's owner.
// Mirror it onto the fork's real remote for every OPERATIONAL link.
const RULES = [
  [/raw\.githubusercontent\.com\/decolua\/44router/g, "raw.githubusercontent.com/jackielnikkie/another-44router"],
  [/github\.com\/decolua\/44router/g, "github.com/jackielnikkie/another-44router"],
  [/starchart\.cc\/decolua\/44router/g, "starchart.cc/jackielnikkie/another-44router"],
  [/www\.npmjs\.com\/package\/44router/g, "www.npmjs.com/package/another-44router"],
  [/img\.shields\.io\/npm\/v\/44router\.svg/g, "img.shields.io/npm/v/another-44router.svg"],
  [/img\.shields\.io\/npm\/dm\/44router\.svg/g, "img.shields.io/npm/dm/another-44router.svg"],
  [/img\.shields\.io\/npm\/l\/44router\.svg/g, "img.shields.io/npm/l/another-44router.svg"],
  [/hub\.docker\.com\/r\/decolua\/44router/g, "hub.docker.com/r/jackielnikkie/another-44router"],
  [/img\.shields\.io\/docker\/pulls\/decolua\/44router\.svg/g, "img.shields.io/docker/pulls/jackielnikkie/another-44router.svg"],
  [/ghcr\.io\/decolua\/44router/g, "ghcr.io/jackielnikkie/another-44router"],
  [/decolua\/44router/g, "jackielnikkie/another-44router"],
];

// Dead domain — the user owns no such site. Env defaults must stay valid URLs.
const WEBSITE_DROP = [
  [/# CLOUD_URL=https:\/\/44router\.com/g, "# CLOUD_URL=http://localhost:20128"],
  [/# NEXT_PUBLIC_CLOUD_URL=https:\/\/44router\.com/g, "# NEXT_PUBLIC_CLOUD_URL=http://localhost:20128"],
  [/https:\/\/44router\.com/g, "http://localhost:20128"],
  [/44router\.com/g, "localhost:20128"],
];

const files = execSync("git ls-files", { maxBuffer: 1 << 28 })
  .toString()
  .split("\n")
  .filter(Boolean)
  .filter((f) => !BIN.test(f) && f !== "package-lock.json" && !f.startsWith("scripts/rebrand"));

// Credit lines must survive: LICENSE + the "fork of / by @decolua" acknowledgements.
const CREDIT = /(Copyright \(c\)|is a personal fork of|fork of \[|Acknowledgments|credit for the original|upstream project)/i;

let touched = 0;
for (const f of files) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  let out = src;
  for (const [re, to] of RULES) out = out.replace(re, to);
  for (const [re, to] of WEBSITE_DROP) out = out.replace(re, to);
  // restore decolua references that appear on an attribution line
  if (out !== src) {
    const before = src.split("\n");
    const after = out.split("\n");
    const fixed = after.map((line, i) =>
      RULES.some(([re]) => re.test(before[i] ?? "")) && CREDIT.test(before[i] ?? "") ? before[i] : line,
    );
    out = fixed.join("\n");
  }
  if (out !== src) {
    writeFileSync(f, out);
    touched++;
    console.log(`  ${f}`);
  }
}
console.log(`\ntouched ${touched} files`);
