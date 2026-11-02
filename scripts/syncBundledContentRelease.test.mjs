import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  describeCodingExplanationDelta,
  prepareCodingExplanationsManifest,
  EXPECTED_TRACK_IDS,
  CLAUDE_TRACK_ID,
  GENERATED_DIRECTORY,
  SUCCESSOR_LEDGER_FILE_NAME,
  RELEASE_LOCK_RELATIVE_PATH,
  APPROACH_CHALLENGE_BANK_CONTRACT,
  APPROACH_CHALLENGE_TRACK_ID,
  buildCurrentReleaseLock,
  deriveAcceptedApproachChallengeContract,
  historicalTrainingProjection,
  parseArgs,
  syncCanonicalContent,
  validateBuiltContent,
} from "./syncBundledContentRelease.mjs";


const SMALL_INVENTORY = Object.freeze({ trackCount: 9, nodeCount: 9, mentalUnitCount: 9, questionCount: 48 });
const DESIGN_TRACK_IDS = ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"];
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function git(root, ...args) { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim(); }
function commitProducer(root) {
  git(root, "add", "-A");
  git(root, "-c", "user.name=content-sync-test", "-c", "user.email=content-sync-test@example.com", "commit", "-qm", "fixture source");
  const head = git(root, "rev-parse", "HEAD");
  git(root, "update-ref", "refs/remotes/origin/master", head);
  return head;
}

test("sync arguments keep candidate mode explicit and separate", () => {
  assert.deepEqual(parseArgs([]), { mode: "sync" });
  assert.deepEqual(parseArgs(["check", "--content-root", "../content"]), { mode: "check", producerRoot: path.resolve("../content") });
  assert.deepEqual(parseArgs(["candidate", "--content-root", "../content"]), { mode: "candidate", producerRoot: path.resolve("../content") });
  assert.deepEqual(parseArgs(["sync-current-approach-challenge", "--content-root", "../content"]), { mode: "authorized-current-approach-challenge", producerRoot: path.resolve("../content") });
  assert.throws(() => parseArgs(["check", "--local-reviewed-candidate", "acceptance.json"]), /Usage:/u);
});

test("historical training projection excludes only the independent paired bank", () => {
  const artifact = {
    schemaVersion: "patternly-content-artifact-v2", trackId: "coding-interview-dsa-problem-solving", contentVersion: "current-v2",
    questions: [{ questionId: "ordinary-q", nodeId: "ordinary-node" }], simulationProfiles: [{ profileId: "legacy-40" }],
    completionRule: { ruleVersion: 2 }, planningPolicy: { policyVersion: "current" },
    approachChallengeProblems: [{ problemId: "paired-only" }],
  };
  const projection = JSON.parse(historicalTrainingProjection(artifact, "legacy-training-v1").toString("utf8"));
  assert.equal(projection.schemaVersion, "patternly-content-artifact-v1");
  assert.equal(projection.contentVersion, "legacy-training-v1");
  assert.deepEqual(projection.questions, artifact.questions);
  assert.deepEqual(projection.simulationProfiles, artifact.simulationProfiles);
  assert.deepEqual(projection.completionRule, artifact.completionRule);
  assert.equal(Object.hasOwn(projection, "planningPolicy"), false);
  assert.equal(Object.hasOwn(projection, "approachChallengeProblems"), false);
});

function validGcpSimulationProfile(contentVersion, nodeId) {
  return {
    schemaVersion: "patternly-simulation-profile-envelope-v1",
    profileId: "google-cloud-associate-cloud-engineer-certification-exam-v1",
    profileVersion: "1",
    familyId: "certification",
    modeId: "certification-exam-simulation",
    familyConfig: {
      schemaVersion: "patternly-certification-simulation-config-v1",
      source: { url: "https://cloud.google.com/learn/certification/cloud-engineer/", checkedDate: "2026-08-10", guideVersion: "not_documented" },
      durationMinutes: 120,
      questionCount: { kind: "range", minimum: 50, maximum: 60 },
      blueprint: {
        kind: "weighted_sections",
        sections: [
          { id: "domain-1", contentDomainId: "gcp-ace-standard-domain-1", weightPercent: 20 },
          { id: "domain-2", contentDomainId: "gcp-ace-standard-domain-2", weightPercent: 30 },
          { id: "domain-3", contentDomainId: "gcp-ace-standard-domain-3", weightPercent: 30 },
          { id: "domain-4", contentDomainId: "gcp-ace-standard-domain-4", weightPercent: 20 },
        ],
      },
      interactionPolicy: {
        schemaVersion: "patternly-certification-simulation-policy-v1",
        policyId: "patternly-certification-simulation-v1",
        policyVersion: "1",
        owner: "patternly_product",
        navigation: "free",
        answerChanges: "until_final_submission",
        flagging: "available",
        navigator: "available",
        sections: "blueprint_visible",
        timeout: "absolute_deadline",
        feedbackTiming: "after_verified_finalization",
      },
      nodeDomainMap: { [nodeId]: "gcp-ace-standard-domain-3" },
    },
  };
}

function validCodingSimulationProfile(questionIds) {
  const selectionPolicy = Object.fromEntries([
    "requireUniqueItemIds", "requireDeclaredSimulationEligibility", "requireMultipleMentalUnits",
    "requireMultiplePatternFamilies", "requireEveryActiveInteractionTypeRepresented",
    "prohibitConsecutiveSameMentalUnitWhenAlternativeExists", "prohibitDuplicateContentIdentity",
    "prohibitTaxonomyWidening", "prohibitFallbackItems",
  ].map((key) => [key, true]));
  return {
    schemaVersion: "patternly-simulation-profile-envelope-v1",
    profileId: "algorithms-interview-simulation-v1",
    profileVersion: "1",
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
    familyConfig: {
      schemaVersion: "patternly-coding-interview-simulation-config-v1",
      blueprintId: "coding-interview-interview-simulation-v1",
      blueprintVersion: "1",
      requestedLength: 40,
      actualLength: 40,
      shorteningPolicy: "prohibited",
      uniqueItemsRequired: 40,
      timerKind: "foreground_countdown",
      durationMinutes: 45,
      navigationPolicy: "free_navigation",
      answerChangePolicy: "editable_until_finalization",
      reinsertPolicy: "disabled",
      feedbackTiming: "after_verified_finalization",
      learningStages: ["simulation"],
      selectionPolicy,
      poolId: "algorithms-interview-simulation-v1",
      poolVersion: "1",
      eligibleQuestionIds: questionIds,
    },
  };
}

function validDesignSimulationProfile(trackId) {
  const stages = ["requirements", "architecture", "tradeoffs", "final_answer"].map((stageId) => ({ stageId, title: stageId, response: { type: "text", required: true, minimumCharacters: 1 } }));
  const rubricIds = ["requirements_clarity", "architecture_coherence", "tradeoff_reasoning", "communication_completeness"];
  return {
    schemaVersion: "patternly-simulation-profile-envelope-v1", profileId: `${trackId}-simulation-v1`, profileVersion: "1",
    familyId: "design_interview", modeId: "design-interview-simulation",
    familyConfig: {
      schemaVersion: "patternly-design-interview-simulation-config-v1", caseId: `${trackId}-case-v1`, caseVersion: "1", title: "Design case", brief: "Design a system and explain the relevant constraints.",
      timer: { kind: "absolute_deadline", durationSeconds: 2700 }, stages,
      reviewCriteria: stages.map((stage) => ({ criterionId: `${stage.stageId}-criterion`, stageId: stage.stageId, description: `Review ${stage.title}.` })),
      rubric: { kind: "self_assessment_reference_only", dimensions: rubricIds.map((dimensionId) => ({ dimensionId, title: dimensionId, levels: [1, 2, 3, 4].map((level) => ({ level, label: `Level ${level}`, description: `Reference level ${level}.` })) })) },
      outcomeEvaluation: { machineEvaluable: ["response_completeness"], semanticScoring: "not_evaluated" },
    },
  };
}

function validPlanningPolicy(questions) {
  const scopeRefs = [...new Map(questions.map((question) => [`${question.nodeId}\u0000${question.mentalUnitId}`, { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId }])).values()];
  return {
    schemaVersion: "patternly-learning-planning-policy-v1",
    policyVersion: "test-policy-v1",
    workEstimates: [{
      estimateId: "test-estimate", modeId: "test-mode", scopeRefs,
      minMinutesPerResponse: 1, typicalMinutesPerResponse: 2, maxMinutesPerResponse: 3,
      provenance: "authored", observationCount: 0, rationale: "Bounded fixture estimate.",
      reviewReserve: { kind: "unavailable", reason: "not a producer policy fixture" },
    }],
    unavailableScopes: [],
  };
}

async function createBuiltSet(directory, suffix = "current") {
  await mkdir(directory, { recursive: true });
  const tracks = [];
  for (const trackId of EXPECTED_TRACK_IDS) {
    const codingQuestionIds = trackId === "coding-interview-dsa-problem-solving" ? Array.from({ length: 40 }, (_, index) => `${trackId}-${suffix}-q-${index + 1}`) : undefined;
    const artifact = {
      schemaVersion: "patternly-content-artifact-v2",
      trackId,
      contentVersion: `2026.09.12-${suffix}`,
      questions: (codingQuestionIds ?? [`${trackId}-${suffix}-q`]).map((questionId) => ({
        questionId,
        trackId,
        nodeId: `${trackId}-node`,
        mentalUnitId: `${trackId}-mu`,
        ...(trackId === "google-cloud-associate-cloud-engineer" ? { contentDomainId: "gcp-ace-standard-domain-3" } : {}),
      })),
    };
    artifact.planningPolicy = validPlanningPolicy(artifact.questions);
    if (trackId === "google-cloud-associate-cloud-engineer") artifact.simulationProfiles = [validGcpSimulationProfile(artifact.contentVersion, `${trackId}-node`)];
    if (codingQuestionIds) artifact.simulationProfiles = [validCodingSimulationProfile(codingQuestionIds)];
    if (DESIGN_TRACK_IDS.includes(trackId)) artifact.simulationProfiles = [validDesignSimulationProfile(trackId)];
    const bytes = Buffer.from(JSON.stringify(artifact));
    await writeFile(path.join(directory, `${trackId}.json`), bytes);
    tracks.push({ trackId, contentVersion: artifact.contentVersion, questionCount: artifact.questions.length, sha256: sha256(bytes) });
  }
  tracks.sort((left, right) => left.trackId.localeCompare(right.trackId));
  await writeFile(path.join(directory, "content-lock.json"), JSON.stringify({ schemaVersion: "patternly-content-lock-v1", tracks }));
}

