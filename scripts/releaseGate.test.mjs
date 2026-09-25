import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

function runArgs(args, env = {}) {
  try {
    return { status: 0, output: execFileSync("node", ["scripts/releaseGate.mjs", ...args], { cwd: root, encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (error) {
    return { status: error.status, output: error.stdout, error: error.stderr };
  }
}

function runWithContentRoot(contentRoot, args = [], applicationRoot = root) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs", ...args], { cwd: root, encoding: "utf8", env: { ...process.env, PATTERNLY_CONTENT_ROOT: contentRoot, PATTERNLY_APPLICATION_ROOT: applicationRoot } }),
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
    ...(id === "signing-and-builds" ? { releaseBinding: {
      iosBuild: { appVersion: "0.1.0", buildId: "test-ios-build-001", buildNumber: "42", bundleIdentifier: "com.lkurczab.patternly" },
      configuration: {
        apiOrigin: "https://api.patternly.test", appCheckAppleProvider: "appAttestWithDeviceCheckFallback", authActionOrigin: "https://auth.patternly.test",
        channel: "production", environment: "production", firebaseProjectId: "patternly-production", iosAssociatedDomain: "applinks:patternly.test", otaPolicy: "embedded-only",
        publicWebOrigin: "https://patternly.test", runtimeMode: "release", runtimeVersion: "0.1.0", updatesCheckAutomatically: "NEVER", updatesEnabled: false, updatesUrl: "https://u.expo.dev/test-project",
      },
    } } : {}),
    ...(id === "physical-device-matrix" ? { runtimeReceipt: { channel: "production", iosBuildId: "test-ios-build-001", launchedArtifact: "embedded", manifestId: "a".repeat(64), otaPolicy: "embedded-only", runtimeVersion: "0.1.0" } } : {}),
    schemaVersion: "patternly-release-evidence-v2",
    status: "verified",
    verifiedAt: "2026-08-21T00:00:00.000Z",
    verifiedBy: "test-authority",
  };
  return { ...identity, evidenceSha256: evidenceSha256 ?? createHash("sha256").update(JSON.stringify(canonicalize(identity))).digest("hex") };
}

const requiredExternalEvidenceIds = [
  "security-and-privacy",
  "provider-and-operations",
  "signing-and-builds",
  "store-readiness",
  "product-owner-go",
];

function createAdmittedContentRoot({ mutateReadiness = null, mutateCandidate = null, mutateApproval = null } = {}) {
  const contentRoot = mkdtempSync(join(tmpdir(), "patternly-release-gate-content-admitted-"));
  const sourceContentRoot = join(root, "..", "patternly-content");
  execFileSync("git", ["init", "-q"], { cwd: contentRoot });
  symlinkSync(join(sourceContentRoot, "scripts"), join(contentRoot, "scripts"));
  symlinkSync(join(sourceContentRoot, "schemas"), join(contentRoot, "schemas"));
  mkdirSync(join(contentRoot, "evidence", "content-acceptance"), { recursive: true });
  mkdirSync(join(contentRoot, "evidence", "human-content-approvals"), { recursive: true });
  mkdirSync(join(contentRoot, "evidence", "readiness"), { recursive: true });
  const candidate = JSON.parse(readFileSync(join(sourceContentRoot, "evidence/content-acceptance/candidate-manifest-v1.json"), "utf8"));
  const approval = JSON.parse(readFileSync(join(sourceContentRoot, "evidence/human-content-approvals/manifest.json"), "utf8"));
  const readiness = JSON.parse(readFileSync(join(sourceContentRoot, "evidence/readiness/candidate-readiness.json"), "utf8"));
  mutateCandidate?.(candidate);
  mutateApproval?.(approval);
  mutateReadiness?.(readiness);
  writeFileSync(join(contentRoot, "evidence", "content-acceptance", "candidate-manifest-v1.json"), JSON.stringify(candidate));
  writeFileSync(join(contentRoot, "evidence", "human-content-approvals", "manifest.json"), JSON.stringify(approval));
  writeFileSync(join(contentRoot, "evidence", "readiness", "candidate-readiness.json"), JSON.stringify(readiness));
  execFileSync("git", ["add", "."], { cwd: contentRoot });
  execFileSync("git", ["-c", "user.name=release-gate-test", "-c", "user.email=release-gate-test@example.com", "commit", "-qm", "readiness"], { cwd: contentRoot });
  return contentRoot;
}

function createCleanApplicationRoot() {
  const applicationRoot = mkdtempSync(join(tmpdir(), "patternly-release-gate-app-clean-"));
  execFileSync("git", ["init", "-q"], { cwd: applicationRoot });
  writeFileSync(join(applicationRoot, "source.txt"), "application source\n");
  execFileSync("git", ["add", "source.txt"], { cwd: applicationRoot });
  execFileSync("git", ["-c", "user.name=release-gate-test", "-c", "user.email=release-gate-test@example.com", "commit", "-qm", "source"], { cwd: applicationRoot });
  return applicationRoot;
}

function releaseLegalFixture() {
  const legal = JSON.parse(readFileSync(join(root, "config", "public-legal.release.json"), "utf8"));
  const resolvePlaceholders = (value) => {
    if (Array.isArray(value)) return value.map(resolvePlaceholders);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolvePlaceholders(child)]));
    return typeof value === "string" && /^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA):/.test(value) ? "Resolved legal value" : value;
  };
  const resolved = resolvePlaceholders(legal);
  resolved.publicLinks = {
    privacyUrl: "https://patternly.example/privacy",
    termsUrl: "https://patternly.example/terms",
    supportUrl: "https://patternly.example/support",
  };
  return resolved;
}

