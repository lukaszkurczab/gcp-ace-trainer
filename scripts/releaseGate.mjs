import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import YAML from "yaml";

const root = process.cwd();
const applicationRoot = resolve(process.env.PATTERNLY_APPLICATION_ROOT ?? root);
const contentRoot = resolve(process.env.PATTERNLY_CONTENT_ROOT ?? "../patternly-content");
const evidenceRoot = resolve(process.env.PATTERNLY_RELEASE_EVIDENCE_ROOT ?? "evidence/release");
const releaseLockPath = resolve(process.env.PATTERNLY_RELEASE_LOCK_PATH ?? "integration/contracts/content-release/release.lock.json");
const releaseGate = process.argv.includes("--enforce");

const externalEvidence = [
  "design-authority",
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
    return { status: "unavailable", error: readableError(error) };
  }
}

function contentRepositoryStatus() {
  return repositoryStatus(contentRoot);
}

function contentSourceCommitStatus(sourceCommit) {
  if (typeof sourceCommit !== "string" || !/^[a-f0-9]{40}$/.test(sourceCommit)) return { status: "invalid" };
  try {
    execFileSync("git", ["-C", contentRoot, "cat-file", "-e", `${sourceCommit}^{commit}`], { stdio: "ignore" });
    return { status: "reachable" };
  } catch (error) {
    return { status: "unreachable", error: readableError(error) };
  }
}

function inspectReleaseLock() {
  let lock;
  try {
    lock = readJson(releaseLockPath);
  } catch (error) {
    return { status: "unavailable", path: releaseLockPath, trackIds: [], error: readableError(error) };
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
    status: errors.length === 0 ? "valid" : "invalid",
    path: releaseLockPath,
    schemaVersion: lock?.schemaVersion ?? null,
    repository: lock?.repository ?? null,
    bundleId: lock?.bundleId ?? null,
    trackIds: uniqueSorted(trackIds),
    errors,
  };
}

function externalEvidenceStatus(id, expectedApplicationCommit) {
  const path = resolve(evidenceRoot, `${id}.json`);
  if (!existsSync(path)) return { id, path, status: "not_evidenced" };
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
      return { id, path, status: "invalid" };
    }
    return { id, path, status: "verified", applicationCommit: value.applicationCommit, evidenceSha256 };
  } catch (error) {
    return { id, path, status: "invalid", error: readableError(error) };
  }
}

const blockers = [];
const applicationRepository = repositoryStatus(applicationRoot);
const applicationCommit = applicationHeadCommit();
if (applicationRepository.status === "unavailable") blockers.push({ kind: "application_repository_unavailable", error: applicationRepository.error });
if (applicationRepository.status === "dirty") blockers.push({ kind: "application_worktree_dirty", changedPathCount: applicationRepository.changedPathCount });
let launchTrackIds = [];
try {
  const contract = YAML.parse(readFileSync(resolve(root, "docs/canonical-product-contract.yaml"), "utf8"));
  launchTrackIds = contract?.learningProducts?.launchTrackScope;
  if (!Array.isArray(launchTrackIds) || launchTrackIds.length !== 8 || launchTrackIds.some((id) => typeof id !== "string") || uniqueSorted(launchTrackIds).length !== 8) {
    blockers.push({ kind: "invalid_launch_scope_contract" });
    launchTrackIds = [];
  } else {
    launchTrackIds = uniqueSorted(launchTrackIds);
  }
} catch (error) {
  blockers.push({ kind: "unreadable_launch_scope_contract", error: readableError(error) });
}

let readiness = null;
try {
  readiness = readJson(resolve(contentRoot, "evidence/readiness/eight-track-launch-readiness.json"));
  if (readiness?.schemaVersion !== "eight-track-launch-readiness-v1" || !Array.isArray(readiness.launchTrackIds) || !Array.isArray(readiness.tracks)) {
    blockers.push({ kind: "invalid_content_readiness_report" });
    readiness = null;
  }
} catch (error) {
  blockers.push({ kind: "unreadable_content_readiness_report", error: readableError(error) });
}

