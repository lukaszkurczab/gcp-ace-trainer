import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { createCandidateContentReleaseLock, readCandidateContentProducerPin, readHistoricalContentProducerPin } from "./candidateContentReleaseLock.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.resolve(appRoot, "../patternly-content");

test("candidate lock binds the exact nine bundled artifacts", async () => {
  const lock = await createCandidateContentReleaseLock({ appRoot, contentRoot });
  assert.equal(lock.schemaVersion, 3);
  assert.equal(lock.artifacts.length, 9);
  assert.equal(new Set(lock.artifacts.map((artifact) => artifact.trackId)).size, 9);
  assert.match(lock.candidateId, /^[a-f0-9]{64}$/u);
  assert.match(lock.bundledContentLockSha256, /^[a-f0-9]{64}$/u);
});

test("candidate lock rejects bundled bytes outside the candidate", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-candidate-lock-"));
  try {
    const target = path.join(fixture, "src/content/generated/canonical-content");
    await mkdir(target, { recursive: true });
    const bundled = JSON.parse(await readFile(path.join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8"));
    bundled.tracks[0].sha256 = "0".repeat(64);
    await writeFile(path.join(target, "content-lock.json"), `${JSON.stringify(bundled)}\n`);
    await assert.rejects(createCandidateContentReleaseLock({ appRoot: fixture, contentRoot }), /Bundled content differs/);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});

test("CI bootstrap binds the actual current v3 lock to all nine verified bundled artifacts", async () => {
  const lock = JSON.parse(await readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));
  assert.equal(await readCandidateContentProducerPin({ appRoot }), lock.artifacts[0].producerCommit);
  assert.equal(execFileSync(process.execPath, ["scripts/candidateContentReleaseLock.mjs", "producer-pin"], { cwd: appRoot, encoding: "utf8" }), `${lock.artifacts[0].producerCommit}\n`);
});

test("CI bootstrap fails closed for malformed v3 metadata without an active v2 fallback", async t => {
  const actual = JSON.parse(await readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));
  const vectors = [
    ["old schema", lock => { lock.schemaVersion = 2; }],
    ["extra root field", lock => { lock.unverified = true; }],
    ["missing track", lock => { lock.artifacts.pop(); }],
    ["extra track", lock => { lock.artifacts.push({ ...lock.artifacts[0] }); }],
    ["duplicate track", lock => { lock.artifacts[1].trackId = lock.artifacts[0].trackId; }],
    ["mixed pin", lock => { lock.artifacts[1].producerCommit = "c".repeat(40); }],
    ["source mismatch", lock => { lock.artifacts[1].sourceRepositoryCommit = "c".repeat(40); }],
    ["malformed pin", lock => { for (const entry of lock.artifacts) entry.producerCommit = entry.sourceRepositoryCommit = "unsafe\ncommit=other"; }],
    ["mixed release", lock => { lock.artifacts[1].releaseId = "other-release"; }],
    ["bad checksum", lock => { lock.artifacts[1].checksumSha256 = "bad"; }],
    ["bad manifest digest", lock => { lock.releaseManifestSha256 = "bad"; }],
    ["bad candidate identity", lock => { lock.candidateId = "d".repeat(64); }],
    ["wrong candidate path", lock => { lock.candidateManifestPath = "../outside"; }],
  ];
  for (const [label, mutate] of vectors) await t.test(label, async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-ci-pin-"));
    try {
      const lock = structuredClone(actual); mutate(lock);
      await mkdir(path.join(fixture, "integration/contracts/content-release"), { recursive: true });
      await writeFile(path.join(fixture, "integration/contracts/content-release/release.lock.json"), JSON.stringify(lock));
      await assert.rejects(readCandidateContentProducerPin({ appRoot: fixture }), /Candidate release lock bootstrap/);
    } finally { await rm(fixture, { recursive: true, force: true }); }
  });
});

