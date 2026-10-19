import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import "tsx/cjs";
import { createRequire } from "node:module";
import { verifyReleaseManifest } from "./releaseManifest.mjs";
import { validateReleaseEvidence, validateRuntimeReceipt } from "./releaseEvidence.mjs";
import { legalSourceFingerprint } from "./legalSourceFingerprint.mjs";
import { legalDocumentApprovalIssue } from "./publicLegalApproval.mjs";
import { currentContentWorktreeStatus } from "./currentContentWorktree.mjs";

const require = createRequire(import.meta.url);
const { validateLegalVariablesRelease } = require("../src/legal/legalVariablesSchema.ts");

const root = process.cwd();
let applicationRootInput = process.env.PATTERNLY_APPLICATION_ROOT ?? root;
let contentRootInput = process.env.PATTERNLY_CONTENT_ROOT ?? "../patternly-content";
let backendRootInput = process.env.PATTERNLY_BACKEND_ROOT ?? null;
let webRootInput = process.env.PATTERNLY_WEB_ROOT ?? null;
const evidenceRoot = resolve(process.env.PATTERNLY_RELEASE_EVIDENCE_ROOT ?? "evidence/release");
const releaseLockPath = resolve(process.env.PATTERNLY_RELEASE_LOCK_PATH ?? "integration/contracts/content-release/release.lock.json");
let releaseGate = false;
let requestedStage = null;
let seenStageArgument = false;
let outputPath = null;
let releaseManifestPath = process.env.PATTERNLY_RELEASE_MANIFEST_PATH ? resolve(process.env.PATTERNLY_RELEASE_MANIFEST_PATH) : null;
const seenRootArguments = new Set();
let seenManifestArgument = false;
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--enforce" && !releaseGate) releaseGate = true;
  else if (argument === "--stage" && !seenStageArgument) {
    const value = process.argv[index + 1];
    if (!value || !["local", "freeze", "go"].includes(value)) throw new Error("--stage requires local, freeze, or go");
    requestedStage = value;
    seenStageArgument = true;
    index += 1;
  }
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

const stage = requestedStage ?? "go";

const applicationRoot = realpathSync(resolve(applicationRootInput));
const contentRoot = realpathSync(resolve(contentRootInput));

const applicationReleaseLockRelativePath = "integration/contracts/content-release/release.lock.json";
const publicLegalRelativePath = "config/public-legal.release.json";
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

const canonicalHash = legalSourceFingerprint;

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

function repositoryStatus(repositoryRoot, { allowDerivedContent = false } = {}) {
  if (allowDerivedContent) return currentContentWorktreeStatus(repositoryRoot);
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
  if (lock?.schemaVersion !== 4) errors.push("schemaVersion must be 4");
  if (lock?.ownerPolicy !== "standing-owner-decision-2026-10-19-current-source") errors.push("ownerPolicy does not identify the current-source policy");
  if (!/^[a-f0-9]{64}$/u.test(lock?.sourceInputFingerprint ?? "")) errors.push("sourceInputFingerprint must be a current SHA-256 identity");
  if (!/^[a-f0-9]{64}$/u.test(lock?.bundledSuccessorLedgerSha256 ?? "")) errors.push("bundledSuccessorLedgerSha256 must be a current SHA-256 hash");
  if (lock?.currentIdentity?.sourceInputFingerprint !== lock?.sourceInputFingerprint) errors.push("currentIdentity does not match sourceInputFingerprint");
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
      if (!Number.isSafeInteger(artifact.artifactBytes) || artifact.artifactBytes < 1) errors.push(`${prefix}.artifactBytes must be a positive byte length`);
      if (!Number.isSafeInteger(artifact.questionCount) || artifact.questionCount < 1) errors.push(`${prefix}.questionCount must be a positive question count`);
    }
  }
  if (new Set(trackIds).size !== trackIds.length) errors.push("artifacts.trackId values must be unique");
  const identityTrackIds = lock?.currentIdentity?.tracks?.map((track) => track.trackId) ?? [];
  if (JSON.stringify(identityTrackIds) !== JSON.stringify(uniqueSorted(trackIds))) errors.push("currentIdentity track scope differs from artifacts");
  if (Array.isArray(lock?.artifacts) && Array.isArray(lock?.currentIdentity?.tracks)) {
    const rows = new Map(lock.currentIdentity.tracks.map((track) => [track.trackId, track]));
    for (const artifact of lock.artifacts) {
      const row = rows.get(artifact.trackId);
      if (row?.artifactSha256 !== artifact.checksumSha256 || row?.artifactBytes !== artifact.artifactBytes || row?.contentVersion !== artifact.contentVersion || row?.questionCount !== artifact.questionCount || artifact.releaseId !== lock.releaseId) errors.push(`current identity differs from artifact ${artifact.trackId}`);
    }
  }

  return {
    repositoryRole: "application",
    status: errors.length === 0 ? "valid" : "invalid",
    path: applicationReleaseLockRelativePath,
    schemaVersion: lock?.schemaVersion ?? null,
    sourceInputFingerprint: lock?.sourceInputFingerprint ?? null,
    currentIdentity: lock?.currentIdentity ?? null,
    bundleId: lock?.bundleId ?? null,
    trackIds: uniqueSorted(trackIds),
    errors,
  };
}

