import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  EXPECTED_TRACK_IDS,
  CLAUDE_TRACK_ID,
  GENERATED_DIRECTORY,
  SUCCESSOR_LEDGER_FILE_NAME,
  historicalTrainingProjection,
  parseArgs,
  readApprovedBESDSuccessorProof,
  validateReviewedCandidate,
  syncCanonicalContent,
  validateBuiltContent,
  verifyApprovedTrainingSuccessor,
} from "./syncBundledContentRelease.mjs";

const { acceptedQleProducer } = createRequire(import.meta.url)("./fixtures/acceptedQleProducer.ts");

const SMALL_INVENTORY = Object.freeze({ trackCount: 9, nodeCount: 9, mentalUnitCount: 9, questionCount: 48 });
const HEAD = "1".repeat(40);
const FROZEN_APP_CONTENT_BASE = "07881c44f26ffbbe84d80d4b123e709eef884c06";
const DESIGN_TRACK_IDS = ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"];
const TEST_BESD_DESCRIPTOR_BASE = Object.freeze({
  path: "evidence/business-quality/test-besd-successor.json",
  schemaVersion: "patternly-bizq-semantic-replacement-v1",
  trackId: "backend-system-design-interview",
  beforeProducerCommit: "0".repeat(40),
  beforeContentVersion: "besd-source-v1",
  contentVersion: "besd-successor-v2",
  replacementCount: 1,
  questionCount: 2,
});

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

test("reviewed candidate sync is explicit and rejects duplicate or malformed opt-in", () => {
  assert.deepEqual(parseArgs([]), { mode: "sync" });
  assert.deepEqual(parseArgs(["check", "--reviewed-candidate"]), { mode: "check", reviewedCandidate: true });
  assert.deepEqual(parseArgs(["check", "--reviewed-candidate", "--content-root", "/tmp/patternly-content"]), {
    mode: "check", reviewedCandidate: true, producerRoot: path.resolve("/tmp/patternly-content"),
  });
  assert.deepEqual(parseArgs(["check", "--local-reviewed-candidate", "acceptance.json"]), { mode: "check", localReviewedCandidate: path.resolve("acceptance.json") });
  assert.deepEqual(parseArgs(["prepare-local-candidate", "--track", CLAUDE_TRACK_ID]), { command: "prepare-local-candidate", trackId: CLAUDE_TRACK_ID });
  assert.throws(() => parseArgs(["prepare-local-candidate", "--track", "other-track"]), /prepare-local-candidate requires/u);
  assert.throws(() => parseArgs(["sync", "--reviewed-candidate", "--local-reviewed-candidate", "acceptance.json"]), /cannot be combined/u);
  assert.throws(() => parseArgs(["--reviewed-candidate", "--reviewed-candidate"]), /Usage:/u);
});

function besdMigrationFixture() {
  const oldVersion = "besd-training-v1";
  const previousArtifact = {
    schemaVersion: "patternly-content-artifact-v2",
    trackId: TEST_BESD_DESCRIPTOR_BASE.trackId,
    contentVersion: "besd-source-v1",
    questions: [
      { questionId: "besd-b02-i001", mentalUnitId: "BESD-N02-B02", prompt: "Old cohort question" },
      { questionId: "besd-b02-i002", mentalUnitId: "BESD-N02-B02", prompt: "Unchanged question" },
    ],
    planningPolicy: { schemaVersion: "patternly-learning-planning-policy-v1", policyVersion: "policy-v1" },
  };
  const currentArtifact = structuredClone(previousArtifact);
  currentArtifact.contentVersion = TEST_BESD_DESCRIPTOR_BASE.contentVersion;
  currentArtifact.questions[0] = { questionId: "besd-b02-i003", mentalUnitId: "BESD-N02-B02", prompt: "Reviewed successor question" };
  const beforeTrainingProjection = historicalTrainingProjection(previousArtifact, oldVersion);
  const trainingProjection = historicalTrainingProjection(currentArtifact, TEST_BESD_DESCRIPTOR_BASE.contentVersion);
  const descriptor = Object.freeze({
    ...TEST_BESD_DESCRIPTOR_BASE,
    beforeTraining: Object.freeze({ contentVersion: oldVersion, artifactSha256: sha256(beforeTrainingProjection), questionCount: 2 }),
    trainingSha256: sha256(trainingProjection),
  });
  const proof = {
    schemaVersion: descriptor.schemaVersion,
    trackId: descriptor.trackId,
    beforeProducerCommit: descriptor.beforeProducerCommit,
    beforeContentVersion: descriptor.beforeContentVersion,
    contentVersion: descriptor.contentVersion,
    replacements: [{
      beforeQuestionId: previousArtifact.questions[0].questionId,
      questionId: currentArtifact.questions[0].questionId,
      mentalUnitId: currentArtifact.questions[0].mentalUnitId,
      beforeQuestion: structuredClone(previousArtifact.questions[0]),
      currentQuestion: structuredClone(currentArtifact.questions[0]),
    }],
  };
  return { descriptor, proof, previousArtifact, currentArtifact };
}

