import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  closeSync,
  existsSync,
  openSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test, { after, before } from "node:test";

import {
  CANDIDATE_TRACK_IDS,
  RELEASE_MANIFEST_REFERENCES,
  createReleaseManifest,
  manifestIdFor,
  validateReleaseManifest,
  verifyReleaseManifest,
} from "./releaseManifest.mjs";
import { canonicalHash, signingManifestBinding, validateRuntimeReceipt } from "./releaseEvidence.mjs";
import { currentContentWorktreeStatus } from "./currentContentWorktree.mjs";
import { syncCanonicalContent } from "./syncBundledContentRelease.mjs";

const root = process.cwd();
const contentRoot = resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? resolve(root, "../patternly-content"));
const backendRoot = resolve(process.env.PATTERNLY_BACKEND_ROOT ?? resolve(root, "../patternly-backend"));
let fixtureRoot;
let applicationRoot;
let backendFixtureRoot;
let contentFixtureRoot;
let webRoot;
let outputRoot;
let manifestPath;
let manifest;
let evidenceRoot;

function signingEvidence(applicationCommit) {
  const identity = {
    applicationCommit,
    evidenceReferences: [{ kind: "eas-build", value: "eas-build:test-ios-build-001" }],
    id: "signing-and-builds",
    releaseBinding: {
      iosBuild: { appVersion: "0.1.0", buildId: "test-ios-build-001", buildNumber: "42", bundleIdentifier: "com.lkurczab.patternly" },
      configuration: {
        apiOrigin: "https://api.patternly.test",
        appCheckAppleProvider: "appAttestWithDeviceCheckFallback",
        authActionOrigin: "https://auth.patternly.test",
        channel: "production",
        environment: "production",
        firebaseProjectId: "patternly-production",
        iosAssociatedDomain: "applinks:patternly.test",
        otaPolicy: "embedded-only",
        publicWebOrigin: "https://patternly.test",
        runtimeMode: "release",
        runtimeVersion: "0.1.0",
        updatesCheckAutomatically: "NEVER",
        updatesEnabled: false,
        updatesUrl: "https://u.expo.dev/204d9769-4832-4c4a-b932-6359c4ff9dab",
      },
    },
    schemaVersion: "patternly-release-evidence-v2",
    status: "verified",
    verifiedAt: "2026-09-25T00:00:00.000Z",
    verifiedBy: "test-authority",
  };
  return { ...identity, evidenceSha256: canonicalHash(identity) };
}

function physicalEvidence(applicationCommit, runtimeReceipt) {
  const identity = {
    applicationCommit,
    evidenceReferences: [{ kind: "device-run", value: "maestro://iphone-17/release-candidate" }],
    id: "physical-device-matrix",
    runtimeReceipt,
    schemaVersion: "patternly-release-evidence-v2",
    status: "verified",
    verifiedAt: "2026-09-25T01:00:00.000Z",
    verifiedBy: "test-authority",
  };
  return { ...identity, evidenceSha256: canonicalHash(identity) };
}

function gitCommit(repositoryRoot, message) {
  execFileSync("git", ["add", "."], { cwd: repositoryRoot });
  execFileSync("git", ["-c", "user.name=gate03-test", "-c", "user.email=gate03-test@example.com", "commit", "-qm", message], { cwd: repositoryRoot });
}

function makeGitRoot(name, files) {
  const repositoryRoot = join(fixtureRoot, name);
  mkdirSync(repositoryRoot, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repositoryRoot });
  for (const [path, value] of Object.entries(files)) {
    const target = join(repositoryRoot, path);
    mkdirSync(resolve(target, ".."), { recursive: true });
    writeFileSync(target, value);
  }
  gitCommit(repositoryRoot, name);
  return repositoryRoot;
}

