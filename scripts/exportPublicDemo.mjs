import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import "tsx/cjs";

const require = createRequire(import.meta.url);
const { contentPackageRuntimeOwner } = require("../src/application/contentPackageRuntimeOwner.ts");
const { loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const { validateQuestion } = require("../src/content/canonical/questionValidation.ts");
const { projectCanonicalSourceLinks } = require("../src/application/canonical/canonicalSourceLinks.ts");
const { detailLines } = require("../src/features/practice/feedbackDetails.ts");
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? resolve(appRoot, "../patternly-content"));
const webOutput = resolve(appRoot, "../patternly-web/src/generated/demoQuestions.json");
const contentLockPath = resolve(appRoot, "src/content/generated/canonical-content/content-lock.json");
const releaseLockPath = resolve(appRoot, "integration/contracts/content-release/release.lock.json");
const admissionPath = resolve(contentRoot, "evidence/admissions/candidate-admission-v3.json");
export const demos = Object.freeze([
  Object.freeze({
    trackId: "coding-interview-dsa-problem-solving",
    familyId: "coding_interview",
    nodeId: "complexity_and_constraints",
    questionId: "alg-complexity-time-005",
    sourcePath: "content/coding-interview-dsa-problem-solving/complexity_and_constraints/derive_time_complexity.json",
    modeIds: ["coding-interview-learn-approach", "coding-interview-guided-practice", "coding-interview-custom-practice"],
  }),
  Object.freeze({
    trackId: "aws-certified-solutions-architect-associate",
    familyId: "certification",
    nodeId: "aws_secure_architecture_foundations",
    questionId: "aws-saa-c03-architecture-001-odk096",
    sourcePath: "content/aws-certified-solutions-architect-associate/aws_secure_architecture_foundations/architecture_review.json",
    modeIds: ["certification-focus-practice"],
  }),
]);
export const previewSample = Object.freeze({
  trackId: "coding-interview-dsa-problem-solving",
  familyId: "coding_interview",
  nodeId: "complexity_and_constraints",
  questionId: "alg-complexity-amortized-001",
  sourcePath: "content/coding-interview-dsa-problem-solving/complexity_and_constraints/amortized_complexity.json",
  modeIds: ["coding-interview-custom-practice"],
});
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (path, label) => {
  if (!existsSync(path)) throw new Error(`Public demo export unavailable: ${label} is missing.`);
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { throw new Error(`Public demo export unavailable: ${label} is malformed.`); }
};
const readBytes = (path, label) => {
  try { return readFileSync(path); }
  catch { throw new Error(`Public demo export unavailable: ${label} is missing or unreadable.`); }
};
const sameJson = (left, right) => JSON.stringify(sortJson(left)) === JSON.stringify(sortJson(right));
function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJson(value[key])]));
  return value;
}

function assertSafeGitPath(path, label) {
  if (typeof path !== "string" || path.length === 0 || path.startsWith("/") || path.includes("\\") || path.includes(":") || path.split("/").some((part) => part === "" || part === "." || part === ".." || part.startsWith("-"))) {
    throw new Error(`Public demo admitted source unavailable: ${label} path is invalid.`);
  }
}