async function createPredecessorFromBuiltSet(sourceDirectory, directory) {
  await mkdir(directory, { recursive: true });
  const tracks = [];
  for (const trackId of EXPECTED_TRACK_IDS) {
    const successor = JSON.parse(await readFile(path.join(sourceDirectory, `${trackId}.json`), "utf8"));
    delete successor.planningPolicy;
    successor.schemaVersion = "patternly-content-artifact-v1";
    successor.contentVersion = `legacy-${successor.contentVersion}`;
    const bytes = Buffer.from(JSON.stringify(successor));
    await writeFile(path.join(directory, `${trackId}.json`), bytes);
    tracks.push({ trackId, contentVersion: successor.contentVersion, questionCount: successor.questions.length, sha256: sha256(bytes) });
  }
  tracks.sort((left, right) => left.trackId.localeCompare(right.trackId));
  const lock = { schemaVersion: "patternly-content-lock-v1", tracks };
  await writeFile(path.join(directory, "content-lock.json"), JSON.stringify(lock));
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "patternly-canonical-sync-test-"));
  const appRoot = path.join(root, "patternly");
  const producerRoot = path.join(root, "patternly-content");
  const producerOutput = path.join(root, "producer-output");
  const targetDirectory = path.join(appRoot, GENERATED_DIRECTORY);
  const targetLockFile = path.join(appRoot, RELEASE_LOCK_RELATIVE_PATH);
  const contractRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(import.meta.dirname, "../../patternly-content"));
  await mkdir(path.dirname(targetDirectory), { recursive: true });
  await mkdir(path.join(producerRoot, "scripts"), { recursive: true });
  await writeFile(path.join(producerRoot, "scripts", "build.mjs"), "// fixture\n");
  await mkdir(path.join(producerRoot, "scripts", "content"), { recursive: true });
  await mkdir(path.join(producerRoot, "config"), { recursive: true });
  await Promise.all(["question-contract.mjs", "case-recipe.mjs", "planning-policy.mjs", "track-runtime-bindings.mjs"].map((name) => cp(
    path.join(contractRoot, "scripts", "content", name),
    path.join(producerRoot, "scripts", "content", name),
  )));
  await cp(path.join(contractRoot, "config/track-runtime-bindings.json"), path.join(producerRoot, "config/track-runtime-bindings.json"));
  git(producerRoot, "init", "-q", "-b", "master");
  git(producerRoot, "remote", "add", "origin", "https://github.com/lukaszkurczab/patternly-content.git");
  const head = commitProducer(producerRoot);
  await createBuiltSet(producerOutput);
  await mkdir(targetDirectory, { recursive: true });
  for (const name of await readdir(producerOutput)) await cp(path.join(producerOutput, name), path.join(targetDirectory, name), { recursive: true });
  await mkdir(path.dirname(targetLockFile), { recursive: true });
  await writeFile(targetLockFile, "{}\n");
  const buildResultFrom = async (directory) => {
    const lock = JSON.parse(await readFile(path.join(directory, "content-lock.json"), "utf8"));
    const artifacts = await Promise.all(EXPECTED_TRACK_IDS.map(async (trackId) => {
      const artifactBytes = await readFile(path.join(directory, `${trackId}.json`), "utf8");
      const artifact = JSON.parse(artifactBytes);
      return { trackId, track: { contentVersion: artifact.contentVersion }, artifactBytes, questions: artifact.questions, artifact };
    }));
    return { outputRoot: directory, catalog: { tracks: EXPECTED_TRACK_IDS }, lock, artifacts };
  };
  const identityFor = async (directory) => {
    const built = await buildResultFrom(directory);
    const tracks = EXPECTED_TRACK_IDS.map((trackId) => {
      const artifact = built.artifacts.find((entry) => entry.trackId === trackId);
      const bytes = Buffer.from(artifact.artifactBytes);
      return { trackId, contentVersion: artifact.track.contentVersion, artifactSha256: sha256(bytes), artifactBytes: bytes.length, questionCount: artifact.questions.length };
    });
    return { schemaVersion: "patternly-current-content-identity-v1", ownerPolicy: "standing-owner-decision-2026-10-19-current-source", sourceInputFingerprint: sha256(Buffer.from(JSON.stringify(tracks))), sourceRepositoryCommit: git(producerRoot, "rev-parse", "HEAD"), sourceTree: "clean", tracks, verificationCategories: [], claims: { semanticReview: "not_claimed", publication: "not_performed", deployment: "not_performed", deviceAcceptance: "not_claimed" } };
  };
  const runBuild = async ({ outputRoot }) => {
    for (const name of await readdir(producerOutput)) await cp(path.join(producerOutput, name), path.join(outputRoot, name), { recursive: true });
    return buildResultFrom(outputRoot);
  };
  const getCurrentIdentity = async ({ built }) => identityFor(built.outputRoot);
  const getFreshSourceFingerprint = async () => (await identityFor(producerOutput)).sourceInputFingerprint;
  const options = { appRoot, producerRoot, targetDirectory, targetLockFile, runBuild, expectedContentCommit: head, getCurrentIdentity, getFreshSourceFingerprint, expectedInventory: SMALL_INVENTORY };
  return { root, appRoot, producerRoot, producerOutput, targetDirectory, targetLockFile, options, head };
}

async function snapshot(directory) {
  const names = (await readdir(directory)).sort();
  return Promise.all(names.map(async (name) => [name, sha256(await readFile(path.join(directory, name)))]));
}

test("current-bank preparation rejects non-main or working inputs before build or recovery", async (t) => {
  const cases = [
    ["tracked WIP", async state => writeFile(path.join(state.producerRoot, "scripts/build.mjs"), "// changed\n"), /has working changes/u],
    ["staged WIP", async state => { await writeFile(path.join(state.producerRoot, "candidate.json"), "{}\n"); git(state.producerRoot, "add", "candidate.json"); }, /has working changes/u],
    ["untracked WIP", async state => writeFile(path.join(state.producerRoot, "candidate.json"), "{}\n"), /has working changes/u],
    ["missing main ref", async state => git(state.producerRoot, "update-ref", "-d", "refs/remotes/origin/master"), /source is unavailable/u],
    ["different main ref", async state => { await writeFile(path.join(state.producerRoot, "later.txt"), "next\n"); commitProducer(state.producerRoot); git(state.producerRoot, "reset", "--hard", state.head); }, /HEAD must match origin\/master/u],
    ["foreign origin", async state => git(state.producerRoot, "remote", "set-url", "origin", "https://github.com/example/other-content.git"), /origin must identify/u],
    ["nested root", async state => { state.options.producerRoot = path.join(state.producerRoot, "scripts"); }, /must be the patternly-content repository root/u],
    ["wrong expected SHA", async state => { state.options.expectedContentCommit = "f".repeat(40); }, /expected exact SHA/u],
  ];
  for (const [name, changeSource, category] of cases) await t.test(name, async (t) => {
    const state = await fixture();
    t.after(() => rm(state.root, { recursive: true, force: true }));
    await changeSource(state);
    const before = await snapshot(state.targetDirectory);
    const lockBefore = await readFile(state.targetLockFile);
    const sourceBefore = git(state.producerRoot, "status", "--porcelain=v1", "--untracked-files=all");
    const journal = `${state.targetDirectory}.transaction.json`;
    await writeFile(journal, "preserve unresolved transaction\n");
    let buildCalled = false;
    await assert.rejects(syncCanonicalContent({ ...state.options, runBuild: async () => { buildCalled = true; } }), category);
    assert.equal(buildCalled, false);
    assert.deepEqual(await snapshot(state.targetDirectory), before);
    assert.deepEqual(await readFile(state.targetLockFile), lockBefore);
    assert.equal(await readFile(journal, "utf8"), "preserve unresolved transaction\n");
    assert.equal(git(state.producerRoot, "status", "--porcelain=v1", "--untracked-files=all"), sourceBefore);
  });
});

test("explicit candidate mode accepts dirty canonical source, pins its fingerprint, and marks output local", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await writeFile(path.join(state.producerRoot, "candidate-content.json"), "local candidate\n");
  const nonClaudeBefore = new Map((await snapshot(state.targetDirectory)).filter(([name]) => name !== `${CLAUDE_TRACK_ID}.json` && name !== "content-lock.json" && name !== SUCCESSOR_LEDGER_FILE_NAME));
  const result = await syncCanonicalContent({ ...state.options, mode: "candidate" });
  assert.equal(result.currentIdentity.sourceTree, "dirty");
  assert.match(result.currentIdentity.sourceInputFingerprint, /^[a-f0-9]{64}$/u);
  const lock = JSON.parse(await readFile(state.targetLockFile, "utf8"));
  assert.equal(lock.releaseId, `patternly-local-candidate-${result.currentIdentity.sourceInputFingerprint.slice(0, 20)}`);
  assert.equal(lock.currentIdentity.sourceTree, "dirty");
  assert.equal(lock.sourceRepositoryCommit, state.head);
  assert.deepEqual(new Map((await snapshot(state.targetDirectory)).filter(([name]) => name !== `${CLAUDE_TRACK_ID}.json` && name !== "content-lock.json" && name !== SUCCESSOR_LEDGER_FILE_NAME)), nonClaudeBefore);
});