function makeWorkingTreeFixture(name, sourceRoot, revision = null) {
  const repositoryRoot = join(fixtureRoot, name);
  execFileSync("git", ["clone", "--quiet", "--shared", sourceRoot, repositoryRoot]);
  if (revision) execFileSync("git", ["checkout", "--quiet", "--detach", revision], { cwd: repositoryRoot });
  if (!revision) {
    const patchPath = join(fixtureRoot, `${name}-tracked-working-tree.patch`);
    const patchFd = openSync(patchPath, "wx", 0o600);
    try {
      try {
        execFileSync("git", ["diff", "HEAD", "--binary"], {
          cwd: sourceRoot,
          stdio: ["ignore", patchFd, "pipe"],
        });
      } finally {
        closeSync(patchFd);
      }
      if (statSync(patchPath).size > 0) {
        execFileSync("git", ["apply", "--binary", patchPath], { cwd: repositoryRoot });
        execFileSync("git", ["add", "-u"], { cwd: repositoryRoot });
        execFileSync("git", ["-c", "user.name=release-manifest-test", "-c", "user.email=release-manifest-test@example.com", "commit", "-qm", "working tree fixture"], { cwd: repositoryRoot });
      }
    } finally {
      rmSync(patchPath, { force: true });
    }
  }
  const sourceModules = join(sourceRoot, "node_modules");
  if (existsSync(sourceModules)) {
    const fixtureModules = join(repositoryRoot, "node_modules");
    mkdirSync(fixtureModules);
    for (const entry of readdirSync(sourceModules)) symlinkSync(join(sourceModules, entry), join(fixtureModules, entry), "dir");
  }
  return repositoryRoot;
}

function roots() {
  return { application: applicationRoot, backend: backendFixtureRoot, content: contentFixtureRoot, web: webRoot };
}

function readManifest() {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function writeManifest(value) {
  writeFileSync(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
}

async function withMutation(mutate, assertion) {
  const original = readManifest();
  const changed = JSON.parse(JSON.stringify(original));
  mutate(changed);
  changed.manifestId = manifestIdFor(changed);
  writeManifest(changed);
  try {
    await assertion(changed);
  } finally {
    writeManifest(original);
  }
}

before(async () => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "patternly-gate03-"));
  outputRoot = join(fixtureRoot, "evidence-output");
  mkdirSync(outputRoot);
  backendFixtureRoot = makeWorkingTreeFixture("backend", backendRoot);
  contentFixtureRoot = makeWorkingTreeFixture("content", contentRoot);
  const identityModulePath = "scripts/content/current-source-identity.mjs";
  const identityTarget = join(contentFixtureRoot, identityModulePath);
  mkdirSync(resolve(identityTarget, ".."), { recursive: true });
  copyFileSync(join(contentRoot, identityModulePath), identityTarget);
  execFileSync("git", ["add", "-A"], { cwd: contentFixtureRoot });
  if (execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: contentFixtureRoot, encoding: "utf8" }).trim()) {
    execFileSync("git", ["-c", "user.name=release-manifest-test", "-c", "user.email=release-manifest-test@example.com", "commit", "-qm", "current source identity fixture"], { cwd: contentFixtureRoot });
  }
  applicationRoot = makeWorkingTreeFixture("application", root);
  const appVerifierSource = join(root, "scripts/verifyBundledCurrentContent.mjs");
  const appVerifierTarget = join(applicationRoot, "scripts/verifyBundledCurrentContent.mjs");
  mkdirSync(resolve(appVerifierTarget, ".."), { recursive: true });
  copyFileSync(appVerifierSource, appVerifierTarget);
  execFileSync("git", ["add", "-A"], { cwd: applicationRoot });
  if (execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: applicationRoot, encoding: "utf8" }).trim()) {
    execFileSync("git", ["-c", "user.name=release-manifest-test", "-c", "user.email=release-manifest-test@example.com", "commit", "-qm", "current bundle verifier fixture"], { cwd: applicationRoot });
  }
  evidenceRoot = join(fixtureRoot, "release-evidence");
  mkdirSync(evidenceRoot);
  const applicationCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: applicationRoot, encoding: "utf8" }).trim();
  writeFileSync(join(evidenceRoot, "signing-and-builds.json"), JSON.stringify(signingEvidence(applicationCommit)));
  webRoot = makeGitRoot("web", { "index.html": "<!doctype html>\n" });
  manifestPath = join(outputRoot, "release-manifest.json");
  const identityModule = await import(pathToFileURL(identityTarget).href);
  const currentIdentity = await identityModule.computeCurrentSourceIdentity({ contentRoot: contentFixtureRoot });
  const signing = signingManifestBinding(signingEvidence(applicationCommit));
  manifest = {
    schemaVersion: "patternly-release-manifest-v2",
    manifestId: "0".repeat(64),
    candidateId: currentIdentity.sourceInputFingerprint,
    trackIds: [...CANDIDATE_TRACK_IDS],
    repositories: [
      { role: "application", slug: "patternly", commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: applicationRoot, encoding: "utf8" }).trim() },
      { role: "backend", slug: "patternly-backend", commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: backendFixtureRoot, encoding: "utf8" }).trim() },
      { role: "content", slug: "patternly-content", commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: contentFixtureRoot, encoding: "utf8" }).trim() },
      { role: "web", slug: "patternly-web", commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: webRoot, encoding: "utf8" }).trim() },
    ],
    references: RELEASE_MANIFEST_REFERENCES.map((reference) => ({ ...reference, sha256: createHash("sha256").update(readFileSync(join(roots()[reference.repositoryRole], reference.path))).digest("hex") })),
    iosBuild: signing.iosBuild,
    configurationFingerprint: signing.configurationFingerprint,
    evidence: signing.evidence,
    otaPolicy: signing.otaPolicy,
  };
  manifest.manifestId = manifestIdFor(manifest);
  writeManifest(manifest);
});