export function readAdmittedCommitText(repository, commit, repositoryPath, label) {
  assertSafeGitPath(repositoryPath, label);
  try {
    return execFileSync("git", ["-C", repository, "show", `${commit}:${repositoryPath}`], {
      encoding: "utf8",
      maxBuffer: 80 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(`Public demo admitted source unavailable: pinned ${label} is missing or unreadable.`);
  }
}

export function assertAdmittedSampleMatchesCurrentRuntime({ selection, admittedQuestion, currentTrack, currentFamilyId }) {
  if (currentFamilyId !== selection.familyId || currentTrack.trackId !== selection.trackId) {
    throw new Error("Public demo admitted source does not match the current canonical track family.");
  }
  const currentQuestion = currentTrack.getQuestion(selection.questionId);
  if (!currentQuestion || !sameJson(admittedQuestion, currentQuestion)) {
    throw new Error("Public demo admitted source question differs from the current canonical training question.");
  }
  for (const modeId of selection.modeIds) {
    const mode = currentTrack.getMode(modeId);
    if (mode.availability !== "immediate" || mode.selection.kind !== "node" || mode.selection.nodeId !== selection.nodeId || !currentTrack.getPool(modeId).some((question) => question.questionId === selection.questionId)) {
      throw new Error("Public demo admitted source question is outside the current ordinary Free practice pool.");
    }
  }
}

export function buildPublicDemoProjection({ selection, question, sourceQuestion, track, runtimeFamilyId, generatedLock, releaseLock, admission, candidateManifest, sourceRelease, runtimeEvidence, admissionSha, releaseManifestSha, runtimeEvidenceSha, releaseLockSha, contentLockSha, producerCommit }) {
  const { trackId, familyId, nodeId, questionId, sourcePath, modeIds } = selection;
  const trackLock = generatedLock.tracks?.find((entry) => entry.trackId === trackId);
  const releaseEntry = releaseLock.artifacts?.find((entry) => entry.trackId === trackId);
  const admissionTrack = admission.tracks?.find((entry) => entry.trackId === trackId);
  if (!track || track.trackId !== trackId || !question || question.questionId !== questionId) throw new Error("Public demo source item is missing or has an unexpected identity.");
  if (runtimeFamilyId !== familyId) throw new Error("Public demo source item resolved to an unexpected content family.");
  const issues = validateQuestion(question);
  if (issues.length) throw new Error(`Public demo source item is invalid (${issues.join(", ")}).`);
  if (!sameJson(question, sourceQuestion)) throw new Error("Public demo source item does not match the canonical source file.");
  if (!trackLock || trackLock.sha256 !== track.artifactSha256 || trackLock.contentVersion !== track.contentVersion) throw new Error("Public demo artifact does not match the current app content lock.");
  if (!releaseEntry || releaseEntry.checksumSha256 !== track.artifactSha256 || releaseEntry.contentVersion !== track.contentVersion) throw new Error("Public demo artifact does not match the current content release lock.");
  if (admission.publishingAdmission !== "granted" || admissionTrack?.publishingAdmission !== "granted" || admission.schemaVersion !== "patternly-candidate-admission-v3" || admission.release?.boundary !== "local_verified_artifacts_no_deployment" || admission.application?.bundledContentLockSha256 !== contentLockSha || admission.application?.releaseLockSha256 !== releaseLockSha || !admissionTrack || admissionTrack.runtimeAdmission !== "granted" || admissionTrack.artifactSha256 !== track.artifactSha256) throw new Error("Public demo source is outside the existing app admission evidence.");
  if (candidateManifest?.candidateId !== admission.candidateId || candidateManifest?.release?.releaseId !== admission.release?.releaseId || sourceRelease?.manifest?.releaseId !== admission.release?.releaseId || sourceRelease?.artifacts?.find((entry) => entry.trackId === trackId)?.checksumSha256 !== track.artifactSha256 || !releaseManifestSha || releaseManifestSha !== admission.release?.checksumSha256) throw new Error("Public demo source does not match the existing candidate and release receipts.");
  if (runtimeEvidence?.schemaVersion !== "patternly-runtime-admission-evidence-v3" || runtimeEvidence.status !== "passed" || runtimeEvidence.candidateId !== admission.candidateId || runtimeEvidence.frontendCommit !== admission.application?.frontendCommit || runtimeEvidence.bundledContentLock?.sha256 !== contentLockSha || runtimeEvidence.applicationReleaseLock?.sha256 !== releaseLockSha || !runtimeEvidenceSha || runtimeEvidenceSha !== admission.runtimeEvidence?.sha256) throw new Error("Public demo source has no matching existing app runtime admission evidence.");
  if (admission.runtimeAdmission !== "granted" || !admissionSha) throw new Error("Public demo source has no matching existing runtime admission receipt.");
  if (admission.release?.releaseId !== releaseEntry.releaseId || releaseEntry.producerCommit !== producerCommit || releaseEntry.producerCommit !== releaseEntry.sourceRepositoryCommit) throw new Error("Public demo producer does not match the locked current release.");
  for (const modeId of modeIds) {
    const mode = track.modes.find((entry) => entry.modeId === modeId);
    if (!mode || mode.availability !== "immediate" || mode.selection.kind !== "node" || mode.selection.nodeId !== nodeId || !track.getPool(modeId).some((entry) => entry.questionId === questionId)) throw new Error("Public demo item is outside the existing ordinary Free node practice pools.");
  }
  if (question.interaction.type !== "choice_single" || question.feedback.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Public demo item is not a canonical single-choice question.");
  const sourceUrls = new Set(projectCanonicalSourceLinks(question).map((source) => source.url));
  const detailsParagraphs = detailLines(question.feedback.details).filter((line) => !sourceUrls.has(line));
  if (detailsParagraphs.length === 0) throw new Error("Public demo item has no authored explanatory Details paragraphs.");
  return {
    schemaVersion: "patternly-canonical-demo-question-v1",
    provenance: {
      trackId, nodeId, questionId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      appContentLockSha256: contentLockSha,
      releaseLockSha256: releaseLockSha,
      admissionPath: "patternly-content/evidence/admissions/candidate-admission-v3.json",
      admissionSha256: admissionSha,
      candidateId: admission.candidateId,
      sourceReleaseSha256: releaseManifestSha,
      runtimeEvidenceSha256: runtimeEvidenceSha,
      releaseId: releaseEntry.releaseId,
      producerCommit,
      sourcePath,
      modeIds: [...modeIds],
    },
    detailsParagraphs,
    question,
  };
}

/** Historical bytes verify the current receipt; they never supply public question payloads. */
export function assertSelectedArtifactAdmitted({ selection, currentBytes, admittedBytes, currentLock, admittedLock }) {
  const current = currentLock.tracks?.find((entry) => entry.trackId === selection.trackId);
  const admitted = admittedLock.tracks?.find((entry) => entry.trackId === selection.trackId);
  if (!current || !admitted || !sameJson(current, admitted) || sha256(currentBytes) !== current.sha256 || !currentBytes.equals(admittedBytes)) {
    throw new Error(`Public demo selected artifact differs from admission: ${selection.trackId}.`);
  }
}

export function assertAdmissionCommitBindings({ admission, generatedLockBytes, releaseLockBytes, runtimeTestBytes, runtimeEvidence }) {
  if (sha256(generatedLockBytes) !== admission.application?.bundledContentLockSha256 || sha256(releaseLockBytes) !== admission.application?.releaseLockSha256 || runtimeEvidence.runtimeTest?.path !== "src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts" || sha256(runtimeTestBytes) !== runtimeEvidence.runtimeTest?.sha256) {
    throw new Error("Public demo admission commit files differ from the existing receipt.");
  }
}

export function assertPreviewSampleManifest(manifest, readImage = (path) => readBytes(resolve(appRoot, "../patternly-web", path), "public preview image")) {
  const expectedPaths = ["public/app-preview/practice-ios.png", "public/app-preview/today-ios.png", "public/app-preview/topics-ios.png"];
  if (!Array.isArray(manifest.images) || !sameJson(manifest.images.map((image) => image.path).sort(), expectedPaths)) {
    throw new Error("Public preview image inventory differs from the three reviewed images.");
  }
  const questionImages = manifest.images.filter((image) => image.questionId || image.nodeId);
  if (questionImages.length !== 1 || questionImages[0].questionId !== previewSample.questionId || questionImages[0].nodeId !== previewSample.nodeId || questionImages[0].path !== expectedPaths[0]) {
    throw new Error("Public preview sample differs from the reviewed third Free sample.");
  }
  for (const image of manifest.images) {
    if (sha256(readImage(image.path)) !== image.sha256) throw new Error(`Public preview image differs from its reviewed hash: ${image.path}.`);
  }
  return questionImages[0];
}

export async function createPublicDemoCatalog() {
  const currentLockBytes = readBytes(contentLockPath, "app content lock");
  const currentReleaseBytes = readBytes(releaseLockPath, "app release lock");
  const admissionBytes = readBytes(admissionPath, "candidate admission receipt");
  const admission = JSON.parse(admissionBytes.toString("utf8"));
  if (!/^[a-f0-9]{40}$/u.test(admission.application?.frontendCommit ?? "")) throw new Error("Public demo admission APP commit is invalid.");
  const { validateCandidateAdmissionV3 } = await import(pathToFileURL(resolve(contentRoot, "scripts/review/candidate-admission-v3.mjs")).href);
  const { candidateIdFor } = await import(pathToFileURL(resolve(contentRoot, "scripts/review/candidate-manifest.mjs")).href);
  await validateCandidateAdmissionV3(admission, { root: contentRoot });
  const candidateManifest = readJson(resolve(contentRoot, admission.candidatePath), "candidate manifest");
  if (candidateIdFor(candidateManifest) !== admission.candidateId) throw new Error("Public demo candidate identity is invalid.");
  const releaseManifestBytes = readBytes(resolve(contentRoot, admission.release.releasePath), "candidate release manifest");
  const runtimeEvidenceBytes = readBytes(resolve(contentRoot, admission.runtimeEvidence.path), "app runtime admission evidence");
  const sourceRelease = JSON.parse(releaseManifestBytes.toString("utf8"));
  const runtimeEvidence = JSON.parse(runtimeEvidenceBytes.toString("utf8"));
  const commit = admission.application.frontendCommit;
  const generatedLockBytes = Buffer.from(readAdmittedCommitText(appRoot, commit, "src/content/generated/canonical-content/content-lock.json", "admitted app content lock"));
  const releaseBytes = Buffer.from(readAdmittedCommitText(appRoot, commit, "integration/contracts/content-release/release.lock.json", "admitted app release lock"));
  const runtimeTestBytes = Buffer.from(readAdmittedCommitText(appRoot, commit, "src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts", "admission-time runtime test"));
  assertAdmissionCommitBindings({ admission, generatedLockBytes, releaseLockBytes: releaseBytes, runtimeTestBytes, runtimeEvidence });
  if (!currentReleaseBytes.equals(releaseBytes)) throw new Error("Public demo current release lock differs from the admitted release lock.");
  const generatedLock = JSON.parse(generatedLockBytes.toString("utf8"));
  const currentLock = JSON.parse(currentLockBytes.toString("utf8"));
  const releaseLock = JSON.parse(releaseBytes.toString("utf8"));
  const previewImage = assertPreviewSampleManifest(readJson(resolve(appRoot, "../patternly-web/scripts/app-preview-manifest.json"), "public preview manifest"));
  const canonicalCatalog = await loadCanonicalRuntimeCatalog();
  const projections = [];
  for (const selection of [...demos, previewSample]) {
    const artifactPath = `src/content/generated/canonical-content/${selection.trackId}.json`;
    const currentBytes = readBytes(resolve(appRoot, artifactPath), "current selected artifact");
    const admittedBytes = Buffer.from(readAdmittedCommitText(appRoot, commit, artifactPath, "admitted selected artifact"));
    assertSelectedArtifactAdmitted({ selection, currentBytes, admittedBytes, currentLock, admittedLock: generatedLock });
    const { runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(selection.trackId, selection.familyId);
    const track = canonicalCatalog.getTrack(selection.trackId);
    const question = track.getQuestion(selection.questionId);
    const admittedQuestion = JSON.parse(admittedBytes.toString("utf8")).questions.find((entry) => entry.questionId === selection.questionId);
    assertAdmittedSampleMatchesCurrentRuntime({ selection, admittedQuestion, currentTrack: track, currentFamilyId: runtime.familyId });
    const sourceQuestionFile = readJson(resolve(contentRoot, selection.sourcePath), "canonical source");
    const sourceQuestion = Array.isArray(sourceQuestionFile) ? sourceQuestionFile.find((entry) => entry.questionId === selection.questionId) : undefined;
    const releaseEntry = releaseLock.artifacts?.find((entry) => entry.trackId === selection.trackId);
    projections.push(buildPublicDemoProjection({
      selection, question, sourceQuestion, track, runtimeFamilyId: runtime.familyId, generatedLock, releaseLock, admission, candidateManifest, sourceRelease, runtimeEvidence,
      admissionSha: sha256(admissionBytes), releaseManifestSha: sha256(releaseManifestBytes), runtimeEvidenceSha: sha256(runtimeEvidenceBytes), releaseLockSha: sha256(releaseBytes), contentLockSha: sha256(generatedLockBytes), producerCommit: releaseEntry?.producerCommit,
    }));
  }
  return {
    schemaVersion: "patternly-canonical-demo-questions-v1",
    // Only two questions enter the interactive payload. The image is admitted separately.
    demos: projections.slice(0, demos.length),
    publicSamples: projections.map((projection, index) => ({
      presentation: index < demos.length ? "interactive" : "image",
      ...projection.provenance,
      admissionAppCommit: commit,
      ...(index === demos.length ? { imagePath: previewImage.path, imageSha256: previewImage.sha256 } : {}),
    })),
  };
}

export function assertSnapshotCurrent(actualContents, expectedContents) {
  if (actualContents !== expectedContents) throw new Error("Generated public demo snapshot is stale; regenerate it with npm run export:demo.");
}

function optionsFromArgs(args) {
  if (args.length === 0) return { outputPath: webOutput, write: true };
  if (args.length === 1 && args[0] === "--check") return { outputPath: webOutput, write: false };
  throw new Error("Usage: exportPublicDemo.mjs [--check]");
}

export async function runPublicDemoExporter(args = process.argv.slice(2)) {
  const options = optionsFromArgs(args);
  const catalog = await createPublicDemoCatalog();
  const contents = `${JSON.stringify(catalog, null, 2)}\n`;
  if (!options.write) {
    assertSnapshotCurrent(existsSync(options.outputPath) ? readFileSync(options.outputPath, "utf8") : undefined, contents);
    return { outputPath: options.outputPath, catalog, checked: true };
  }
  mkdirSync(dirname(options.outputPath), { recursive: true });
  const temporaryPath = `${options.outputPath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, contents, { flag: "wx" });
    renameSync(temporaryPath, options.outputPath);
  } catch (error) {
    try { rmSync(temporaryPath, { force: true }); } catch { /* retain the original write error */ }
    throw error;
  }
  return { outputPath: options.outputPath, catalog, checked: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPublicDemoExporter().then(({ outputPath, catalog, checked }) => {
    process.stdout.write(`${JSON.stringify({ status: checked ? "current" : "written", outputPath, questionIds: catalog.demos.map((demo) => demo.provenance.questionId) })}\n`);
  }).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
}
