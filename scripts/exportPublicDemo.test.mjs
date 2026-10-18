import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assertAdmittedSampleMatchesCurrentRuntime, assertSnapshotCurrent, buildPublicDemoProjection, createPublicDemoCatalog, assertSelectedArtifactAdmitted, assertAdmissionCommitBindings, assertPreviewSampleManifest, previewSample, readAdmittedCommitText } from "./exportPublicDemo.mjs";

const require = createRequire(import.meta.url);
const { buildCanonicalRuntimeCatalog, loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const { contentPackageRuntimeOwner } = require("../src/application/contentPackageRuntimeOwner.ts");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? resolve(root, "../patternly-content"));
const readAppJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readContentJson = (path) => JSON.parse(readFileSync(resolve(contentRoot, path), "utf8"));
const hashBytes = (value) => createHash("sha256").update(value).digest("hex");
const HISTORICAL_APP_COMMIT = "e889b05d033d4cc4b7676d0ca3f224efc3fac115";
const HISTORICAL_CONTENT_COMMIT = "8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03";
const HISTORICAL_CANDIDATE_ID = "946d3589abf9bfb205b382e7ebb9205786c3e42e18fe733c3607ad836a6a80a4";
const HISTORICAL_TRACK_IDS = [
  "aws-certified-solutions-architect-associate",
  "backend-system-design-interview",
  "claude-certified-architect-professional-certification",
  "coding-interview-dsa-problem-solving",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "object-oriented-design-interview",
];
const historicalText = (repository, commit, path) => execFileSync(
  "git",
  ["-C", repository, "show", `${commit}:${path}`],
  { encoding: "utf8", maxBuffer: 80 * 1024 * 1024 },
);
const historicalJson = (repository, commit, path) => JSON.parse(historicalText(repository, commit, path));
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

let historicalCatalogPromise;
async function historicalCatalog() {
  if (!historicalCatalogPromise) {
    const artifacts = HISTORICAL_TRACK_IDS.map((trackId) => historicalJson(
      root,
      HISTORICAL_APP_COMMIT,
      `src/content/generated/canonical-content/${trackId}.json`,
    ));
    const generatedLock = historicalJson(root, HISTORICAL_APP_COMMIT, "src/content/generated/canonical-content/content-lock.json");
    historicalCatalogPromise = buildCanonicalRuntimeCatalog({ artifacts, locks: generatedLock.tracks });
  }
  return historicalCatalogPromise;
}

async function historicalFixture(selection) {
  const catalog = await historicalCatalog();
  const track = catalog.getTrack(selection.trackId);
  const question = track.getQuestion(selection.questionId);
  const sourceQuestionFile = historicalJson(contentRoot, HISTORICAL_CONTENT_COMMIT, selection.sourcePath);
  const sourceQuestion = sourceQuestionFile.find((entry) => entry.questionId === selection.questionId);
  const admissionBytes = historicalText(contentRoot, HISTORICAL_CONTENT_COMMIT, "evidence/admissions/candidate-admission-v3.json");
  const admission = JSON.parse(admissionBytes);
  const candidateManifestBytes = historicalText(contentRoot, HISTORICAL_CONTENT_COMMIT, admission.candidatePath);
  const candidateManifest = JSON.parse(candidateManifestBytes);
  const releaseManifestBytes = historicalText(contentRoot, HISTORICAL_CONTENT_COMMIT, admission.release.releasePath);
  const sourceRelease = JSON.parse(releaseManifestBytes);
  const runtimeEvidenceBytes = historicalText(contentRoot, HISTORICAL_CONTENT_COMMIT, admission.runtimeEvidence.path);
  const runtimeEvidence = JSON.parse(runtimeEvidenceBytes);
  const contentLockBytes = historicalText(root, HISTORICAL_APP_COMMIT, "src/content/generated/canonical-content/content-lock.json");
  const generatedLock = JSON.parse(contentLockBytes);
  const releaseLockBytes = historicalText(root, HISTORICAL_APP_COMMIT, "integration/contracts/content-release/release.lock.json");
  const releaseLock = JSON.parse(releaseLockBytes);
  const releaseEntry = releaseLock.artifacts.find((entry) => entry.trackId === selection.trackId);
  assert.equal(admission.candidateId, HISTORICAL_CANDIDATE_ID);
  assert.equal(candidateManifest.candidateId, HISTORICAL_CANDIDATE_ID);
  assert.equal(releaseLock.candidateId, HISTORICAL_CANDIDATE_ID);
  return {
    selection, question, sourceQuestion, track,
    runtimeFamilyId: selection.familyId,
    generatedLock,
    releaseLock,
    admission, candidateManifest, sourceRelease, runtimeEvidence,
    admissionSha: hashBytes(admissionBytes),
    releaseManifestSha: hashBytes(releaseManifestBytes),
    runtimeEvidenceSha: hashBytes(runtimeEvidenceBytes),
    releaseLockSha: hashBytes(releaseLockBytes),
    contentLockSha: hashBytes(contentLockBytes),
    producerCommit: releaseEntry.producerCommit,
  };
}

