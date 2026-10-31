import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "./canonical";
import { isFreeApproachChallengeProblem, selectApproachChallengeProblems } from "../application/coding-interview/approachChallengeSelection";
import type { ApproachChallengeProblem } from "./canonical/approachChallengeProblem";

type CurrentProducerBuilder = Readonly<{
  buildAll(options: Readonly<{ rootDirectory: string; outputRoot: string }>): Promise<Readonly<{
    artifacts: readonly {
      trackId: string;
      artifact: {
        contentVersion: string;
        planningPolicy?: { policyVersion: string };
        questions: readonly { trackId: string; nodeId: string; mentalUnitId: string; questionId: string }[];
        simulationProfiles?: readonly { familyConfig?: { eligibleQuestionIds?: readonly string[] } }[];
        approachChallengeProblems?: readonly ApproachChallengeProblem[];
      };
    }[];
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

test("current source identity is installed exactly in the APP runtime", async () => {
  const appRoot = process.cwd();
  const currentContentRoot = contentRoot("PATTERNLY_CONTENT_CURRENT_ROOT");
  const identityApi = await import(pathToFileURL(join(currentContentRoot, "scripts/content/current-source-identity.mjs")).href) as unknown as {
    computeCurrentSourceIdentity(options: { contentRoot: string }): Promise<{ sourceInputFingerprint: string; tracks: readonly unknown[] }>;
  };
  const identity = await identityApi.computeCurrentSourceIdentity({ contentRoot: currentContentRoot });
  const releaseLock = JSON.parse(readFileSync(join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8")) as { sourceInputFingerprint: string; currentIdentity: { tracks: readonly unknown[] } };
  assert.equal(releaseLock.sourceInputFingerprint, identity.sourceInputFingerprint);
  assert.deepEqual(releaseLock.currentIdentity.tracks, identity.tracks);
});

test("current producer builds independently and matches every installed APP artifact byte", async (t) => {
  const appRoot = process.cwd();
  const currentContentRoot = contentRoot("PATTERNLY_CONTENT_CURRENT_ROOT");
  const outputRoot = await mkdtemp(join(tmpdir(), "patternly-odk096-current-bundle-"));
  try {
    const builder = await import(pathToFileURL(join(currentContentRoot, "scripts/build.mjs")).href) as unknown as CurrentProducerBuilder;
    const built = await builder.buildAll({ rootDirectory: currentContentRoot, outputRoot });
    const catalog = await loadCanonicalRuntimeCatalog();
    const sourceCoding = built.artifacts.find((entry) => entry.trackId === "coding-interview-dsa-problem-solving")!.artifact;
    const runtimeCoding = catalog.getTrack("coding-interview-dsa-problem-solving");
    const pairedProblems = sourceCoding.approachChallengeProblems ?? [];
    assert.equal(sourceCoding.questions.length, 3404);
    assert.equal(sourceCoding.simulationProfiles?.[0]?.familyConfig?.eligibleQuestionIds?.length, 40);
    assert.ok(sourceCoding.simulationProfiles?.[0]?.familyConfig?.eligibleQuestionIds?.every((id) => sourceCoding.questions.some((question) => question.questionId === id)));
    assert.equal(pairedProblems.length, 36);
    assert.equal(runtimeCoding.questions.length, 3404);
    assert.equal(runtimeCoding.approachChallengeProblems?.length, 36);
    const familyIds = [...new Set(pairedProblems.flatMap((problem) => problem.requiredFamilyIds))];
    const sources = (problems: typeof pairedProblems) => problems.map((problem) => ({ problem }));
    const selectorBase = {
      contentVersion: runtimeCoding.contentVersion,
      artifactSha256: runtimeCoding.artifactSha256,
      completion: { kind: "unknown" } as const,
      settings: { mode: "manual" as const, selectedFamilyIds: familyIds, requestedProblemCount: 20 as const, difficulties: ["easy", "medium", "hard"] as const },
    };
    const freeSelection = selectApproachChallengeProblems({ ...selectorBase, sources: sources(pairedProblems), access: "free" });
    assert.equal(freeSelection.problems.length, 6);
    assert.ok(freeSelection.problems.every(({ problemId }) => isFreeApproachChallengeProblem(pairedProblems.find((problem) => problem.problemId === problemId)!)));
    const premiumProblems = pairedProblems.filter((problem) => !isFreeApproachChallengeProblem(problem));
    assert.equal(premiumProblems.length, 30);
    const selectedPremiumIds = new Set<string>();
    for (let offset = 0; offset < premiumProblems.length; offset += 20) {
      const selection = selectApproachChallengeProblems({ ...selectorBase, sources: sources(premiumProblems.slice(offset, offset + 20)), access: "premium" });
      assert.equal(selection.diagnostics.invalidCandidateCount, 0);
      assert.deepEqual(selection.diagnostics.missingFamilyMappings, []);
      for (const { problemId } of selection.problems) selectedPremiumIds.add(problemId);
    }
    assert.equal(selectedPremiumIds.size, 30, "the real Premium selector admits every accepted Premium pair across supported batch sizes");
    const generatedLock = JSON.parse(readFileSync(join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8")) as { schemaVersion: string; tracks: readonly { trackId: string; sha256: string; contentVersion: string; questionCount: number }[] };
    assert.equal(generatedLock.schemaVersion, "patternly-content-lock-v1");
    assert.deepEqual([...catalog.tracks].sort(), [...built.lock.tracks.map((track) => track.trackId)].sort());
    assert.equal(built.artifacts.length, 9);
    assert.deepEqual(generatedLock.tracks.map(({ trackId }) => trackId).sort(), built.lock.tracks.map(({ trackId }) => trackId).sort());
    for (const sourceTrack of built.lock.tracks) {
      const artifact = built.artifacts.find((entry) => entry.trackId === sourceTrack.trackId)!.artifact;
      assert.equal(sourceTrack.questionCount, artifact.questions.length, `${sourceTrack.trackId} source question count matches its lock`);
      assert.equal(sourceTrack.sha256, sha256Raw(readFileSync(join(outputRoot, `${sourceTrack.trackId}.json`))), `${sourceTrack.trackId} source output hash matches its lock`);
      assert.equal(sourceTrack.sha256, sha256Raw(readFileSync(join(appRoot, "src/content/generated/canonical-content", `${sourceTrack.trackId}.json`))), `${sourceTrack.trackId} current source bytes are installed in APP`);
    }
    for (const entry of generatedLock.tracks) {
      const track = catalog.getTrack(entry.trackId);
      assert.equal(track.artifactSha256, entry.sha256);
      assert.equal(track.contentVersion, entry.contentVersion);
      assert.equal(track.contentReleaseId, "canonical-content-v1");
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("current canonical producer and installed APP preserve exact training projection and policy identity", async () => {
  const appRoot = process.cwd();
  const currentContentRoot = contentRoot("PATTERNLY_CONTENT_CURRENT_ROOT");
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
    assert.deepEqual({ tracks: built.artifacts.length, nodes: nodes.size, mentalUnits: mentalUnits.size, questions }, { tracks: 9, nodes: 117, mentalUnits: 958, questions: 16_759 });

    const aws = built.artifacts.find((entry) => entry.trackId === "aws-certified-solutions-architect-associate")!.artifact;
    const successorLedger = JSON.parse(readFileSync(join(appRoot, "src/content/generated/canonical-content/content-successor-ledger.json"), "utf8")) as {
      tracks: readonly Readonly<{ trackId: string; training: Readonly<{ contentVersion: string; artifactSha256: string; questionCount: number }>; planningPolicy: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }> }>[];
    };
    const awsSuccessor = successorLedger.tracks.find((entry) => entry.trackId === "aws-certified-solutions-architect-associate")!;
    const awsQuestions = [...aws.questions].sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0);
    const awsNodeQuestions = awsQuestions.filter((question) => question.nodeId === "aws_secure_architecture_foundations");
    const sourceCatalog = JSON.parse(readFileSync(join(currentContentRoot, "content/catalog.json"), "utf8")) as { tracks: readonly { trackId: string; contentVersion: string }[] };
    const authoredAws = sourceCatalog.tracks.find((entry) => entry.trackId === "aws-certified-solutions-architect-associate");
    assert.ok(authoredAws, "AWS content identity is declared by the current authoring catalog");
    assert.equal(aws.contentVersion, authoredAws.contentVersion);
    const installedAwsBytes = readFileSync(join(appRoot, "src/content/generated/canonical-content/aws-certified-solutions-architect-associate.json"));
    const installedAws = JSON.parse(installedAwsBytes.toString("utf8")) as typeof aws & { schemaVersion: string };
    const installedLock = JSON.parse(readFileSync(join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8")) as { tracks: readonly { trackId: string; contentVersion: string; sha256: string; questionCount: number }[] };
    const awsLock = installedLock.tracks.find((entry) => entry.trackId === "aws-certified-solutions-architect-associate");
    assert.ok(awsLock);
    assert.equal(installedAws.schemaVersion, "patternly-content-artifact-v2");
    assert.equal(awsLock.contentVersion, authoredAws.contentVersion);
    assert.equal(awsLock.questionCount, awsQuestions.length);
    assert.equal(awsLock.sha256, sha256Raw(installedAwsBytes));
    assert.deepEqual(awsSuccessor.planningPolicy, { contentVersion: authoredAws.contentVersion, artifactSha256: awsLock.sha256, policyVersion: aws.planningPolicy?.policyVersion });
    assert.equal(awsSuccessor.training.questionCount, awsQuestions.length);
    const emittedAws = JSON.parse(readFileSync(join(outputRoot, "aws-certified-solutions-architect-associate.json"), "utf8")) as { schemaVersion: string; contentVersion: string; planningPolicy?: unknown } & Record<string, unknown>;
    assert.deepEqual(readFileSync(join(outputRoot, "aws-certified-solutions-architect-associate.json")), installedAwsBytes, "the real producer's exact current AWS bytes are installed in APP");
    const trainingProjection = structuredClone(emittedAws);
    delete trainingProjection.planningPolicy;
    trainingProjection.schemaVersion = "patternly-content-artifact-v1";
    trainingProjection.contentVersion = awsSuccessor.training.contentVersion;
    assert.equal(sha256Raw(JSON.stringify(trainingProjection)), awsSuccessor.training.artifactSha256);
    assert.equal((aws as unknown as { completionRule: { ruleVersion: number; chapters: readonly unknown[] } }).completionRule.ruleVersion, 2);
    assert.equal(awsNodeQuestions.length, 40);
    assert.equal(builder.sha256(builder.canonicalJson(awsNodeQuestions)), "8dd16df1d7c6741b373026547c35255aea97869542bbb8897a4f36c73730bc33");
    const installedAwsQuestions = [...installedAws.questions].sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0);
    assert.equal(builder.sha256(builder.canonicalJson(awsQuestions)), sha256Raw(builder.canonicalJson(installedAwsQuestions)), "the complete current question inventory matches installed APP content without freezing a superseded whole-bank hash");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
