import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assertAdmittedSampleMatchesCurrentRuntime, assertSnapshotCurrent, buildPublicDemoProjection, createPublicDemoCatalog, assertSelectedArtifactAdmitted, assertPreviewSampleManifest, previewSample } from "./exportPublicDemo.mjs";

const require = createRequire(import.meta.url);
const { loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const { contentPackageRuntimeOwner } = require("../src/application/contentPackageRuntimeOwner.ts");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? resolve(root, "../patternly-content"));
const readAppJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readContentJson = (path) => JSON.parse(readFileSync(resolve(contentRoot, path), "utf8"));
const hashBytes = (value) => createHash("sha256").update(value).digest("hex");
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

async function currentFixture(selection) {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(selection.trackId);
  const question = track.getQuestion(selection.questionId);
  const sourceQuestionFile = readContentJson(selection.sourcePath);
  const sourceQuestion = sourceQuestionFile.find((entry) => entry.questionId === selection.questionId);
  const contentLockBytes = readFileSync(resolve(root, "src/content/generated/canonical-content/content-lock.json"));
  const generatedLock = JSON.parse(contentLockBytes.toString("utf8"));
  const releaseLockBytes = readFileSync(resolve(root, "integration/contracts/content-release/release.lock.json"));
  const releaseLock = JSON.parse(releaseLockBytes.toString("utf8"));
  const releaseEntry = releaseLock.artifacts.find((entry) => entry.trackId === selection.trackId);
  const currentIdentity = releaseLock.currentIdentity;
  return {
    selection, question, sourceQuestion, track,
    runtimeFamilyId: selection.familyId,
    generatedLock,
    releaseLock,
    currentIdentity,
    releaseLockSha: hashBytes(releaseLockBytes),
    contentLockSha: hashBytes(contentLockBytes),
  };
}

test("current source permits exactly three public samples and only two interactive payloads", async () => {
  const catalog = await createPublicDemoCatalog();
  const bases = await Promise.all(contentSelections.map(currentFixture));
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
    assert.equal(demo.provenance.sourceInputFingerprint, bases[index].currentIdentity.sourceInputFingerprint);
    assert.equal(demo.question.questionId, selection.questionId);
    assert.equal(demo.provenance.nodeId, selection.nodeId);
    assert.deepEqual(demo.provenance.modeIds, selection.modeIds);
    assert.ok(demo.question.interaction.type === "choice_single");
    assert.deepEqual(demo.question, base.sourceQuestion, "The displayed projection retains exact raw current source parity.");
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

test("active-source parity requires the same exact sample and current Free pool", async () => {
  const selection = contentSelections[0];
  const base = await currentFixture(selection);
  const { runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(selection.trackId, selection.familyId);
  const currentTrack = (await loadCanonicalRuntimeCatalog()).getTrack(selection.trackId);
  const valid = { selection, admittedQuestion: base.question, currentTrack, currentFamilyId: runtime.familyId };
  assert.equal(assertAdmittedSampleMatchesCurrentRuntime(valid), undefined);
  assert.throws(() => assertAdmittedSampleMatchesCurrentRuntime({ ...valid, currentFamilyId: "certification" }), /canonical track family/u);
  assert.throws(() => assertAdmittedSampleMatchesCurrentRuntime({ ...valid, admittedQuestion: { ...base.question, prompt: `${base.question.prompt} changed` } }), /differs from the current canonical training question/u);
  const outsidePool = { ...currentTrack, getPool: () => [] };
  assert.throws(() => assertAdmittedSampleMatchesCurrentRuntime({ ...valid, currentTrack: outsidePool }), /outside the current ordinary Free practice pool/u);
});

test("public demo keeps the existing three selected samples and verifies exact current artifact bytes", async () => {
  const currentLock = readAppJson("src/content/generated/canonical-content/content-lock.json");
  const releaseLock = readAppJson("integration/contracts/content-release/release.lock.json");
  const selection = { trackId: "claude-certified-architect-professional-certification" };
  const path = `src/content/generated/canonical-content/${selection.trackId}.json`;
  const currentBytes = readFileSync(resolve(root, path));
  assert.equal(assertSelectedArtifactAdmitted({ selection, currentBytes, currentLock, releaseLock }), undefined);
  assert.throws(() => assertSelectedArtifactAdmitted({ selection, currentBytes: Buffer.concat([currentBytes, Buffer.from(" ")]), currentLock, releaseLock }), /differs from the active app lock/u);
  const catalog = await createPublicDemoCatalog();
  assert.ok(catalog.publicSamples.every((sample) => sample.trackId !== selection.trackId));
});

test("selected full artifact bytes and per-track lock must both match the current bank", () => {
  const currentLock = readAppJson("src/content/generated/canonical-content/content-lock.json");
  const releaseLock = readAppJson("integration/contracts/content-release/release.lock.json");
  for (const selection of [...contentSelections, previewSample]) {
    const path = `src/content/generated/canonical-content/${selection.trackId}.json`;
    const valid = { selection, currentBytes: readFileSync(resolve(root, path)), currentLock, releaseLock };
    assert.equal(assertSelectedArtifactAdmitted(valid), undefined);
    assert.throws(() => assertSelectedArtifactAdmitted({ ...valid, currentBytes: Buffer.concat([valid.currentBytes, Buffer.from("\n")]) }), /differs/u);
    const staleLock = structuredClone(currentLock);
    staleLock.tracks.find((entry) => entry.trackId === selection.trackId).contentVersion = "stale";
    assert.throws(() => assertSelectedArtifactAdmitted({ ...valid, currentLock: staleLock }), /current release metadata/u);
  }
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

/* Public projections bind the selected source item to the current APP bank. */
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

test("rejects source, identity, current locks, family, and resolved Free-pool mismatches for each demo", async () => {
  for (const selection of [...contentSelections, previewSample]) {
    const base = await currentFixture(selection);
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
    const changedIdentity = { ...base, currentIdentity: structuredClone(base.currentIdentity) };
    changedIdentity.currentIdentity.tracks.find((entry) => entry.trackId === selection.trackId).artifactSha256 = "0".repeat(64);
    assert.throws(() => buildPublicDemoProjection(changedIdentity), /current canonical source identity/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, currentIdentity: { ...base.currentIdentity, schemaVersion: "unsupported" } }), /current canonical source identity/u);
    assert.throws(() => buildPublicDemoProjection({ ...base, question: undefined }), /missing or has an unexpected identity/u);
    const outsidePool = { ...base, track: { ...base.track, getPool: () => [] } };
    assert.throws(() => buildPublicDemoProjection(outsidePool), /outside the existing ordinary Free node practice pools/u);
  }
});