test("CI bootstrap rejects valid-shaped metadata that disagrees with actual bundled hashes or versions", async t => {
  const actual = JSON.parse(await readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));
  for (const field of ["bundledContentLockSha256", "checksumSha256", "contentVersion"]) await t.test(field, async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-ci-bundle-pin-"));
    try {
      const lock = structuredClone(actual);
      if (field === "bundledContentLockSha256") lock[field] = "0".repeat(64);
      else lock.artifacts[0][field] = field === "contentVersion" ? "other-version" : "0".repeat(64);
      await mkdir(path.join(fixture, "integration/contracts/content-release"), { recursive: true });
      await writeFile(path.join(fixture, "integration/contracts/content-release/release.lock.json"), JSON.stringify(lock));
      const { cp } = await import("node:fs/promises");
      await cp(path.join(appRoot, "src/content/generated/canonical-content"), path.join(fixture, "src/content/generated/canonical-content"), { recursive: true });
      await assert.rejects(readCandidateContentProducerPin({ appRoot: fixture }), /bootstrap bundled (?:lock hash|artifact) differs/);
    } finally { await rm(fixture, { recursive: true, force: true }); }
  });
});

test("both QA jobs share the strict pin reader and retain mandatory candidate and actual checkout identity gates", async () => {
  const workflow = await readFile(path.join(appRoot, ".github/workflows/qa.yml"), "utf8");
  for (const job of workflow.split(/\n  (?:qa-static|content-release-cross-repository-contract):\n/).slice(1)) {
    assert.match(job, /node scripts\/candidateContentReleaseLock\.mjs producer-pin/);
    assert.match(job, /ref: \$\{\{ steps\.content-lock\.outputs\.historical-commit \}\}/);
    assert.match(job, /node scripts\/candidateContentReleaseLock\.mjs historical-producer-pin/);
    assert.match(job, /cat-file -e.*EXPECTED_CANDIDATE_SOURCE_SHA/);
    assert.match(job, /path: patternly-content-historical/);
    assert.match(job, /ref: master\n\s+path: patternly-content/);
    assert.match(job, /historical_content_sha.*EXPECTED_HISTORICAL_CONTENT_SHA/);
    assert.match(job, /node scripts\/candidateContentReleaseLock\.mjs check/);
    assert.match(job, /PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA: \$\{\{ steps\.current-content\.outputs\.sha \}\}/);
    assert.match(job, /PATTERNLY_CONTENT_HISTORICAL_ROOT:.*patternly-content-historical/);
    assert.match(job, /PATTERNLY_CONTENT_CURRENT_ROOT:.*patternly-content\n/);
    assert.doesNotMatch(job, /lock\.schemaVersion !== 2|continue-on-error/);
    for (const step of job.split(/\n      - /).filter((step) => /repository: lukaszkurczab\/patternly-content(?:\n|$)/.test(step))) {
      assert.doesNotMatch(step, /ref: main(?:\n|$)/);
    }
  }
  assert.match(workflow, /npx expo prebuild --no-install --clean/);
  assert.match(workflow, /npm run baseline:report/);
  assert.match(workflow, /npm run test:content-release-cross-repo/);
});

test("historical bootstrap preserves the exact frozen lock and distinct producer checkout", async () => {
  const frozenPath = "integration/contracts/content-release/release.lock.historical-0024.json";
  const frozenBytes = await readFile(path.join(appRoot, frozenPath));
  const pin = JSON.parse(frozenBytes).artifacts.at(-1).producerCommit;
  assert.equal(await readHistoricalContentProducerPin({ appRoot }), pin);
  assert.notEqual(pin, await readCandidateContentProducerPin({ appRoot }));
  assert.equal(execFileSync(process.execPath, ["scripts/candidateContentReleaseLock.mjs", "historical-producer-pin"], { cwd: appRoot, encoding: "utf8" }), `${pin}\n`);
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-ci-history-pin-"));
  try {
    await mkdir(path.join(fixture, "integration/contracts/content-release"), { recursive: true });
    await writeFile(path.join(fixture, frozenPath), Buffer.concat([frozenBytes, Buffer.from("\n")]));
    await assert.rejects(readHistoricalContentProducerPin({ appRoot: fixture }), /Frozen historical release lock hash differs/);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