const contentRepository = { ...contentRepositoryStatus(), headCommit: repositoryHeadCommit(contentRoot) };
if (contentRepository.status === "unavailable") blockers.push({ kind: "content_readiness_repository_unavailable", error: contentRepository.error });
if (contentRepository.status === "dirty") blockers.push({ kind: "content_readiness_worktree_dirty", changedPathCount: contentRepository.changedPathCount });
const contentSourceCommit = contentSourceCommitStatus(readiness?.sourceCommit);
if (contentSourceCommit.status === "invalid" || contentSourceCommit.status === "unreachable") blockers.push({ kind: "content_readiness_source_commit_unavailable", sourceCommit: readiness?.sourceCommit ?? null, actual: contentSourceCommit.status });

const contentReleaseLock = inspectReleaseLock();
const lockedTrackIds = contentReleaseLock.trackIds;
if (contentReleaseLock.status === "unavailable") blockers.push({ kind: "unreadable_content_release_lock", error: contentReleaseLock.error });
if (contentReleaseLock.status === "invalid") blockers.push({ kind: "invalid_content_release_lock", errors: contentReleaseLock.errors });

if (readiness) {
  const reportScope = uniqueSorted(readiness.launchTrackIds);
  if (JSON.stringify(reportScope) !== JSON.stringify(launchTrackIds)) blockers.push({ kind: "content_readiness_scope_mismatch", expected: launchTrackIds, actual: reportScope });
  const byTrackId = new Map(readiness.tracks.map((track) => [track?.trackId, track]));
  for (const trackId of launchTrackIds) {
    const track = byTrackId.get(trackId);
    if (!track) {
      blockers.push({ kind: "missing_track_readiness", trackId });
      continue;
    }
    if (!Number.isInteger(track.sourceFileCount) || track.sourceFileCount < 1 || !Number.isInteger(track.canonicalItemCount) || track.canonicalItemCount < 1) blockers.push({ kind: "canonical_source_not_ready", trackId });
    if (track.structuralValidation?.result !== "passed") blockers.push({ kind: "technical_validation_not_admitted", trackId, actual: track.structuralValidation?.result ?? null });
    if (track.humanReview !== "approved") blockers.push({ kind: "human_editorial_approval_missing", trackId, actual: track.humanReview ?? null });
    if (track.bundledFreeNodePackage?.presence !== "present") blockers.push({ kind: "free_node_package_missing", trackId });
    if (track.immutableArtifact?.presence !== "verified") blockers.push({ kind: "immutable_full_package_missing", trackId, actual: track.immutableArtifact?.presence ?? null });
    if (track.publishingAdmission !== "admitted") blockers.push({ kind: "publishing_admission_missing", trackId, actual: track.publishingAdmission ?? null });
    if (track.runtimeAdmission !== "admitted") blockers.push({ kind: "runtime_admission_missing", trackId, actual: track.runtimeAdmission ?? null });
  }
}

if (contentReleaseLock.status === "valid" && JSON.stringify(lockedTrackIds) !== JSON.stringify(launchTrackIds)) blockers.push({ kind: "application_release_lock_scope_mismatch", expected: launchTrackIds, actual: lockedTrackIds });

const external = externalEvidence.map((id) => externalEvidenceStatus(id, applicationCommit));
for (const evidence of external) if (evidence.status !== "verified") blockers.push({ kind: "external_release_evidence_missing", evidenceId: evidence.id, status: evidence.status, path: evidence.path });
const optionalExternal = optionalExternalEvidence.map((id) => externalEvidenceStatus(id, applicationCommit));

const report = {
  schemaVersion: "patternly-launch-readiness-v1",
  status: blockers.length === 0 ? "ready" : "not_ready",
  launchTrackIds,
  applicationRepository: { path: applicationRoot, headCommit: applicationCommit, ...applicationRepository },
  contentReadiness: readiness ? { path: resolve(contentRoot, "evidence/readiness/eight-track-launch-readiness.json"), sourceCommit: readiness.sourceCommit ?? null, headCommit: contentRepository.headCommit, repository: contentRepository.status, sourceCommitStatus: contentSourceCommit.status } : null,
  contentReleaseLock,
  applicationReleaseLockTrackIds: lockedTrackIds,
  externalEvidence: external,
  optionalExternalEvidence: optionalExternal,
  blockers: blockers.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (releaseGate && blockers.length) process.exitCode = 1;