after(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

test("release manifest binds current source identity without archived proof paths", async () => {
  assert.equal(manifest.schemaVersion, "patternly-release-manifest-v2");
  assert.match(manifest.manifestId, /^[a-f0-9]{64}$/u);
  assert.match(manifest.candidateId, /^[a-f0-9]{64}$/u);
  assert.deepEqual(manifest.trackIds, CANDIDATE_TRACK_IDS);
  assert.deepEqual(manifest.repositories.map(({ role }) => role), ["application", "backend", "content", "web"]);
  assert.deepEqual(manifest.repositories.map(({ slug }) => slug), ["patternly", "patternly-backend", "patternly-content", "patternly-web"]);
  assert.deepEqual(manifest.references.map(({ repositoryRole, path }) => ({ repositoryRole, path })), RELEASE_MANIFEST_REFERENCES);
  assert.deepEqual(manifest.iosBuild, { appVersion: "0.1.0", buildId: "test-ios-build-001", buildNumber: "42", bundleIdentifier: "com.lkurczab.patternly" });
  assert.match(manifest.configurationFingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(manifest.otaPolicy, "embedded-only");
  assert.deepEqual(manifest.evidence, [{ id: "signing-and-builds", sha256: signingEvidence(manifest.repositories[0].commit).evidenceSha256 }]);
  assert.equal(manifest.manifestId, manifestIdFor(manifest));
  assert.match(manifest.repositories.find(({ role }) => role === "application")?.commit, /^[a-f0-9]{40}$/u);
  assert.equal(manifest.references.some(({ path }) => /candidate-reconciliation|evidence\/readiness|evidence\/admissions/u.test(path)), false);
  assert.ok(manifest.references.some(({ path }) => path === "scripts/content/current-source-identity.mjs"));
  const created = await createReleaseManifest({ roots: roots(), evidenceRoot, outputPath: join(outputRoot, "release-manifest-current-source.json") });
  assert.equal(created.candidateId, manifest.candidateId);
  const verified = await verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath });
  assert.equal(verified.status, "verified");
});