function inspectPublicLegalVariables() {
  const path = resolve(applicationRoot, publicLegalRelativePath);
  let encoded;
  try {
    encoded = readFileSync(path, "utf8");
  } catch (error) {
    return {
      status: error?.code === "ENOENT" ? "missing" : "unavailable",
      path: publicLegalRelativePath,
      version: null,
      fingerprint: null,
      fieldPaths: [],
    };
  }

  let value;
  try {
    value = JSON.parse(encoded);
  } catch {
    return { status: "malformed", path: publicLegalRelativePath, version: null, fingerprint: null, fieldPaths: [] };
  }

  const issues = validateLegalVariablesRelease(value);
  const isExplicitlyUnapproved = value?.legalDocumentApproval?.status === "UNAPPROVED";
  if (isExplicitlyUnapproved) issues.push({ path: "legalDocumentApproval.status", message: "Production legal documents are not approved." });
  const approvalIssue = legalDocumentApprovalIssue(value);
  if (approvalIssue) issues.push({ path: "legalDocumentApproval.renderedDocumentsSha256", message: approvalIssue });
  const fieldPaths = uniqueSorted(issues.map(({ path: fieldPath }) => fieldPath));
  const hasUnresolvedPlaceholders = issues.some(({ message }) => message === "Unresolved legal placeholder.");
  const hasOtherIssues = issues.some(({ message }) => message !== "Unresolved legal placeholder."
    && message !== "Production legal documents are not approved.");
  const documentVersion = value?.documentVersion;
  const versionIsDatePair = documentVersion
    && typeof documentVersion === "object"
    && !Array.isArray(documentVersion)
    && hasExactKeys(documentVersion, ["en", "pl", "de", "fr", "es", "it", "et"])
    && Object.values(documentVersion).every((version) => typeof version === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(version));
  return {
    status: hasOtherIssues ? "invalid" : hasUnresolvedPlaceholders || isExplicitlyUnapproved ? "incomplete" : "valid",
    path: publicLegalRelativePath,
    version: versionIsDatePair ? documentVersion : null,
    fingerprint: canonicalHash(value),
    fieldPaths,
  };
}

function externalEvidenceStatus(id, expectedApplicationCommit, verifiedManifest = null) {
  const path = resolve(evidenceRoot, `${id}.json`);
  const portablePath = `${releaseEvidenceRelativeDirectory}/${id}.json`;
  if (!existsSync(path)) return { id, repositoryRole: "application", path: portablePath, status: "not_evidenced" };
  try {
    const value = readJson(path);
    validateReleaseEvidence(value, { expectedId: id, expectedApplicationCommit });
    if (id === "physical-device-matrix") validateRuntimeReceipt(value.runtimeReceipt, verifiedManifest);
    return { id, repositoryRole: "application", path: portablePath, status: "verified", applicationCommit: value.applicationCommit, evidenceSha256: value.evidenceSha256, ...(id === "physical-device-matrix" ? { runtimeReceipt: value.runtimeReceipt } : {}) };
  } catch (error) {
    return { id, repositoryRole: "application", path: portablePath, status: "invalid", error: portableError(error) };
  }
}

const blockers = [];
const applicationRepository = repositoryStatus(applicationRoot, { allowDerivedContent: true });
const applicationCommit = applicationHeadCommit();
const publicLegalVariables = inspectPublicLegalVariables();
if (publicLegalVariables.status === "missing") blockers.push({ kind: "public_legal_variables_missing", path: publicLegalVariables.path });
else if (publicLegalVariables.status === "malformed") blockers.push({ kind: "public_legal_variables_malformed", path: publicLegalVariables.path });
else if (publicLegalVariables.status === "unavailable") blockers.push({ kind: "public_legal_variables_unavailable", path: publicLegalVariables.path });
else if (publicLegalVariables.status === "incomplete" || publicLegalVariables.status === "invalid") {
  blockers.push({
    kind: publicLegalVariables.status === "incomplete" ? "public_legal_variables_incomplete" : "public_legal_variables_invalid",
    path: publicLegalVariables.path,
    fieldPaths: publicLegalVariables.fieldPaths,
  });
}
if (applicationRepository.status === "unavailable") blockers.push({ kind: "application_repository_unavailable", error: applicationRepository.error });
if (applicationRepository.status === "dirty") blockers.push({ kind: "application_worktree_dirty", changedPathCount: applicationRepository.changedPathCount, unexpectedPaths: applicationRepository.unexpectedPaths });
const contentReleaseLock = inspectReleaseLock();
const lockedTrackIds = contentReleaseLock.trackIds;
if (contentReleaseLock.status === "unavailable") blockers.push({ kind: "unreadable_content_release_lock", error: contentReleaseLock.error });
if (contentReleaseLock.status === "invalid") blockers.push({ kind: "invalid_content_release_lock", errors: contentReleaseLock.errors });
if (contentReleaseLock.status === "valid" && lockedTrackIds.length !== 9) blockers.push({ kind: "invalid_content_release_scope", actual: lockedTrackIds });
const launchTrackIds = contentReleaseLock.status === "valid" && lockedTrackIds.length === 9 ? lockedTrackIds : [];

