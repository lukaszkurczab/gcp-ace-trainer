import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Workspace-only references also work when specs are opened through docs/specs.
const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(app, "..");
const plan = join(workspace, "docs/PATTERNLY-WORKING-PLAN.md");
const state = join(workspace, ".agent/WORKING_STATE.md");
const read = (path) => readFileSync(path, "utf8");
let checked = 0;
const headings = (source) => new Set([...source.matchAll(/^#{1,6} (.+)$/gm)].map((match) =>
  match[1].toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, "").replace(/ /g, "-")));

function checkLinks(path, canonicalOnly = false) {
  for (const match of read(path).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (canonicalOnly && !/PATTERNLY-WORKING-PLAN\.md|WORKING_STATE\.md/.test(link)) continue;
    if (/^[a-z][a-z\d+.-]*:/i.test(link)) continue;
    const [file, fragment] = link.split("#");
    const target = file ? (isAbsolute(file) ? file : resolve(dirname(path), file)) : path;
    assert.ok(existsSync(target), `${path}: missing ${link}`);
    if (fragment && target.endsWith(".md")) {
      assert.ok(headings(read(target)).has(decodeURIComponent(fragment)), `${path}: missing anchor ${link}`);
    }
    if (/PATTERNLY-WORKING-PLAN\.md/.test(link)) assert.equal(target, plan, `${path}: competing plan`);
    if (/WORKING_STATE\.md/.test(link)) assert.equal(target, state, `${path}: competing state`);
    checked++;
  }
}

function walk(path) {
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    return statSync(child).isDirectory() ? walk(child) : child.endsWith(".md") ? [child] : [];
  });
}

for (const path of [
  plan, state,
  join(workspace, "docs/01-product-definition.md"),
  join(workspace, "docs/03-navigation-and-flows.md"),
  join(workspace, "docs/execution-prompts/2026-10-13/README.md"),
  join(workspace, "docs/reports/current-audit.md"),
  join(workspace, "patternly-backend/README.md"),
  join(app, "AGENTS.md"), join(app, ".agent/WORKING_STATE.md"),
  join(app, "docs/specs/engineering/performance.md"),
]) checkLinks(path);
for (const path of walk(join(app, "docs/specs"))) checkLinks(path, true);

for (const repo of ["patternly", "patternly-backend", "patternly-content", "patternly-web"]) {
  assert.equal(existsSync(join(workspace, repo, "docs/PATTERNLY-WORKING-PLAN.md")), false, `${repo}: duplicate plan`);
}
assert.equal(existsSync(join(workspace, "PATTERNLY-WORKING-PLAN.md")), false, "stale root plan");
for (const path of ["docs/01-product-definition.md", "docs/03-navigation-and-flows.md"]) {
  assert.doesNotMatch(read(join(workspace, path)), /paginated terminal/i);
}
assert.match(read(join(app, ".agent/WORKING_STATE.md")), /Ten plik nie przechowuje statusu/);
const backend = join(workspace, "patternly-backend");
const ci = read(join(backend, ".github/workflows/ci.yml"));
const readme = read(join(backend, "README.md"));
for (const pattern of [/node-version: ([\d.]+)/, /java-version: '([\d]+)'/, /firebase-tools@([\d.]+)/]) {
  const pin = ci.match(pattern)?.[1];
  assert.ok(pin, `missing CI pin: ${pattern}`);
  assert.ok(readme.includes(pin), `README missing CI pin ${pin}`);
}
console.log(`PASS: ${checked} local references; one workspace plan/state, Activity wording consistent.`);
console.log("Scope: all local links in the named entry docs; only plan/state links in other specs. External URLs and historical report contents are not validated.");
