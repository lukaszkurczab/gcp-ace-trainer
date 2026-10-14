import assert from "node:assert/strict";
import { createHash as cryptoCreateHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { createCandidateContentReleaseLock, parseCandidateContentReleaseLockArgs, readCandidateContentProducerPin, readHistoricalContentProducerPin } from "./candidateContentReleaseLock.mjs";
import { historicalTrainingProjection } from "./syncBundledContentRelease.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const FROZEN_ADMITTED_APP = "cc6cd256dea06bf6b940f59587dd4600e642be53";
async function frozenAdmittedApp(t) {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "qle-frozen-admitted-app-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const names = ["content-lock.json", "content-successor-ledger.json", ...JSON.parse(await readFile(path.join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8")).tracks.map(t => `${t.trackId}.json`)];
  for (const name of [...names.map(n => `src/content/generated/canonical-content/${n}`), "integration/contracts/content-release/release.lock.json"]) {
    await mkdir(path.dirname(path.join(fixture, name)), { recursive: true });
    await writeFile(path.join(fixture, name), execFileSync("git", ["show", `${FROZEN_ADMITTED_APP}:${name}`], { cwd: appRoot, maxBuffer: 80 * 1024 * 1024 }));
  }
  return fixture;
}
const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));

test("candidate lock CLI accepts one explicit producer root and rejects duplicates", () => {
  assert.deepEqual(parseCandidateContentReleaseLockArgs(["write", "--content-root", "/tmp/patternly-content"]), {
    mode: "write", contentRoot: path.resolve("/tmp/patternly-content"),
  });
  assert.throws(() => parseCandidateContentReleaseLockArgs(["--content-root", "/tmp/one", "--content-root", "/tmp/two"]), /Usage:/u);
});

test("candidate lock binds the exact nine admitted v2 artifacts and raw bundled lock", async t => {
  const frozenRoot = await frozenAdmittedApp(t);
  const lock = await createCandidateContentReleaseLock({ appRoot: frozenRoot, contentRoot });
  const lockBytes = await readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"));
  const immutable = JSON.parse(lockBytes.toString("utf8"));
  assert.deepEqual(lock, immutable, "the active lock must match the exact current candidate release");
  assert.equal(lock.schemaVersion, 3);
  assert.equal(lock.artifacts.length, 9);
  assert.equal(new Set(lock.artifacts.map((artifact) => artifact.trackId)).size, 9);
  assert.match(lock.candidateId, /^[a-f0-9]{64}$/u);
  assert.match(lock.bundledContentLockSha256, /^[a-f0-9]{64}$/u);
  const contentLockBytes = await readFile(path.join(frozenRoot, "src/content/generated/canonical-content/content-lock.json"));
  assert.equal(lock.bundledContentLockSha256, createHash(contentLockBytes));
  const contentLock = JSON.parse(contentLockBytes.toString("utf8"));
  const bundledByTrack = new Map(contentLock.tracks.map((track) => [track.trackId, track]));
  for (const artifact of lock.artifacts) {
    const bundled = bundledByTrack.get(artifact.trackId);
    assert.ok(bundled, `candidate artifact exists in bundle: ${artifact.trackId}`);
    assert.equal(artifact.contentVersion, bundled.contentVersion);
    assert.equal(artifact.checksumSha256, bundled.sha256);
  }
});

test("candidate lock rejects bundled bytes outside the candidate", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-candidate-lock-"));
  try {
    const target = path.join(fixture, "src/content/generated/canonical-content");
    await cp(path.join(appRoot, "src/content/generated/canonical-content"), target, { recursive: true });
    const bundled = JSON.parse(await readFile(path.join(target, "content-lock.json"), "utf8"));
    bundled.tracks[0].sha256 = "0".repeat(64);
    await writeFile(path.join(target, "content-lock.json"), `${JSON.stringify(bundled)}\n`);
    await assert.rejects(createCandidateContentReleaseLock({ appRoot: fixture, contentRoot }), /SHA-256 mismatch/);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});

test("the v2 policy successor round trips to exact v1 training bytes and rejects changed training content", async () => {
  const directory = path.join(appRoot, "src/content/generated/canonical-content");
  const ledger = JSON.parse(await readFile(path.join(directory, "content-successor-ledger.json"), "utf8"));
  assert.equal(ledger.tracks.length, 9);
  for (const entry of ledger.tracks) {
    const artifact = JSON.parse(await readFile(path.join(directory, `${entry.trackId}.json`), "utf8"));
    const reconstructed = historicalTrainingProjection(artifact, entry.training.contentVersion);
    assert.equal(createHash(reconstructed), entry.training.artifactSha256, `${entry.trackId} preserves its exact v1 training pin`);
    const changedTraining = structuredClone(artifact);
    changedTraining.questions[0].questionId = `${changedTraining.questions[0].questionId}-changed`;
    assert.notEqual(createHash(historicalTrainingProjection(changedTraining, entry.training.contentVersion)), entry.training.artifactSha256,
      `${entry.trackId} must reject a training change hidden behind the policy successor`);
  }
});

function createHash(value) { return cryptoCreateHash("sha256").update(value).digest("hex"); }

