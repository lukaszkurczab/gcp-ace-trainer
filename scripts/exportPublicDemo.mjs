import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import "tsx/cjs";

const require = createRequire(import.meta.url);
const { contentPackageRuntimeOwner } = require("../src/application/contentPackageRuntimeOwner.ts");
const { buildCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const { validateQuestion } = require("../src/content/canonical/questionValidation.ts");
const { projectCanonicalSourceLinks } = require("../src/application/canonical/canonicalSourceLinks.ts");
const { detailLines } = require("../src/features/practice/feedbackDetails.ts");
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(appRoot, "../patternly-content");
const webOutput = resolve(appRoot, "../patternly-web/src/generated/demoQuestions.json");
const contentLockPath = resolve(appRoot, "src/content/generated/canonical-content/content-lock.json");
const releaseLockPath = resolve(appRoot, "integration/contracts/content-release/release.lock.json");
const admissionPath = resolve(contentRoot, "evidence/admissions/candidate-admission-v3.json");
const localAdmittedSource = Object.freeze({
  appCommit: "e889b05d033d4cc4b7676d0ca3f224efc3fac115",
  contentCommit: "8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03",
  candidateId: "946d3589abf9bfb205b382e7ebb9205786c3e42e18fe733c3607ad836a6a80a4",
  trackIds: Object.freeze([
    "aws-certified-solutions-architect-associate",
    "backend-system-design-interview",
    "claude-certified-architect-professional-certification",
    "coding-interview-dsa-problem-solving",
    "frontend-system-design-interview",
    "google-cloud-associate-cloud-engineer",
    "microsoft-azure-administrator-associate-az-104",
    "microsoft-azure-ai-fundamentals-ai-901",
    "object-oriented-design-interview",
  ]),
});
const demos = Object.freeze([
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
    throw new Error(`Public demo local source unavailable: ${label} path is invalid.`);
  }
}

function readHistoricalText(repository, commit, repositoryPath, label) {
  assertSafeGitPath(repositoryPath, label);
  try {
    return execFileSync("git", ["-C", repository, "show", `${commit}:${repositoryPath}`], {
      encoding: "utf8",
      maxBuffer: 80 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(`Public demo local source unavailable: pinned ${label} is missing or unreadable.`);
  }
}

function readHistoricalJson(repository, commit, repositoryPath, label) {
  const text = readHistoricalText(repository, commit, repositoryPath, label);
  try { return JSON.parse(text); }
  catch { throw new Error(`Public demo local source unavailable: pinned ${label} is malformed.`); }
}

export function assertHistoricalDemoMatchesCurrentRuntime({ selection, historicalQuestion, currentTrack, currentFamilyId }) {
  if (currentFamilyId !== selection.familyId || currentTrack.trackId !== selection.trackId) {
    throw new Error("Public demo local source does not match the current canonical track family.");
  }
  const currentQuestion = currentTrack.getQuestion(selection.questionId);
  if (!currentQuestion || !sameJson(historicalQuestion, currentQuestion)) {
    throw new Error("Public demo local source question differs from the current canonical training question.");
  }
  for (const modeId of selection.modeIds) {
    const mode = currentTrack.getMode(modeId);
    if (mode.availability !== "immediate" || mode.selection.kind !== "node" || mode.selection.nodeId !== selection.nodeId || !currentTrack.getPool(modeId).some((question) => question.questionId === selection.questionId)) {
      throw new Error("Public demo local source question is outside the current ordinary Free practice pool.");
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
  if (admission.schemaVersion !== "patternly-candidate-admission-v3" || admission.release?.boundary !== "local_verified_artifacts_no_deployment" || admission.application?.bundledContentLockSha256 !== contentLockSha || admission.application?.releaseLockSha256 !== releaseLockSha || !admissionTrack || admissionTrack.runtimeAdmission !== "granted" || admissionTrack.artifactSha256 !== track.artifactSha256) throw new Error("Public demo source is outside the existing app admission evidence.");
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

export async function createPublicDemoCatalog() {
  const lockBytes = readBytes(contentLockPath, "app content lock");
  const releaseBytes = readBytes(releaseLockPath, "app release lock");
  const admissionBytes = readBytes(admissionPath, "candidate admission receipt");
  const generatedLock = JSON.parse(lockBytes.toString("utf8"));
  const releaseLock = JSON.parse(releaseBytes.toString("utf8"));
  const admission = JSON.parse(admissionBytes.toString("utf8"));
  const candidateManifestBytes = readBytes(resolve(contentRoot, admission.candidatePath), "candidate manifest");
  const releaseManifestBytes = readBytes(resolve(contentRoot, admission.release.releasePath), "candidate release manifest");
  const runtimeEvidenceBytes = readBytes(resolve(contentRoot, admission.runtimeEvidence.path), "app runtime admission evidence");
  const candidateManifest = JSON.parse(candidateManifestBytes.toString("utf8"));
  const sourceRelease = JSON.parse(releaseManifestBytes.toString("utf8"));
  const runtimeEvidence = JSON.parse(runtimeEvidenceBytes.toString("utf8"));
  const contentLockSha = sha256(lockBytes);
  const releaseLockSha = sha256(releaseBytes);
  const projections = [];
  for (const selection of demos) {
    const { track, runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(selection.trackId, selection.familyId);
    if (runtime.familyId !== selection.familyId) throw new Error("Public demo source is outside its admitted content package family.");
    const question = track.getQuestion(selection.questionId);
    const sourceQuestionFile = readJson(resolve(contentRoot, selection.sourcePath), "canonical source");
    const sourceQuestion = Array.isArray(sourceQuestionFile) ? sourceQuestionFile.find((entry) => entry.questionId === selection.questionId) : undefined;
    if (!sourceQuestion) throw new Error("Public demo source item is missing from its canonical source file.");
    const releaseEntry = releaseLock.artifacts?.find((entry) => entry.trackId === selection.trackId);
    projections.push(buildPublicDemoProjection({
      selection, question, sourceQuestion, track, runtimeFamilyId: runtime.familyId, generatedLock, releaseLock, admission, candidateManifest, sourceRelease, runtimeEvidence,
      admissionSha: sha256(admissionBytes), releaseManifestSha: sha256(releaseManifestBytes), runtimeEvidenceSha: sha256(runtimeEvidenceBytes), releaseLockSha, contentLockSha, producerCommit: releaseEntry?.producerCommit,
    }));
  }
  return { schemaVersion: "patternly-canonical-demo-questions-v1", demos: projections };
}

/** Rebuilds the locally admitted demo using pinned historical receipts, after exact current-Free parity checks. */
export async function createLocalAdmittedPublicDemoCatalog() {
  const appArtifacts = localAdmittedSource.trackIds.map((trackId) => readHistoricalJson(
    appRoot,
    localAdmittedSource.appCommit,
    `src/content/generated/canonical-content/${trackId}.json`,
    `historical ${trackId} artifact`,
  ));
  const generatedLockText = readHistoricalText(appRoot, localAdmittedSource.appCommit, "src/content/generated/canonical-content/content-lock.json", "historical app content lock");
  const releaseLockText = readHistoricalText(appRoot, localAdmittedSource.appCommit, "integration/contracts/content-release/release.lock.json", "historical app release lock");
  const generatedLock = JSON.parse(generatedLockText);
  const releaseLock = JSON.parse(releaseLockText);
  const historicalCatalog = await buildCanonicalRuntimeCatalog({ artifacts: appArtifacts, locks: generatedLock.tracks });

  const admissionText = readHistoricalText(contentRoot, localAdmittedSource.contentCommit, "evidence/admissions/candidate-admission-v3.json", "candidate admission receipt");
  const admission = JSON.parse(admissionText);
  if (admission.candidateId !== localAdmittedSource.candidateId) throw new Error("Public demo local source does not match its pinned admission candidate.");
  const candidateText = readHistoricalText(contentRoot, localAdmittedSource.contentCommit, admission.candidatePath, "candidate manifest");
  const releaseManifestText = readHistoricalText(contentRoot, localAdmittedSource.contentCommit, admission.release?.releasePath, "source release manifest");
  const runtimeEvidenceText = readHistoricalText(contentRoot, localAdmittedSource.contentCommit, admission.runtimeEvidence?.path, "runtime admission evidence");
  const candidateManifest = JSON.parse(candidateText);
  const sourceRelease = JSON.parse(releaseManifestText);
  const runtimeEvidence = JSON.parse(runtimeEvidenceText);
  const generatedContentLockSha = sha256(generatedLockText);
  const historicalReleaseLockSha = sha256(releaseLockText);
  const projections = [];

  for (const selection of demos) {
    const historicalTrack = historicalCatalog.getTrack(selection.trackId);
    const historicalQuestion = historicalTrack.getQuestion(selection.questionId);
    const { track: currentTrack, runtime: currentRuntime } = await contentPackageRuntimeOwner.resolveForDiscovery(selection.trackId, selection.familyId);
    assertHistoricalDemoMatchesCurrentRuntime({ selection, historicalQuestion, currentTrack, currentFamilyId: currentRuntime.familyId });

    const sourceFile = readHistoricalJson(contentRoot, localAdmittedSource.contentCommit, selection.sourcePath, "canonical question source");
    const sourceQuestion = Array.isArray(sourceFile) ? sourceFile.find((question) => question.questionId === selection.questionId) : undefined;
    if (!historicalQuestion || !sourceQuestion) throw new Error("Public demo local source item is missing from its pinned historical source.");
    const releaseEntry = releaseLock.artifacts?.find((entry) => entry.trackId === selection.trackId);
    projections.push(buildPublicDemoProjection({
      selection,
      question: historicalQuestion,
      sourceQuestion,
      track: historicalTrack,
      runtimeFamilyId: currentRuntime.familyId,
      generatedLock,
      releaseLock,
      admission,
      candidateManifest,
      sourceRelease,
      runtimeEvidence,
      admissionSha: sha256(admissionText),
      releaseManifestSha: sha256(releaseManifestText),
      runtimeEvidenceSha: sha256(runtimeEvidenceText),
      releaseLockSha: historicalReleaseLockSha,
      contentLockSha: generatedContentLockSha,
      producerCommit: releaseEntry?.producerCommit,
    }));
  }
  return { schemaVersion: "patternly-canonical-demo-questions-v1", demos: projections };
}

export function assertSnapshotCurrent(actualContents, expectedContents) {
  if (actualContents !== expectedContents) throw new Error("Generated public demo snapshot is stale; regenerate it with npm run export:demo.");
}

function optionsFromArgs(args) {
  if (args.length === 0) return { outputPath: webOutput, source: "current", write: true };
  if (args.length === 1 && args[0] === "--check") return { outputPath: webOutput, source: "current", write: false };
  if (args.length === 1 && args[0] === "--local-admitted-source") return { outputPath: webOutput, source: "local-admitted", write: false };
  if (args.length === 2 && args[0] === "--local-admitted-source" && args[1] === "--check") return { outputPath: webOutput, source: "local-admitted", write: false };
  if (args.length === 2 && args[0] === "--local-admitted-source" && args[1] === "--write") return { outputPath: webOutput, source: "local-admitted", write: true };
  throw new Error("Usage: exportPublicDemo.mjs [--check] | --local-admitted-source [--check|--write]");
}

export async function runPublicDemoExporter(args = process.argv.slice(2)) {
  const options = optionsFromArgs(args);
  const catalog = options.source === "local-admitted" ? await createLocalAdmittedPublicDemoCatalog() : await createPublicDemoCatalog();
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
