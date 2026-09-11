import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test, { after, before } from "node:test";

import {
  CANDIDATE_TRACK_IDS,
  RELEASE_MANIFEST_REFERENCES,
  createReleaseManifest,
  manifestIdFor,
  validateReleaseManifest,
  verifyReleaseManifest,
} from "./releaseManifest.mjs";

const root = process.cwd();
const contentRoot = resolve(root, "../patternly-content");
const backendRoot = resolve(root, "../patternly-backend");
let fixtureRoot;
let applicationRoot;
let webRoot;
let outputRoot;
let manifestPath;
let manifest;

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

function roots() {
  return { application: applicationRoot, backend: backendRoot, content: contentRoot, web: webRoot };
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
  applicationRoot = makeGitRoot("application", {
    "integration/contracts/content-release/release.lock.json": readFileSync(join(root, "integration/contracts/content-release/release.lock.json")),
  });
  webRoot = makeGitRoot("web", { "index.html": "<!doctype html>\n" });
  manifestPath = join(outputRoot, "release-manifest.json");
  const created = await createReleaseManifest({ roots: roots(), outputPath: manifestPath });
  manifest = readManifest();
  assert.equal(created.manifestId, manifest.manifestId);
});

after(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

test("creates deterministic portable identity with four exact repositories and four references", async () => {
  assert.equal(manifest.schemaVersion, "patternly-release-manifest-v1");
  assert.match(manifest.manifestId, /^[a-f0-9]{64}$/u);
  assert.match(manifest.candidateId, /^[a-f0-9]{64}$/u);
  assert.deepEqual(manifest.trackIds, CANDIDATE_TRACK_IDS);
  assert.deepEqual(manifest.repositories.map(({ role }) => role), ["application", "backend", "content", "web"]);
  assert.deepEqual(manifest.repositories.map(({ slug }) => slug), ["patternly", "patternly-backend", "patternly-content", "patternly-web"]);
  assert.deepEqual(manifest.references.map(({ repositoryRole, path }) => ({ repositoryRole, path })), RELEASE_MANIFEST_REFERENCES);
  assert.equal(manifest.manifestId, manifestIdFor(manifest));
  const firstBytes = readFileSync(manifestPath, "utf8");
  const secondPath = join(outputRoot, "release-manifest-second.json");
  await createReleaseManifest({ roots: roots(), outputPath: secondPath });
  assert.equal(readFileSync(secondPath, "utf8"), firstBytes);
});

test("verifies exact HEADs, clean worktrees, hashes and ACC-02/OpenAPI owning checks", async () => {
  const verified = await verifyReleaseManifest({ roots: roots(), manifestPath });
  assert.equal(verified.status, "verified");
  assert.equal(verified.manifestId, manifest.manifestId);
  assert.equal(verified.candidateId, manifest.candidateId);
  assert.deepEqual(verified.trackIds, CANDIDATE_TRACK_IDS);
});

test("CLI create output can be copied to another external directory and verified", () => {
  const cliCreatedPath = join(outputRoot, "cli-created-release-manifest.json");
  const commonArgs = [
    "--application-root", applicationRoot,
    "--backend-root", backendRoot,
    "--content-root", contentRoot,
    "--web-root", webRoot,
  ];
  const createOutput = execFileSync("node", ["scripts/releaseManifest.mjs", "create", ...commonArgs, "--output", cliCreatedPath], {
    cwd: root,
    encoding: "utf8",
  });
  const createdSummary = JSON.parse(createOutput);
  assert.equal(createdSummary.status, "created");
  assert.equal(createOutput.includes(root), false);

  const copiedRoot = mkdtempSync(join(tmpdir(), "patternly-gate03-copy-"));
  const copiedManifestPath = join(copiedRoot, "nested", "release-manifest.json");
  mkdirSync(join(copiedRoot, "nested"));
  copyFileSync(cliCreatedPath, copiedManifestPath);
  try {
    const verifyOutput = execFileSync("node", ["scripts/releaseManifest.mjs", "verify", ...commonArgs, "--manifest", copiedManifestPath], {
      cwd: root,
      encoding: "utf8",
    });
    const verifiedSummary = JSON.parse(verifyOutput);
    assert.equal(verifiedSummary.status, "verified");
    assert.equal(verifiedSummary.manifestId, createdSummary.manifestId);
    assert.equal(verifyOutput.includes(root), false);
    assert.equal(readFileSync(copiedManifestPath, "utf8").includes(root), false);
  } finally {
    rmSync(copiedRoot, { recursive: true, force: true });
  }
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
    "--backend-root", backendRoot,
    "--content-root", contentRoot,
    "--web-root", webRoot,
    "--output", reportPath,
  ];
}

test("enforced releaseGate reports a verified manifest identity without absolute paths", async () => {
  const reportPath = join(outputRoot, "release-gate-valid.json");
  const result = runReleaseGate(releaseGateArgs(reportPath));
  assert.equal(result.status, 1, "external release evidence remains an intentional blocker");
  const report = JSON.parse(result.output);
  assert.equal(readFileSync(reportPath, "utf8"), result.output);
  assert.equal(report.releaseManifest.status, "verified");
  assert.equal(report.releaseManifest.manifestId, manifest.manifestId);
  assert.equal(report.applicationRepository.path, ".");
  assert.equal(report.contentReadiness.path, "evidence/readiness/candidate-readiness.json");
  assert.equal(report.contentReleaseLock.path, "integration/contracts/content-release/release.lock.json");
  assert.equal(result.output.includes(root), false);
  assert.equal(report.blockers.some((blocker) => blocker.kind === "release_manifest_invalid"), false);
  assert.equal(report.blockers.some((blocker) => blocker.kind === "release_manifest_missing"), false);
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
    await assert.rejects(verifyReleaseManifest({ roots: roots(), manifestPath }), /HEAD is stale|commit is stale/u);
  });
  await withMutation((value) => { value.candidateId = "b".repeat(64); }, async () => {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), manifestPath }), /candidateId is stale|ACC-02/u);
  });
  await withMutation((value) => { value.trackIds = [...value.trackIds].reverse(); }, async (value) => {
    assert.throws(() => validateReleaseManifest(value), /trackIds/u);
  });
});

