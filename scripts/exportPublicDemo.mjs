import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import "tsx/cjs";

const require = createRequire(import.meta.url);
const { contentPackageRuntimeOwner } = require("../src/application/contentPackageRuntimeOwner.ts");
const { validateQuestion } = require("../src/content/canonical/questionValidation.ts");
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(appRoot, "../patternly-content");
const webOutput = resolve(appRoot, "../patternly-web/src/generated/codingDemoQuestion.json");
const trackId = "coding-interview-dsa-problem-solving";
const nodeId = "complexity_and_constraints";
const questionId = "alg-complexity-time-005";
const sourcePath = resolve(contentRoot, "content", trackId, nodeId, "derive_time_complexity.json");
const contentLockPath = resolve(appRoot, "src/content/generated/canonical-content/content-lock.json");
const releaseLockPath = resolve(appRoot, "integration/contracts/content-release/release.lock.json");
const admissionPath = resolve(contentRoot, "evidence/admissions/candidate-admission-v3.json");
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

export function buildPublicDemoProjection({ question, sourceQuestion, track, generatedLock, releaseLock, admission, candidateManifest, sourceRelease, runtimeEvidence, admissionSha, releaseManifestSha, runtimeEvidenceSha, releaseLockSha, contentLockSha, producerCommit }) {
  const trackLock = generatedLock.tracks?.find((entry) => entry.trackId === trackId);
  const releaseEntry = releaseLock.artifacts?.find((entry) => entry.trackId === trackId);
  const admissionTrack = admission.tracks?.find((entry) => entry.trackId === trackId);
  const poolModes = ["coding-interview-learn-approach", "coding-interview-guided-practice", "coding-interview-custom-practice"];
  if (!track || track.trackId !== trackId || !question || question.questionId !== questionId) throw new Error("Public demo source item is missing or has an unexpected identity.");
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
  for (const modeId of poolModes) {
    const mode = track.modes.find((entry) => entry.modeId === modeId);
    if (!mode || mode.availability !== "immediate" || mode.selection.kind !== "node" || mode.selection.nodeId !== nodeId || !track.getPool(modeId).some((entry) => entry.questionId === questionId)) throw new Error("Public demo item is outside the existing ordinary Free Coding practice pools.");
  }
  if (question.interaction.type !== "choice_single" || question.feedback.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Public demo item is not a canonical single-choice question.");
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
      sourcePath: `content/${trackId}/${nodeId}/derive_time_complexity.json`,
    },
    question,
  };
}

export async function createPublicDemoProjection() {
  const { track, runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  if (runtime.familyId !== "coding_interview") throw new Error("Public demo source is outside the Coding Interview package family.");
  const question = track.getQuestion(questionId);
  const sourceFile = readJson(sourcePath, "canonical source");
  const sourceQuestion = Array.isArray(sourceFile) ? sourceFile.find((entry) => entry.questionId === questionId) : undefined;
  if (!sourceQuestion) throw new Error("Public demo source item is missing from its canonical source file.");
  const lockBytes = readBytes(contentLockPath, "app content lock");
  const releaseBytes = readBytes(releaseLockPath, "app release lock");
  const admissionBytes = readBytes(admissionPath, "candidate admission receipt");
  const generatedLock = JSON.parse(lockBytes.toString("utf8"));
  const releaseLock = JSON.parse(releaseBytes.toString("utf8"));
  const admission = JSON.parse(admissionBytes.toString("utf8"));
  const producerCommit = releaseLock.artifacts?.find((entry) => entry.trackId === trackId)?.producerCommit;
  const candidateManifestBytes = readBytes(resolve(contentRoot, admission.candidatePath), "candidate manifest");
  const releaseManifestBytes = readBytes(resolve(contentRoot, admission.release.releasePath), "candidate release manifest");
  const runtimeEvidenceBytes = readBytes(resolve(contentRoot, admission.runtimeEvidence.path), "app runtime admission evidence");
  const candidateManifest = JSON.parse(candidateManifestBytes.toString("utf8"));
  const sourceRelease = JSON.parse(releaseManifestBytes.toString("utf8"));
  const runtimeEvidence = JSON.parse(runtimeEvidenceBytes.toString("utf8"));
  return buildPublicDemoProjection({ question, sourceQuestion, track, generatedLock, releaseLock, admission, candidateManifest, sourceRelease, runtimeEvidence, admissionSha: sha256(admissionBytes), releaseManifestSha: sha256(releaseManifestBytes), runtimeEvidenceSha: sha256(runtimeEvidenceBytes), releaseLockSha: sha256(releaseBytes), contentLockSha: sha256(lockBytes), producerCommit });
}

function outputFromArgs(args) {
  if (args.length === 0) return webOutput;
  if (args.length === 1 && args[0] === "--check") return webOutput;
  throw new Error("Usage: exportPublicDemo.mjs [--check]");
}

export async function runPublicDemoExporter(args = process.argv.slice(2)) {
  const check = args[0] === "--check";
  const outputPath = outputFromArgs(args);
  const projection = await createPublicDemoProjection();
  const contents = `${JSON.stringify(projection, null, 2)}\n`;
  if (check) {
    if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== contents) throw new Error("Generated public demo snapshot is stale; regenerate it with npm run export:demo.");
    return { outputPath, projection, checked: true };
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, contents, { flag: "wx" });
    renameSync(temporaryPath, outputPath);
  } catch (error) {
    try { rmSync(temporaryPath, { force: true }); } catch { /* retain the original write error */ }
    throw error;
  }
  return { outputPath, projection, checked: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPublicDemoExporter().then(({ outputPath, projection, checked }) => {
    process.stdout.write(`${JSON.stringify({ status: checked ? "current" : "written", outputPath, questionId: projection.provenance.questionId, artifactSha256: projection.provenance.artifactSha256 })}\n`);
  }).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
}
