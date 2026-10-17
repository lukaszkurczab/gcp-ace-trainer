import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, realpathSync, lstatSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(app, "..");
const vault = resolve(process.env.PATTERNLY_VAULT_ROOT ?? join(workspace, "../../Vaults/Patternly"));
const plan = join(vault, "Ogólne/docs/PATTERNLY-WORKING-PLAN.md");
const state = join(vault, "Ogólne/WORKING_STATE.md");
const read = (path) => readFileSync(path, "utf8");
const walk = (path) => readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
  if ([".obsidian", ".git", "Źródła"].includes(entry.name)) return [];
  const child = join(path, entry.name);
  return entry.isDirectory() ? walk(child) : entry.name.endsWith(".md") ? [child] : [];
});
assert.ok(existsSync(plan) && existsSync(state), `Vault unavailable: ${vault}. Set PATTERNLY_VAULT_ROOT to the cloned Patternly vault.`);
const notes = walk(vault);
let localLinks = 0;
let wikiLinks = 0;
const headings = (source) => new Set([...source.matchAll(/^#{1,6} (.+)$/gm)].map((match) =>
  match[1].toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, "").replace(/ /g, "-")));

function checkLinks(path) {
  for (const match of read(path).matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].replace(/^<|>$/g, "");
    if (/^(?:https?|obsidian|codex|mailto):/i.test(link)) continue;
    const [file, fragment] = link.split("#");
    const decoded = decodeURIComponent(file);
    const target = decoded.startsWith("file://") ? fileURLToPath(decoded)
      : file ? (isAbsolute(decoded) ? decoded : resolve(dirname(path), decoded)) : path;
    assert.ok(existsSync(target), `${path}: missing ${link}`);
    if (fragment && target.endsWith(".md")) {
      assert.ok(headings(read(target)).has(decodeURIComponent(fragment)), `${path}: missing anchor ${link}`);
    }
    if (basename(target) === "PATTERNLY-WORKING-PLAN.md") assert.equal(realpathSync(target), realpathSync(plan), `${path}: competing plan`);
    if (basename(target) === "WORKING_STATE.md") assert.equal(realpathSync(target), realpathSync(state), `${path}: competing state`);
    localLinks++;
  }
  if (!path.startsWith(vault)) return;
  for (const match of read(path).matchAll(/\[\[([^\]]+)\]\]/g)) {
    const file = match[1].split("|")[0].replace(/\\/g, "").split("#")[0];
    if (!file) continue;
    const target = file.endsWith(".md") ? file : `${file}.md`;
    assert.ok(existsSync(join(vault, target)) || existsSync(join(dirname(path), target)) ||
      notes.some((note) => basename(note) === basename(target)), `${path}: missing wiki target ${file}`);
    wikiLinks++;
  }
}
for (const path of notes) checkLinks(path);
for (const repo of ["patternly", "patternly-backend", "patternly-content", "patternly-web"]) {
  const root = join(workspace, repo);
  checkLinks(join(root, "AGENTS.md"));
  if (existsSync(join(root, "README.md"))) checkLinks(join(root, "README.md"));
  assert.equal(existsSync(join(root, "docs/PATTERNLY-WORKING-PLAN.md")), false, `${repo}: duplicate plan`);
}
checkLinks(join(workspace, "AGENTS.md"));
checkLinks(join(app, ".agent/WORKING_STATE.md"));
const stateAlias = join(workspace, ".agent/WORKING_STATE.md");
if (existsSync(stateAlias)) {
  assert.ok(lstatSync(stateAlias).isSymbolicLink(), "Workspace state must be an alias, not a second copy");
  assert.equal(realpathSync(stateAlias), realpathSync(state));
}
assert.equal(existsSync(join(workspace, "docs/PATTERNLY-WORKING-PLAN.md")), false, "stale workspace plan");
assert.equal(existsSync(join(workspace, "docs/specs")), false, "stale docs/specs alias");
assert.match(read(join(app, ".agent/WORKING_STATE.md")), /Ten plik nie przechowuje statusu/);
const ci = read(join(workspace, "patternly-backend/.github/workflows/ci.yml"));
const readme = read(join(vault, "patternly-backend/README.md"));
for (const pattern of [/node-version: ([\d.]+)/, /java-version: '([\d]+)'/, /firebase-tools@([\d.]+)/]) {
  const pin = ci.match(pattern)?.[1];
  assert.ok(pin && readme.includes(pin), `Vault backend README missing CI pin ${pin}`);
}
console.log(`PASS: ${notes.length} vault notes, ${localLinks} local references, ${wikiLinks} wiki targets; one vault plan/state.`);
console.log("Scope: documentation links and routing, canonical plan/state and backend CI pins. External URLs, historical archive contents and runtime behavior are separate checks.");
