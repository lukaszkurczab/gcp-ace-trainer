import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  EXPECTED_TRACK_IDS,
  CLAUDE_TRACK_ID,
  GENERATED_DIRECTORY,
  SUCCESSOR_LEDGER_FILE_NAME,
  RELEASE_LOCK_RELATIVE_PATH,
  buildCurrentReleaseLock,
  historicalTrainingProjection,
  parseArgs,
  syncCanonicalContent,
  validateBuiltContent,
} from "./syncBundledContentRelease.mjs";


const SMALL_INVENTORY = Object.freeze({ trackCount: 9, nodeCount: 9, mentalUnitCount: 9, questionCount: 48 });
const HEAD = "1".repeat(40);
const DESIGN_TRACK_IDS = ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"];
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

test("sync arguments expose only current-source sync/check", () => {
  assert.deepEqual(parseArgs([]), { mode: "sync" });
  assert.deepEqual(parseArgs(["check", "--content-root", "../content"]), { mode: "check", producerRoot: path.resolve("../content") });
  assert.throws(() => parseArgs(["check", "--local-reviewed-candidate", "acceptance.json"]), /Usage:/u);
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
    return { schemaVersion: "patternly-current-content-identity-v1", ownerPolicy: "standing-owner-decision-2026-10-19-current-source", sourceInputFingerprint: sha256(Buffer.from(JSON.stringify(tracks))), sourceRepositoryCommit: HEAD, sourceTree: "dirty", tracks, verificationCategories: [], claims: { semanticReview: "not_claimed", publication: "not_performed", deployment: "not_performed", deviceAcceptance: "not_claimed" } };
  };
  const runBuild = async ({ outputRoot }) => {
    for (const name of await readdir(producerOutput)) await cp(path.join(producerOutput, name), path.join(outputRoot, name), { recursive: true });
    return buildResultFrom(outputRoot);
  };
  const getCurrentIdentity = async ({ built }) => identityFor(built.outputRoot);
  const getFreshSourceFingerprint = async () => (await identityFor(producerOutput)).sourceInputFingerprint;
  const options = { appRoot, producerRoot, targetDirectory, targetLockFile, runBuild, getProducerHead: async () => HEAD, getCurrentIdentity, getFreshSourceFingerprint, expectedInventory: SMALL_INVENTORY };
  return { root, appRoot, producerRoot, producerOutput, targetDirectory, targetLockFile, options };
}

async function snapshot(directory) {
  const names = (await readdir(directory)).sort();
  return Promise.all(names.map(async (name) => [name, sha256(await readFile(path.join(directory, name)))]));
}

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
  assert.equal(result.head, HEAD);
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