test("rejects modified evidence before accepting a portable reference", async () => {
  await withMutation((value) => {
    value.references.find((reference) => reference.path.endsWith("candidate-readiness.json")).sha256 = "0".repeat(64);
  }, async () => {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), manifestPath }), /Reference hash mismatch/u);
  });
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
      verifyReleaseManifest({ roots: { ...roots(), application: alias }, manifestPath }),
      /repository roots|symbolic-link|checkout root/u,
    );
  });
});

test("rejects dirty repositories and output paths inside or through symlinked parents", async () => {
  const dirtyPath = join(applicationRoot, "unreviewed.txt");
  writeFileSync(dirtyPath, "dirty\n");
  try {
    await assert.rejects(verifyReleaseManifest({ roots: roots(), manifestPath }), /worktree must be clean/u);
  } finally {
    rmSync(dirtyPath, { force: true });
  }

  await assert.rejects(
    createReleaseManifest({ roots: roots(), outputPath: join(applicationRoot, "release-manifest.json") }),
    /outside all repository worktrees/u,
  );
  const outputAlias = join(fixtureRoot, "output-alias");
  symlinkSync(outputRoot, outputAlias);
  await assert.rejects(
    createReleaseManifest({ roots: roots(), outputPath: join(outputAlias, "manifest.json") }),
    /symbolic-link/u,
  );
  const danglingOutput = join(outputRoot, "dangling.json");
  symlinkSync(join(outputRoot, "does-not-exist.json"), danglingOutput);
  assert.equal(existsSync(join(outputRoot, "does-not-exist.json")), false);
  await assert.rejects(
    createReleaseManifest({ roots: roots(), outputPath: danglingOutput }),
    /symbolic link/u,
  );
  assert.equal(existsSync(join(outputRoot, "does-not-exist.json")), false);
});