let currentContentIdentity = null;
try {
  const identityModule = await import(pathToFileURL(resolve(contentRoot, "scripts/content/current-source-identity.mjs")).href);
  const identity = await identityModule.computeCurrentSourceIdentity({ contentRoot });
  const bundled = await import(pathToFileURL(resolve(root, "scripts/verifyBundledCurrentContent.mjs")).href);
  const installed = await bundled.verifyBundledCurrentContent({ root: applicationRoot });
  if (identity.sourceInputFingerprint !== contentReleaseLock.sourceInputFingerprint || JSON.stringify(identity.tracks) !== JSON.stringify(contentReleaseLock.currentIdentity?.tracks)) throw new Error("current source differs from installed APP content");
  currentContentIdentity = { sourceRepositoryCommit: installed.sourceRepositoryCommit, sourceInputFingerprint: identity.sourceInputFingerprint, releaseId: installed.releaseId, artifactDigests: installed.artifactDigests };
} catch (error) {
  blockers.push({ kind: "current_content_identity_failed", error: portableError(error) });
}

const contentRepository = { ...contentRepositoryStatus(), headCommit: repositoryHeadCommit(contentRoot) };
if (contentRepository.status === "unavailable") blockers.push({ kind: "content_source_repository_unavailable", error: contentRepository.error });
if (contentRepository.status === "dirty") blockers.push({ kind: "content_source_worktree_dirty", changedPathCount: contentRepository.changedPathCount });

if (contentReleaseLock.status === "valid" && JSON.stringify(lockedTrackIds) !== JSON.stringify(launchTrackIds)) blockers.push({ kind: "application_release_lock_scope_mismatch", expected: launchTrackIds, actual: lockedTrackIds });

let releaseManifest = null;
if (!releaseManifestPath) {
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
        evidenceRoot,
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
        iosBuild: verified.iosBuild,
        configurationFingerprint: verified.configurationFingerprint,
        evidence: verified.evidence,
        otaPolicy: verified.otaPolicy,
      };
    } catch (error) {
      releaseManifest = { status: "invalid" };
      blockers.push({ kind: "release_manifest_invalid", reason: portableManifestError(error) });
    }
  }
}

const external = externalEvidence.map((id) => externalEvidenceStatus(id, applicationCommit, releaseManifest));
for (const evidence of external) if (evidence.status !== "verified") blockers.push({ kind: "external_release_evidence_missing", evidenceId: evidence.id, status: evidence.status, path: evidence.path });
const optionalExternal = optionalExternalEvidence.map((id) => externalEvidenceStatus(id, applicationCommit, releaseManifest));
for (const evidence of optionalExternal) if (evidence.status !== "verified") blockers.push({ kind: "external_release_evidence_missing", evidenceId: evidence.id, status: evidence.status, path: evidence.path });

const STAGE_ORDER = Object.freeze({ local: 0, freeze: 1, go: 2 });
function blockerMinimumStage(blocker) {
  if (blocker.kind.startsWith("public_legal_variables_") || blocker.kind.startsWith("release_manifest_")) return "freeze";
  if (blocker.kind === "external_release_evidence_missing") return blocker.evidenceId === "signing-and-builds" ? "freeze" : "go";
  return "local";
}
function blockersForStage(targetStage) {
  return blockers
    .filter((blocker) => STAGE_ORDER[blockerMinimumStage(blocker)] <= STAGE_ORDER[targetStage])
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}
const stageResults = Object.freeze(Object.fromEntries(["local", "freeze", "go"].map((targetStage) => {
  const targetBlockers = blockersForStage(targetStage);
  return [targetStage, Object.freeze({ status: targetBlockers.length === 0 ? "ready" : "not_ready", blockers: targetBlockers })];
})));
const activeBlockers = stageResults[stage].blockers;

const report = {
  schemaVersion: "patternly-launch-readiness-v2",
  stage,
  status: stageResults[stage].status,
  stages: stageResults,
  launchTrackIds,
  applicationRepository: { repositoryRole: "application", path: ".", headCommit: applicationCommit, ...applicationRepository },
  publicLegalVariables,
  currentContentIdentity: currentContentIdentity ? { repositoryRole: "content", path: "scripts/content/current-source-identity.mjs", ...currentContentIdentity, headCommit: contentRepository.headCommit, repository: contentRepository.status } : null,
  contentReleaseLock,
  applicationReleaseLockTrackIds: lockedTrackIds,
  releaseManifest,
  externalEvidence: external,
  optionalExternalEvidence: optionalExternal,
  blockers: activeBlockers,
};

const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) writeFileSync(outputPath, serializedReport);
process.stdout.write(serializedReport);
if (releaseGate && activeBlockers.length) process.exitCode = 1;