test("release manifest verification fails closed when current source differs from the installed app bank", async () => {
  const originalLock = readFileSync(join(applicationRoot, "integration/contracts/content-release/release.lock.json"));
  const lock = JSON.parse(originalLock);
  lock.sourceInputFingerprint = "0".repeat(64);
  writeFileSync(join(applicationRoot, "integration/contracts/content-release/release.lock.json"), JSON.stringify(lock));
  try { await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /Reference hash mismatch|does not bind|source and installed APP bank differ/u); }
  finally { writeFileSync(join(applicationRoot, "integration/contracts/content-release/release.lock.json"), originalLock); }
});

test("does not create release output when current source differs from installed app bytes", async () => {
  const output = join(outputRoot, "must-not-exist.json");
  const targetPath = join(applicationRoot, "src/content/generated/canonical-content/aws-certified-solutions-architect-associate.json");
  const original = readFileSync(targetPath);
  writeFileSync(targetPath, Buffer.concat([original, Buffer.from(" ")]));
  try { await assert.rejects(createReleaseManifest({ roots: roots(), evidenceRoot, outputPath: output }), /digest mismatch|does not match its canonical locks/u); }
  finally { writeFileSync(targetPath, original); }
  assert.equal(existsSync(output), false);
});

test("CLI create writes a manifest bound to current source and app bytes", () => {
  const cliCreatedPath = join(outputRoot, "cli-created-release-manifest.json");
  const commonArgs = [
    "--application-root", applicationRoot,
    "--backend-root", backendFixtureRoot,
    "--content-root", contentFixtureRoot,
    "--web-root", webRoot,
    "--evidence-root", evidenceRoot,
  ];
  const result = execFileSync("node", ["scripts/releaseManifest.mjs", "create", ...commonArgs, "--output", cliCreatedPath], { cwd: root, encoding: "utf8" });
  assert.match(result, /"status": "created"/u);
  assert.equal(existsSync(cliCreatedPath), true);
});

function runReleaseGate(args) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs", ...args], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATTERNLY_RELEASE_LOCK_PATH: join(applicationRoot, "integration/contracts/content-release/release.lock.json"),
          PATTERNLY_RELEASE_EVIDENCE_ROOT: join(fixtureRoot, "release-evidence"),
        },
      }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

function releaseGateArgs(reportPath, includeManifest = true, manifest = manifestPath) {
  return [
    "--enforce",
    ...(includeManifest ? ["--manifest", manifest] : []),
    "--application-root", applicationRoot,
    "--backend-root", backendFixtureRoot,
    "--content-root", contentFixtureRoot,
    "--web-root", webRoot,
    "--output", reportPath,
  ];
}

test("enforced releaseGate reports current identity and keeps external release blockers", async () => {
  const reportPath = join(outputRoot, "release-gate-valid.json");
  const result = runReleaseGate(releaseGateArgs(reportPath));
  assert.equal(result.status, 1, "external release evidence remains an intentional blocker");
  const report = JSON.parse(result.output);
  assert.equal(readFileSync(reportPath, "utf8"), result.output);
  assert.equal(report.releaseManifest.status, "verified");
  assert.equal(report.applicationRepository.path, ".");
  assert.equal(report.currentContentIdentity.path, "scripts/content/current-source-identity.mjs");
  assert.equal(report.contentReleaseLock.path, "integration/contracts/content-release/release.lock.json");
  assert.equal(result.output.includes(root), false);
  assert.equal(report.blockers.some((blocker) => blocker.kind === "current_content_identity_failed"), false);
  assert.equal(report.blockers.some((blocker) => blocker.kind === "release_manifest_invalid"), false);
  assert.equal(report.blockers.some((blocker) => blocker.kind === "release_manifest_missing"), false);
});