test("candidate mode rejects a clean source and never weakens ordinary sync", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const before = await snapshot(state.targetDirectory);
  await assert.rejects(syncCanonicalContent({ ...state.options, mode: "candidate" }), /requires explicit uncommitted content changes/u);
  await writeFile(path.join(state.producerRoot, "candidate-content.json"), "local candidate\n");
  await assert.rejects(syncCanonicalContent(state.options), /has working changes/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
});

test("authorized current-bank sync fails closed without a source-derived accepted bank manifest", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await writeFile(path.join(state.producerRoot, "accepted-source-is-dirty.json"), "authorized integration probe\n");
  const before = await snapshot(state.targetDirectory);
  const lockBefore = await readFile(state.targetLockFile);
  await assert.rejects(syncCanonicalContent({ ...state.options, mode: "authorized-current-approach-challenge" }), /source manifest differs from the accepted/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.deepEqual(await readFile(state.targetLockFile), lockBefore);
  assert.equal(git(state.producerRoot, "status", "--porcelain=v1", "--untracked-files=all").includes("accepted-source-is-dirty.json"), true);
});

test("accepted bank contract binds exact source entries to the source-derived artifact SHA", () => {
  const problems = [];
  const familyCounts = {};
  for (const [familyId, count] of Object.entries(APPROACH_CHALLENGE_BANK_CONTRACT.familyCounts)) {
    familyCounts[familyId] = count;
    for (let index = 1; index <= count; index += 1) {
      const problemId = `contract-${familyId}-${String(index).padStart(2, "0")}`;
      problems.push({
        problemId, problemVersion: "1", primaryFamilyId: familyId,
        approachQuestion: { questionId: `${problemId}-q1` },
        complexityQuestion: { questionId: `${problemId}-q2` },
      });
    }
  }
  const sourceEntries = problems.map((problem, index) => ({
    familyId: problem.primaryFamilyId,
    problemId: problem.problemId,
    problemVersion: problem.problemVersion,
    sourcePath: `content/${problem.primaryFamilyId}/${problem.problemId}.json`,
    sourceSha256: sha256(Buffer.from(`source:${index}:${problem.problemId}`)),
    questionIds: [problem.approachQuestion.questionId, problem.complexityQuestion.questionId],
  }));
  const sourceManifest = {
    registryVersion: "test-current-bank-v2",
    problemCount: APPROACH_CHALLENGE_BANK_CONTRACT.problemCount,
    questionCount: APPROACH_CHALLENGE_BANK_CONTRACT.questionCount,
    freeProblemCount: APPROACH_CHALLENGE_BANK_CONTRACT.freeProblemCount,
    premiumProblemCount: APPROACH_CHALLENGE_BANK_CONTRACT.premiumProblemCount,
    familyCounts,
    sourceEntries,
  };
  const artifactBytes = Buffer.from(JSON.stringify({ trackId: APPROACH_CHALLENGE_TRACK_ID, approachChallengeProblems: problems }));
  const artifactSha256 = sha256(artifactBytes);
  const currentIdentity = { tracks: [{ trackId: APPROACH_CHALLENGE_TRACK_ID, artifactSha256 }] };
  const contract = deriveAcceptedApproachChallengeContract(sourceManifest, artifactBytes, currentIdentity);
  assert.equal(contract.registryVersion, sourceManifest.registryVersion);
  assert.equal(contract.artifactSha256, artifactSha256);
  assert.equal(contract.sourceEntries.length, 472);
  assert.throws(() => deriveAcceptedApproachChallengeContract(sourceManifest, artifactBytes, {
    tracks: [{ trackId: APPROACH_CHALLENGE_TRACK_ID, artifactSha256: "f".repeat(64) }],
  }), /does not bind the actual paired-bank artifact hash/u);
  const mismatched = structuredClone(sourceManifest);
  mismatched.sourceEntries[0].sourceSha256 = "bad";
  assert.throws(() => deriveAcceptedApproachChallengeContract(mismatched, artifactBytes, currentIdentity), /invalid or duplicate source entry/u);
});

test("a clean detached canonical main checkout retains exact source provenance", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  git(state.producerRoot, "checkout", "--quiet", "--detach", state.head);
  git(state.producerRoot, "remote", "set-url", "origin", "git@github.com:lukaszkurczab/patternly-content.git");
  const result = await syncCanonicalContent(state.options);
  assert.equal(result.head, state.head);
  const lock = JSON.parse(await readFile(state.targetLockFile, "utf8"));
  assert.equal(lock.sourceRepositoryCommit, state.head);
  assert.equal(lock.currentIdentity.sourceTree, "clean");
  await syncCanonicalContent({ ...state.options, mode: "check" });
});

test("direct sync honors the expected source SHA from its environment", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const inherited = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
  process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA = "f".repeat(40);
  const options = { ...state.options, expectedContentCommit: undefined };
  const before = await snapshot(state.targetDirectory);
  try {
    await assert.rejects(syncCanonicalContent(options), /expected exact SHA/u);
    assert.deepEqual(await snapshot(state.targetDirectory), before);
  } finally {
    if (inherited === undefined) delete process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
    else process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA = inherited;
  }
});

test("source drift during preparation cannot replace APP bank bytes", async (t) => {
  for (const kind of ["working edit", "main ref", "head and main"]) await t.test(kind, async (t) => {
    const state = await fixture();
    t.after(() => rm(state.root, { recursive: true, force: true }));
    const before = await snapshot(state.targetDirectory);
    const lockBefore = await readFile(state.targetLockFile);
    await assert.rejects(syncCanonicalContent({
      ...state.options,
      expectedContentCommit: "",
      getFreshSourceFingerprint: async () => {
        const fingerprint = await state.options.getFreshSourceFingerprint();
        if (kind === "main ref") git(state.producerRoot, "update-ref", "-d", "refs/remotes/origin/master");
        else {
          await writeFile(path.join(state.producerRoot, "later.txt"), "changed while preparing\n");
          if (kind === "head and main") commitProducer(state.producerRoot);
        }
        return fingerprint;
      },
    }), /source is unavailable|has working changes|commit changed during preparation/u);
    assert.deepEqual(await snapshot(state.targetDirectory), before);
    assert.deepEqual(await readFile(state.targetLockFile), lockBefore);
  });
});

test("check cannot report success after the source becomes dirty", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const before = await snapshot(state.targetDirectory);
  const lockBefore = await readFile(state.targetLockFile);
  await assert.rejects(syncCanonicalContent({
    ...state.options, mode: "check",
    getCurrentIdentity: async options => {
      const identity = await state.options.getCurrentIdentity(options);
      await writeFile(path.join(state.producerRoot, "candidate.json"), "{}\n");
      return identity;
    },
  }), /has working changes/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.deepEqual(await readFile(state.targetLockFile), lockBefore);
});

test("source fingerprint drift fails before installing any current-bank bytes", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const before = await snapshot(state.targetDirectory);
  const lockBefore = await readFile(state.targetLockFile);
  await assert.rejects(syncCanonicalContent({
    ...state.options,
    getFreshSourceFingerprint: async () => "f".repeat(64),
  }), /source changed while the current application bank was being prepared/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.deepEqual(await readFile(state.targetLockFile), lockBefore);
});

test("sync replaces the whole generated directory with an exact validated set", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const result = await syncCanonicalContent(state.options);
  assert.equal(result.head, state.head);
  assert.deepEqual(result.inventory, SMALL_INVENTORY);
  assert.deepEqual((await readdir(state.targetDirectory)).sort(), [...EXPECTED_TRACK_IDS.map((id) => `${id}.json`), "content-lock.json", SUCCESSOR_LEDGER_FILE_NAME].sort());
  const installed = Object.fromEntries(await snapshot(state.targetDirectory));
  const producer = Object.fromEntries(await snapshot(state.producerOutput));
  for (const [name, digest] of Object.entries(producer)) assert.equal(installed[name], digest);
  assert.equal(result.ledger.tracks.length, 9);
});

test("sync loads content validation contracts from its explicit producer root", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const policyPath = path.join(state.producerRoot, "scripts/content/planning-policy.mjs");
  const policySource = await readFile(policyPath, "utf8");
  const signature = "export function validatePlanningPolicy(policy, questions) {";
  assert.ok(policySource.includes(signature), "test producer has its own contract implementation");
  await writeFile(policyPath, policySource.replace(signature, `${signature}\n  throw new Error("explicit producer contract root used");`));
  state.options.expectedContentCommit = commitProducer(state.producerRoot);
  await assert.rejects(syncCanonicalContent(state.options), /explicit producer contract root used/u);
  assert.ok(await lstat(state.targetDirectory));
});

test("repeated sync and check preserve the validated training predecessor ledger byte-for-byte", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const ledgerPath = path.join(state.targetDirectory, SUCCESSOR_LEDGER_FILE_NAME);
  const initialLedger = await readFile(ledgerPath);
  const initialDirectory = await snapshot(state.targetDirectory);

  await syncCanonicalContent(state.options);
  assert.deepEqual(await readFile(ledgerPath), initialLedger);
  assert.deepEqual(await snapshot(state.targetDirectory), initialDirectory);

  const checked = await syncCanonicalContent({ ...state.options, mode: "check" });
  assert.deepEqual(await readFile(ledgerPath), initialLedger);
  assert.equal(checked.ledger.tracks.length, 9);
});

test("current source preserves the GCP simulation contract without retired evidence snapshots", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const result = await syncCanonicalContent(state.options);
  const gcp = JSON.parse(await readFile(path.join(state.targetDirectory, "google-cloud-associate-cloud-engineer.json"), "utf8"));
  assert.equal(Object.hasOwn(gcp.simulationProfiles[0].familyConfig, "nodeDomainMapEvidence"), false);
  assert.deepEqual(gcp.simulationProfiles[0].familyConfig.nodeDomainMap, { [`${gcp.trackId}-node`]: "gcp-ace-standard-domain-3" });
  assert.equal(result.inventory.questionCount, SMALL_INVENTORY.questionCount);
});

