import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import YAML from "yaml";

const root = process.cwd();
const contentRoot = resolve(process.env.PATTERNLY_CONTENT_ROOT ?? "../patternly-content");
const evidenceRoot = resolve(process.env.PATTERNLY_RELEASE_EVIDENCE_ROOT ?? "evidence/release");
const releaseGate = process.argv.includes("--enforce");

const externalEvidence = [
  "design-authority",
  "security-and-privacy",
  "provider-and-operations",
  "physical-device-matrix",
  "store-readiness",
  "product-owner-go",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function readableError(error) {
  return error instanceof Error ? error.message : String(error);
}

function externalEvidenceStatus(id) {
  const path = resolve(evidenceRoot, `${id}.json`);
  if (!existsSync(path)) return { id, path, status: "not_evidenced" };
  try {
    const value = readJson(path);
    if (value?.schemaVersion !== "patternly-release-evidence-v1" || value?.id !== id || value?.status !== "verified" || typeof value?.evidenceSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.evidenceSha256)) {
      return { id, path, status: "invalid" };
    }
    return { id, path, status: "verified" };
  } catch (error) {
    return { id, path, status: "invalid", error: readableError(error) };
  }
}

const blockers = [];
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

let lockedTrackIds = [];
try {
  const lock = readJson(resolve(root, "integration/contracts/content-release/release.lock.json"));
  lockedTrackIds = uniqueSorted(Array.isArray(lock?.artifacts) ? lock.artifacts.map((artifact) => artifact?.trackId).filter((id) => typeof id === "string") : []);
} catch (error) {
  blockers.push({ kind: "unreadable_content_release_lock", error: readableError(error) });
}

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

if (JSON.stringify(lockedTrackIds) !== JSON.stringify(launchTrackIds)) blockers.push({ kind: "application_release_lock_scope_mismatch", expected: launchTrackIds, actual: lockedTrackIds });

const external = externalEvidence.map(externalEvidenceStatus);
for (const evidence of external) if (evidence.status !== "verified") blockers.push({ kind: "external_release_evidence_missing", evidenceId: evidence.id, status: evidence.status, path: evidence.path });

const report = {
  schemaVersion: "patternly-launch-readiness-v1",
  status: blockers.length === 0 ? "ready" : "not_ready",
  launchTrackIds,
  contentReadiness: readiness ? { path: resolve(contentRoot, "evidence/readiness/eight-track-launch-readiness.json"), sourceCommit: readiness.sourceCommit ?? null } : null,
  applicationReleaseLockTrackIds: lockedTrackIds,
  externalEvidence: external,
  blockers: blockers.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (releaseGate && blockers.length) process.exitCode = 1;
