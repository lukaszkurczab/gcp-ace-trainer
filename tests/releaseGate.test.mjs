import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const root = process.cwd();

function run(enforce = false) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs", ...(enforce ? ["--enforce"] : [])], { cwd: root, encoding: "utf8" }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

function runWithContentRoot(contentRoot) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs"], { cwd: root, encoding: "utf8", env: { ...process.env, PATTERNLY_CONTENT_ROOT: contentRoot } }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

function runWithReleaseLock(releaseLockPath) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs"], { cwd: root, encoding: "utf8", env: { ...process.env, PATTERNLY_RELEASE_LOCK_PATH: releaseLockPath } }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

function runWithApplicationRoot(applicationRoot) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs"], { cwd: root, encoding: "utf8", env: { ...process.env, PATTERNLY_APPLICATION_ROOT: applicationRoot } }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

function runWithEvidenceRoot(evidenceRoot) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs"], { cwd: root, encoding: "utf8", env: { ...process.env, PATTERNLY_RELEASE_EVIDENCE_ROOT: evidenceRoot } }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

function evidenceRecord(id, applicationCommit, evidenceSha256 = undefined) {
  const identity = {
    applicationCommit,
    evidenceReferences: [{ kind: "test-proof", value: `synthetic://${id}` }],
    id,
    schemaVersion: "patternly-release-evidence-v2",
    status: "verified",
    verifiedAt: "2026-08-21T00:00:00.000Z",
    verifiedBy: "test-authority",
  };
  return { ...identity, evidenceSha256: evidenceSha256 ?? createHash("sha256").update(JSON.stringify(canonicalize(identity))).digest("hex") };
}

const requiredExternalEvidenceIds = [
  "design-authority",
  "security-and-privacy",
  "provider-and-operations",
  "signing-and-builds",
  "store-readiness",
  "product-owner-go",
];

test("launch readiness report is deterministic and exposes the unresolved release blockers", () => {
  const first = run();
  const second = run();
  assert.equal(first.status, 0);
  assert.equal(first.output, second.output);
  const report = JSON.parse(first.output);
  assert.equal(report.schemaVersion, "patternly-launch-readiness-v1");
  assert.equal(report.status, "not_ready");
  assert.equal(report.launchTrackIds.length, 8);
  assert.ok(["clean", "dirty"].includes(report.applicationRepository.status));
  assert.match(report.applicationRepository.headCommit, /^[a-f0-9]{40}$/u);
  assert.match(report.contentReadiness.headCommit, /^[a-f0-9]{40}$/u);
  assert.equal(report.blockers.some((blocker) => blocker.kind === "application_worktree_dirty"), report.applicationRepository.status === "dirty");
  assert.equal(report.contentReleaseLock.status, "valid");
  assert.equal(report.externalEvidence.find((evidence) => evidence.id === "signing-and-builds")?.status, "not_evidenced");
  assert.ok(report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing" && blocker.evidenceId === "signing-and-builds"));
  assert.ok(report.blockers.some((blocker) => blocker.kind === "unreadable_content_readiness_report")
    || report.blockers.some((blocker) => blocker.trackId === "microsoft-azure-administrator-associate-az-104"
      && [
        "canonical_source_not_ready",
        "free_node_package_missing",
        "immutable_full_package_missing",
        "publishing_admission_missing",
        "runtime_admission_missing",
        "technical_validation_not_admitted",
      ].includes(blocker.kind)));
  assert.equal(report.blockers.some((blocker) => blocker.kind === "human_editorial_approval_missing"), false);
  assert.ok(report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing"));
});

test("release gate fails while the readiness report contains blockers", () => {
  const result = run(true);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.output).status, "not_ready");
});