test("current source changes automatically advance the exact training identity", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const originalLedger = JSON.parse(await readFile(path.join(state.targetDirectory, SUCCESSOR_LEDGER_FILE_NAME), "utf8"));

  const trackId = "claude-certified-architect-professional-certification";
  const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  artifact.contentVersion = "claude-reviewed-successor-v2";
  artifact.questions[0].prompt += " Reviewed clarification.";
  const artifactBytes = Buffer.from(JSON.stringify(artifact));
  await writeFile(artifactPath, artifactBytes);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  const entry = lock.tracks.find((track) => track.trackId === trackId);
  entry.contentVersion = artifact.contentVersion;
  entry.sha256 = sha256(artifactBytes);
  await writeFile(lockPath, JSON.stringify(lock));

  const result = await syncCanonicalContent(state.options);
  const successor = result.ledger.tracks.find((track) => track.trackId === trackId);
  assert.equal(successor.training.contentVersion, artifact.contentVersion);
  assert.notEqual(successor.training.artifactSha256, originalLedger.tracks.find((track) => track.trackId === trackId)?.training.artifactSha256);
  assert.deepEqual(result.ledger.tracks.filter((track) => track.trackId !== trackId).map((track) => track.training),
    originalLedger.tracks.filter((track) => track.trackId !== trackId).map((track) => track.training));
});

test("changed question inventory becomes the current bank and does not preserve an obsolete training identity", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const changedTrackIds = [CLAUDE_TRACK_ID, "frontend-system-design-interview"];
  for (const trackId of changedTrackIds) {
    const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
    const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
    artifact.contentVersion = `${trackId}-changed-count-v2`;
    artifact.questions.push({ ...artifact.questions[0], questionId: `${trackId}-added-question` });
    const bytes = Buffer.from(JSON.stringify(artifact));
    await writeFile(artifactPath, bytes);
    const lockPath = path.join(state.producerOutput, "content-lock.json");
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    const entry = lock.tracks.find((track) => track.trackId === trackId);
    entry.contentVersion = artifact.contentVersion;
    entry.questionCount = artifact.questions.length;
    entry.sha256 = sha256(bytes);
    await writeFile(lockPath, JSON.stringify(lock));
  }
  const currentOptions = { ...state.options };
  delete currentOptions.expectedInventory;
  const result = await syncCanonicalContent(currentOptions);
  assert.equal(result.inventory.questionCount, SMALL_INVENTORY.questionCount + changedTrackIds.length);
  for (const trackId of changedTrackIds) {
    const artifact = JSON.parse(await readFile(path.join(state.targetDirectory, `${trackId}.json`), "utf8"));
    const training = result.ledger.tracks.find((entry) => entry.trackId === trackId).training;
    assert.equal(training.contentVersion, artifact.contentVersion);
    assert.equal(training.questionCount, artifact.questions.length);
  }
});

test("sync accepts a complete GCP Exam envelope inside the artifact lock boundary", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const trackId = "google-cloud-associate-cloud-engineer";
  const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  assert.equal(artifact.simulationProfiles[0].familyId, "certification");
  assert.equal(artifact.simulationProfiles[0].modeId, "certification-exam-simulation");
  const artifactBytes = Buffer.from(JSON.stringify(artifact));
  await writeFile(artifactPath, artifactBytes);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  lock.tracks.find((entry) => entry.trackId === trackId).sha256 = sha256(artifactBytes);
  await writeFile(lockPath, JSON.stringify(lock));

  await syncCanonicalContent(state.options);
  const synced = JSON.parse(await readFile(path.join(state.targetDirectory, `${trackId}.json`), "utf8"));
  assert.deepEqual(synced.simulationProfiles, artifact.simulationProfiles);
  assert.equal(lock.tracks.find((entry) => entry.trackId === trackId).sha256, sha256(await readFile(path.join(state.targetDirectory, `${trackId}.json`))));
});

test("sync accepts the exact Coding Mock profile with its ordered 40-question pool", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const trackId = "coding-interview-dsa-problem-solving";
  const artifact = JSON.parse(await readFile(path.join(state.producerOutput, `${trackId}.json`), "utf8"));
  assert.equal(artifact.simulationProfiles[0].familyId, "coding_interview");
  assert.equal(artifact.simulationProfiles[0].modeId, "coding-interview-simulation");
  assert.equal(artifact.simulationProfiles[0].familyConfig.eligibleQuestionIds.length, 40);
  await syncCanonicalContent(state.options);
  const synced = JSON.parse(await readFile(path.join(state.targetDirectory, `${trackId}.json`), "utf8"));
  assert.deepEqual(synced.simulationProfiles, artifact.simulationProfiles);
});

test("sync accepts and preserves each exact per-track Design Interview simulation profile", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  for (const trackId of DESIGN_TRACK_IDS) {
    const artifact = JSON.parse(await readFile(path.join(state.producerOutput, `${trackId}.json`), "utf8"));
    assert.equal(artifact.simulationProfiles[0].profileId, `${trackId}-simulation-v1`);
    const synced = JSON.parse(await readFile(path.join(state.targetDirectory, `${trackId}.json`), "utf8"));
    assert.deepEqual(synced.simulationProfiles, artifact.simulationProfiles);
  }
});

test("sync rejects Design profile identity, deadline, stage, response, criterion, rubric, and scoring drift", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const targetBefore = await snapshot(state.targetDirectory);
  const trackId = DESIGN_TRACK_IDS[0];
  const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const originalArtifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const originalLock = JSON.parse(await readFile(lockPath, "utf8"));
  const mutations = [
    (profile) => { profile.profileId = `${DESIGN_TRACK_IDS[1]}-simulation-v1`; },
    (profile) => { profile.familyConfig.timer.durationSeconds = 2701; },
    (profile) => { profile.familyConfig.stages[1].stageId = "tradeoffs"; },
    (profile) => { profile.familyConfig.stages[0].response.required = false; },
    (profile) => { profile.familyConfig.reviewCriteria[0].stageId = "architecture"; },
    (profile) => { profile.familyConfig.rubric.kind = "scored"; },
    (profile) => { profile.familyConfig.outcomeEvaluation.semanticScoring = "evaluated"; },
  ];
  for (const mutate of mutations) {
    const artifact = structuredClone(originalArtifact);
    mutate(artifact.simulationProfiles[0]);
    const bytes = Buffer.from(JSON.stringify(artifact));
    await writeFile(artifactPath, bytes);
    const lock = structuredClone(originalLock);
    lock.tracks.find((entry) => entry.trackId === trackId).sha256 = sha256(bytes);
    await writeFile(lockPath, JSON.stringify(lock));
    await assert.rejects(syncCanonicalContent(state.options));
    assert.deepEqual(await snapshot(state.targetDirectory), targetBefore);
  }
});

test("sync rejects Coding Mock profiles that drift from the declared strict contract", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const targetBefore = await snapshot(state.targetDirectory);
  const trackId = "coding-interview-dsa-problem-solving";
  const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const originalArtifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const originalLock = JSON.parse(await readFile(lockPath, "utf8"));
  const mutations = [
    (profile) => { profile.familyId = "certification"; },
    (profile) => { profile.modeId = "coding-interview-guided-practice"; },
    (profile) => { profile.familyConfig.durationMinutes = 44; },
    (profile) => { profile.familyConfig.selectionPolicy.prohibitFallbackItems = false; },
    (profile) => { profile.familyConfig.eligibleQuestionIds[1] = profile.familyConfig.eligibleQuestionIds[0]; },
    (profile) => { profile.familyConfig.eligibleQuestionIds.pop(); },
  ];
  for (const mutate of mutations) {
    const artifact = structuredClone(originalArtifact);
    mutate(artifact.simulationProfiles[0]);
    const bytes = Buffer.from(JSON.stringify(artifact));
    await writeFile(artifactPath, bytes);
    const lock = structuredClone(originalLock);
    lock.tracks.find((entry) => entry.trackId === trackId).sha256 = sha256(bytes);
    await writeFile(lockPath, JSON.stringify(lock));
    await assert.rejects(syncCanonicalContent(state.options));
    assert.deepEqual(await snapshot(state.targetDirectory), targetBefore);
  }
});

test("current source can install a valid GCP artifact without historical checkout reconstruction", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const trackId = "google-cloud-associate-cloud-engineer";
  const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  delete artifact.simulationProfiles;
  for (const question of artifact.questions) delete question.contentDomainId;
  const bytes = Buffer.from(JSON.stringify(artifact));
  await writeFile(artifactPath, bytes);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  lock.tracks.find((entry) => entry.trackId === trackId).sha256 = sha256(bytes);
  await writeFile(lockPath, JSON.stringify(lock));

  await validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY });
  const result = await syncCanonicalContent(state.options);
  assert.equal(result.inventory.questionCount, SMALL_INVENTORY.questionCount);
  assert.equal(result.ledger.tracks.length, 9);
});