function writeApplicationLegal(applicationRoot, contents) {
  const configDirectory = join(applicationRoot, "config");
  mkdirSync(configDirectory, { recursive: true });
  writeFileSync(join(configDirectory, "public-legal.release.json"), contents);
}

test("launch readiness report is deterministic and exposes the unresolved release blockers", () => {
  const contentRoot = createAdmittedContentRoot();
  try {
    const first = runWithContentRoot(contentRoot);
    const second = runWithContentRoot(contentRoot);
    assert.equal(first.status, 0);
    assert.equal(first.output, second.output);
    const report = JSON.parse(first.output);
    assert.equal(report.schemaVersion, "patternly-launch-readiness-v2");
    assert.equal(report.stage, "go");
    assert.equal(report.status, "not_ready");
    assert.equal(report.publicLegalVariables.status, "incomplete");
    assert.equal(report.publicLegalVariables.path, "config/public-legal.release.json");
    assert.deepEqual(report.publicLegalVariables.version, { en: "2026-09-05", pl: "2026-09-05" });
    assert.match(report.publicLegalVariables.fingerprint, /^[a-f0-9]{64}$/u);
    assert.ok(report.publicLegalVariables.fieldPaths.includes("terms.adrEntity.en"));
    assert.ok(report.blockers.some((blocker) => blocker.kind === "public_legal_variables_incomplete"));
    assert.equal(JSON.stringify(report.publicLegalVariables).includes("TO BE COMPLETED"), false);
    assert.equal(report.launchTrackIds.length, 9);
    assert.ok(["clean", "dirty"].includes(report.applicationRepository.status));
    assert.match(report.applicationRepository.headCommit, /^[a-f0-9]{40}$/u);
    assert.match(report.contentReadiness.headCommit, /^[a-f0-9]{40}$/u);
    assert.equal(report.blockers.every((blocker) => ["application_worktree_dirty", "external_release_evidence_missing", "public_legal_variables_incomplete", "release_manifest_missing"].includes(blocker.kind)), true);
    assert.ok(report.blockers.some((blocker) => blocker.kind === "release_manifest_missing"));
    assert.deepEqual(
      report.blockers.filter((blocker) => blocker.kind === "application_worktree_dirty").map((blocker) => blocker.kind),
      report.applicationRepository.status === "dirty" ? ["application_worktree_dirty"] : [],
    );
    const externalBlockers = report.blockers.filter((blocker) => blocker.kind === "external_release_evidence_missing");
    assert.equal(externalBlockers.length, requiredExternalEvidenceIds.length + 1);
    assert.deepEqual(externalBlockers.map((blocker) => blocker.evidenceId).sort(), [...requiredExternalEvidenceIds, "physical-device-matrix"].sort());
    assert.equal(report.contentReleaseLock.status, "valid");
    assert.equal(report.contentReadiness.repository, "clean");
    assert.match(report.contentReadiness.candidateId, /^[a-f0-9]{64}$/u);
    assert.deepEqual(report.contentReadiness.trackIds, report.launchTrackIds);
    assert.equal(report.externalEvidence.some((evidence) => evidence.id === "design-authority"), false);
    assert.equal(report.blockers.some((blocker) => blocker.evidenceId === "design-authority"), false);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "signing-and-builds")?.status, "not_evidenced");
    assert.ok(report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing" && blocker.evidenceId === "signing-and-builds"));
    assert.ok(report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing"));
    assert.equal(first.output.includes(root), false);
  } finally {
    rmSync(contentRoot, { recursive: true, force: true });
  }
});

