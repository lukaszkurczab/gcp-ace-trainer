import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildPublicDemoProjection, createPublicDemoProjection } from "./exportPublicDemo.mjs";

const require = createRequire(import.meta.url);
const { loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const hash = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");

test("exports one admitted current-Free-pool Coding question and exact authored feedback", async () => {
  const projection = await createPublicDemoProjection();
  assert.equal(projection.schemaVersion, "patternly-canonical-demo-question-v1");
  assert.equal(projection.question.questionId, "alg-complexity-time-005");
  assert.equal(projection.question.answer.optionId, "bounded_total_moves");
  assert.deepEqual(projection.question.feedback.messages.map(({ targetId }) => targetId), ["constant_body", "nested_never_matters", "pointer_names"]);
  assert.equal(projection.provenance.contentVersion, "coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04");
  assert.equal(Object.hasOwn(projection, "questions"), false);
});

test("rejects source, identity, lock, admission, and resolved-pool mismatches", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const question = track.getQuestion("alg-complexity-time-005");
  const sourceFile = read("../patternly-content/content/coding-interview-dsa-problem-solving/complexity_and_constraints/derive_time_complexity.json");
  const sourceQuestion = sourceFile.find((entry) => entry.questionId === question.questionId);
  const base = {
    question, sourceQuestion, track,
    generatedLock: read("src/content/generated/canonical-content/content-lock.json"),
    releaseLock: read("integration/contracts/content-release/release.lock.json"),
    admission: read("../patternly-content/evidence/admissions/candidate-admission-v3.json"),
    candidateManifest: read("../patternly-content/reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json"),
    sourceRelease: read("../patternly-content/reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json"),
    runtimeEvidence: read("../patternly-content/evidence/admissions/runtime/e7fbd82b4afab18994e406175feb442842ccf06b41be3efec0ae92cf2d394fbe-61225d14e3930361dfcde3945057c88c2204b08e.json"),
    admissionSha: hash("../patternly-content/evidence/admissions/candidate-admission-v3.json"),
    releaseManifestSha: hash("../patternly-content/reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json"),
    runtimeEvidenceSha: hash("../patternly-content/evidence/admissions/runtime/e7fbd82b4afab18994e406175feb442842ccf06b41be3efec0ae92cf2d394fbe-61225d14e3930361dfcde3945057c88c2204b08e.json"),
    releaseLockSha: "release-lock-sha", contentLockSha: "content-lock-sha",
    producerCommit: "0a4b8cbcf51b40f0c33b6c699606e2c85998705a",
  };
  // The independent receipt binds these raw lock hashes; use its actual values for the valid case.
  base.contentLockSha = base.admission.application.bundledContentLockSha256;
  base.releaseLockSha = base.admission.application.releaseLockSha256;
  assert.equal(buildPublicDemoProjection(base).question.questionId, question.questionId);
  const changedSource = { ...base, sourceQuestion: { ...sourceQuestion, prompt: `${sourceQuestion.prompt} changed` } };
  assert.throws(() => buildPublicDemoProjection(changedSource), /canonical source file/u);
  const changedIdentity = { ...base, question: { ...question, questionId: "another-question" } };
  assert.throws(() => buildPublicDemoProjection(changedIdentity), /unexpected identity/u);
  const changedLock = { ...base, generatedLock: structuredClone(base.generatedLock) }; changedLock.generatedLock.tracks.find((entry) => entry.trackId === track.trackId).sha256 = "0".repeat(64);
  assert.throws(() => buildPublicDemoProjection(changedLock), /app content lock/u);
  const changedAppVersion = { ...base, generatedLock: structuredClone(base.generatedLock) }; changedAppVersion.generatedLock.tracks.find((entry) => entry.trackId === track.trackId).contentVersion = "different-version";
  assert.throws(() => buildPublicDemoProjection(changedAppVersion), /app content lock/u);
  const changedReleaseVersion = { ...base, releaseLock: structuredClone(base.releaseLock) }; changedReleaseVersion.releaseLock.artifacts.find((entry) => entry.trackId === track.trackId).contentVersion = "different-version";
  assert.throws(() => buildPublicDemoProjection(changedReleaseVersion), /content release lock/u);
  const changedAdmission = { ...base, admission: structuredClone(base.admission) }; changedAdmission.admission.tracks.find((entry) => entry.trackId === track.trackId).runtimeAdmission = "denied";
  assert.throws(() => buildPublicDemoProjection(changedAdmission), /admission evidence/u);
  const changedCandidate = { ...base, candidateManifest: structuredClone(base.candidateManifest) }; changedCandidate.candidateManifest.candidateId = "another-candidate";
  assert.throws(() => buildPublicDemoProjection(changedCandidate), /candidate and release receipts/u);
  const changedRuntimeEvidence = { ...base, runtimeEvidence: { ...base.runtimeEvidence, status: "failed" } };
  assert.throws(() => buildPublicDemoProjection(changedRuntimeEvidence), /runtime admission evidence/u);
  const outsidePool = { ...base, track: { ...track, getPool: () => [] } };
  assert.throws(() => buildPublicDemoProjection(outsidePool), /outside the existing ordinary Free/u);
  assert.throws(() => buildPublicDemoProjection({ ...base, question: undefined }), /missing or has an unexpected identity/u);
});