function validGcpSimulationProfile(contentVersion, nodeId, evidenceVersion = "gcp-published-2026.08.01") {
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
      nodeDomainMapEvidence: {
        artifactPath: `artifacts/tracks/google-cloud-associate-cloud-engineer/${evidenceVersion}/track-artifact.json`,
        contentVersion: evidenceVersion,
        itemCount: 1,
        nodeCount: 1,
        ambiguousNodeCount: 0,
      },
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
  const predecessorOutput = path.join(root, "predecessor-output");
  const targetDirectory = path.join(appRoot, GENERATED_DIRECTORY);
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
  await createPredecessorFromBuiltSet(producerOutput, predecessorOutput);
  const runBuild = async ({ outputRoot }) => {
    for (const name of await readdir(producerOutput)) await cp(path.join(producerOutput, name), path.join(outputRoot, name), { recursive: true });
  };
  const getBootstrapPredecessor = async () => {
    const lock = JSON.parse(await readFile(path.join(predecessorOutput, "content-lock.json"), "utf8"));
    const artifacts = new Map(await Promise.all(EXPECTED_TRACK_IDS.map(async (trackId) => [`${trackId}.json`, await readFile(path.join(predecessorOutput, `${trackId}.json`))])));
    return { lock, artifacts };
  };
  const options = { appRoot, producerRoot, targetDirectory, runBuild, getProducerHead: async () => HEAD, getProducerContentSourceCommit: async () => HEAD, getBootstrapPredecessor, verifyProducer: async () => {}, expectedInventory: SMALL_INVENTORY };
  return { root, appRoot, producerRoot, producerOutput, predecessorOutput, targetDirectory, options };
}

async function snapshot(directory) {
  const names = (await readdir(directory)).sort();
  return Promise.all(names.map(async (name) => [name, sha256(await readFile(path.join(directory, name)))]));
}