test("release readiness reports missing, malformed, and complete public legal configuration safely", () => {
  const applicationRoot = createCleanApplicationRoot();
  try {
    let report = JSON.parse(runWithApplicationRoot(applicationRoot).output);
    assert.equal(report.publicLegalVariables.status, "missing");
    assert.deepEqual(report.blockers.find((blocker) => blocker.kind === "public_legal_variables_missing"), {
      kind: "public_legal_variables_missing",
      path: "config/public-legal.release.json",
    });

    const malformedSecret = "private-secret-marker";
    writeApplicationLegal(applicationRoot, `{ "secret": "${malformedSecret}" `);
    report = JSON.parse(runWithApplicationRoot(applicationRoot).output);
    assert.equal(report.publicLegalVariables.status, "malformed");
    assert.equal(report.blockers.some((blocker) => blocker.kind === "public_legal_variables_malformed"), true);
    assert.equal(JSON.stringify(report).includes(malformedSecret), false);

    const invalidVersionSecret = "private-version-secret";
    const invalidVersion = releaseLegalFixture();
    invalidVersion.documentVersion = { en: invalidVersionSecret, pl: "2026-09-05", unexpected: "invalid-shape" };
    writeApplicationLegal(applicationRoot, JSON.stringify(invalidVersion));
    report = JSON.parse(runWithApplicationRoot(applicationRoot).output);
    assert.equal(report.publicLegalVariables.status, "invalid");
    assert.equal(report.publicLegalVariables.version, null);
    assert.equal(JSON.stringify(report).includes(invalidVersionSecret), false);

    const mixedIssueSecret = "private-invalid-field-secret";
    const mixedIssues = releaseLegalFixture();
    mixedIssues.premiumCheckoutEnabled = mixedIssueSecret;
    mixedIssues.terms.adrEntity.en = "[TO BE COMPLETED: adrEntity]";
    writeApplicationLegal(applicationRoot, JSON.stringify(mixedIssues));
    report = JSON.parse(runWithApplicationRoot(applicationRoot).output);
    assert.equal(report.publicLegalVariables.status, "invalid");
    assert.ok(report.publicLegalVariables.fieldPaths.includes("premiumCheckoutEnabled"));
    assert.ok(report.publicLegalVariables.fieldPaths.includes("terms.adrEntity.en"));
    assert.equal(JSON.stringify(report).includes(mixedIssueSecret), false);

    const invalidPrivacyPath = releaseLegalFixture();
    invalidPrivacyPath.publicLinks.privacyUrl = "https://patternly.example/legal/privacy";
    writeApplicationLegal(applicationRoot, JSON.stringify(invalidPrivacyPath));
    report = JSON.parse(runWithApplicationRoot(applicationRoot).output);
    assert.equal(report.publicLegalVariables.status, "invalid");
    assert.deepEqual(report.publicLegalVariables.fieldPaths, ["publicLinks.privacyUrl"]);

    writeApplicationLegal(applicationRoot, JSON.stringify(releaseLegalFixture()));
    report = JSON.parse(runWithApplicationRoot(applicationRoot).output);
    assert.equal(report.publicLegalVariables.status, "valid");
    assert.deepEqual(report.publicLegalVariables.fieldPaths, []);
    assert.match(report.publicLegalVariables.fingerprint, /^[a-f0-9]{64}$/u);
    assert.equal(report.blockers.some((blocker) => blocker.kind.startsWith("public_legal_variables_")), false);
  } finally {
    rmSync(applicationRoot, { recursive: true, force: true });
  }
});