test("releaseGate does not let a physical receipt bypass current identity checks", () => {
  const path = join(evidenceRoot, "physical-device-matrix.json");
  const releaseLockPath = join(applicationRoot, "integration/contracts/content-release/release.lock.json");
  const releaseLock = readFileSync(releaseLockPath);
  const applicationCommit = manifest.repositories.find(({ role }) => role === "application").commit;
  const receipt = { channel: "production", iosBuildId: manifest.iosBuild.buildId, launchedArtifact: "embedded", manifestId: manifest.manifestId, otaPolicy: "embedded-only", runtimeVersion: manifest.iosBuild.appVersion };
  writeFileSync(path, JSON.stringify(physicalEvidence(applicationCommit, receipt)));
  try {
    const validBaseline = JSON.parse(runReleaseGate(releaseGateArgs(join(outputRoot, "release-gate-physical-baseline.json"))).output);
    assert.equal(validBaseline.optionalExternalEvidence[0].status, "verified");

    const changedLock = JSON.parse(releaseLock.toString("utf8"));
    changedLock.currentIdentity.sourceInputFingerprint = "0".repeat(64);
    writeFileSync(releaseLockPath, `${JSON.stringify(changedLock, null, 2)}\n`);
    let report = JSON.parse(runReleaseGate(releaseGateArgs(join(outputRoot, "release-gate-physical-valid.json"))).output);
    assert.equal(report.optionalExternalEvidence[0].status, "invalid");
    assert.ok(report.blockers.some((blocker) => blocker.kind === "current_content_identity_failed"));

    writeFileSync(path, JSON.stringify(physicalEvidence(applicationCommit, { ...receipt, iosBuildId: "other-build" })));
    report = JSON.parse(runReleaseGate(releaseGateArgs(join(outputRoot, "release-gate-physical-invalid.json"))).output);
    assert.equal(report.optionalExternalEvidence[0].status, "invalid");
    assert.ok(report.blockers.some((blocker) => blocker.evidenceId === "physical-device-matrix" && blocker.status === "invalid"));
  } finally {
    writeFileSync(releaseLockPath, releaseLock);
    rmSync(path, { force: true });
  }
});

test("release verification accepts only exact source-derived APP outputs as uncommitted changes", async () => {
  execFileSync("git", ["-c", "user.name=release-manifest-test", "-c", "user.email=release-manifest-test@example.com", "commit", "--allow-empty", "-qm", "selected current content source"], { cwd: contentFixtureRoot });
  await syncCanonicalContent({ appRoot: applicationRoot, producerRoot: contentFixtureRoot });
  const status = currentContentWorktreeStatus(applicationRoot);
  assert.equal(status.status, "derived_content");
  assert.ok(status.changedPaths.includes("integration/contracts/content-release/release.lock.json"));

  await createReleaseManifest({ roots: roots(), evidenceRoot, outputPath: manifestPath });
  manifest = readManifest();
  const verified = await verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath });
  assert.equal(verified.status, "verified");

  const releaseLockPath = join(applicationRoot, "integration/contracts/content-release/release.lock.json");
  const exactLockBytes = readFileSync(releaseLockPath);
  try {
    const tampered = JSON.parse(exactLockBytes.toString("utf8"));
    tampered.currentIdentity.sourceInputFingerprint = "0".repeat(64);
    writeFileSync(releaseLockPath, `${JSON.stringify(tampered, null, 2)}\n`);
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /Reference hash mismatch|current source identity|currentIdentity|track identity/u);
  } finally {
    writeFileSync(releaseLockPath, exactLockBytes);
  }
});

test("runtime receipt rejects every mismatch with the verified embedded artifact", () => {
  const verified = { status: "verified", manifestId: manifest.manifestId, iosBuild: manifest.iosBuild, otaPolicy: manifest.otaPolicy };
  const receipt = { channel: "production", iosBuildId: manifest.iosBuild.buildId, launchedArtifact: "embedded", manifestId: manifest.manifestId, otaPolicy: "embedded-only", runtimeVersion: manifest.iosBuild.appVersion };
  assert.deepEqual(validateRuntimeReceipt(receipt, verified), receipt);
  for (const [field, value] of [["manifestId", "0".repeat(64)], ["iosBuildId", "other-build"], ["runtimeVersion", "9.9.9"], ["channel", "other"], ["otaPolicy", "remote"], ["launchedArtifact", "ota-update"]]) {
    assert.throws(() => validateRuntimeReceipt({ ...receipt, [field]: value }, verified), /does not match/u, field);
  }
});