test("sync rejects malformed GCP profiles before replacing the target even when lock SHA is recomputed", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const targetBefore = await snapshot(state.targetDirectory);
  const trackId = "google-cloud-associate-cloud-engineer";
  const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const originalArtifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const originalLock = JSON.parse(await readFile(lockPath, "utf8"));
  const mutations = [
    (profile) => { profile.schemaVersion = "patternly-simulation-profile-v2"; },
    (profile) => { profile.profileVersion = "2"; },
    (profile) => { profile.familyId = "coding_interview"; },
    (profile) => { profile.modeId = "certification-focus-practice"; },
    (profile) => { profile.familyConfig.schemaVersion = "patternly-certification-simulation-config-v2"; },
    (profile) => { profile.familyConfig.questionCount.maximum = 61; },
    (profile) => { delete profile.familyConfig.nodeDomainMap[`${trackId}-node`]; },
    (profile) => { profile.familyConfig.nodeDomainMap[`${trackId}-node`] = "foreign-domain"; },
    (profile) => { profile.familyConfig.nodeDomainMap[`${trackId}-node`] = "gcp-ace-standard-domain-2"; },
    (profile) => { profile.familyConfig.nodeDomainMapEvidence = { contentVersion: "foreign-version" }; },
  ];
  for (const mutate of mutations) {
    const artifact = structuredClone(originalArtifact);
    mutate(artifact.simulationProfiles[0]);
    const bytes = Buffer.from(JSON.stringify(artifact));
    await writeFile(artifactPath, bytes);
    const lock = structuredClone(originalLock);
    lock.tracks.find((entry) => entry.trackId === trackId).sha256 = sha256(bytes);
    await writeFile(lockPath, JSON.stringify(lock));
    await assert.rejects(syncCanonicalContent(state.options));
    assert.deepEqual(await snapshot(state.targetDirectory), targetBefore);
  }
});

test("check mode proves byte parity and never writes inside the application root", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const before = await snapshot(state.targetDirectory);
  const rootBefore = (await readdir(state.appRoot, { recursive: true })).sort();
  const result = await syncCanonicalContent({ ...state.options, mode: "check" });
  assert.equal(result.mode, "check");
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.deepEqual((await readdir(state.appRoot, { recursive: true })).sort(), rootBefore);
});

test("check fails on byte drift without repairing it", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const file = path.join(state.targetDirectory, `${EXPECTED_TRACK_IDS[0]}.json`);
  await writeFile(file, `${await readFile(file, "utf8")} `);
  const drifted = await readFile(file);
  await assert.rejects(syncCanonicalContent({ ...state.options, mode: "check" }), /SHA-256 mismatch/u);
  assert.deepEqual(await readFile(file), drifted);
});

test("producer failure preserves the existing complete target and cleans staging", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const before = await snapshot(state.targetDirectory);
  await assert.rejects(syncCanonicalContent({ ...state.options, runBuild: async () => { throw new Error("producer failed"); } }), /producer failed/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.equal((await readdir(path.dirname(state.targetDirectory))).some((name) => name.startsWith(".canonical-content-build-")), false);
});

test("failed second rename rolls back the previous directory", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const before = await snapshot(state.targetDirectory);
  let calls = 0;
  const move = async (from, to) => {
    calls += 1;
    if (calls === 2) throw new Error("injected replacement failure");
    return rename(from, to);
  };
  await assert.rejects(syncCanonicalContent({ ...state.options, move }), /previous bank restored/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.equal(await lstat(`${state.targetDirectory}.backup`).then(() => true, () => false), false);
});

test("a missing installed bank fails closed instead of restoring an old checkout automatically", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  await rename(state.targetDirectory, `${state.targetDirectory}.backup`);
  await assert.rejects(syncCanonicalContent(state.options));
  assert.equal(await lstat(state.targetDirectory).then(() => true, () => false), false);
  assert.equal(await lstat(`${state.targetDirectory}.backup`).then(() => true, () => false), true);
});

test("validation rejects extra files, duplicate IDs, tampering, and symlink entries", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await writeFile(path.join(state.producerOutput, "extra.json"), "{}");
  await assert.rejects(validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY }), /exactly the nine/u);
  await rm(path.join(state.producerOutput, "extra.json"));

  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  lock.tracks[1].trackId = lock.tracks[0].trackId;
  await writeFile(lockPath, JSON.stringify(lock));
  await assert.rejects(validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY }), /missing, extra, or duplicate/u);

  await rm(state.producerOutput, { recursive: true });
  await createBuiltSet(state.producerOutput);
  const artifact = path.join(state.producerOutput, `${EXPECTED_TRACK_IDS[0]}.json`);
  await writeFile(artifact, `${await readFile(artifact, "utf8")} `);
  await assert.rejects(validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY }), /SHA-256 mismatch/u);

  await rm(state.producerOutput, { recursive: true });
  await createBuiltSet(state.producerOutput);
  const realArtifact = path.join(state.producerOutput, `${EXPECTED_TRACK_IDS[0]}.json`);
  const bytes = await readFile(realArtifact);
  await rm(realArtifact);
  const outside = path.join(state.root, "outside.json");
  await writeFile(outside, bytes);
  await symlink(outside, realArtifact);
  await assert.rejects(validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY }), /non-regular entry/u);
});

test("validation rejects a missing or misnamed artifact and an unsorted lock", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const artifact = path.join(state.producerOutput, `${EXPECTED_TRACK_IDS[0]}.json`);
  await rename(artifact, path.join(state.producerOutput, "misnamed.json"));
  await assert.rejects(validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY }), /exactly the nine/u);

  await rm(state.producerOutput, { recursive: true });
  await createBuiltSet(state.producerOutput);
  const lockPath = path.join(state.producerOutput, "content-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  lock.tracks.reverse();
  await writeFile(lockPath, JSON.stringify(lock));
  await assert.rejects(validateBuiltContent(state.producerOutput, { expectedInventory: SMALL_INVENTORY }), /sorted by trackId/u);
});

test("failed first rename preserves the target byte-for-byte and leaves no transaction debris", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const before = await snapshot(state.targetDirectory);
  await assert.rejects(syncCanonicalContent({
    ...state.options,
    move: async () => { throw new Error("injected first rename failure"); },
  }), /previous bank restored/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  const names = await readdir(path.dirname(state.targetDirectory));
  assert.equal(names.some((name) => name.includes(".backup") || name.includes(".failed-") || name.startsWith(".canonical-content-build-")), false);
});

test("each paired-directory and release-lock rename failure restores both previous targets", async (t) => {
  for (const failureAt of [1, 2, 3, 4]) {
    const state = await fixture();
    t.after(() => rm(state.root, { recursive: true, force: true }));
    await syncCanonicalContent(state.options);
    const before = await snapshot(state.targetDirectory);
    const lockBefore = await readFile(state.targetLockFile);
    let calls = 0;
    await assert.rejects(syncCanonicalContent({
      ...state.options,
      move: async (from, to) => {
        calls += 1;
        if (calls === failureAt) throw new Error(`injected rename stage ${failureAt}`);
        return rename(from, to);
      },
    }), /previous bank restored/u);
    assert.deepEqual(await snapshot(state.targetDirectory), before, `directory after rename stage ${failureAt}`);
    assert.deepEqual(await readFile(state.targetLockFile), lockBefore, `release lock after rename stage ${failureAt}`);
    assert.equal(await lstat(`${state.targetDirectory}.transaction.json`).then(() => true, () => false), false);
    assert.equal(await lstat(`${state.targetDirectory}.previous`).then(() => true, () => false), false);
    assert.equal(await lstat(`${state.targetLockFile}.previous`).then(() => true, () => false), false);
  }
});

test("sync detects a concurrent installed-bank edit immediately before replacement", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const lockBefore = await readFile(state.targetLockFile);
  let changed = false;
  await assert.rejects(syncCanonicalContent({
    ...state.options,
    getFreshSourceFingerprint: async () => {
      if (!changed) {
        changed = true;
        const target = path.join(state.targetDirectory, `${EXPECTED_TRACK_IDS[0]}.json`);
        await writeFile(target, `${await readFile(target, "utf8")} `);
      }
      return await state.options.getFreshSourceFingerprint();
    },
  }), /Installed content changed while the new bank was being prepared|SHA-256 mismatch/u);
  assert.equal(changed, true);
  assert.equal(await readFile(state.targetLockFile, "utf8"), lockBefore.toString("utf8"));
  assert.equal((await readFile(path.join(state.targetDirectory, `${EXPECTED_TRACK_IDS[0]}.json`), "utf8")).endsWith(" "), true);
});

test("sync preserves a conflicting target and recoverable backups after an interrupted transaction", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const targetBackup = `${state.targetDirectory}.previous`;
  const lockBackup = `${state.targetLockFile}.previous`;
  const stagedDirectory = path.join(path.dirname(state.targetDirectory), `.canonical-content-build-${process.pid}-conflict`);
  const stagedLockDirectory = path.join(path.dirname(state.targetLockFile), `.current-content-lock-${process.pid}-conflict`);
  const stagedLockFile = path.join(stagedLockDirectory, "release.lock.json");
  await rename(state.targetDirectory, targetBackup);
  await rename(state.targetLockFile, lockBackup);
  await cp(state.producerOutput, stagedDirectory, { recursive: true });
  await mkdir(stagedLockDirectory);
  const stagedLockBytes = await readFile(lockBackup);
  await writeFile(stagedLockFile, stagedLockBytes);
  const digests = async (directory) => Object.fromEntries(await Promise.all((await readdir(directory)).map(async (name) => [name, sha256(await readFile(path.join(directory, name)))])));
  const journal = {
    schemaVersion: 1, phase: "prepared", targetDirectory: state.targetDirectory, targetLockFile: state.targetLockFile,
    backupDirectory: targetBackup, backupLockFile: lockBackup, stagedDirectory, stagedLockFile,
    previousDirectoryDigests: await digests(targetBackup), previousLockSha256: sha256(await readFile(lockBackup)),
    stagedDirectoryDigests: await digests(stagedDirectory), stagedLockSha256: sha256(stagedLockBytes),
  };
  await mkdir(state.targetDirectory);
  await writeFile(path.join(state.targetDirectory, "concurrent-edit.txt"), "preserve this edit");
  const conflictingLock = Buffer.from("concurrent release-lock edit\n");
  await writeFile(state.targetLockFile, conflictingLock);
  await writeFile(`${state.targetDirectory}.transaction.json`, JSON.stringify(journal));
  await assert.rejects(syncCanonicalContent(state.options), /conflicts with concurrently changed target/u);
  assert.equal(await readFile(path.join(state.targetDirectory, "concurrent-edit.txt"), "utf8"), "preserve this edit");
  assert.deepEqual(await readFile(state.targetLockFile), conflictingLock);
  assert.equal(await lstat(targetBackup).then(() => true, () => false), true);
  assert.equal(await lstat(lockBackup).then(() => true, () => false), true);
  assert.equal(await lstat(`${state.targetDirectory}.transaction.json`).then(() => true, () => false), true);
});

