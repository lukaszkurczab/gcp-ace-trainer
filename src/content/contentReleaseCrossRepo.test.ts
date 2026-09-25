import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "./canonical";

type CurrentProducerBuilder = Readonly<{
  buildAll(options: Readonly<{ rootDirectory: string; outputRoot: string }>): Promise<Readonly<{
    artifacts: readonly Readonly<{ trackId: string; artifact: { contentVersion: string; questions: readonly Readonly<{ trackId: string; nodeId: string; mentalUnitId: string; questionId: string }>[] } }>[];
    lock: Readonly<{ tracks: readonly Readonly<{ trackId: string; contentVersion: string; questionCount: number; sha256: string }>[] }>;
  }>>;
  canonicalJson(value: unknown): string;
  sha256(value: string): string;
}>;

type HistoricalReleaseEntry = Readonly<{
  releaseId: string;
  sourceRepositoryCommit: string;
  trackId: string;
  contentVersion: string;
  checksumSha256: string;
}>;

type HistoricalReleaseLockEntry = HistoricalReleaseEntry & Readonly<{ producerCommit: string }>;

type HistoricalReleaseManifest = Readonly<{
  manifest: Readonly<{
    releaseId: string;
    sourceRepositoryCommit: string;
  }>;
  artifacts: readonly (HistoricalReleaseEntry & Readonly<{ artifactBytes: string }>)[];
}>;

const sha256Raw = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");

const contentRoot = (environmentVariable: string): string => {
  const configuredRoot = process.env[environmentVariable];
  const root = resolve(configuredRoot ?? resolve(process.cwd(), "../patternly-content"));
  assert.ok(existsSync(root), `${environmentVariable} content root does not exist: ${root}`);
  return root;
};

const gitHead = (root: string): string => execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

const expectedCurrentContentSha = (): string => {
  const expectedSha = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
  assert.ok(expectedSha, "PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA is required");
  assert.match(expectedSha, /^[a-f0-9]{40}$/u, "expected current content SHA must be a full commit SHA");
  return expectedSha;
};

test("historical content release lock remains covered by frozen release manifests", () => {
  const appRoot = process.cwd();
  const historicalContentRoot = contentRoot("PATTERNLY_CONTENT_HISTORICAL_ROOT");
  const lockPath = join(appRoot, "integration/contracts/content-release/release.lock.historical-0024.json");
  const lockBytes = readFileSync(lockPath);
  assert.equal(sha256Raw(lockBytes), "d5058e8678ceab38fbdb3fc6ea423b80e21571885549df9b42dd6e3916312195");
  const releaseLock = JSON.parse(lockBytes.toString("utf8")) as {
    schemaVersion: number;
    repository: string;
    artifacts: readonly HistoricalReleaseLockEntry[];
    retainedArtifacts: readonly HistoricalReleaseLockEntry[];
  };
  assert.equal(releaseLock.schemaVersion, 2);
  assert.equal(releaseLock.repository, "lukaszkurczab/patternly-content");
  assert.equal(releaseLock.artifacts.length, 9);
  assert.equal(gitHead(historicalContentRoot), releaseLock.artifacts.at(-1)!.producerCommit, "historical content checkout must match the locked producer commit");
  assert.equal(new Set(releaseLock.artifacts.map((entry) => entry.trackId)).size, 9);
  assert.equal(releaseLock.retainedArtifacts.length, 2);
  assert.deepEqual(
    new Set(releaseLock.retainedArtifacts.map((entry) => entry.trackId)),
    new Set(["google-cloud-associate-cloud-engineer", "coding-interview-dsa-problem-solving"]),
  );
  assert.equal(new Set(releaseLock.retainedArtifacts.map((entry) => entry.trackId)).size, 2);

  for (const entry of [...releaseLock.artifacts, ...releaseLock.retainedArtifacts]) {
    const releasePath = join(historicalContentRoot, "artifacts/releases", entry.releaseId, "release.json");
    const release = JSON.parse(readFileSync(releasePath, "utf8")) as HistoricalReleaseManifest;
    assert.equal(release.manifest.releaseId, entry.releaseId);
    assert.equal(release.manifest.sourceRepositoryCommit, entry.sourceRepositoryCommit);
    const matches = release.artifacts.filter((artifact) => artifact.trackId === entry.trackId);
    assert.equal(matches.length, 1);
    const artifact = matches[0]!;
    assert.equal(artifact.trackId, entry.trackId);
    assert.equal(artifact.contentVersion, entry.contentVersion);
    assert.equal(artifact.checksumSha256, entry.checksumSha256);
    assert.equal(artifact.sourceRepositoryCommit, entry.sourceRepositoryCommit);
    assert.equal(sha256Raw(artifact.artifactBytes), artifact.checksumSha256);
    assert.equal(sha256Raw(artifact.artifactBytes), entry.checksumSha256);
  }
});

