import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assertSnapshotCurrent, buildPublicDemoProjection, createPublicDemoCatalog } from "./exportPublicDemo.mjs";

const require = createRequire(import.meta.url);
const { loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(root, "../patternly-content");
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readContent = (path) => JSON.parse(readFileSync(resolve(contentRoot, path), "utf8"));
const hash = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const contentSelections = [
  {
    trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", nodeId: "complexity_and_constraints", questionId: "alg-complexity-time-005",
    sourcePath: "content/coding-interview-dsa-problem-solving/complexity_and_constraints/derive_time_complexity.json",
    modeIds: ["coding-interview-learn-approach", "coding-interview-guided-practice", "coding-interview-custom-practice"],
  },
  {
    trackId: "aws-certified-solutions-architect-associate", familyId: "certification", nodeId: "aws_secure_architecture_foundations", questionId: "aws-saa-c03-architecture-001-odk096",
    sourcePath: "content/aws-certified-solutions-architect-associate/aws_secure_architecture_foundations/architecture_review.json",
    modeIds: ["certification-focus-practice"],
  },
];

async function fixture(selection) {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(selection.trackId);
  const question = track.getQuestion(selection.questionId);
  const sourceQuestion = readContent(selection.sourcePath).find((entry) => entry.questionId === selection.questionId);
  const admission = read("../patternly-content/evidence/admissions/candidate-admission-v3.json");
  const candidateManifest = read(`../patternly-content/${admission.candidatePath}`);
  const sourceRelease = read(`../patternly-content/${admission.release.releasePath}`);
  const runtimeEvidence = read(`../patternly-content/${admission.runtimeEvidence.path}`);
  const releaseEntry = read("integration/contracts/content-release/release.lock.json").artifacts.find((entry) => entry.trackId === selection.trackId);
  return {
    selection, question, sourceQuestion, track,
    runtimeFamilyId: selection.familyId,
    generatedLock: read("src/content/generated/canonical-content/content-lock.json"),
    releaseLock: read("integration/contracts/content-release/release.lock.json"),
    admission, candidateManifest, sourceRelease, runtimeEvidence,
    admissionSha: hash(`../patternly-content/evidence/admissions/candidate-admission-v3.json`),
    releaseManifestSha: hash(`../patternly-content/${admission.release.releasePath}`),
    runtimeEvidenceSha: hash(`../patternly-content/${admission.runtimeEvidence.path}`),
    releaseLockSha: hash("integration/contracts/content-release/release.lock.json"),
    contentLockSha: admission.application.bundledContentLockSha256,
    producerCommit: releaseEntry.producerCommit,
  };
}

test("exports exactly Coding and AWS from current ordinary Free pools with source-bound authored feedback", async () => {
  const catalog = await createPublicDemoCatalog();
  assert.equal(catalog.schemaVersion, "patternly-canonical-demo-questions-v1");
  assert.deepEqual(catalog.demos.map((demo) => demo.provenance.questionId), ["alg-complexity-time-005", "aws-saa-c03-architecture-001-odk096"]);
  assert.deepEqual(catalog.demos.map((demo) => demo.provenance.trackId), contentSelections.map(({ trackId }) => trackId));
  assert.equal(catalog.demos.length, 2);
  for (const [index, selection] of contentSelections.entries()) {
    const demo = catalog.demos[index];
    const base = await fixture(selection);
    assert.equal(demo.question.questionId, selection.questionId);
    assert.equal(demo.provenance.nodeId, selection.nodeId);
    assert.deepEqual(demo.provenance.modeIds, selection.modeIds);
    assert.ok(demo.question.interaction.type === "choice_single");
    assert.deepEqual(demo.question, base.sourceQuestion, "The displayed projection retains exact raw canonical question parity.");
    assert.deepEqual(demo.detailsParagraphs, expectedDetailsByTrackId[selection.trackId]);
    assert.ok(demo.detailsParagraphs.length > 0);
    assert.ok(base.question.feedback.messages.every((message) => message.kind === "wrong_option" && message.targetId !== base.question.answer.optionId));
    for (const modeId of selection.modeIds) {
      const mode = base.track.getMode(modeId);
      assert.equal(mode.availability, "immediate");
      assert.equal(mode.selection.nodeId, selection.nodeId);
      assert.ok(base.track.getPool(modeId).some(({ questionId }) => questionId === selection.questionId));
    }
  }
  assert.deepEqual(catalog.demos[1].detailsParagraphs, [
    "Replicating stateless frontends does not remove a hard dependency; a single nonredundant dependency can determine the availability of the invoking workload.",
    "The finding is not primarily a cost or sustainability label. A database that can interrupt every replica is a reliability risk even when frontend capacity spans Availability Zones.",
    "AWS defines reliability as a workload performing its intended function consistently and notes that hard dependency interruptions directly translate into interruptions of the invoking system.",
    "The review records the database as a reliability risk and evaluates Multi-AZ, failover, backup, and recovery behavior for the data dependency rather than stopping at frontend redundancy.",
  ]);
});

const expectedDetailsByTrackId = {
  "coding-interview-dsa-problem-solving": [
    "Do not count the inner loop as n for every outer iteration unless it restarts. Instead, charge each iteration to a pointer advance. A left pointer can advance at most n positions and a right-moving pointer can also advance at most n positions, so there are at most 2n advances. If every loop iteration makes at least one such advance, there can be only O(n) iterations overall. This aggregate argument fails if an inner pointer resets and revisits the same elements for every outer iteration.",
  ],
  "aws-certified-solutions-architect-associate": [
    "Replicating stateless frontends does not remove a hard dependency; a single nonredundant dependency can determine the availability of the invoking workload.",
    "The finding is not primarily a cost or sustainability label. A database that can interrupt every replica is a reliability risk even when frontend capacity spans Availability Zones.",
    "AWS defines reliability as a workload performing its intended function consistently and notes that hard dependency interruptions directly translate into interruptions of the invoking system.",
    "The review records the database as a reliability risk and evaluates Multi-AZ, failover, backup, and recovery behavior for the data dependency rather than stopping at frontend redundancy.",
  ],
};

test("snapshot check accepts exact bytes and rejects missing or stale generated content", () => {
  assert.equal(assertSnapshotCurrent("expected", "expected"), undefined);
  assert.throws(() => assertSnapshotCurrent(undefined, "expected"), /snapshot is stale/u);
  assert.throws(() => assertSnapshotCurrent("stale", "expected"), /snapshot is stale/u);
});

test("rejects source, identity, current locks/admission/receipts, family, and resolved Free-pool mismatches for each demo", async () => {
  for (const selection of contentSelections) {
    const base = await fixture(selection);
    assert.equal(buildPublicDemoProjection(base).question.questionId, selection.questionId);
    assert.throws(() => buildPublicDemoProjection({ ...base, sourceQuestion: { ...base.sourceQuestion, prompt: `${base.sourceQuestion.prompt} changed` } }), /canonical source file/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, question: { ...base.question, questionId: "another-question" } }), /unexpected identity/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, runtimeFamilyId: "wrong-family" }), /unexpected content family/u);
    const changedLock = { ...base, generatedLock: structuredClone(base.generatedLock) };
    changedLock.generatedLock.tracks.find((entry) => entry.trackId === selection.trackId).sha256 = "0".repeat(64);
    assert.throws(() => buildPublicDemoProjection(changedLock), /app content lock/u);
    const changedAppVersion = { ...base, generatedLock: structuredClone(base.generatedLock) };
    changedAppVersion.generatedLock.tracks.find((entry) => entry.trackId === selection.trackId).contentVersion = "different-version";
    assert.throws(() => buildPublicDemoProjection(changedAppVersion), /app content lock/u);
    const changedReleaseVersion = { ...base, releaseLock: structuredClone(base.releaseLock) };
    changedReleaseVersion.releaseLock.artifacts.find((entry) => entry.trackId === selection.trackId).contentVersion = "different-version";
    assert.throws(() => buildPublicDemoProjection(changedReleaseVersion), /content release lock/u);
    const changedAdmission = { ...base, admission: structuredClone(base.admission) };
    changedAdmission.admission.tracks.find((entry) => entry.trackId === selection.trackId).runtimeAdmission = "denied";
    assert.throws(() => buildPublicDemoProjection(changedAdmission), /admission evidence/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, admissionSha: "" }), /runtime admission receipt/u);
    const changedCandidate = { ...base, candidateManifest: structuredClone(base.candidateManifest) };
    changedCandidate.candidateManifest.candidateId = "another-candidate";
    assert.throws(() => buildPublicDemoProjection(changedCandidate), /candidate and release receipts/u);
    const changedRuntimeEvidence = { ...base, runtimeEvidence: { ...base.runtimeEvidence, status: "failed" } };
    assert.throws(() => buildPublicDemoProjection(changedRuntimeEvidence), /runtime admission evidence/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, question: undefined }), /missing or has an unexpected identity/u);
    const outsidePool = { ...base, track: { ...base.track, getPool: () => [] } };
    assert.throws(() => buildPublicDemoProjection(outsidePool), /outside the existing ordinary Free node practice pools/u);
  }
});