test("a second sync refuses to recover a transaction owned by a live process", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const lockPath = `${state.targetDirectory}.sync.lock`;
  await writeFile(lockPath, JSON.stringify({ pid: process.pid, token: "active-sync-test" }));
  await assert.rejects(syncCanonicalContent(state.options), /sync is already active/u);
  assert.equal(await readFile(lockPath, "utf8"), JSON.stringify({ pid: process.pid, token: "active-sync-test" }));
});

test("sync recovers a crash after both old targets were moved aside", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const targetBackup = `${state.targetDirectory}.previous`;
  const lockBackup = `${state.targetLockFile}.previous`;
  const stagedDirectory = path.join(path.dirname(state.targetDirectory), `.canonical-content-build-${process.pid}-interrupted`);
  const stagedLockDirectory = path.join(path.dirname(state.targetLockFile), `.current-content-lock-${process.pid}-interrupted`);
  const stagedLockFile = path.join(stagedLockDirectory, "release.lock.json");
  await rename(state.targetDirectory, targetBackup);
  await rename(state.targetLockFile, lockBackup);
  await cp(state.producerOutput, stagedDirectory, { recursive: true });
  await mkdir(stagedLockDirectory);
  const stagedLockBytes = await readFile(lockBackup);
  await writeFile(stagedLockFile, stagedLockBytes);
  const fileDigests = async (directory) => Object.fromEntries(await Promise.all((await readdir(directory)).map(async (name) => [name, sha256(await readFile(path.join(directory, name)))])));
  const journal = {
    schemaVersion: 1,
    phase: "prepared",
    targetDirectory: state.targetDirectory,
    targetLockFile: state.targetLockFile,
    backupDirectory: targetBackup,
    backupLockFile: lockBackup,
    stagedDirectory,
    stagedLockFile,
    previousDirectoryDigests: Object.fromEntries(await snapshot(targetBackup)),
    previousLockSha256: sha256(await readFile(lockBackup)),
    stagedDirectoryDigests: await fileDigests(stagedDirectory),
    stagedLockSha256: sha256(stagedLockBytes),
  };
  await writeFile(`${state.targetDirectory}.transaction.json`, JSON.stringify(journal));
  const result = await syncCanonicalContent(state.options);
  assert.equal(result.mode, "sync");
  assert.equal(await lstat(`${state.targetDirectory}.transaction.json`).then(() => true, () => false), false);
  assert.equal(await lstat(targetBackup).then(() => true, () => false), false);
  assert.equal(await lstat(lockBackup).then(() => true, () => false), false);
});

test("recovery preserves an unexpected file in the staged release-lock directory", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const targetBackup = `${state.targetDirectory}.previous`;
  const lockBackup = `${state.targetLockFile}.previous`;
  const stagedDirectory = path.join(path.dirname(state.targetDirectory), `.canonical-content-build-${process.pid}-extra-lock-file`);
  const stagedLockDirectory = path.join(path.dirname(state.targetLockFile), `.current-content-lock-${process.pid}-extra-lock-file`);
  const stagedLockFile = path.join(stagedLockDirectory, "release.lock.json");
  await rename(state.targetDirectory, targetBackup);
  await rename(state.targetLockFile, lockBackup);
  await cp(state.producerOutput, stagedDirectory, { recursive: true });
  await mkdir(stagedLockDirectory);
  const stagedLockBytes = await readFile(lockBackup);
  await writeFile(stagedLockFile, stagedLockBytes);
  const digests = async (directory) => Object.fromEntries(await Promise.all((await readdir(directory)).map(async (name) => [name, sha256(await readFile(path.join(directory, name)))])));
  const journal = {
    schemaVersion: 1, phase: "prepared", targetDirectory: state.targetDirectory, targetLockFile: state.targetLockFile,
    backupDirectory: targetBackup, backupLockFile: lockBackup, stagedDirectory, stagedLockFile,
    previousDirectoryDigests: await digests(targetBackup), previousLockSha256: sha256(await readFile(lockBackup)),
    stagedDirectoryDigests: await digests(stagedDirectory), stagedLockSha256: sha256(stagedLockBytes),
  };
  await writeFile(path.join(stagedLockDirectory, "unexpected.txt"), "preserve this file");
  await writeFile(`${state.targetDirectory}.transaction.json`, JSON.stringify(journal));
  await assert.rejects(syncCanonicalContent(state.options), /unexpected files in the staged release-lock directory/u);
  assert.equal(await readFile(path.join(stagedLockDirectory, "unexpected.txt"), "utf8"), "preserve this file");
  assert.equal(await lstat(targetBackup).then(() => true, () => false), true);
  assert.equal(await lstat(lockBackup).then(() => true, () => false), true);
  assert.equal(await lstat(`${state.targetDirectory}.transaction.json`).then(() => true, () => false), true);
});

test("a symlinked target parent fails before staging and cannot write outside appRoot", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const generatedParent = path.dirname(state.targetDirectory);
  const external = path.join(state.root, "external");
  await rm(generatedParent, { recursive: true });
  await mkdir(external);
  await symlink(external, generatedParent);
  let buildCalled = false;
  await assert.rejects(syncCanonicalContent({
    ...state.options,
    runBuild: async () => { buildCalled = true; },
  }), /target ancestor must be a real directory/u);
  assert.equal(buildCalled, false);
  assert.deepEqual(await readdir(external), []);
});

test("check rejects a temporary root inside appRoot before any app-tree write", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const before = (await readdir(state.appRoot, { recursive: true })).sort();
  const unsafeTemporaryRoot = path.join(state.appRoot, "unsafe-check-temp");
  let buildCalled = false;
  await assert.rejects(syncCanonicalContent({
    ...state.options,
    mode: "check",
    temporaryRoot: unsafeTemporaryRoot,
    runBuild: async () => { buildCalled = true; },
  }), /temporary root must be outside/u);
  assert.equal(buildCalled, false);
  assert.deepEqual((await readdir(state.appRoot, { recursive: true })).sort(), before);
  assert.equal(await lstat(unsafeTemporaryRoot).then(() => true, () => false), false);
});

const REAL_CONTENT_ROOT = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(import.meta.dirname, "../../patternly-content"));
const REAL_GENERATED = path.resolve(REAL_CONTENT_ROOT, "../patternly", GENERATED_DIRECTORY);
const codingBaseline = JSON.parse(await readFile(path.join(REAL_GENERATED, `${APPROACH_CHALLENGE_TRACK_ID}.json`), "utf8"));
// Exercise the exact reviewed predecessor prompts even after the current APP advances.
for (const [id, prompt] of Object.entries({
  "alg-hms-choose-015-distinct-membership": "Which state is sufficient when the output asks for the number of distinct values only?",
  "alg-tp-dup-13-both-sides": "Why may both pointers need duplicate skipping after a successful pair match?",
})) codingBaseline.questions.find((q) => q.questionId === id).prompt = prompt;
const promptSuccessors = {
  "alg-hms-choose-015-distinct-membership": "Which minimal hash-based state is sufficient when the output asks only for the number of distinct values?",
  "alg-tp-dup-13-both-sides": "After emitting a unique value pair from a sorted array, which symmetric policy skips repetitions of both just-used boundary values before the next comparison?",
};
function explanationSuccessor() {
  const result = structuredClone(codingBaseline);
  result.questions.find((q) => q.questionId === "alg-complexity-output-001").feedback.reason += " Producing k records incurs k output actions.";
  for (const [id, prompt] of Object.entries(promptSuccessors)) result.questions.find((q) => q.questionId === id).prompt = prompt;
  const p = result.approachChallengeProblems[0];
  p.approachQuestion.feedback.details = { blocks: [{ type: "paragraph", text: "Visit each requested index once and accumulate its contribution without preprocessing the rest of the array." }] };
  p.approachQuestion.feedback.reason += " Compare the requested range with the whole input workload.";
  p.approachQuestion.interaction.options[0].feedback += " The inclusive endpoints determine exactly which entries are accumulated.";
  p.methodReveal.title += " for this query";
  p.problemVersion = String(Number(p.problemVersion) + 1);
  const second = result.approachChallengeProblems[1];
  result.questions.find((q) => q.questionId === "alg-complexity-output-001").feedback.messages[0].text += " Count each required output action before comparing the candidate bounds.";
  second.complexityQuestion.feedback.reason += " Count the stated preparation and query work under the same cost model.";
  second.problemVersion = String(Number(second.problemVersion) + 1);
  return result;
}

test("explanations delta admits text and only the two exact prompt exceptions", () => {
  const after = explanationSuccessor();
  const items = describeCodingExplanationDelta(codingBaseline, after);
  assert.equal(items.filter((item) => item.kind === "ordinary").length, 3);
  assert.equal(items.filter((item) => item.kind === "acm").length, 2);
  assert.deepEqual(items.filter((item) => item.kind === "ordinary").map((item) => item.itemId).sort(), ["alg-complexity-output-001", ...Object.keys(promptSuccessors)].sort());
  for (const item of items) assert.ok(item.changes.length);
  assert.notEqual(sha256(historicalTrainingProjection(codingBaseline, codingBaseline.contentVersion)), sha256(historicalTrainingProjection(after, after.contentVersion)));
});