test("enforced releaseGate writes portable reports for invalid and missing manifests", () => {
  const invalidManifestPath = join(outputRoot, "invalid-release-manifest.json");
  writeFileSync(invalidManifestPath, JSON.stringify({ bad: true }));
  const invalidReportPath = join(outputRoot, "release-gate-invalid.json");
  const invalidResult = runReleaseGate(releaseGateArgs(invalidReportPath, true, invalidManifestPath));
  assert.equal(invalidResult.status, 1);
  const invalidReport = JSON.parse(invalidResult.output);
  assert.equal(invalidReport.releaseManifest.status, "invalid");
  assert.ok(invalidReport.blockers.some((blocker) => blocker.kind === "release_manifest_invalid"));
  assert.equal(invalidResult.output.includes(root), false);
  assert.equal(invalidResult.output.includes(invalidManifestPath), false);

  const missingReportPath = join(outputRoot, "release-gate-missing.json");
  const missingResult = runReleaseGate(releaseGateArgs(missingReportPath, false));
  assert.equal(missingResult.status, 1);
  const missingReport = JSON.parse(missingResult.output);
  assert.equal(missingReport.releaseManifest.status, "missing");
  assert.ok(missingReport.blockers.some((blocker) => blocker.kind === "release_manifest_missing"));
  assert.equal(missingResult.output.includes(root), false);
});

test("rejects missing, extra and duplicate repository roles plus the legacy two-SHA shape", async () => {
  await withMutation((value) => { value.repositories = value.repositories.slice(1); }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /exactly four repositories/u);
  });
  await withMutation((value) => { value.repositories.push({ role: "extra", slug: "extra", commit: "a".repeat(40) }); }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /exactly four repositories/u);
  });
  await withMutation((value) => {
    value.repositories[1].role = "application";
    value.repositories[1].slug = "patternly";
  }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /duplicated/u);
  });
  assert.throws(() => validateReleaseManifest({
    schemaVersion: "patternly-release-manifest-v1",
    manifestId: "a".repeat(64),
    applicationCommit: "a".repeat(40),
    contentCommit: "b".repeat(40),
  }), /unsupported or missing fields/u);
});

test("rejects wrong manifest identity, stale candidate/track scope and wrong repository SHA", async () => {
  const wrongIdentity = readManifest();
  wrongIdentity.manifestId = "f".repeat(64);
  assert.throws(() => validateReleaseManifest(wrongIdentity), /manifestId does not match/u);
  await withMutation((value) => { value.repositories[0].commit = "a".repeat(40); }, async () => {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /HEAD is stale|commit is stale/u);
  });
  await withMutation((value) => { value.candidateId = "b".repeat(64); }, async () => {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /candidateId is stale/u);
  });
  await withMutation((value) => { value.trackIds = [...value.trackIds].reverse(); }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /trackIds/u);
  });
});

test("rejects modified evidence before accepting a portable reference", async () => {
  await withMutation((value) => {
    value.references.find((reference) => reference.path === "scripts/content/current-source-identity.mjs").sha256 = "0".repeat(64);
  }, async () => {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /Reference hash mismatch/u);
  });
});

