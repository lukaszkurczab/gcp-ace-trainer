import assert from "node:assert/strict";
import { createHash as cryptoCreateHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { createCandidateContentReleaseLock, readCandidateContentProducerPin, readHistoricalContentProducerPin } from "./candidateContentReleaseLock.mjs";
import { historicalTrainingProjection } from "./syncBundledContentRelease.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const canonical = (value) => value === null || ["boolean", "number", "string"].includes(typeof value)
  ? JSON.stringify(value)
  : Array.isArray(value) ? `[${value.map(canonical).join(",")}]`
    : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;

async function candidateFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "patternly-direct-candidate-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const releaseRoot = path.join(root, "reports/candidate-reconciliation/AWS-02-DRAFT/release");
  await mkdir(releaseRoot, { recursive: true });
  await mkdir(path.join(root, "scripts/review"), { recursive: true });
  await writeFile(path.join(root, "scripts/review/candidate-manifest.mjs"), `import { createHash } from "node:crypto";\nexport function canonicalJson(value) { if (value === null || ["boolean", "number", "string"].includes(typeof value)) return JSON.stringify(value); if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]"; return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}"; }\nexport const candidateIdFor = manifest => { const { candidateId: _candidateId, ...identity } = manifest; return createHash("sha256").update(canonicalJson(identity)).digest("hex"); };\n`);
  const generated = path.join(appRoot, "src/content/generated/canonical-content");
  const contentLock = JSON.parse(await readFile(path.join(generated, "content-lock.json"), "utf8"));
  const artifacts = [];
  for (const track of contentLock.tracks) {
    const artifactPath = `artifacts/${track.trackId}.json`;
    const artifactBytes = await readFile(path.join(generated, `${track.trackId}.json`));
    await mkdir(path.dirname(path.join(releaseRoot, artifactPath)), { recursive: true });
    await writeFile(path.join(releaseRoot, artifactPath), artifactBytes);
    artifacts.push({ trackId: track.trackId, artifactPath, artifactBytes: artifactBytes.length, checksumSha256: track.sha256, contentVersion: track.contentVersion, questionCount: track.questionCount });
  }
  const sourceRepositoryCommit = "e".repeat(40);
  const release = { artifacts, manifest: { releaseId: "patternly-candidate-test", sourceRepositoryCommit } };
  await writeFile(path.join(releaseRoot, "release.json"), JSON.stringify(release));
  const candidate = {
    candidateId: "pending", status: "draft_not_admitted",
    release: { releaseId: release.manifest.releaseId, sourceRepositoryCommit, checksumSha256: cryptoCreateHash("sha256").update(`${canonical(release)}\n`).digest("hex") },
    tracks: artifacts.map(({ trackId, artifactPath, checksumSha256, contentVersion, questionCount }) => ({ trackId, artifactPath, checksumSha256, contentVersion, questionCount })),
  };
  candidate.candidateId = cryptoCreateHash("sha256").update(canonical(Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== "candidateId")))).digest("hex");
  const candidatePath = path.join(root, "reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json");
  await mkdir(path.dirname(candidatePath), { recursive: true });
  await writeFile(candidatePath, JSON.stringify(candidate));
  return root;
}

test("candidate lock binds the exact nine current v2 bundled artifacts", async (t) => {
  const candidateRoot = await candidateFixture(t);
  const lock = await createCandidateContentReleaseLock({ appRoot, contentRoot: candidateRoot });
  const contentLockBytes = await readFile(path.join(appRoot, "src/content/generated/canonical-content/content-lock.json"));
  const contentLock = JSON.parse(contentLockBytes);
  assert.equal(lock.schemaVersion, 3);
  assert.equal(lock.artifacts.length, 9);
  assert.equal(new Set(lock.artifacts.map((artifact) => artifact.trackId)).size, 9);
  assert.equal(lock.bundledContentLockSha256, createHash(contentLockBytes));
  assert.deepEqual(lock.artifacts.map(({ trackId, contentVersion, checksumSha256 }) => ({ trackId, contentVersion, checksumSha256 })), contentLock.tracks.map(({ trackId, contentVersion, sha256 }) => ({ trackId, contentVersion, checksumSha256: sha256 })));
  assert.match(lock.candidateId, /^[a-f0-9]{64}$/u);
  assert.match(lock.bundledContentLockSha256, /^[a-f0-9]{64}$/u);
});

test("candidate lock rejects bundled bytes outside the candidate", async (t) => {
  const candidateRoot = await candidateFixture(t);
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-candidate-lock-"));
  try {
    const target = path.join(fixture, "src/content/generated/canonical-content");
    await cp(path.join(appRoot, "src/content/generated/canonical-content"), target, { recursive: true });
    const bundled = JSON.parse(await readFile(path.join(target, "content-lock.json"), "utf8"));
    bundled.tracks[0].sha256 = "0".repeat(64);
    await writeFile(path.join(target, "content-lock.json"), `${JSON.stringify(bundled)}\n`);
    await assert.rejects(createCandidateContentReleaseLock({ appRoot: fixture, contentRoot: candidateRoot }), /SHA-256 mismatch/);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});

test("candidate lock rejects malformed identity, split source commits, and manifest track drift", async (t) => {
  for (const mutation of [
    (candidate) => { candidate.candidateId = "f".repeat(64); },
    (candidate) => { candidate.release.sourceRepositoryCommit = "d".repeat(40); },
    (candidate) => { candidate.tracks[0].checksumSha256 = "0".repeat(64); },
  ]) await t.test("invalid candidate binding", async (subtest) => {
    const contentRoot = await candidateFixture(subtest);
    const manifestPath = path.join(contentRoot, "reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json");
    const candidate = JSON.parse(await readFile(manifestPath, "utf8"));
    mutation(candidate);
    if (candidate.candidateId !== "f".repeat(64)) {
      const { candidateId: _old, ...identity } = candidate;
      candidate.candidateId = cryptoCreateHash("sha256").update(canonical(identity)).digest("hex");
    }
    await writeFile(manifestPath, JSON.stringify(candidate));
    await assert.rejects(createCandidateContentReleaseLock({ appRoot, contentRoot }), /Candidate release identity is invalid|Candidate manifest track binding differs/u);
  });
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

test("CI bootstrap binds the actual current v3 lock to all nine verified bundled artifacts", async (t) => {
  const candidateRoot = await candidateFixture(t);
  const lock = await createCandidateContentReleaseLock({ appRoot, contentRoot: candidateRoot });
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-ci-current-lock-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(path.join(fixture, "integration/contracts/content-release"), { recursive: true });
  await writeFile(path.join(fixture, "integration/contracts/content-release/release.lock.json"), `${canonical(lock)}\n`);
  await cp(path.join(appRoot, "src/content/generated/canonical-content"), path.join(fixture, "src/content/generated/canonical-content"), { recursive: true });
  assert.equal(await readCandidateContentProducerPin({ appRoot: fixture }), lock.artifacts[0].producerCommit);
  assert.equal(lock.artifacts.length, 9);
});

test("CI bootstrap fails closed for malformed v3 metadata without an active v2 fallback", async t => {
  const candidateRoot = await candidateFixture(t);
  const actual = await createCandidateContentReleaseLock({ appRoot, contentRoot: candidateRoot });
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
  const candidateRoot = await candidateFixture(t);
  const actual = await createCandidateContentReleaseLock({ appRoot, contentRoot: candidateRoot });
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
      await assert.rejects(readCandidateContentProducerPin({ appRoot: fixture }), /bootstrap bundled (?:lock hash|training artifact) differs/);
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
