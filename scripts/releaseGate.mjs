import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyReleaseManifest } from "./releaseManifest.mjs";

const root = process.cwd();
let applicationRootInput = process.env.PATTERNLY_APPLICATION_ROOT ?? root;
let contentRootInput = process.env.PATTERNLY_CONTENT_ROOT ?? "../patternly-content";
let backendRootInput = process.env.PATTERNLY_BACKEND_ROOT ?? null;
let webRootInput = process.env.PATTERNLY_WEB_ROOT ?? null;
const evidenceRoot = resolve(process.env.PATTERNLY_RELEASE_EVIDENCE_ROOT ?? "evidence/release");
const releaseLockPath = resolve(process.env.PATTERNLY_RELEASE_LOCK_PATH ?? "integration/contracts/content-release/release.lock.json");
let releaseGate = false;
let outputPath = null;
let releaseManifestPath = process.env.PATTERNLY_RELEASE_MANIFEST_PATH ? resolve(process.env.PATTERNLY_RELEASE_MANIFEST_PATH) : null;
const seenRootArguments = new Set();
let seenManifestArgument = false;
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--enforce" && !releaseGate) releaseGate = true;
  else if (argument === "--output" && outputPath === null) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error("--output requires a path");
    outputPath = resolve(value);
    index += 1;
  } else if (argument === "--manifest" && !seenManifestArgument) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
    releaseManifestPath = resolve(value);
    seenManifestArgument = true;
    index += 1;
  } else if (argument === "--application-root" && !seenRootArguments.has("application")) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
    seenRootArguments.add("application");
    applicationRootInput = value;
    index += 1;
  } else if (argument === "--content-root" && !seenRootArguments.has("content")) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
    seenRootArguments.add("content");
    contentRootInput = value;
    index += 1;
  } else if (argument === "--backend-root" && !seenRootArguments.has("backend")) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
    seenRootArguments.add("backend");
    backendRootInput = value;
    index += 1;
  } else if (argument === "--web-root" && !seenRootArguments.has("web")) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
    seenRootArguments.add("web");
    webRootInput = value;
    index += 1;
  } else throw new Error(`Unknown or duplicate argument: ${argument}`);
}

const applicationRoot = realpathSync(resolve(applicationRootInput));
const contentRoot = realpathSync(resolve(contentRootInput));

const applicationReleaseLockRelativePath = "integration/contracts/content-release/release.lock.json";
const contentReadinessRelativePath = "evidence/readiness/candidate-readiness.json";
const releaseEvidenceRelativeDirectory = "evidence/release";

function isWithin(parent, child) {
  const relative = child.slice(parent.length);
  return child === parent || (child.startsWith(parent) && (relative.startsWith("/") || relative.startsWith("\\")));
}

const outputBoundaryRoots = [applicationRoot, contentRoot];
if (releaseManifestPath) {
  for (const optionalRoot of [backendRootInput, webRootInput]) {
    if (!optionalRoot) continue;
    try { outputBoundaryRoots.push(realpathSync(resolve(optionalRoot))); } catch { /* manifest verification reports the missing root */ }
  }
}