test("launch readiness rejects a forged editorial approval", () => {
  const trackId = "coding-interview-dsa-problem-solving";
  const contentRoot = createAdmittedContentRoot({ mutateReadiness: (readiness) => { readiness.tracks.find((track) => track.trackId === trackId).humanApproval = null; } });
  try {
    const result = runWithContentRoot(contentRoot);
    assert.equal(result.status, 0);
    const report = JSON.parse(result.output);
    assert.equal(report.contentReadiness, null);
    assert.ok(report.blockers.some((blocker) => blocker.kind === "invalid_content_readiness_report"));
  } finally {
    rmSync(contentRoot, { recursive: true, force: true });
  }
});

test("release gate fails while the readiness report contains blockers", () => {
  const result = run(true);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.output).status, "not_ready");
});

test("enforced release gate requires a verified four-repository manifest", () => {
  const result = run(true);
  const report = JSON.parse(result.output);
  assert.equal(result.status, 1);
  assert.equal(report.releaseManifest?.status, "missing");
  assert.ok(report.blockers.some((blocker) => blocker.kind === "release_manifest_missing"));
});

test("launch readiness fails closed when the content evidence checkout is dirty", () => {
  const contentRoot = mkdtempSync(join(tmpdir(), "patternly-release-gate-content-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: contentRoot });
    mkdirSync(join(contentRoot, "evidence", "readiness"), { recursive: true });
    writeFileSync(join(contentRoot, "evidence", "readiness", "candidate-readiness.json"), JSON.stringify({
      schemaVersion: "patternly-candidate-readiness-v2",
      candidateId: "a".repeat(64),
      trackIds: [],
      tracks: [],
    }));
    writeFileSync(join(contentRoot, "unreviewed-evidence.txt"), "must not be admitted\n");

    const result = runWithContentRoot(contentRoot);
    const report = JSON.parse(result.output);
    assert.equal(report.contentReadiness, null);
    assert.ok(report.blockers.some((blocker) => blocker.kind === "content_readiness_worktree_dirty"));
  } finally {
    rmSync(contentRoot, { recursive: true, force: true });
  }
});

test("explicit report output is written after inspection and does not dirty either worktree", () => {
  const contentRoot = createAdmittedContentRoot();
  const applicationRoot = createCleanApplicationRoot();
  const outputDirectory = mkdtempSync(join(tmpdir(), "patternly-release-report-"));
  const outputPath = join(outputDirectory, "report.json");
  try {
    const result = runWithContentRoot(contentRoot, ["--output", outputPath], applicationRoot);
    assert.equal(result.status, 0);
    assert.equal(readFileSync(outputPath, "utf8"), result.output);
    const report = JSON.parse(result.output);
    assert.equal(report.contentReadiness.repository, "clean");
    assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: contentRoot, encoding: "utf8" }), "");
    assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: applicationRoot, encoding: "utf8" }), "");
    assert.ok(!report.blockers.some((blocker) => blocker.kind === "application_worktree_dirty"));
  } finally {
    rmSync(contentRoot, { recursive: true, force: true });
    rmSync(applicationRoot, { recursive: true, force: true });
    rmSync(outputDirectory, { recursive: true, force: true });
  }
});