test("explanations version guard accepts one numeric or semantic patch step, never a jump", () => {
  const before = structuredClone(codingBaseline), after = structuredClone(codingBaseline);
  const p = after.approachChallengeProblems.find((problem) => /^[0-9]+\.[0-9]+\.[0-9]+$/u.test(problem.problemVersion));
  assert.ok(p, "the current Coding bank contains semantic-version ACM sources");
  p.approachQuestion.feedback.reason += " State the output obligation explicitly.";
  const old = p.problemVersion, parts = old.split("."); parts[2] = String(Number(parts[2]) + 1); p.problemVersion = parts.join(".");
  assert.equal(describeCodingExplanationDelta(before, after).length, 1);
  p.problemVersion = `${parts[0]}.${Number(parts[1]) + 1}.0`;
  assert.throws(() => describeCodingExplanationDelta(before, after), /coding_explanations_version/u);
  p.problemVersion = `${parts[0]}.${parts[1]}.${Number(parts[2]) + 1}`;
  assert.throws(() => describeCodingExplanationDelta(before, after), /coding_explanations_version/u);
});

test("explanations delta rejects protected changes even if a manifest writer tried to approve them", async (t) => {
  const cases = [
    ["ordinary answer", (x) => { x.questions[0].answer.optionId = "other"; }],
    ["ordinary option text", (x) => { x.questions[0].interaction.options[0].text += " changed"; }],
    ["ordinary prompt", (x) => { x.questions[0].prompt += " changed"; }],
    ["exception wording", (x) => { x.questions.find((q) => q.questionId === Object.keys(promptSuccessors)[0]).prompt += " changed"; }],
    ["exception preimage", (x, b) => { b.questions.find((q) => q.questionId === Object.keys(promptSuccessors)[0]).prompt += " changed"; }],
    ["constraints", (x) => { x.questions[0].constraints = ["changed"]; }],
    ["mental objective", (x) => { x.questions[0].mentalUnitId += "-changed"; }],
    ["scoring", (x) => { x.questions[0].interaction.scoringMethod = "changed"; }],
    ["ordinary order", (x) => { [x.questions[0], x.questions[1]] = [x.questions[1], x.questions[0]]; }],
    ["ordinary inventory", (x) => { x.questions.pop(); }],
    ["ACM order", (x) => { x.approachChallengeProblems.reverse(); }],
    ["ACM inventory", (x) => { x.approachChallengeProblems.pop(); }],
    ["ACM grade", (x) => { x.approachChallengeProblems[0].approachQuestion.interaction.options[0].grade = "incorrect"; }],
    ["ACM option text", (x) => { x.approachChallengeProblems[0].approachQuestion.interaction.options[0].text += " changed"; }],
    ["ACM option identity", (x) => { x.approachChallengeProblems[0].approachQuestion.interaction.options[0].optionId += "-changed"; }],
    ["ACM option order", (x) => { x.approachChallengeProblems[0].approachQuestion.interaction.options.reverse(); }],
    ["ACM stage identity", (x) => { x.approachChallengeProblems[0].complexityQuestion.questionId += "-changed"; }],
    ["ACM analyzed approach", (x) => { x.approachChallengeProblems[0].analyzedApproachId += "-changed"; }],
    ["ACM prompt", (x) => { x.approachChallengeProblems[0].approachQuestion.prompt += " changed"; }],
    ["version without text", (x) => { x.approachChallengeProblems[2].problemVersion = String(Number(x.approachChallengeProblems[2].problemVersion) + 1); }],
    ["missing successor version", (x) => { x.approachChallengeProblems[0].problemVersion = codingBaseline.approachChallengeProblems[0].problemVersion; }],
    ["version jump", (x) => { x.approachChallengeProblems[0].problemVersion = "99"; }],
    ["message target", (x) => { const q = x.questions.find((q) => q.feedback.messages?.length); q.feedback.messages[0].targetId += "-changed"; }],
    ["message kind", (x) => { const q = x.questions.find((q) => q.feedback.messages?.length); q.feedback.messages[0].kind = "changed"; }],
    ["message removal", (x) => { const q = x.questions.find((q) => q.feedback.messages?.length); q.feedback.messages.pop(); }],
    ["new message array", (x) => { const p = x.approachChallengeProblems.find((p) => p.complexityQuestion.feedback.messages === undefined); const q = p.complexityQuestion; q.feedback.messages = [{kind:"wrong_option",targetId:q.interaction.options.find((o)=>o.optionId!==q.answer.optionId).optionId,text:"A newly introduced message is outside this authorization."}]; }],
    ["new message in existing array", (x) => { const q = x.questions.find((q) => q.feedback.messages?.length); q.feedback.messages.push({...q.feedback.messages[0],text:"An additional message is not a text-only edit."}); }],
    ["message order", (x) => { const q = x.questions.find((q) => q.feedback.messages?.length > 1); q.feedback.messages.reverse(); }],
    ["message array removal", (x) => { const q = x.questions.find((q) => q.feedback.messages?.length); delete q.feedback.messages; }],
    ["new hidden field", (x) => { x.questions[0].feedback.hidden = "changed"; }],
    ["simulation profile", (x) => { x.simulationProfiles[0].profileVersion = "999"; }],
    ["planning policy", (x) => { x.planningPolicy.policyVersion += "-changed"; }],
    ["content version", (x) => { x.contentVersion += "-changed"; }],
    ["schema", (x) => { x.schemaVersion += "-changed"; }],
  ];
  for (const [name, change] of cases) await t.test(name, () => {
    const before = structuredClone(codingBaseline), after = explanationSuccessor(); change(after, before);
    assert.throws(() => describeCodingExplanationDelta(before, after), /coding_explanations_/u);
  });
  assert.throws(() => describeCodingExplanationDelta(codingBaseline, structuredClone(codingBaseline)), /coding_explanations_empty/u);
});

async function explanationFixture(t) {
  const state = await fixture(); t.after(() => rm(state.root, { recursive: true, force: true }));
  await cp(path.join(REAL_CONTENT_ROOT, "scripts/content/approach-challenge-contract.mjs"), path.join(state.producerRoot, "scripts/content/approach-challenge-contract.mjs"));
  // Full Coding contracts; the other eight tracks are small, immutable canaries.
  const baselineBytes = Buffer.from(JSON.stringify(codingBaseline));
  await writeFile(path.join(state.targetDirectory, `${APPROACH_CHALLENGE_TRACK_ID}.json`), baselineBytes);
  const baselineLockFile = path.join(state.targetDirectory, "content-lock.json");
  const baselineLock = JSON.parse(await readFile(baselineLockFile, "utf8"));
  Object.assign(baselineLock.tracks.find((row) => row.trackId === APPROACH_CHALLENGE_TRACK_ID), { contentVersion: codingBaseline.contentVersion, questionCount: 3404, sha256: sha256(baselineBytes) });
  await writeFile(baselineLockFile, JSON.stringify(baselineLock));
  const baselineLedger = { schemaVersion: "patternly-content-successor-ledger-v1", tracks: [] };
  for (const row of baselineLock.tracks) {
    const a = JSON.parse(await readFile(path.join(state.targetDirectory, `${row.trackId}.json`), "utf8"));
    baselineLedger.tracks.push({ trackId: row.trackId, training: { contentVersion: row.contentVersion, artifactSha256: sha256(historicalTrainingProjection(a, row.contentVersion)), questionCount: row.questionCount }, planningPolicy: { contentVersion: row.contentVersion, artifactSha256: row.sha256, policyVersion: a.planningPolicy.policyVersion } });
  }
  await writeFile(path.join(state.targetDirectory, SUCCESSOR_LEDGER_FILE_NAME), JSON.stringify(baselineLedger));
  const oldRelease = await readFile(state.targetLockFile);
  const after = explanationSuccessor();
  const sourceFile = path.join(state.producerRoot, "content", APPROACH_CHALLENGE_TRACK_ID, "fixture.json");
  await mkdir(path.dirname(sourceFile), { recursive: true }); await writeFile(sourceFile, JSON.stringify(after.questions));
  const sourceEntries = [], sourceWrites = [];
  const sourceDirectories = new Set(after.approachChallengeProblems.map((problem) => path.join(state.producerRoot, "content/approach-challenges", APPROACH_CHALLENGE_TRACK_ID, problem.primaryFamilyId)));
  await Promise.all([...sourceDirectories].map((directory) => mkdir(directory, { recursive: true })));
  for (const problem of after.approachChallengeProblems) {
    const relative = `content/approach-challenges/${APPROACH_CHALLENGE_TRACK_ID}/${problem.primaryFamilyId}/${problem.problemId}.json`;
    const bytes = Buffer.from(JSON.stringify(problem)); const file = path.join(state.producerRoot, relative);
    sourceWrites.push([file, bytes]);
    sourceEntries.push({ familyId: problem.primaryFamilyId, problemId: problem.problemId, problemVersion: problem.problemVersion, sourcePath: relative, sourceSha256: sha256(bytes), questionIds: [problem.approachQuestion.questionId, problem.complexityQuestion.questionId] });
  }
  for (let i = 0; i < sourceWrites.length; i += 32) await Promise.all(sourceWrites.slice(i, i + 32).map(([file, bytes]) => writeFile(file, bytes)));
  sourceEntries.sort((a, b) => a.problemId.localeCompare(b.problemId));
  const sourceManifest = { registryVersion: "fixture-reviewed", ...APPROACH_CHALLENGE_BANK_CONTRACT, sourceEntries };
  delete sourceManifest.freeFamilyId;
  const registryPath = path.join(state.producerRoot, "config/approach-challenge-registries", `${APPROACH_CHALLENGE_TRACK_ID}.json`);
  await mkdir(path.dirname(registryPath), { recursive: true }); await writeFile(registryPath, JSON.stringify(sourceManifest));
  await rm(state.producerOutput, { recursive: true }); await mkdir(state.producerOutput);
  for (const name of await readdir(state.targetDirectory)) if (name !== SUCCESSOR_LEDGER_FILE_NAME) await cp(path.join(state.targetDirectory, name), path.join(state.producerOutput, name));
  const codingFile = path.join(state.producerOutput, `${APPROACH_CHALLENGE_TRACK_ID}.json`);
  const bytes = Buffer.from(JSON.stringify(after)); await writeFile(codingFile, bytes);
  const lockFile = path.join(state.producerOutput, "content-lock.json"), lock = JSON.parse(await readFile(lockFile, "utf8"));
  lock.tracks.find((entry) => entry.trackId === APPROACH_CHALLENGE_TRACK_ID).sha256 = sha256(bytes); await writeFile(lockFile, JSON.stringify(lock));
  const runBuildBase = state.options.runBuild, identityBase = state.options.getCurrentIdentity;
  state.options.runBuild = async (args) => {
    const built = await runBuildBase(args); built.lockPath = path.join(args.outputRoot, "content-lock.json");
    const coding = built.artifacts.find((entry) => entry.trackId === APPROACH_CHALLENGE_TRACK_ID);
    coding.sourceFiles = [sourceFile]; coding.approachChallengeManifest = structuredClone(sourceManifest); return built;
  };
  state.options.getCurrentIdentity = async (args) => ({ ...await identityBase(args), sourceTree: "dirty" });
  state.options.expectedInventory = null;
  const before = await validateBuiltContent(state.targetDirectory, { producerRoot: state.producerRoot, allowLegacySimulationEvidence: true });
  const prepareRoot = path.join(state.root, "prepare"); await mkdir(prepareRoot);
  const built = await state.options.runBuild({ outputRoot: prepareRoot });
  const currentIdentity = await state.options.getCurrentIdentity({ built });
  const manifest = await prepareCodingExplanationsManifest({ beforeFiles: before.files, beforeReleaseLock: oldRelease, built, currentIdentity, producerRoot: state.producerRoot });
  const manifestPath = path.join(state.root, "reviewed.json"), manifestBytes = Buffer.from(JSON.stringify(manifest)); await writeFile(manifestPath, manifestBytes);
  Object.assign(state.options, { mode: "coding-explanations", explanationsManifestPath: manifestPath, expectedManifestSha256: sha256(manifestBytes) });
  return { ...state, manifest, sourceFile, sourceManifest };
}