test("CI bootstrap binds the admitted v3 lock and rejects the unpromoted local Claude bundle", async t => {
  const frozenRoot = await frozenAdmittedApp(t);
  const lock = JSON.parse(await readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));
  assert.equal(await readCandidateContentProducerPin({ appRoot: frozenRoot }), lock.artifacts[0].producerCommit);
  await assert.rejects(readCandidateContentProducerPin({ appRoot }), /bundled content lock hash differs|[Ii]nventory mismatch/u);
});

test("candidate bootstrap loads validation modules from the explicitly supplied producer root", async (t) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-candidate-explicit-root-"));
  const producerRoot = path.join(fixture, "producer");
  const appFixture = path.join(fixture, "app");
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(path.join(appFixture, "integration/contracts/content-release"), { recursive: true });
  await cp(path.join(appRoot, "src/content/generated/canonical-content"), path.join(appFixture, "src/content/generated/canonical-content"), { recursive: true });
  await cp(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), path.join(appFixture, "integration/contracts/content-release/release.lock.json"));
  await mkdir(path.join(producerRoot, "scripts/content"), { recursive: true });
  const signatures = {
    "question-contract.mjs": "export function validatePackageCompletionRule(rule, pathName = \"completionRule\", questions) {",
    "planning-policy.mjs": "export function validatePlanningPolicy(policy, questions) {",
    "track-runtime-bindings.mjs": "export function loadTrackRuntimeBindings({ rootDirectory = DEFAULT_ROOT } = {}) {",
  };
  for (const name of ["question-contract.mjs", "planning-policy.mjs", "track-runtime-bindings.mjs"]) {
    const source = await readFile(path.join(contentRoot, "scripts/content", name), "utf8");
    const signature = signatures[name];
    assert.ok(source.includes(signature), `producer validation fixture includes ${name}'s exported entry point`);
    await writeFile(path.join(producerRoot, "scripts/content", name), source.replace(signature, `${signature}\n  throw new Error("explicit candidate producer root used");`));
  }
  await cp(path.join(contentRoot, "scripts/content/case-recipe.mjs"), path.join(producerRoot, "scripts/content/case-recipe.mjs"));
  await mkdir(path.join(producerRoot, "config"), { recursive: true });
  await cp(path.join(contentRoot, "config/track-runtime-bindings.json"), path.join(producerRoot, "config/track-runtime-bindings.json"));
  await assert.rejects(readCandidateContentProducerPin({ appRoot: appFixture, contentRoot: producerRoot }), /explicit candidate producer root used/u);
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
  const frozenRoot = await frozenAdmittedApp(t);
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
      await cp(path.join(frozenRoot, "src/content/generated/canonical-content"), path.join(fixture, "src/content/generated/canonical-content"), { recursive: true });
      await assert.rejects(readCandidateContentProducerPin({ appRoot: fixture }), /bootstrap bundled (?:content lock hash|candidate artifact) differs/);
    } finally { await rm(fixture, { recursive: true, force: true }); }
  });
});

test("both QA jobs share the strict pin reader and retain mandatory candidate and actual checkout identity gates", async () => {
  const workflow = await readFile(path.join(appRoot, ".github/workflows/qa.yml"), "utf8");
  const jobs = workflow.split(/\n  (?:qa-static|content-release-cross-repository-contract):\n/).slice(1);
  assert.equal(jobs.length, 2);
  for (const job of jobs) {
    const applicationCheckoutIndex = job.indexOf("- name: Checkout application");
    const currentProducerCheckoutIndex = job.indexOf("- name: Checkout current content producer");
    const immutableLockReadIndex = job.indexOf("name: Read immutable content lock");
    assert.ok(applicationCheckoutIndex >= 0 && applicationCheckoutIndex < currentProducerCheckoutIndex, "application checkout must precede current producer checkout");
    assert.ok(currentProducerCheckoutIndex < immutableLockReadIndex, "current producer checkout must precede immutable lock pin reads");
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

test("historical bootstrap preserves the exact frozen lock and distinct producer checkout", async t => {
  const frozenRoot = await frozenAdmittedApp(t);
  const frozenPath = "integration/contracts/content-release/release.lock.historical-0024.json";
  const frozenBytes = await readFile(path.join(appRoot, frozenPath));
  const pin = JSON.parse(frozenBytes).artifacts.at(-1).producerCommit;
  assert.equal(await readHistoricalContentProducerPin({ appRoot }), pin);
  assert.notEqual(pin, await readCandidateContentProducerPin({ appRoot: frozenRoot }));
  assert.equal(execFileSync(process.execPath, ["scripts/candidateContentReleaseLock.mjs", "historical-producer-pin"], { cwd: appRoot, encoding: "utf8" }), `${pin}\n`);
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-ci-history-pin-"));
  try {
    await mkdir(path.join(fixture, "integration/contracts/content-release"), { recursive: true });
    await writeFile(path.join(fixture, frozenPath), Buffer.concat([frozenBytes, Buffer.from("\n")]));
    await assert.rejects(readHistoricalContentProducerPin({ appRoot: fixture }), /Frozen historical release lock hash differs/);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
