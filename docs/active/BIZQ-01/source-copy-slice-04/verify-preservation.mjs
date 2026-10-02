import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const appRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const contentRoot = path.resolve(appRoot, "../patternly-content");
const git = (root, args) => execFileSync("git", args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const producerBase = "ddd45c83f47a77d425dd016f949f58e9dad0d3a9";
const changed = git(contentRoot, ["diff", "--name-only", producerBase, "--", "content"]).toString().trim().split("\n");
assert.deepEqual(changed, ["content/catalog.json", "content/coding-interview-dsa-problem-solving/contrast_binary_search_vs_linear_scan/correctness_before_asymptotic_speed.json"]);
assert.equal(git(contentRoot, ["ls-files", "--others", "--exclude-standard", "--", "content"]).toString().trim(), "");
assert.equal(git(contentRoot, ["diff", "--name-only", producerBase, "--", "content/migration-evidence", "artifacts", "evidence/business-quality/bizq-01-besd-slice-01.json"]).toString().trim(), "");
const appBase = "371dcee0083989f7ce2b7668c1fdbcae771d4c9c";
const lockPath = "src/content/generated/canonical-content/content-lock.json";
const old = JSON.parse(git(appRoot, ["show", `${appBase}:${lockPath}`]));
const current = JSON.parse(readFileSync(path.join(appRoot, lockPath)));
let preserved = 0;
for (const track of old.tracks) {
  if (track.trackId === "coding-interview-dsa-problem-solving") continue;
  const file = `src/content/generated/canonical-content/${track.trackId}.json`;
  assert.deepEqual(git(appRoot, ["show", `${appBase}:${file}`]), readFileSync(path.join(appRoot, file)));
  const now = current.tracks.find((entry) => entry.trackId === track.trackId);
  for (const key of ["contentVersion", "sha256", "questionCount"]) assert.equal(now[key], track[key]);
  preserved += 1;
}
assert.equal(preserved, 8);
console.log("PRESERVATION=passed; other8 raw artifact bytes/version/hash/count pins and immutable history unchanged; only named source file/catalog changed; no untracked ingress.");