test("reviewed explanations install only their exact source-bound delta and derive a new ordinary training hash", async (t) => {
  const state = await explanationFixture(t);
  const beforeLedger = JSON.parse(await readFile(path.join(state.targetDirectory, SUCCESSOR_LEDGER_FILE_NAME), "utf8"));
  const sourceStatus = git(state.producerRoot, "status", "--porcelain=v1", "--untracked-files=all");
  const result = await syncCanonicalContent(state.options);
  assert.equal(result.explanationReceipt.changedOrdinary, 3); assert.equal(result.explanationReceipt.changedAcm, 2);
  const coding = result.ledger.tracks.find((row) => row.trackId === APPROACH_CHALLENGE_TRACK_ID);
  assert.notEqual(coding.training.artifactSha256, beforeLedger.tracks.find((row) => row.trackId === APPROACH_CHALLENGE_TRACK_ID).training.artifactSha256);
  for (const id of EXPECTED_TRACK_IDS.filter((id) => id !== APPROACH_CHALLENGE_TRACK_ID)) assert.deepEqual(result.ledger.tracks.find((row) => row.trackId === id), beforeLedger.tracks.find((row) => row.trackId === id));
  assert.equal(git(state.producerRoot, "status", "--porcelain=v1", "--untracked-files=all"), sourceStatus);
  assert.equal(result.currentIdentity.sourceTree, "dirty");
});

test("reviewed explanations reject manifest, source, baseline, and race drift without replacing APP", async (t) => {
  const cases = [
    ["missing expected SHA", async (s) => { delete s.options.expectedManifestSha256; }],
    ["manifest bytes", async (s) => { await writeFile(s.options.explanationsManifestPath, JSON.stringify({ ...s.manifest, items: [] })); }],
    ["unreviewed IDs", async (s) => { s.manifest.items[0].itemId += "-other"; await writeFile(s.options.explanationsManifestPath, JSON.stringify(s.manifest)); s.options.expectedManifestSha256 = sha256(await readFile(s.options.explanationsManifestPath)); }],
    ["missing approved delta", async (s) => { s.manifest.items.pop(); await writeFile(s.options.explanationsManifestPath, JSON.stringify(s.manifest)); s.options.expectedManifestSha256 = sha256(await readFile(s.options.explanationsManifestPath)); }],
    ["ordinary source record", async (s) => { const q = JSON.parse(await readFile(s.sourceFile, "utf8")); q.find((q) => q.questionId === "alg-complexity-output-001").feedback.reason += " unbuilt"; await writeFile(s.sourceFile, JSON.stringify(q)); }],
    ["ACM source bytes", async (s) => { const file = path.join(s.producerRoot, s.sourceManifest.sourceEntries[0].sourcePath); await writeFile(file, (await readFile(file, "utf8")) + "\n"); }],
    ["source fingerprint", async (s) => { s.options.getFreshSourceFingerprint = async () => "f".repeat(64); }],
    ["false clean provenance", async (s) => { const base = s.options.getCurrentIdentity; s.options.getCurrentIdentity = async args => ({ ...await base(args), sourceTree: "clean" }); }],
    ["registry bytes", async (s) => { const p = path.join(s.producerRoot, "config/approach-challenge-registries", `${APPROACH_CHALLENGE_TRACK_ID}.json`); await writeFile(p, (await readFile(p, "utf8")) + "\n"); }],
    ["release baseline", async (s) => { await writeFile(s.targetLockFile, "changed baseline"); }],
    ["stale registry", async (s) => { const base = s.options.runBuild; s.options.runBuild = async args => { const built = await base(args); built.artifacts.find(x => x.trackId === APPROACH_CHALLENGE_TRACK_ID).approachChallengeManifest.sourceEntries[0].sourceSha256 = "f".repeat(64); return built; }; }],
    ["interrupted transaction", async (s) => { await writeFile(`${s.targetDirectory}.transaction.json`, "preserve me"); }],
    ["unrelated artifact", async (s) => { const file = path.join(s.producerOutput, `${EXPECTED_TRACK_IDS[0]}.json`); const a = JSON.parse(await readFile(file, "utf8")); a.contentVersion += "-other"; const b = Buffer.from(JSON.stringify(a)); await writeFile(file, b); const lf = path.join(s.producerOutput, "content-lock.json"); const lock = JSON.parse(await readFile(lf, "utf8")); Object.assign(lock.tracks.find(x=>x.trackId===EXPECTED_TRACK_IDS[0]), {contentVersion:a.contentVersion,sha256:sha256(b)}); await writeFile(lf,JSON.stringify(lock)); }],
  ];
  const state = await explanationFixture(t), originalOptions = { ...state.options }, originalManifest = structuredClone(state.manifest);
  const restorable = [state.options.explanationsManifestPath, state.sourceFile, path.join(state.producerRoot, state.sourceManifest.sourceEntries[0].sourcePath), state.targetLockFile, path.join(state.producerOutput, `${EXPECTED_TRACK_IDS[0]}.json`), path.join(state.producerOutput, "content-lock.json"), path.join(state.producerRoot, "config/approach-challenge-registries", `${APPROACH_CHALLENGE_TRACK_ID}.json`)];
  const originalBytes = await Promise.all(restorable.map((file) => readFile(file)));
  for (const [name, change] of cases) await t.test(name, async () => {
    state.options = { ...originalOptions }; state.manifest = structuredClone(originalManifest);
    await change(state);
    const before = await snapshot(state.targetDirectory), release = await readFile(state.targetLockFile);
    const category = name === "source fingerprint" ? /Canonical source changed/u : name === "interrupted transaction" ? /transaction/iu : /coding_explanations_/u;
    try {
      await assert.rejects(syncCanonicalContent(state.options), category);
      assert.deepEqual(await snapshot(state.targetDirectory), before); assert.deepEqual(await readFile(state.targetLockFile), release);
    } finally {
      await Promise.all(restorable.map((file, i) => writeFile(file, originalBytes[i])));
      await rm(`${state.targetDirectory}.transaction.json`, { force: true });
    }
  });
});

test("reviewed explanations preserve a concurrent APP release-lock edit", async (t) => {
  const state = await explanationFixture(t), build = state.options.runBuild;
  const concurrent = Buffer.from("concurrent APP metadata must survive");
  state.options.runBuild = async (args) => { const built = await build(args); await writeFile(state.targetLockFile, concurrent); return built; };
  const before = await snapshot(state.targetDirectory);
  await assert.rejects(syncCanonicalContent(state.options), /Installed content changed/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.deepEqual(await readFile(state.targetLockFile), concurrent);
});

test("coding explanations CLI requires a separately supplied digest and leaves old modes closed", () => {
  assert.deepEqual(parseArgs(["sync-coding-explanations", "--explanations-manifest", "/tmp/review.json", "--expected-manifest-sha256", "a".repeat(64)]), { mode: "coding-explanations", explanationsManifestPath: "/tmp/review.json", expectedManifestSha256: "a".repeat(64) });
  assert.throws(() => parseArgs(["sync-coding-explanations"]), /Usage:/u);
  assert.throws(() => parseArgs(["sync", "--explanations-manifest", "/tmp/review.json"]), /Usage:/u);
});


test("explanations preparation refuses missing commit or full producer fingerprint", async () => {
  await assert.rejects(prepareCodingExplanationsManifest({ currentIdentity: { sourceInputFingerprint: "a".repeat(64) } }), /coding_explanations_identity/u);
  await assert.rejects(prepareCodingExplanationsManifest({ currentIdentity: { sourceRepositoryCommit: "a".repeat(40) } }), /coding_explanations_identity/u);
});