test("rejects changed iOS build, public configuration, and signing evidence bytes", async () => {
  const evidencePath = join(evidenceRoot, "signing-and-builds.json");
  const original = JSON.parse(readFileSync(evidencePath, "utf8"));
  const assertBindingRejected = async (mutate, pattern) => {
    const changed = JSON.parse(JSON.stringify(original));
    mutate(changed);
    const { evidenceSha256: _old, ...identity } = changed;
    changed.evidenceSha256 = canonicalHash(identity);
    writeFileSync(evidencePath, JSON.stringify(changed));
    try {
      await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), pattern);
    } finally {
      writeFileSync(evidencePath, JSON.stringify(original));
    }
  };
  await assertBindingRejected((value) => { value.releaseBinding.iosBuild.buildId = "different-ios-build"; }, /binding is stale/u);
  await assertBindingRejected((value) => { value.releaseBinding.configuration.apiOrigin = "https://other-api.patternly.test"; }, /binding is stale/u);
  const corrupted = { ...original, evidenceSha256: "0".repeat(64) };
  writeFileSync(evidencePath, JSON.stringify(corrupted));
  try {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /hash mismatch/u);
  } finally {
    writeFileSync(evidencePath, JSON.stringify(original));
  }
  const withSecret = JSON.parse(JSON.stringify(original));
  withSecret.releaseBinding.configuration.firebaseApiKey = "must-not-enter-release-identity";
  const { evidenceSha256: _hash, ...secretIdentity } = withSecret;
  withSecret.evidenceSha256 = canonicalHash(secretIdentity);
  writeFileSync(evidencePath, JSON.stringify(withSecret));
  try {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /unsupported or missing fields/u);
  } finally {
    writeFileSync(evidencePath, JSON.stringify(original));
  }
});

test("rejects absolute, traversal and symlink references", async () => {
  await withMutation((value) => {
    value.references[0].path = "/tmp/release.lock.json";
  }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /portable relative path/u);
  });
  await withMutation((value) => {
    value.references[0].path = "../release.lock.json";
  }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /portable relative path|traversal/u);
  });

  const alias = join(fixtureRoot, "application-alias");
  symlinkSync(applicationRoot, alias);
  await withMutation((value) => {
    value.references[0].repositoryRole = "application";
  }, async () => {
    await assert.rejects(
      verifyReleaseManifest({ roots: { ...roots(), application: alias }, evidenceRoot, manifestPath }),
      /repository roots|symbolic-link|checkout root/u,
    );
  });
});

test("rejects dirty repositories and output paths inside or through symlinked parents", async () => {
  const dirtyPath = join(applicationRoot, "unreviewed.txt");
  writeFileSync(dirtyPath, "dirty\n");
  try {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /worktree must be clean/u);
  } finally {
    rmSync(dirtyPath, { force: true });
  }

  const retainedDirtyPath = join(applicationRoot, "src/content/generated/retained-content/unreviewed-retained.json");
  mkdirSync(join(retainedDirtyPath, ".."), { recursive: true });
  writeFileSync(retainedDirtyPath, "retained data is protected\n");
  try {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), evidenceRoot, manifestPath }), /worktree must be clean except for verified generated current-content outputs/u);
  } finally {
    rmSync(retainedDirtyPath, { force: true });
  }

  await assert.rejects(
    createReleaseManifest({ roots: roots(), evidenceRoot, outputPath: join(applicationRoot, "release-manifest.json") }),
    /outside all repository worktrees/u,
  );
  const outputAlias = join(fixtureRoot, "output-alias");
  symlinkSync(outputRoot, outputAlias);
  await assert.rejects(
    createReleaseManifest({ roots: roots(), evidenceRoot, outputPath: join(outputAlias, "manifest.json") }),
    /symbolic-link/u,
  );
  const danglingOutput = join(outputRoot, "dangling.json");
  symlinkSync(join(outputRoot, "does-not-exist.json"), danglingOutput);
  assert.equal(existsSync(join(outputRoot, "does-not-exist.json")), false);
  await assert.rejects(
    createReleaseManifest({ roots: roots(), evidenceRoot, outputPath: danglingOutput }),
    /symbolic link/u,
  );
  assert.equal(existsSync(join(outputRoot, "does-not-exist.json")), false);
});