if (outputPath) {
  const outputParent = realpathSync(dirname(outputPath));
  try {
    if (lstatSync(outputPath).isSymbolicLink()) throw new Error("--output final path must not be a symbolic link");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const physicalOutputPath = existsSync(outputPath) ? realpathSync(outputPath) : resolve(outputParent, basename(outputPath));
  if (outputBoundaryRoots.some((boundaryRoot) => isWithin(boundaryRoot, physicalOutputPath))) throw new Error("--output must be outside all repository worktrees");
  outputPath = physicalOutputPath;
}

// Design authority is an owner decision. Figma connector/session identifiers are
// ephemeral and must never become release evidence or a launch blocker.
const externalEvidence = [
  "security-and-privacy",
  "provider-and-operations",
  "signing-and-builds",
  "store-readiness",
  "product-owner-go",
];
const optionalExternalEvidence = ["physical-device-matrix"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function readableError(error) {
  return error instanceof Error ? error.message : String(error);
}

function portableManifestError(error) {
  let message = readableError(error);
  for (const repositoryRoot of [applicationRoot, contentRoot, backendRootInput && resolve(backendRootInput), webRootInput && resolve(webRootInput)]) {
    if (repositoryRoot) message = message.split(repositoryRoot).join("<repository-root>");
  }
  // A release report can be copied between machines. Do not let an underlying
  // validator's ENOENT or Git diagnostic reintroduce the author's filesystem.
  return message.replace(/(^|[\s:'"(])(?:\/[A-Za-z0-9._-]+)+(?![A-Za-z0-9._-])/gu, "$1<local-path>")
    .replace(/(^|[\s:'"(])[A-Za-z]:[\\/][^\s'"(),;]+/gu, "$1<local-path>");
}

function portableError(error) {
  return portableManifestError(error);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

function canonicalHash(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function hasExactKeys(value, expectedKeys) {
  return value && typeof value === "object" && !Array.isArray(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expectedKeys].sort());
}

function repositoryHeadCommit(repositoryRoot) {
  try {
    const commit = execFileSync("git", ["-C", repositoryRoot, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return /^[a-f0-9]{40}$/.test(commit) ? commit : null;
  } catch {
    return null;
  }
}

function applicationHeadCommit() {
  return repositoryHeadCommit(applicationRoot);
}

function repositoryStatus(repositoryRoot) {
  try {
    const porcelain = execFileSync("git", ["-C", repositoryRoot, "status", "--porcelain", "--untracked-files=all"], { encoding: "utf8" });
    return { status: porcelain.trim() ? "dirty" : "clean", changedPathCount: porcelain.split("\n").filter(Boolean).length };
  } catch (error) {
    return { status: "unavailable", error: portableError(error) };
  }
}

function contentRepositoryStatus() {
  return repositoryStatus(contentRoot);
}

function inspectReleaseLock() {
  let lock;
  try {
    lock = readJson(releaseLockPath);
  } catch (error) {
    return {
      repositoryRole: "application",
      path: applicationReleaseLockRelativePath,
      status: "unavailable",
      trackIds: [],
      error: portableError(error),
    };
  }

  const errors = [];
  if (lock?.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (lock?.repository !== "lukaszkurczab/patternly-content") errors.push("repository must be lukaszkurczab/patternly-content");
  if (typeof lock?.bundleId !== "string" || lock.bundleId.length === 0) errors.push("bundleId must be a non-empty string");
  if (!Array.isArray(lock?.artifacts) || lock.artifacts.length === 0) errors.push("artifacts must be a non-empty array");

  const trackIds = [];
  if (Array.isArray(lock?.artifacts)) {
    for (const [index, artifact] of lock.artifacts.entries()) {
      const prefix = `artifacts[${index}]`;
      if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
        errors.push(`${prefix} must be an object`);
        continue;
      }
      if (typeof artifact.trackId === "string") trackIds.push(artifact.trackId);
      for (const field of ["releaseId", "trackId", "contentVersion"]) {
        if (typeof artifact[field] !== "string" || artifact[field].length === 0) errors.push(`${prefix}.${field} must be a non-empty string`);
      }
      if (typeof artifact.producerCommit !== "string" || !/^[a-f0-9]{40}$/.test(artifact.producerCommit)) errors.push(`${prefix}.producerCommit must be a 40-character lowercase commit SHA`);
      if (typeof artifact.sourceRepositoryCommit !== "string" || !/^[a-f0-9]{40}$/.test(artifact.sourceRepositoryCommit)) errors.push(`${prefix}.sourceRepositoryCommit must be a 40-character lowercase commit SHA`);
      if (typeof artifact.checksumSha256 !== "string" || !/^[a-f0-9]{64}$/.test(artifact.checksumSha256)) errors.push(`${prefix}.checksumSha256 must be a 64-character lowercase SHA-256`);
    }
  }
  if (new Set(trackIds).size !== trackIds.length) errors.push("artifacts.trackId values must be unique");

  return {
    repositoryRole: "application",
    status: errors.length === 0 ? "valid" : "invalid",
    path: applicationReleaseLockRelativePath,
    schemaVersion: lock?.schemaVersion ?? null,
    repository: lock?.repository ?? null,
    bundleId: lock?.bundleId ?? null,
    trackIds: uniqueSorted(trackIds),
    errors,
  };
}

function externalEvidenceStatus(id, expectedApplicationCommit) {
  const path = resolve(evidenceRoot, `${id}.json`);
  const portablePath = `${releaseEvidenceRelativeDirectory}/${id}.json`;
  if (!existsSync(path)) return { id, repositoryRole: "application", path: portablePath, status: "not_evidenced" };
  try {
    const value = readJson(path);
    const { evidenceSha256, ...identity } = value ?? {};
    const referencesValid = Array.isArray(value?.evidenceReferences)
      && value.evidenceReferences.length > 0
      && value.evidenceReferences.every((reference) => hasExactKeys(reference, ["kind", "value"]) && typeof reference.kind === "string" && reference.kind.trim().length > 0 && typeof reference.value === "string" && reference.value.trim().length > 0);
    const timestampValid = typeof value?.verifiedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.verifiedAt) && !Number.isNaN(Date.parse(value.verifiedAt));
    if (!hasExactKeys(value, ["applicationCommit", "evidenceReferences", "evidenceSha256", "id", "schemaVersion", "status", "verifiedAt", "verifiedBy"])
      || value?.schemaVersion !== "patternly-release-evidence-v2"
      || value?.id !== id
      || value?.status !== "verified"
      || value?.applicationCommit !== expectedApplicationCommit
      || !/^[a-f0-9]{40}$/.test(value?.applicationCommit ?? "")
      || !timestampValid
      || typeof value?.verifiedBy !== "string"
      || value.verifiedBy.trim().length === 0
      || !referencesValid
      || typeof evidenceSha256 !== "string"
      || !/^[a-f0-9]{64}$/.test(evidenceSha256)
      || evidenceSha256 !== canonicalHash(identity)) {
      return { id, repositoryRole: "application", path: portablePath, status: "invalid" };
    }
    return { id, repositoryRole: "application", path: portablePath, status: "verified", applicationCommit: value.applicationCommit, evidenceSha256 };
  } catch (error) {
    return { id, repositoryRole: "application", path: portablePath, status: "invalid", error: portableError(error) };
  }
}

const blockers = [];
const applicationRepository = repositoryStatus(applicationRoot);
const applicationCommit = applicationHeadCommit();
if (applicationRepository.status === "unavailable") blockers.push({ kind: "application_repository_unavailable", error: applicationRepository.error });
if (applicationRepository.status === "dirty") blockers.push({ kind: "application_worktree_dirty", changedPathCount: applicationRepository.changedPathCount });
const contentReleaseLock = inspectReleaseLock();
const lockedTrackIds = contentReleaseLock.trackIds;
if (contentReleaseLock.status === "unavailable") blockers.push({ kind: "unreadable_content_release_lock", error: contentReleaseLock.error });
if (contentReleaseLock.status === "invalid") blockers.push({ kind: "invalid_content_release_lock", errors: contentReleaseLock.errors });
if (contentReleaseLock.status === "valid" && lockedTrackIds.length !== 9) blockers.push({ kind: "invalid_content_release_scope", actual: lockedTrackIds });
const launchTrackIds = contentReleaseLock.status === "valid" && lockedTrackIds.length === 9 ? lockedTrackIds : [];

let readiness = null;
let candidate = null;
const readinessPath = resolve(contentRoot, contentReadinessRelativePath);
try {
  const candidateContract = await import(pathToFileURL(resolve(contentRoot, "scripts/review/candidate-manifest.mjs")));
  const approvalContract = await import(pathToFileURL(resolve(contentRoot, "scripts/review/content-approval.mjs")));
  candidate = await candidateContract.loadCandidateManifest(contentRoot);
  const approval = await approvalContract.loadHumanApprovalManifest({ root: contentRoot, candidate, trackIds: candidateContract.CANDIDATE_TRACK_IDS });
  readiness = readJson(readinessPath);
  candidateContract.validateCandidateReadiness(readiness, { candidate, approval });
} catch (error) {
  blockers.push({ kind: existsSync(readinessPath) ? "invalid_content_readiness_report" : "unreadable_content_readiness_report", error: portableError(error) });
  candidate = null;
  readiness = null;
}

const contentRepository = { ...contentRepositoryStatus(), headCommit: repositoryHeadCommit(contentRoot) };
if (contentRepository.status === "unavailable") blockers.push({ kind: "content_readiness_repository_unavailable", error: contentRepository.error });
if (contentRepository.status === "dirty") blockers.push({ kind: "content_readiness_worktree_dirty", changedPathCount: contentRepository.changedPathCount });

if (readiness) {
  const reportScope = readiness.trackIds;
  if (JSON.stringify(reportScope) !== JSON.stringify(launchTrackIds)) blockers.push({ kind: "content_readiness_scope_mismatch", expected: launchTrackIds, actual: reportScope });
  const byTrackId = new Map(readiness.tracks.map((track) => [track?.trackId, track]));
  const lockByTrackId = new Map((contentReleaseLock.status === "valid" ? readJson(releaseLockPath).artifacts : []).map((artifact) => [artifact.trackId, artifact]));
  for (const trackId of launchTrackIds) {
    const track = byTrackId.get(trackId);
    if (!track) {
      blockers.push({ kind: "missing_track_readiness", trackId });
      continue;
    }
    if (track.structuralValidation.result !== "passed") blockers.push({ kind: "technical_validation_not_admitted", trackId, actual: track.structuralValidation.result });
    if (!track.humanApproval) blockers.push({ kind: "human_editorial_approval_missing", trackId });
    const lockedArtifact = lockByTrackId.get(trackId);
    const artifactMatchesLock = lockedArtifact && ["releaseId", "trackId", "contentVersion", "sourceRepositoryCommit", "checksumSha256"].every((field) => track.artifact?.[field] === lockedArtifact[field]);
    if (!artifactMatchesLock) blockers.push({ kind: "content_readiness_artifact_mismatch", trackId });
    if (track.publishingAdmission !== "admitted") blockers.push({ kind: "publishing_admission_missing", trackId, actual: track.publishingAdmission ?? null });
    if (track.runtimeAdmission !== "admitted") blockers.push({ kind: "runtime_admission_missing", trackId, actual: track.runtimeAdmission ?? null });
    if (track.blockers.length !== 0) blockers.push({ kind: "track_readiness_blocked", trackId, actual: track.blockers });
  }
}

if (contentReleaseLock.status === "valid" && JSON.stringify(lockedTrackIds) !== JSON.stringify(launchTrackIds)) blockers.push({ kind: "application_release_lock_scope_mismatch", expected: launchTrackIds, actual: lockedTrackIds });

let releaseManifest = null;
if (releaseGate && !releaseManifestPath) {
  releaseManifest = { status: "missing" };
  blockers.push({ kind: "release_manifest_missing" });
}
if (releaseManifestPath) {
  if (!backendRootInput || !webRootInput) {
    releaseManifest = { status: "invalid" };
    blockers.push({ kind: "release_manifest_inputs_missing" });
  } else {
    try {
      const verified = await verifyReleaseManifest({
        manifestPath: releaseManifestPath,
        applicationRoot,
        backendRoot: backendRootInput,
        contentRoot,
        webRoot: webRootInput,
      });
      releaseManifest = {
        status: verified.status,
        manifestId: verified.manifestId,
        candidateId: verified.candidateId,
        trackIds: verified.trackIds,
        repositories: verified.repositories,
  };
    } catch (error) {
      releaseManifest = { status: "invalid" };
      blockers.push({ kind: "release_manifest_invalid", reason: portableManifestError(error) });
    }
  }
}

const external = externalEvidence.map((id) => externalEvidenceStatus(id, applicationCommit));
for (const evidence of external) if (evidence.status !== "verified") blockers.push({ kind: "external_release_evidence_missing", evidenceId: evidence.id, status: evidence.status, path: evidence.path });
const optionalExternal = optionalExternalEvidence.map((id) => externalEvidenceStatus(id, applicationCommit));

const report = {
  schemaVersion: "patternly-launch-readiness-v1",
  status: blockers.length === 0 ? "ready" : "not_ready",
  launchTrackIds,
  applicationRepository: { repositoryRole: "application", path: ".", headCommit: applicationCommit, ...applicationRepository },
  contentReadiness: readiness ? { repositoryRole: "content", path: contentReadinessRelativePath, candidateId: readiness.candidateId, trackIds: readiness.trackIds, headCommit: contentRepository.headCommit, repository: contentRepository.status } : null,
  contentReleaseLock,
  applicationReleaseLockTrackIds: lockedTrackIds,
  releaseManifest,
  externalEvidence: external,
  optionalExternalEvidence: optionalExternal,
  blockers: blockers.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
};

const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) writeFileSync(outputPath, serializedReport);
process.stdout.write(serializedReport);
if (releaseGate && blockers.length) process.exitCode = 1;