test("owning validator rejects stale identity and malformed readiness semantics", () => {
  const cases = [
    ["manifest path", { mutateReadiness: (value) => { value.candidateManifestPath = "wrong.json"; } }],
    ["candidate id", { mutateReadiness: (value) => { value.candidateId = "b".repeat(64); } }],
    ["fake approval", { mutateReadiness: (value) => { value.tracks[0].humanApproval.approvalId = "fake"; } }],
    ["family", { mutateReadiness: (value) => { value.tracks[0].familyId = "wrong"; } }],
    ["source", { mutateReadiness: (value) => { value.tracks[0].source.sourceFileCount += 1; } }],
    ["current source", { mutateReadiness: (value) => { value.tracks[0].currentSource.sourceFileCount += 1; } }],
    ["structural command", { mutateReadiness: (value) => { value.tracks[0].structuralValidation.command = ""; } }],
    ["extra field", { mutateReadiness: (value) => { value.unexpected = true; } }],
    ["manifest identity", { mutateCandidate: (value) => { value.tracks[0].familyId = "wrong"; } }],
    ["approval identity", { mutateApproval: (value) => { value.tracks[0].approvalId = "fake"; } }],
  ];
  for (const [name, mutations] of cases) {
    const contentRoot = createAdmittedContentRoot(mutations);
    try {
      const report = JSON.parse(runWithContentRoot(contentRoot).output);
      assert.equal(report.contentReadiness, null, name);
      assert.ok(report.blockers.some((blocker) => blocker.kind === "invalid_content_readiness_report"), name);
    } finally {
      rmSync(contentRoot, { recursive: true, force: true });
    }
  }
});

test("enforced mode still writes a valid report before returning exit 1", () => {
  const contentRoot = createAdmittedContentRoot();
  const outputDirectory = mkdtempSync(join(tmpdir(), "patternly-release-report-"));
  const outputPath = join(outputDirectory, "report.json");
  try {
    const result = runWithContentRoot(contentRoot, ["--enforce", "--output", outputPath]);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(readFileSync(outputPath, "utf8")).status, "not_ready");
  } finally {
    rmSync(contentRoot, { recursive: true, force: true });
    rmSync(outputDirectory, { recursive: true, force: true });
  }
});

test("CLI rejects malformed arguments and physical output paths inside either worktree", () => {
  const aliasRoot = mkdtempSync(join(tmpdir(), "patternly-release-output-alias-"));
  const appAlias = join(aliasRoot, "app-alias");
  const danglingTarget = join(root, "must-not-be-created-by-release-gate.json");
  const danglingOutput = join(aliasRoot, "dangling-report.json");
  symlinkSync(root, appAlias);
  symlinkSync(danglingTarget, danglingOutput);
  const cases = [
    ["missing value", ["--output"]],
    ["duplicate output", ["--output", join(tmpdir(), "one.json"), "--output", join(tmpdir(), "two.json")]],
    ["unknown argument", ["--unknown"]],
    ["inside application", ["--output", join(root, "report.json")]],
    ["inside content", ["--output", join(root, "..", "patternly-content", "report.json")]],
    ["symlink alias into application", ["--output", join(appAlias, "report.json")]],
    ["dangling final symlink into application", ["--output", danglingOutput]],
    ["missing parent", ["--output", join(aliasRoot, "missing", "report.json")]],
  ];
  try {
    for (const [name, args] of cases) assert.notEqual(runArgs(args).status, 0, name);
    assert.equal(existsSync(danglingTarget), false);
  } finally {
    rmSync(aliasRoot, { recursive: true, force: true });
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
    const path = join(evidenceRoot, "signing-and-builds.json");
    mkdirSync(evidenceRoot, { recursive: true });
    writeFileSync(path, JSON.stringify({
      schemaVersion: "patternly-release-evidence-v1",
      id: "signing-and-builds",
      status: "verified",
      evidenceSha256: "a".repeat(64),
    }));
    let report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "signing-and-builds")?.status, "invalid");

    writeFileSync(path, JSON.stringify(evidenceRecord("signing-and-builds", applicationCommit)));
    report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "signing-and-builds")?.status, "verified");

    writeFileSync(path, JSON.stringify(evidenceRecord("signing-and-builds", applicationCommit, "b".repeat(64))));
    report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.externalEvidence.find((evidence) => evidence.id === "signing-and-builds")?.status, "invalid");
  } finally {
    rmSync(evidenceRoot, { recursive: true, force: true });
  }
});