test("historical local Claude acceptance stays stale against the exact accepted QLE producer", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "patternly-local-claude-sync-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const realAppRoot = path.resolve(import.meta.dirname, "..");
  const producerRoot = await acceptedQleProducer(t, path.resolve(realAppRoot, "../patternly-content"));
  const appRoot = path.join(root, "patternly");
  const targetDirectory = path.join(appRoot, GENERATED_DIRECTORY);
  await mkdir(targetDirectory, { recursive: true });
  await mkdir(appRoot, { recursive: true });
  for (const name of [...EXPECTED_TRACK_IDS.map((trackId) => `${trackId}.json`), "content-lock.json", SUCCESSOR_LEDGER_FILE_NAME]) {
    const bytes = execFileSync("git", ["show", `${FROZEN_APP_CONTENT_BASE}:${GENERATED_DIRECTORY}/${name}`], { cwd: realAppRoot, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
    await writeFile(path.join(targetDirectory, name), bytes);
  }
  const appEvidencePaths = [
    "integration/contracts/content-release/local-claude/qle-v2-contract.md",
    "src/content/generated/retained-content/claude-pre-qle-v2.json",
    "src/content/generated/retained-content/claude-qle-v2-first-cases.json",
    "src/content/generated/retained-content/claude-qle-v2-before-identity.json",
    "integration/contracts/content-release/local-claude/claude-course-alignment-acceptance-2026-10-11.md",
    "integration/contracts/content-release/local-claude/claude-unit-coverage-acceptance-2026-10-11.md",
    "integration/contracts/content-release/release.lock.json",
  ];
  for (const relativePath of appEvidencePaths) {
    const destination = path.join(appRoot, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(realAppRoot, relativePath), destination);
  }
  const contentPinPaths = [
    "reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json",
    "reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json",
    "evidence/readiness/current-candidate-readiness-v2.json",
    "evidence/candidate-decisions/current-candidate-decision-v2.json",
    "evidence/admissions/candidate-admission-v3.json",
    "docs/evidence/content-audits/2026-10-11-claude-course-map.md",
    "docs/evidence/content-audits/2026-10-11-claude-course-map.json",
    "docs/evidence/content-audits/2026-10-11-cc02-content-coverage.md",
    "docs/evidence/content-audits/2026-10-11-cc02-content-coverage.json",
  ];
  for (const relativePath of contentPinPaths) await lstat(path.join(producerRoot, relativePath));

  const before = Object.fromEntries(await snapshot(targetDirectory));
  const acceptancePath = path.join(root, "local-acceptance.json");
  const staleRecord = JSON.parse(await readFile(path.join(realAppRoot, "integration/contracts/content-release/local-claude/qle-v2-acceptance.json"), "utf8"));
  staleRecord.candidate.reviewEvidence[0].sha256 = "0".repeat(64);
  await writeFile(acceptancePath, JSON.stringify(staleRecord));
  await assert.rejects(
    syncCanonicalContent({ appRoot, producerRoot, targetDirectory, localReviewedCandidate: acceptancePath }),
    /acceptance record is stale for current producer inputs/u,
    "changed review evidence must reject the otherwise exact accepted QLE producer",
  );
  assert.deepEqual(Object.fromEntries(await snapshot(targetDirectory)), before, "changed candidate bytes must be rejected before changing the bundle");
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
  assert.equal(await lstat(state.targetDirectory).then(() => true, () => false), false, "invalid producer contracts cannot install staged artifacts");
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

test("the fixed BESD proof verifier binds every before/current object and preserves all questions outside its cohort", () => {
  const fixture = besdMigrationFixture();
  const successor = verifyApprovedTrainingSuccessor({
    previousTraining: fixture.descriptor.beforeTraining,
    previousArtifact: fixture.previousArtifact,
    currentArtifact: fixture.currentArtifact,
    proof: fixture.proof,
    descriptor: fixture.descriptor,
  });
  assert.deepEqual(successor, {
    contentVersion: fixture.descriptor.contentVersion,
    artifactSha256: fixture.descriptor.trainingSha256,
    questionCount: fixture.descriptor.questionCount,
  });

  const missingProof = structuredClone(fixture.proof);
  missingProof.replacements.pop();
  assert.throws(() => verifyApprovedTrainingSuccessor({ ...fixture, previousTraining: fixture.descriptor.beforeTraining, proof: missingProof }), /fixed cohort/u);

  const alteredBefore = structuredClone(fixture.proof);
  alteredBefore.replacements[0].beforeQuestion.prompt += " drift";
  assert.throws(() => verifyApprovedTrainingSuccessor({ ...fixture, previousTraining: fixture.descriptor.beforeTraining, proof: alteredBefore }), /exact predecessor or current question/u);

  const alteredCurrent = structuredClone(fixture.proof);
  alteredCurrent.replacements[0].currentQuestion.prompt += " drift";
  assert.throws(() => verifyApprovedTrainingSuccessor({ ...fixture, previousTraining: fixture.descriptor.beforeTraining, proof: alteredCurrent }), /exact predecessor or current question/u);

  const unrelatedDrift = structuredClone(fixture.currentArtifact);
  unrelatedDrift.questions[1].prompt += " drift";
  assert.throws(() => verifyApprovedTrainingSuccessor({ ...fixture, previousTraining: fixture.descriptor.beforeTraining, currentArtifact: unrelatedDrift }), /outside its fixed cohort/u);

  const wrongSuccessorHash = { ...fixture.descriptor, trainingSha256: "f".repeat(64) };
  assert.throws(() => verifyApprovedTrainingSuccessor({ ...fixture, previousTraining: fixture.descriptor.beforeTraining, descriptor: wrongSuccessorHash }), /exact successor training identity/u);
});

test("the BESD proof reader fails closed on absence, byte drift, and a symlink path", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const migration = besdMigrationFixture();
  const descriptor = {
    ...migration.descriptor,
    path: "evidence/business-quality/test-besd-successor.json",
    sha256: sha256(Buffer.from(JSON.stringify(migration.proof))),
  };
  const proofPath = path.join(state.producerRoot, descriptor.path);
  await assert.rejects(readApprovedBESDSuccessorProof(state.producerRoot, descriptor), /Cannot inspect approved BESD successor proof/u);
  await mkdir(path.dirname(proofPath), { recursive: true });
  const proofBytes = Buffer.from(JSON.stringify(migration.proof));
  await writeFile(proofPath, proofBytes);
  assert.deepEqual(await readApprovedBESDSuccessorProof(state.producerRoot, descriptor), migration.proof);
  await writeFile(proofPath, Buffer.concat([proofBytes, Buffer.from(" ")]));
  await assert.rejects(readApprovedBESDSuccessorProof(state.producerRoot, descriptor), /proof hash differs/u);
  await rm(proofPath);
  const linkedProof = path.join(state.root, "linked-besd-successor.json");
  await writeFile(linkedProof, proofBytes);
  await symlink(linkedProof, proofPath);
  await assert.rejects(readApprovedBESDSuccessorProof(state.producerRoot, descriptor), /Symbolic links are not allowed/u);
});

test("sync admits a policy-only canonical version while retaining the historical GCP evidence pin", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  const result = await syncCanonicalContent(state.options);
  const gcp = JSON.parse(await readFile(path.join(state.targetDirectory, "google-cloud-associate-cloud-engineer.json"), "utf8"));
  const evidence = gcp.simulationProfiles[0].familyConfig.nodeDomainMapEvidence;
  assert.notEqual(gcp.contentVersion, evidence.contentVersion);
  assert.equal(evidence.contentVersion, "gcp-published-2026.08.01");
  assert.equal(evidence.artifactPath, `artifacts/tracks/${gcp.trackId}/${evidence.contentVersion}/track-artifact.json`);
  assert.equal(result.inventory.questionCount, SMALL_INVENTORY.questionCount);
});

test("only an explicitly reviewed Claude candidate may advance its training projection", async (t) => {
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

  await assert.rejects(syncCanonicalContent(state.options), /cannot be silently replaced/u);
  const result = await syncCanonicalContent({
    ...state.options,
    reviewedCandidate: true,
    verifyReviewedCandidate: async ({ artifacts, lock: builtLock }) => {
      const bundled = builtLock.tracks.find((track) => track.trackId === trackId);
      const current = artifacts.get(`${trackId}.json`);
      return new Map([[trackId, {
        artifactSha256: bundled.sha256,
        contentVersion: current.contentVersion,
        questionCount: current.questions.length,
      }]]);
    },
  });
  const successor = result.ledger.tracks.find((track) => track.trackId === trackId);
  assert.equal(successor.training.contentVersion, `${artifact.contentVersion}-training`);
  assert.notEqual(successor.training.artifactSha256, originalLedger.tracks.find((track) => track.trackId === trackId)?.training.artifactSha256);
  assert.deepEqual(result.ledger.tracks.filter((track) => track.trackId !== trackId).map((track) => track.training),
    originalLedger.tracks.filter((track) => track.trackId !== trackId).map((track) => track.training));
});

test("exact reviewed candidate resets mixed-track training identity when a track gains questions", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  const originalLedger = JSON.parse(await readFile(path.join(state.targetDirectory, SUCCESSOR_LEDGER_FILE_NAME), "utf8"));
  const changedTrackIds = [CLAUDE_TRACK_ID, "frontend-system-design-interview"];
  const changedArtifacts = new Map();
  for (const trackId of changedTrackIds) {
    const artifactPath = path.join(state.producerOutput, `${trackId}.json`);
    const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
    artifact.contentVersion = `${trackId}-reviewed-count-successor-v2`;
    artifact.questions.push({ ...artifact.questions[0], questionId: `${trackId}-reviewed-added-question` });
    const artifactBytes = Buffer.from(JSON.stringify(artifact));
    await writeFile(artifactPath, artifactBytes);
    changedArtifacts.set(trackId, artifact);
    const lockPath = path.join(state.producerOutput, "content-lock.json");
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    const entry = lock.tracks.find((track) => track.trackId === trackId);
    entry.contentVersion = artifact.contentVersion;
    entry.questionCount = artifact.questions.length;
    entry.sha256 = sha256(artifactBytes);
    await writeFile(lockPath, JSON.stringify(lock));
  }
  const expectedInventory = { ...SMALL_INVENTORY, questionCount: SMALL_INVENTORY.questionCount + changedTrackIds.length };
  const syncOptions = { ...state.options, expectedInventory, previousExpectedInventory: SMALL_INVENTORY };
  await assert.rejects(syncCanonicalContent(syncOptions), /cannot be silently replaced/u, "unreviewed track count changes are rejected");

  const bindingFor = async (trackId, artifact) => {
    const lock = JSON.parse(await readFile(path.join(state.producerOutput, "content-lock.json"), "utf8"));
    return { artifactSha256: lock.tracks.find((track) => track.trackId === trackId).sha256, contentVersion: artifact.contentVersion, questionCount: artifact.questions.length };
  };
  await assert.rejects(syncCanonicalContent({
    ...syncOptions,
    reviewedCandidate: true,
    verifyReviewedCandidate: async () => new Map([[CLAUDE_TRACK_ID, await bindingFor(CLAUDE_TRACK_ID, changedArtifacts.get(CLAUDE_TRACK_ID))]]),
  }), /cannot be silently replaced/u, "review binding for one changed track cannot authorize another");
  await assert.rejects(syncCanonicalContent({
    ...syncOptions,
    reviewedCandidate: true,
    verifyReviewedCandidate: async () => new Map(await Promise.all(changedTrackIds.map(async (trackId) => [trackId, { ...await bindingFor(trackId, changedArtifacts.get(trackId)), questionCount: 1 }]))),
  }), /cannot be silently replaced/u, "stale question-count binding is rejected");

  const result = await syncCanonicalContent({
    ...syncOptions,
    reviewedCandidate: true,
    verifyReviewedCandidate: async () => new Map(await Promise.all(changedTrackIds.map(async (trackId) => [trackId, await bindingFor(trackId, changedArtifacts.get(trackId))]))),
  });
  for (const trackId of changedTrackIds) {
    const artifact = changedArtifacts.get(trackId);
    const previous = originalLedger.tracks.find((entry) => entry.trackId === trackId).training;
    const current = result.ledger.tracks.find((entry) => entry.trackId === trackId).training;
    assert.equal(current.contentVersion, `${artifact.contentVersion}-training`);
    assert.equal(current.questionCount, artifact.questions.length);
    assert.equal(current.artifactSha256, sha256(historicalTrainingProjection(artifact, current.contentVersion)));
    assert.notDeepEqual(current, previous, "a changed reviewed track starts a fresh training identity with no predecessor credit");
  }
  for (const trackId of EXPECTED_TRACK_IDS.filter((id) => !changedTrackIds.includes(id))) {
    assert.deepEqual(result.ledger.tracks.find((entry) => entry.trackId === trackId).training, originalLedger.tracks.find((entry) => entry.trackId === trackId).training, `${trackId} retains its unchanged training identity`);
  }
  const installed = await validateBuiltContent(state.targetDirectory, { expectedInventory });
  assert.deepEqual(installed.inventory, expectedInventory);
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

test("producer validation accepts legacy GCP shape but first ledger bootstrap refuses changed training material", async (t) => {
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
  await assert.rejects(syncCanonicalContent(state.options), /byte-exact policy-only successor/u);
  assert.equal(await lstat(state.targetDirectory).then(() => true, () => false), false);
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
    (profile) => { profile.familyConfig.nodeDomainMapEvidence.contentVersion = "foreign-version"; },
    (profile) => { profile.familyConfig.nodeDomainMapEvidence.artifactPath = "artifacts/tracks/google-cloud-associate-cloud-engineer/other-version/track-artifact.json"; },
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
  await assert.rejects(syncCanonicalContent({ ...state.options, move }), /previous directory restored/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  assert.equal(await lstat(`${state.targetDirectory}.backup`).then(() => true, () => false), false);
});

test("an interrupted target-to-backup move is recovered before replacement", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  await syncCanonicalContent(state.options);
  await rename(state.targetDirectory, `${state.targetDirectory}.backup`);
  await syncCanonicalContent(state.options);
  const installed = Object.fromEntries(await snapshot(state.targetDirectory));
  const producer = Object.fromEntries(await snapshot(state.producerOutput));
  for (const [name, digest] of Object.entries(producer)) assert.equal(installed[name], digest);
  assert.ok(installed[SUCCESSOR_LEDGER_FILE_NAME]);
  assert.equal(await lstat(`${state.targetDirectory}.backup`).then(() => true, () => false), false);
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
  }), /previous directory restored/u);
  assert.deepEqual(await snapshot(state.targetDirectory), before);
  const names = await readdir(path.dirname(state.targetDirectory));
  assert.equal(names.some((name) => name.includes(".backup") || name.includes(".failed-") || name.startsWith(".canonical-content-build-")), false);
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

test("dirty producer state fails before build or application write", async (t) => {
  const state = await fixture();
  t.after(() => rm(state.root, { recursive: true, force: true }));
  let buildCalled = false;
  await assert.rejects(syncCanonicalContent({
    ...state.options,
    verifyProducer: async () => { throw new Error("producer inputs are dirty"); },
    runBuild: async () => { buildCalled = true; },
  }), /producer inputs are dirty/u);
  assert.equal(buildCalled, false);
  assert.equal(await lstat(state.targetDirectory).then(() => true, () => false), false);
  assert.equal((await readdir(path.dirname(state.targetDirectory))).some((name) => name.startsWith(".canonical-content-build-")), false);
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