test("launch readiness fails closed when the content evidence checkout is dirty", () => {
  const contentRoot = mkdtempSync(join(tmpdir(), "patternly-release-gate-content-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: contentRoot });
    mkdirSync(join(contentRoot, "evidence", "readiness"), { recursive: true });
    writeFileSync(join(contentRoot, "evidence", "readiness", "eight-track-launch-readiness.json"), JSON.stringify({
      schemaVersion: "eight-track-launch-readiness-v1",
      sourceCommit: "0000000000000000000000000000000000000000",
      launchTrackIds: [],
      tracks: [],
    }));
    writeFileSync(join(contentRoot, "unreviewed-evidence.txt"), "must not be admitted\n");

    const result = runWithContentRoot(contentRoot);
    const report = JSON.parse(result.output);
    assert.equal(report.contentReadiness.repository, "dirty");
    assert.ok(report.blockers.some((blocker) => blocker.kind === "content_readiness_worktree_dirty"));
    assert.ok(report.blockers.some((blocker) => blocker.kind === "content_readiness_source_commit_unavailable"));
  } finally {
    rmSync(contentRoot, { recursive: true, force: true });
  }
});

test("launch readiness fails closed when the application release lock provenance is invalid", () => {
  const directory = mkdtempSync(join(tmpdir(), "patternly-release-lock-"));
  const releaseLockPath = join(directory, "release.lock.json");
  try {
    writeFileSync(releaseLockPath, JSON.stringify({
      schemaVersion: 2,
      repository: "lukaszkurczab/patternly-content",
      bundleId: "patternly-app-content-test",
      artifacts: [{
        releaseId: "patternly-core-test",
        producerCommit: "not-a-commit",
        sourceRepositoryCommit: "0000000000000000000000000000000000000000",
        trackId: "coding-interview-dsa-problem-solving",
        contentVersion: "coding-interview-test",
        checksumSha256: "not-a-checksum",
      }],
    }));

    const result = runWithReleaseLock(releaseLockPath);
    const report = JSON.parse(result.output);
    assert.equal(report.contentReleaseLock.status, "invalid");
    assert.ok(report.blockers.some((blocker) => blocker.kind === "invalid_content_release_lock"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("launch readiness fails closed when the application evidence checkout is dirty", () => {
  const applicationRoot = mkdtempSync(join(tmpdir(), "patternly-release-gate-app-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: applicationRoot });
    writeFileSync(join(applicationRoot, "unreviewed-build-input.txt"), "must not be admitted\n");

    const result = runWithApplicationRoot(applicationRoot);
    const report = JSON.parse(result.output);
    assert.equal(report.applicationRepository.status, "dirty");
    assert.ok(report.blockers.some((blocker) => blocker.kind === "application_worktree_dirty"));
  } finally {
    rmSync(applicationRoot, { recursive: true, force: true });
  }
});

test("launch readiness admits external evidence only when its envelope is bound and self-integral", () => {
  const evidenceRoot = mkdtempSync(join(tmpdir(), "patternly-release-evidence-"));
  try {
    const applicationCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const path = join(evidenceRoot, "design-authority.json");
    mkdirSync(evidenceRoot, { recursive: true });
    writeFileSync(path, JSON.stringify({
      schemaVersion: "patternly-release-evidence-v1",
      id: "design-authority",
      status: "verified",
      evidenceSha256: "a".repeat(64),
    }));
    let report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "design-authority")?.status, "invalid");

    writeFileSync(path, JSON.stringify(evidenceRecord("design-authority", applicationCommit)));
    report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "design-authority")?.status, "verified");

    writeFileSync(path, JSON.stringify(evidenceRecord("design-authority", applicationCommit, "b".repeat(64))));
    report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "design-authority")?.status, "invalid");
  } finally {
    rmSync(evidenceRoot, { recursive: true, force: true });
  }
});

test("physical-device evidence is reported and validated as optional external evidence", () => {
  const evidenceRoot = mkdtempSync(join(tmpdir(), "patternly-release-evidence-"));
  try {
    const applicationCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    mkdirSync(evidenceRoot, { recursive: true });
    for (const id of requiredExternalEvidenceIds) writeFileSync(join(evidenceRoot, `${id}.json`), JSON.stringify(evidenceRecord(id, applicationCommit)));

    let report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.deepEqual(report.externalEvidence.map((evidence) => evidence.id), requiredExternalEvidenceIds);
    assert.deepEqual(report.optionalExternalEvidence.map((evidence) => evidence.id), ["physical-device-matrix"]);
    assert.equal(report.optionalExternalEvidence[0].status, "not_evidenced");
    assert.ok(!report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing" && blocker.evidenceId === "physical-device-matrix"));

    writeFileSync(join(evidenceRoot, "physical-device-matrix.json"), JSON.stringify(evidenceRecord("physical-device-matrix", applicationCommit)));
    report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.optionalExternalEvidence[0].status, "verified");
  } finally {
    rmSync(evidenceRoot, { recursive: true, force: true });
  }
});