test("physical-device evidence is optional through freeze and mandatory at go", () => {
  const evidenceRoot = mkdtempSync(join(tmpdir(), "patternly-release-evidence-"));
  try {
    const applicationCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    mkdirSync(evidenceRoot, { recursive: true });
    for (const id of requiredExternalEvidenceIds) writeFileSync(join(evidenceRoot, `${id}.json`), JSON.stringify(evidenceRecord(id, applicationCommit)));

    let report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.deepEqual(report.externalEvidence.map((evidence) => evidence.id), requiredExternalEvidenceIds);
    assert.deepEqual(report.optionalExternalEvidence.map((evidence) => evidence.id), ["physical-device-matrix"]);
    assert.equal(report.optionalExternalEvidence[0].status, "not_evidenced");
    assert.ok(report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing" && blocker.evidenceId === "physical-device-matrix"));
    const freeze = JSON.parse(runArgs(["--stage", "freeze"], { PATTERNLY_RELEASE_EVIDENCE_ROOT: evidenceRoot }).output);
    assert.ok(!freeze.blockers.some((blocker) => blocker.evidenceId === "physical-device-matrix"));

    writeFileSync(join(evidenceRoot, "physical-device-matrix.json"), JSON.stringify(evidenceRecord("physical-device-matrix", applicationCommit)));
    report = JSON.parse(runWithEvidenceRoot(evidenceRoot).output);
    assert.equal(report.optionalExternalEvidence[0].status, "invalid");
  } finally {
    rmSync(evidenceRoot, { recursive: true, force: true });
  }
});

test("stage contract keeps PO, provider, store, and device evidence out of local and freeze", () => {
  const local = JSON.parse(runArgs(["--stage", "local"]).output);
  assert.equal(local.stage, "local");
  assert.ok(!local.blockers.some((blocker) => blocker.kind.startsWith("public_legal_variables_") || blocker.kind.startsWith("release_manifest_") || blocker.kind === "external_release_evidence_missing"));

  const freeze = JSON.parse(runArgs(["--stage", "freeze"]).output);
  assert.equal(freeze.stage, "freeze");
  assert.ok(freeze.blockers.some((blocker) => blocker.kind.startsWith("public_legal_variables_")));
  assert.ok(freeze.blockers.some((blocker) => blocker.kind === "release_manifest_missing"));
  assert.ok(freeze.blockers.some((blocker) => blocker.evidenceId === "signing-and-builds"));
  for (const evidenceId of ["provider-and-operations", "store-readiness", "product-owner-go", "physical-device-matrix"]) {
    assert.ok(!freeze.blockers.some((blocker) => blocker.evidenceId === evidenceId), evidenceId);
  }

  const go = JSON.parse(runArgs(["--stage", "go"]).output);
  for (const evidenceId of ["provider-and-operations", "store-readiness", "product-owner-go", "physical-device-matrix"]) {
    assert.ok(go.blockers.some((blocker) => blocker.evidenceId === evidenceId), evidenceId);
  }
  assert.deepEqual(go.stages.local.blockers, local.blockers);
});
