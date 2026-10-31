import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { RELEASE_LOCK_RELATIVE_PATH, GENERATED_DIRECTORY } from "./syncBundledContentRelease.mjs";
import { validateBundledApproachChallengeBank, verifyBundledCurrentContent } from "./verifyBundledCurrentContent.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

test("standalone verifier accepts the real paired bank and rejects malformed or foreign pairs without CONTENT runtime imports", async () => {
  const contentRoot = path.resolve(root, "../patternly-content");
  const familyCounts = { complexity_and_constraints: 6, arrays_and_strings: 4, hash_map_and_set: 4, two_pointers: 2, sliding_window: 4, prefix_sums: 2, sorting_based: 2, stack: 2, binary_search: 2, tree_traversal: 2, intervals: 2, graph_traversal: 2, dynamic_programming_intro: 2 };
  const problems = [];
  for (const [familyIndex, [familyId, count]] of Object.entries(familyCounts).entries()) {
    for (let index = 1; index <= count; index += 1) {
      const name = `acm-b${String(familyIndex + 1).padStart(2, "0")}-${String(index).padStart(2, "0")}.json`;
      problems.push(JSON.parse(await readFile(path.join(contentRoot, "content/approach-challenges/coding-interview-dsa-problem-solving", familyId, name), "utf8")));
    }
  }
  const artifact = { trackId: "coding-interview-dsa-problem-solving", approachChallengeProblems: problems };
  assert.deepEqual(validateBundledApproachChallengeBank(artifact), { problemCount: 36, stageCount: 72, freeCount: 6, premiumCount: 30 });

  const malformed = structuredClone(artifact);
  delete malformed.approachChallengeProblems[0].complexityQuestion.answer;
  assert.throws(() => validateBundledApproachChallengeBank(malformed), /malformed or foreign complexityQuestion/u);

  const foreign = structuredClone(artifact);
  foreign.approachChallengeProblems[0].trackId = "backend-system-design-interview";
  assert.throws(() => validateBundledApproachChallengeBank(foreign), /invalid or foreign identity/u);
});

test("shipped bundle verifier needs no content checkout and rejects changed artifact bytes", async (t) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-eas-content-verify-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const target = path.join(fixture, GENERATED_DIRECTORY);
  const lockPath = path.join(fixture, RELEASE_LOCK_RELATIVE_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await mkdir(path.dirname(lockPath), { recursive: true });
  await cp(path.join(root, GENERATED_DIRECTORY), target, { recursive: true });
  await cp(path.join(root, RELEASE_LOCK_RELATIVE_PATH), lockPath);

  const verified = await verifyBundledCurrentContent({ root: fixture });
  assert.equal(verified.trackCount, 9);
  const standalone = path.join(fixture, "application-only");
  await mkdir(path.join(standalone, "scripts"), { recursive: true });
  await mkdir(path.join(standalone, "src/content/generated"), { recursive: true });
  await mkdir(path.join(standalone, "integration/contracts/content-release"), { recursive: true });
  await cp(path.join(root, "scripts/verifyBundledCurrentContent.mjs"), path.join(standalone, "scripts/verifyBundledCurrentContent.mjs"));
  await cp(path.join(root, "scripts/syncBundledContentRelease.mjs"), path.join(standalone, "scripts/syncBundledContentRelease.mjs"));
  await cp(target, path.join(standalone, GENERATED_DIRECTORY), { recursive: true });
  await cp(lockPath, path.join(standalone, RELEASE_LOCK_RELATIVE_PATH));
  const standaloneResult = execFileSync(process.execPath, ["scripts/verifyBundledCurrentContent.mjs"], { cwd: standalone, encoding: "utf8", env: { ...process.env, PATTERNLY_CONTENT_CURRENT_ROOT: "", PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA: "" } });
  assert.match(standaloneResult, /BUNDLED_CURRENT_CONTENT=passed/u);
  assert.equal(await import("node:fs/promises").then(({ readdir }) => readdir(fixture)).then((names) => names.includes("patternly-content")), false);

  const artifact = path.join(standalone, GENERATED_DIRECTORY, "aws-certified-solutions-architect-associate.json");
  await writeFile(artifact, Buffer.concat([await readFile(artifact), Buffer.from(" ")]));
  assert.throws(() => execFileSync(process.execPath, ["scripts/verifyBundledCurrentContent.mjs"], { cwd: standalone, stdio: "pipe" }), /Bundled current content digest mismatch/u);
});
