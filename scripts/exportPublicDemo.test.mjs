import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import test from "node:test";
import { assertSnapshotCurrent, buildPublicDemoProjection, createPublicDemoCatalog } from "./exportPublicDemo.mjs";

const require = createRequire(import.meta.url);
const { buildCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(root, "../patternly-content");
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
  { encoding: "utf8", maxBuffer: 40 * 1024 * 1024 },
);
const historicalJson = (repository, commit, path) => JSON.parse(historicalText(repository, commit, path));
async function writeHistoricalFile(targetRoot, repository, commit, relativePath) {
  const rootPath = resolve(targetRoot);
  const targetPath = resolve(rootPath, relativePath);
  assert.ok(targetPath.startsWith(`${rootPath}${sep}`), "historical fixture path must stay inside its temporary root");
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, historicalText(repository, commit, relativePath));
}
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

async function createHistoricalProductionFixture(t) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "patternly-public-demo-946d-"));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  const appFixture = join(fixtureRoot, "patternly");
  const contentFixture = join(fixtureRoot, "patternly-content");
  await mkdir(appFixture, { recursive: true });
  await mkdir(contentFixture, { recursive: true });
  await cp(join(root, "src"), join(appFixture, "src"), { recursive: true });
  await mkdir(join(appFixture, "scripts"), { recursive: true });
  await cp(join(root, "scripts/exportPublicDemo.mjs"), join(appFixture, "scripts/exportPublicDemo.mjs"));
  await symlink(join(root, "node_modules"), join(appFixture, "node_modules"), "dir");

  const canonicalRoot = "src/content/generated/canonical-content";
  for (const trackId of HISTORICAL_TRACK_IDS) {
    await writeHistoricalFile(appFixture, root, HISTORICAL_APP_COMMIT, `${canonicalRoot}/${trackId}.json`);
  }
  await writeHistoricalFile(appFixture, root, HISTORICAL_APP_COMMIT, `${canonicalRoot}/content-lock.json`);
  await writeHistoricalFile(appFixture, root, HISTORICAL_APP_COMMIT, "integration/contracts/content-release/release.lock.json");

  const admissionPath = "evidence/admissions/candidate-admission-v3.json";
  const admissionBytes = historicalText(contentRoot, HISTORICAL_CONTENT_COMMIT, admissionPath);
  const admission = JSON.parse(admissionBytes);
  await writeHistoricalFile(contentFixture, contentRoot, HISTORICAL_CONTENT_COMMIT, admissionPath);
  for (const relativePath of [admission.candidatePath, admission.release.releasePath, admission.runtimeEvidence.path, ...contentSelections.map(({ sourcePath }) => sourcePath)]) {
    await writeHistoricalFile(contentFixture, contentRoot, HISTORICAL_CONTENT_COMMIT, relativePath);
  }

  const exporterPath = join(appFixture, "scripts/exportPublicDemo.mjs");
  const exporter = await import(pathToFileURL(exporterPath).href);
  return { catalog: await exporter.createPublicDemoCatalog() };
}

test("production catalog exports Coding and AWS from the exact historically admitted 946d ordinary Free pools", async (t) => {
  const { catalog } = await createHistoricalProductionFixture(t);
  const bases = await Promise.all(contentSelections.map(historicalFixture));
  const demos = catalog.demos;
  assert.equal(catalog.schemaVersion, "patternly-canonical-demo-questions-v1");
  assert.deepEqual(demos.map((demo) => demo.provenance.questionId), ["alg-complexity-time-005", "aws-saa-c03-architecture-001-odk096"]);
  assert.deepEqual(demos.map((demo) => demo.provenance.trackId), contentSelections.map(({ trackId }) => trackId));
  assert.equal(demos.length, 2);
  for (const [index, selection] of contentSelections.entries()) {
    const demo = demos[index];
    const base = bases[index];
    assert.equal(demo.provenance.candidateId, HISTORICAL_CANDIDATE_ID);
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

test("current draft without matching admission is rejected by the production public-demo path", async () => {
  const releaseLock = readAppJson("integration/contracts/content-release/release.lock.json");
  const admission = readContentJson("evidence/admissions/candidate-admission-v3.json");
  const candidateManifest = readContentJson(admission.candidatePath);
  assert.equal(releaseLock.candidateId, candidateManifest.candidateId);
  assert.equal(candidateManifest.status, "draft_not_admitted");
  assert.notEqual(candidateManifest.candidateId, admission.candidateId);
  await assert.rejects(createPublicDemoCatalog(), /existing app admission evidence/u);
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
  for (const selection of contentSelections) {
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