test("bundled canonical release matches the current producer builder", async () => {
  const appRoot = process.cwd();
  const currentContentRoot = contentRoot("PATTERNLY_CONTENT_CURRENT_ROOT");
  const expectedCurrentSha = expectedCurrentContentSha();
  assert.equal(gitHead(currentContentRoot), expectedCurrentSha, "current content checkout must match its independently resolved SHA");
  const outputRoot = await mkdtemp(join(tmpdir(), "patternly-odk096-current-bundle-"));
  try {
    const builder = await import(pathToFileURL(join(currentContentRoot, "scripts/build.mjs")).href) as unknown as CurrentProducerBuilder;
    const built = await builder.buildAll({ rootDirectory: currentContentRoot, outputRoot });
    const catalog = await loadCanonicalRuntimeCatalog();
    const generatedLock = JSON.parse(readFileSync(join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8")) as { schemaVersion: string; tracks: readonly { trackId: string; sha256: string; contentVersion: string; questionCount: number }[] };
    assert.equal(generatedLock.schemaVersion, "patternly-content-lock-v1");
    assert.deepEqual([...catalog.tracks].sort(), [...built.lock.tracks.map((track) => track.trackId)].sort());
    assert.deepEqual(generatedLock.tracks, built.lock.tracks);
    for (const entry of built.lock.tracks) {
      const track = catalog.getTrack(entry.trackId);
      assert.equal(track.artifactSha256, entry.sha256);
      assert.equal(track.contentVersion, entry.contentVersion);
      assert.equal(track.contentReleaseId, "canonical-content-v1");
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("current canonical builder preserves the ODK-096 inventory and approved AWS identity without repinning history", async () => {
  const appRoot = process.cwd();
  const currentContentRoot = contentRoot("PATTERNLY_CONTENT_CURRENT_ROOT");
  const expectedCurrentSha = expectedCurrentContentSha();
  assert.equal(gitHead(currentContentRoot), expectedCurrentSha, "current content checkout must match its independently resolved SHA");
  const outputRoot = await mkdtemp(join(tmpdir(), "patternly-odk096-current-builder-"));
  try {
    const builder = await import(pathToFileURL(join(currentContentRoot, "scripts/build.mjs")).href) as unknown as CurrentProducerBuilder;
    const built = await builder.buildAll({ rootDirectory: currentContentRoot, outputRoot });
    const nodes = new Set<string>();
    const mentalUnits = new Set<string>();
    let questions = 0;
    for (const entry of built.artifacts) {
      for (const question of entry.artifact.questions) {
        questions += 1;
        nodes.add(`${question.trackId}\0${question.nodeId}`);
        mentalUnits.add(`${question.trackId}\0${question.nodeId}\0${question.mentalUnitId}`);
      }
    }
    assert.deepEqual({ tracks: built.artifacts.length, nodes: nodes.size, mentalUnits: mentalUnits.size, questions }, { tracks: 9, nodes: 117, mentalUnits: 943, questions: 16_077 });

    const aws = built.artifacts.find((entry) => entry.trackId === "aws-certified-solutions-architect-associate")!.artifact;
    const awsQuestions = [...aws.questions].sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0);
    const awsNodeQuestions = awsQuestions.filter((question) => question.nodeId === "aws_secure_architecture_foundations");
    assert.equal(aws.contentVersion, "aws-certified-solutions-architect-associate-authoring-v2026.09.21-odk096");
    assert.equal(awsNodeQuestions.length, 40);
    assert.equal(builder.sha256(builder.canonicalJson(awsNodeQuestions)), "8dd16df1d7c6741b373026547c35255aea97869542bbb8897a4f36c73730bc33");
    assert.equal(builder.sha256(builder.canonicalJson(awsQuestions)), "46697d0c4e395455084d5dc28206b83e9207109b6f803eb94a47d4b4b981ac45");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