test("current receipt admits exactly three public samples and only two interactive payloads", async () => {
  const catalog = await createPublicDemoCatalog();
  const bases = await Promise.all(contentSelections.map(historicalFixture));
  const demos = catalog.demos;
  assert.equal(catalog.schemaVersion, "patternly-canonical-demo-questions-v1");
  assert.deepEqual(demos.map((demo) => demo.provenance.questionId), ["alg-complexity-time-005", "aws-saa-c03-architecture-001-odk096"]);
  assert.deepEqual(demos.map((demo) => demo.provenance.trackId), contentSelections.map(({ trackId }) => trackId));
  assert.equal(demos.length, 2);
  assert.deepEqual(catalog.publicSamples.map((sample) => sample.questionId), [...contentSelections.map((selection) => selection.questionId), previewSample.questionId]);
  assert.equal(catalog.publicSamples[2].presentation, "image");
  assert.ok(catalog.publicSamples.every((sample) => !Object.hasOwn(sample, "question")));
  assert.ok(!JSON.stringify(catalog).includes("What does an amortized O(1) operation guarantee?"), "The screenshot question payload is never emitted.");
  for (const [index, selection] of contentSelections.entries()) {
    const demo = demos[index];
    const base = bases[index];
    assert.equal(demo.provenance.candidateId, readContentJson("evidence/admissions/candidate-admission-v3.json").candidateId);
    assert.equal(demo.question.questionId, selection.questionId);
    assert.equal(demo.provenance.nodeId, selection.nodeId);
    assert.deepEqual(demo.provenance.modeIds, selection.modeIds);
    assert.ok(demo.question.interaction.type === "choice_single");
    assert.deepEqual(demo.question, base.sourceQuestion, "The displayed projection retains exact raw historical source parity.");
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
  assert.deepEqual(demos[1].detailsParagraphs, [
    "Replicating stateless frontends does not remove a hard dependency; a single nonredundant dependency can determine the availability of the invoking workload.",
    "The finding is not primarily a cost or sustainability label. A database that can interrupt every replica is a reliability risk even when frontend capacity spans Availability Zones.",
    "AWS defines reliability as a workload performing its intended function consistently and notes that hard dependency interruptions directly translate into interruptions of the invoking system.",
    "The review records the database as a reliability risk and evaluates Multi-AZ, failover, backup, and recovery behavior for the data dependency rather than stopping at frontend redundancy.",
  ]);
});

test("local admitted-source parity requires the same exact sample and current Free pool", async () => {
  const selection = contentSelections[0];
  const base = await historicalFixture(selection);
  const { runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(selection.trackId, selection.familyId);
  const currentTrack = (await loadCanonicalRuntimeCatalog()).getTrack(selection.trackId);
  const valid = { selection, admittedQuestion: base.question, currentTrack, currentFamilyId: runtime.familyId };
  assert.equal(assertAdmittedSampleMatchesCurrentRuntime(valid), undefined);
  assert.throws(() => assertAdmittedSampleMatchesCurrentRuntime({ ...valid, currentFamilyId: "certification" }), /canonical track family/u);
  assert.throws(() => assertAdmittedSampleMatchesCurrentRuntime({ ...valid, admittedQuestion: { ...base.question, prompt: `${base.question.prompt} changed` } }), /differs from the current canonical training question/u);
  const outsidePool = { ...currentTrack, getPool: () => [] };
  assert.throws(() => assertAdmittedSampleMatchesCurrentRuntime({ ...valid, currentTrack: outsidePool }), /outside the current ordinary Free practice pool/u);
});

test("scoped admission keeps the unrelated local-only Claude artifact outside public permission", async () => {
  const admission = readContentJson("evidence/admissions/candidate-admission-v3.json");
  const currentLock = readAppJson("src/content/generated/canonical-content/content-lock.json");
  const admittedLock = historicalJson(root, admission.application.frontendCommit, "src/content/generated/canonical-content/content-lock.json");
  assert.notEqual(hashBytes(readFileSync(resolve(root, "src/content/generated/canonical-content/content-lock.json"))), admission.application.bundledContentLockSha256);
  const selection = { trackId: "claude-certified-architect-professional-certification" };
  const path = `src/content/generated/canonical-content/${selection.trackId}.json`;
  assert.throws(() => assertSelectedArtifactAdmitted({ selection, currentBytes: readFileSync(resolve(root, path)), admittedBytes: Buffer.from(historicalText(root, admission.application.frontendCommit, path)), currentLock, admittedLock }), /selected artifact differs/u);
  const catalog = await createPublicDemoCatalog();
  assert.ok(catalog.publicSamples.every((sample) => sample.trackId !== selection.trackId));
});

test("selected full artifact bytes and per-track lock must both match admission", () => {
  const admission = readContentJson("evidence/admissions/candidate-admission-v3.json");
  const currentLock = readAppJson("src/content/generated/canonical-content/content-lock.json");
  const admittedLock = historicalJson(root, admission.application.frontendCommit, "src/content/generated/canonical-content/content-lock.json");
  for (const selection of [...contentSelections, previewSample]) {
    const path = `src/content/generated/canonical-content/${selection.trackId}.json`;
    const valid = { selection, currentBytes: readFileSync(resolve(root, path)), admittedBytes: Buffer.from(historicalText(root, admission.application.frontendCommit, path)), currentLock, admittedLock };
    assert.equal(assertSelectedArtifactAdmitted(valid), undefined);
    assert.throws(() => assertSelectedArtifactAdmitted({ ...valid, currentBytes: Buffer.concat([valid.currentBytes, Buffer.from("\n")]) }), /selected artifact differs/u);
    const staleLock = structuredClone(currentLock);
    staleLock.tracks.find((entry) => entry.trackId === selection.trackId).contentVersion = "stale";
    assert.throws(() => assertSelectedArtifactAdmitted({ ...valid, currentLock: staleLock }), /selected artifact differs/u);
  }
});

test("receipt commit locks and admission-time runtime test are exact and fail closed", () => {
  const admission = readContentJson("evidence/admissions/candidate-admission-v3.json");
  const runtimeEvidence = readContentJson(admission.runtimeEvidence.path);
  const bytes = (path) => Buffer.from(historicalText(root, admission.application.frontendCommit, path));
  const valid = { admission, runtimeEvidence, generatedLockBytes: bytes("src/content/generated/canonical-content/content-lock.json"), releaseLockBytes: bytes("integration/contracts/content-release/release.lock.json"), runtimeTestBytes: bytes("src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts") };
  assert.equal(assertAdmissionCommitBindings(valid), undefined);
  for (const field of ["generatedLockBytes", "releaseLockBytes", "runtimeTestBytes"]) assert.throws(() => assertAdmissionCommitBindings({ ...valid, [field]: Buffer.from("changed") }), /commit files differ/u);
  assert.throws(() => readAdmittedCommitText(root, "0".repeat(40), "missing.json", "missing evidence"), /missing or unreadable/u);
});

test("all preview assets and the third sample identity are pinned, without adding sample payloads", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "../patternly-web/scripts/app-preview-manifest.json")));
  assert.equal(assertPreviewSampleManifest(manifest).questionId, previewSample.questionId);
  for (const mutate of [
    (m) => { m.images[0].sha256 = "0".repeat(64); },
    (m) => { m.images.find((image) => image.questionId).questionId = "another-sample"; },
    (m) => { m.images.push({ path: "public/app-preview/extra.png" }); },
  ]) {
    const changed = structuredClone(manifest); mutate(changed);
    assert.throws(() => assertPreviewSampleManifest(changed), /Public preview/u);
  }
  assert.throws(() => assertPreviewSampleManifest(manifest, () => Buffer.from("changed")), /reviewed hash/u);
});

/* Historical 946d proof above intentionally reads the immutable commits that own
   its app lock, generated lock, candidate, admission, source release and receipt. */
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
  for (const selection of [...contentSelections, previewSample]) {
    const base = await historicalFixture(selection);
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
    const deniedPublishing = structuredClone(base.admission);
    deniedPublishing.tracks.find((entry) => entry.trackId === selection.trackId).publishingAdmission = "denied";
    assert.throws(() => buildPublicDemoProjection({ ...base, admission: deniedPublishing }), /admission evidence/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, releaseManifestSha: "0".repeat(64) }), /candidate and release receipts/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, runtimeEvidenceSha: "0".repeat(64) }), /runtime admission evidence/u);
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
