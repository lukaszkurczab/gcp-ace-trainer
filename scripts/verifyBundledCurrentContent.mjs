import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EXPECTED_TRACK_IDS, GENERATED_DIRECTORY, LOCK_FILE_NAME, RELEASE_LOCK_RELATIVE_PATH, SUCCESSOR_LEDGER_FILE_NAME } from "./syncBundledContentRelease.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const CODING_TRACK_ID = "coding-interview-dsa-problem-solving";
const FREE_FAMILY_ID = "complexity_and_constraints";
const FAMILY_COUNTS = Object.freeze({ complexity_and_constraints: 6, arrays_and_strings: 4, hash_map_and_set: 4, two_pointers: 2, sliding_window: 4, prefix_sums: 2, sorting_based: 2, stack: 2, binary_search: 2, tree_traversal: 2, intervals: 2, graph_traversal: 2, dynamic_programming_intro: 2 });
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const failApproachBank = (reason) => { throw new Error(`Bundled current content approach-challenge bank is invalid: ${reason}.`); };
const exactKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());

async function readRegularFile(filePath) {
  const info = await lstat(filePath);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Bundled current content contains a non-regular file: ${path.basename(filePath)}.`);
  return readFile(filePath);
}

function parseJson(bytes, label) {
  try { return JSON.parse(bytes.toString("utf8")); }
  catch { throw new Error(`Bundled current content has invalid JSON in ${label}.`); }
}

function historicalTrainingProjection(artifact, contentVersion) {
  const projection = structuredClone(artifact);
  delete projection.planningPolicy;
  delete projection.approachChallengeProblems;
  projection.schemaVersion = "patternly-content-artifact-v1";
  projection.contentVersion = contentVersion;
  return Buffer.from(JSON.stringify(projection));
}

/** Standalone bundle guard: validates paired-bank boundaries without a CONTENT checkout. */
export function validateBundledApproachChallengeBank(artifact, ordinaryQuestionIds = new Set(), bankQuestionIds = new Set()) {
  if (!Object.hasOwn(artifact, "approachChallengeProblems")) return { problemCount: 0, stageCount: 0, freeCount: 0, premiumCount: 0 };
  const problems = artifact.approachChallengeProblems;
  if (artifact.trackId !== CODING_TRACK_ID || !Array.isArray(problems) || problems.length !== 36) failApproachBank("expected 36 Coding Interview problem pairs");
  const expectedProblemKeys = ["schemaVersion", "problemId", "problemVersion", "trackId", "primaryFamilyId", "requiredFamilyIds", "difficulty", "approachQuestion", "complexityQuestion", "analyzedApproachId", "methodReveal"];
  const ids = new Set();
  const questionIds = new Set(ordinaryQuestionIds);
  const familyCounts = Object.fromEntries(Object.keys(FAMILY_COUNTS).map((familyId) => [familyId, 0]));
  const validId = (value) => typeof value === "string" && value.trim() === value && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(value);
  for (const [index, problem] of problems.entries()) {
    if (!isRecord(problem) || !exactKeys(problem, expectedProblemKeys)) failApproachBank(`problem ${index} has an invalid shape`);
    if (problem.schemaVersion !== "approach-challenge-problem-v1" || !validId(problem.problemId) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(problem.problemVersion ?? "") || problem.trackId !== CODING_TRACK_ID) failApproachBank(`problem ${index} has invalid or foreign identity`);
    if (!Object.hasOwn(familyCounts, problem.primaryFamilyId) || !Array.isArray(problem.requiredFamilyIds) || problem.requiredFamilyIds.length === 0 ||
      problem.requiredFamilyIds.some((familyId) => !Object.hasOwn(familyCounts, familyId)) || !problem.requiredFamilyIds.includes(problem.primaryFamilyId) ||
      new Set(problem.requiredFamilyIds).size !== problem.requiredFamilyIds.length || !["easy", "medium", "hard"].includes(problem.difficulty)) failApproachBank(`problem ${index} has invalid family or difficulty metadata`);
    if (ids.has(problem.problemId)) failApproachBank(`duplicate problemId ${problem.problemId}`);
    ids.add(problem.problemId);
    familyCounts[problem.primaryFamilyId] += 1;
    for (const [stageKey, expectedInteraction] of [["approachQuestion", "approach_choice"], ["complexityQuestion", "choice_single"]]) {
      const stage = problem[stageKey];
      if (!isRecord(stage) || !validId(stage.questionId) || stage.trackId !== CODING_TRACK_ID || !validId(stage.nodeId) || !validId(stage.mentalUnitId) ||
        stage.difficulty !== problem.difficulty || typeof stage.prompt !== "string" || !stage.prompt.trim() ||
        (stage.constraints !== undefined && (!Array.isArray(stage.constraints) || stage.constraints.some((constraint) => typeof constraint !== "string"))) ||
        !isRecord(stage.interaction) || stage.interaction.type !== expectedInteraction || !Array.isArray(stage.interaction.options) ||
        !isRecord(stage.answer) || stage.answer.type !== expectedInteraction || !isRecord(stage.feedback) || stage.feedback.type !== expectedInteraction) {
        failApproachBank(`problem ${index} has a malformed or foreign ${stageKey}`);
      }
      if (questionIds.has(stage.questionId)) failApproachBank(`duplicate ordinary or paired questionId ${stage.questionId}`);
      questionIds.add(stage.questionId);
      bankQuestionIds.add(stage.questionId);
    }
    if (problem.approachQuestion.questionId === problem.complexityQuestion.questionId ||
      problem.approachQuestion.nodeId !== problem.complexityQuestion.nodeId ||
      problem.approachQuestion.mentalUnitId !== problem.complexityQuestion.mentalUnitId ||
      !isRecord(problem.methodReveal) || typeof problem.methodReveal.title !== "string" || !problem.methodReveal.title.trim() ||
      typeof problem.methodReveal.description !== "string" || !problem.methodReveal.description.trim()) failApproachBank(`problem ${index} has inconsistent paired stages or reveal`);
  }
  if (Object.entries(FAMILY_COUNTS).some(([familyId, count]) => familyCounts[familyId] !== count)) failApproachBank("family counts do not match the accepted 36-problem inventory");
  const freeProblems = problems.filter((problem) => problem.primaryFamilyId === FREE_FAMILY_ID);
  if (freeProblems.length !== 6 || freeProblems.some((problem) => problem.requiredFamilyIds.some((familyId) => familyId !== FREE_FAMILY_ID) ||
    problem.approachQuestion.nodeId !== FREE_FAMILY_ID || problem.complexityQuestion.nodeId !== FREE_FAMILY_ID)) failApproachBank("Free pairs are not exactly the six fully contained complexity-and-constraints problems");
  return { problemCount: problems.length, stageCount: problems.length * 2, freeCount: freeProblems.length, premiumCount: problems.length - freeProblems.length };
}

async function readCurrentPayload(root) {
  const directory = path.join(root, GENERATED_DIRECTORY);
  const entries = await readdir(directory, { withFileTypes: true });
  const expected = [...EXPECTED_TRACK_IDS.map((trackId) => `${trackId}.json`), LOCK_FILE_NAME, SUCCESSOR_LEDGER_FILE_NAME].sort();
  const actual = entries.map((entry) => entry.name).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected) || entries.some((entry) => !entry.isFile() || entry.isSymbolicLink())) {
    throw new Error("Bundled current content does not contain the exact regular-file inventory.");
  }

  const lockBytes = await readRegularFile(path.join(directory, LOCK_FILE_NAME));
  const contentLock = parseJson(lockBytes, LOCK_FILE_NAME);
  if (!exactKeys(contentLock, ["schemaVersion", "tracks"]) || contentLock.schemaVersion !== "patternly-content-lock-v1" || !Array.isArray(contentLock.tracks)) {
    throw new Error("Bundled current content lock has an invalid shape.");
  }
  const lockRows = contentLock.tracks;
  if (JSON.stringify(lockRows.map((row) => row?.trackId)) !== JSON.stringify(EXPECTED_TRACK_IDS.toSorted())) {
    throw new Error("Bundled current content lock does not contain the exact sorted nine-track set.");
  }
  const identityByTrack = new Map();
  const artifacts = [];
  const nodeIds = new Set();
  const mentalUnitIds = new Set();
  let questionCount = 0;
  const questionIds = new Set();
  const pairedQuestionIds = new Set();
  for (let index = 0; index < EXPECTED_TRACK_IDS.length; index += 1) {
    const trackId = EXPECTED_TRACK_IDS[index];
    const row = lockRows.find((entry) => entry.trackId === trackId);
    if (!exactKeys(row, ["trackId", "contentVersion", "questionCount", "sha256"]) || typeof row.contentVersion !== "string" || !Number.isSafeInteger(row.questionCount) || row.questionCount < 1 || !/^[a-f0-9]{64}$/u.test(row.sha256 ?? "")) {
      throw new Error(`Bundled current content lock row is invalid for ${trackId}.`);
    }
    const bytes = await readRegularFile(path.join(directory, `${trackId}.json`));
    if (sha256(bytes) !== row.sha256) throw new Error(`Bundled current content digest mismatch for ${trackId}.`);
    const artifact = parseJson(bytes, `${trackId}.json`);
    const shape = ["schemaVersion", "trackId", "contentVersion", "questions", "planningPolicy"];
    const allowedOptional = ["simulationProfiles", "completionRule", "approachChallengeProblems"];
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)
      || artifact.schemaVersion !== "patternly-content-artifact-v2" || artifact.trackId !== trackId || artifact.contentVersion !== row.contentVersion
      || !Array.isArray(artifact.questions) || artifact.questions.length !== row.questionCount
      || !shape.every((key) => Object.hasOwn(artifact, key))
      || Object.keys(artifact).some((key) => !shape.includes(key) && !allowedOptional.includes(key))) {
      throw new Error(`Bundled current content identity is invalid for ${trackId}.`);
    }
    for (const question of artifact.questions) {
      if (!question || typeof question !== "object" || question.trackId !== trackId || typeof question.questionId !== "string" || typeof question.nodeId !== "string" || typeof question.mentalUnitId !== "string") {
        throw new Error(`Bundled current content question identity is invalid for ${trackId}.`);
      }
      if (questionIds.has(question.questionId)) throw new Error(`Bundled current content has a duplicate question ID in ${trackId}.`);
      questionIds.add(question.questionId);
      nodeIds.add(`${trackId}\0${question.nodeId}`);
      mentalUnitIds.add(`${trackId}\0${question.nodeId}\0${question.mentalUnitId}`);
    }
    if (Object.hasOwn(artifact, "approachChallengeProblems")) validateBundledApproachChallengeBank(artifact, questionIds, pairedQuestionIds);
    questionCount += artifact.questions.length;
    artifacts.push({ trackId, row, artifact, bytes });
  }

  if ([...pairedQuestionIds].some((questionId) => questionIds.has(questionId))) failApproachBank("paired question IDs overlap another ordinary track");

  const ledgerBytes = await readRegularFile(path.join(directory, SUCCESSOR_LEDGER_FILE_NAME));
  const ledger = parseJson(ledgerBytes, SUCCESSOR_LEDGER_FILE_NAME);
  if (!exactKeys(ledger, ["schemaVersion", "tracks"]) || ledger.schemaVersion !== "patternly-content-successor-ledger-v1" || !Array.isArray(ledger.tracks)
    || JSON.stringify(ledger.tracks.map((row) => row?.trackId)) !== JSON.stringify(EXPECTED_TRACK_IDS.toSorted())) {
    throw new Error("Bundled current content successor ledger has an invalid track inventory.");
  }
  for (const entry of ledger.tracks) {
    if (!exactKeys(entry, ["trackId", "training", "planningPolicy"])
      || !exactKeys(entry.training, ["contentVersion", "artifactSha256", "questionCount"])
      || !exactKeys(entry.planningPolicy, ["contentVersion", "artifactSha256", "policyVersion"])) throw new Error(`Bundled current content successor identity is invalid for ${entry?.trackId}.`);
    const { row, artifact } = artifacts.find((item) => item.trackId === entry.trackId) ?? {};
    if (!row || entry.planningPolicy.contentVersion !== row.contentVersion || entry.planningPolicy.artifactSha256 !== row.sha256
      || entry.planningPolicy.policyVersion !== artifact.planningPolicy?.policyVersion) throw new Error(`Bundled current content successor policy is stale for ${entry.trackId}.`);
    const projection = historicalTrainingProjection(artifact, entry.training.contentVersion);
    if (sha256(projection) !== entry.training.artifactSha256 || JSON.parse(projection.toString("utf8")).questions.length !== entry.training.questionCount) {
      throw new Error(`Bundled current content training successor does not reconstruct for ${entry.trackId}.`);
    }
  }
  return {
    lockBytes,
    ledgerBytes,
    artifacts,
    inventory: { trackCount: artifacts.length, nodeCount: nodeIds.size, mentalUnitCount: mentalUnitIds.size, questionCount },
  };
}

export async function verifyBundledCurrentContent({ root = appRoot } = {}) {
  const built = await readCurrentPayload(root);
  const lockPath = path.join(root, RELEASE_LOCK_RELATIVE_PATH);
  const lockBytes = await readRegularFile(lockPath);
  const lock = parseJson(lockBytes, RELEASE_LOCK_RELATIVE_PATH);
  const identity = lock.currentIdentity;
  if (lock.schemaVersion !== 4 || identity?.schemaVersion !== "patternly-current-content-identity-v1"
    || identity.ownerPolicy !== "standing-owner-decision-2026-10-19-current-source"
    || lock.sourceInputFingerprint !== identity.sourceInputFingerprint
    || lock.bundledContentLockSha256 !== sha256(built.lockBytes)
    || lock.bundledSuccessorLedgerSha256 !== sha256(built.ledgerBytes)) {
    throw new Error("Bundled current content release metadata does not match its canonical locks.");
  }
  if (lock.artifacts?.length !== EXPECTED_TRACK_IDS.length || identity.tracks?.length !== EXPECTED_TRACK_IDS.length) {
    throw new Error("Bundled current content metadata does not contain exactly nine tracks.");
  }
  for (let index = 0; index < EXPECTED_TRACK_IDS.length; index += 1) {
    const { trackId, row, artifact, bytes } = built.artifacts[index];
    const track = identity.tracks[index];
    const releaseArtifact = lock.artifacts[index];
    if (track?.trackId !== trackId || releaseArtifact?.trackId !== trackId
      || track.artifactSha256 !== sha256(bytes) || track.artifactBytes !== bytes.length
      || track.contentVersion !== artifact.contentVersion || track.questionCount !== artifact.questions.length
      || releaseArtifact.checksumSha256 !== track.artifactSha256 || releaseArtifact.artifactBytes !== track.artifactBytes
      || releaseArtifact.contentVersion !== track.contentVersion || releaseArtifact.questionCount !== track.questionCount
      || releaseArtifact.releaseId !== lock.releaseId || row.sha256 !== track.artifactSha256) {
      throw new Error(`Bundled current content identity does not match ${trackId}.`);
    }
  }
  return { releaseId: lock.releaseId, sourceInputFingerprint: lock.sourceInputFingerprint, sourceRepositoryCommit: lock.sourceRepositoryCommit, trackCount: lock.artifacts.length, inventory: built.inventory, artifactDigests: lock.artifacts.map(({ trackId, checksumSha256, artifactBytes }) => ({ trackId, sha256: checksumSha256, bytes: artifactBytes })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyBundledCurrentContent();
    process.stdout.write(`BUNDLED_CURRENT_CONTENT=passed sourceCommit=${result.sourceRepositoryCommit} fingerprint=${result.sourceInputFingerprint} releaseId=${result.releaseId} tracks=${result.trackCount}\n`);
    for (const artifact of result.artifactDigests) process.stdout.write(`CONTENT_ARTIFACT=${artifact.trackId} sha256=${artifact.sha256} bytes=${artifact.bytes}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
