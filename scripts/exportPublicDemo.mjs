import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
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

export function buildPublicDemoProjection({ selection, question, sourceQuestion, track, runtimeFamilyId, generatedLock, releaseLock, currentIdentity, releaseLockSha, contentLockSha }) {
  const { trackId, familyId, nodeId, questionId, sourcePath, modeIds } = selection;
  const trackLock = generatedLock.tracks?.find((entry) => entry.trackId === trackId);
  const releaseEntry = releaseLock.artifacts?.find((entry) => entry.trackId === trackId);
  if (!track || track.trackId !== trackId || !question || question.questionId !== questionId) throw new Error("Public demo source item is missing or has an unexpected identity.");
  if (runtimeFamilyId !== familyId) throw new Error("Public demo source item resolved to an unexpected content family.");
  const issues = validateQuestion(question);
  if (issues.length) throw new Error(`Public demo source item is invalid (${issues.join(", ")}).`);
  if (!sameJson(question, sourceQuestion)) throw new Error("Public demo source item does not match the canonical source file.");
  if (!trackLock || trackLock.sha256 !== track.artifactSha256 || trackLock.contentVersion !== track.contentVersion) throw new Error("Public demo artifact does not match the current app content lock.");
  if (!releaseEntry || releaseEntry.checksumSha256 !== track.artifactSha256 || releaseEntry.contentVersion !== track.contentVersion) throw new Error("Public demo artifact does not match the current content release lock.");
  const currentTrack = currentIdentity?.tracks?.find((entry) => entry.trackId === trackId);
  if (currentIdentity?.schemaVersion !== "patternly-current-content-identity-v1" || currentIdentity.sourceInputFingerprint !== releaseLock.sourceInputFingerprint || currentTrack?.artifactSha256 !== track.artifactSha256) throw new Error("Public demo source does not match the current canonical source identity.");
  if (releaseEntry.releaseId !== releaseLock.releaseId || releaseEntry.producerCommit !== releaseEntry.sourceRepositoryCommit) throw new Error("Public demo artifact does not match current application release metadata.");
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
      sourceInputFingerprint: currentIdentity.sourceInputFingerprint,
      releaseId: releaseEntry.releaseId,
      sourcePath,
      modeIds: [...modeIds],
    },
    detailsParagraphs,
    question,
  };
}

/** The selected current application package must match its exact lock bytes. */
export function assertSelectedArtifactAdmitted({ selection, currentBytes, currentLock, releaseLock }) {
  const current = currentLock.tracks?.find((entry) => entry.trackId === selection.trackId);
  if (!current || sha256(currentBytes) !== current.sha256) throw new Error(`Public demo selected artifact differs from the active app lock: ${selection.trackId}.`);
  const release = releaseLock.artifacts?.find((entry) => entry.trackId === selection.trackId);
  if (!release || release.checksumSha256 !== current.sha256 || release.contentVersion !== current.contentVersion || release.artifactBytes !== currentBytes.length || release.questionCount !== current.questionCount) {
    throw new Error(`Public demo selected artifact differs from current release metadata: ${selection.trackId}.`);
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
  const sourceIdentityModule = await import(pathToFileURL(resolve(contentRoot, "scripts/content/current-source-identity.mjs")).href);
  const currentIdentity = await sourceIdentityModule.computeCurrentSourceIdentity({ contentRoot });
  const appVerifier = await import(pathToFileURL(resolve(appRoot, "scripts/verifyBundledCurrentContent.mjs")).href);
  await appVerifier.verifyBundledCurrentContent({ root: appRoot });
  const generatedLockBytes = currentLockBytes;
  const generatedLock = JSON.parse(generatedLockBytes.toString("utf8"));
  const currentLock = JSON.parse(currentLockBytes.toString("utf8"));
  const releaseLock = JSON.parse(currentReleaseBytes.toString("utf8"));
  if (currentIdentity.sourceInputFingerprint !== releaseLock.sourceInputFingerprint || JSON.stringify(currentIdentity.tracks) !== JSON.stringify(releaseLock.currentIdentity?.tracks)) throw new Error("Current public demo source differs from the installed APP bank.");
  const previewImage = assertPreviewSampleManifest(readJson(resolve(appRoot, "../patternly-web/scripts/app-preview-manifest.json"), "public preview manifest"));
  const canonicalCatalog = await loadCanonicalRuntimeCatalog();
  const projections = [];
  for (const selection of [...demos, previewSample]) {
    const artifactPath = `src/content/generated/canonical-content/${selection.trackId}.json`;
    const currentBytes = readBytes(resolve(appRoot, artifactPath), "current selected artifact");
    assertSelectedArtifactAdmitted({ selection, currentBytes, currentLock, releaseLock });
    const { runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(selection.trackId, selection.familyId);
    const track = canonicalCatalog.getTrack(selection.trackId);
    const question = track.getQuestion(selection.questionId);
    const activeQuestion = JSON.parse(currentBytes.toString("utf8")).questions.find((entry) => entry.questionId === selection.questionId);
    assertAdmittedSampleMatchesCurrentRuntime({ selection, admittedQuestion: activeQuestion, currentTrack: track, currentFamilyId: runtime.familyId });
    const sourceQuestionFile = readJson(resolve(contentRoot, selection.sourcePath), "canonical source");
    const sourceQuestion = Array.isArray(sourceQuestionFile) ? sourceQuestionFile.find((entry) => entry.questionId === selection.questionId) : undefined;
    projections.push(buildPublicDemoProjection({
      selection, question, sourceQuestion, track, runtimeFamilyId: runtime.familyId, generatedLock, releaseLock, currentIdentity,
      releaseLockSha: sha256(currentReleaseBytes), contentLockSha: sha256(generatedLockBytes),
    }));
  }
  return {
    schemaVersion: "patternly-canonical-demo-questions-v1",
    // Only two questions enter the interactive payload. The image is admitted separately.
    demos: projections.slice(0, demos.length),
    publicSamples: projections.map((projection, index) => ({
      presentation: index < demos.length ? "interactive" : "image",
      ...projection.provenance,
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
