import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdtemp, open, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

export const EXPECTED_TRACK_IDS = Object.freeze([
  "aws-certified-solutions-architect-associate",
  "backend-system-design-interview",
  "claude-certified-architect-professional-certification",
  "coding-interview-dsa-problem-solving",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "object-oriented-design-interview",
]);
export const CLAUDE_TRACK_ID = "claude-certified-architect-professional-certification";
export const GENERATED_DIRECTORY = "src/content/generated/canonical-content";
export const LOCK_FILE_NAME = "content-lock.json";
export const SUCCESSOR_LEDGER_FILE_NAME = "content-successor-ledger.json";
export const RELEASE_LOCK_RELATIVE_PATH = "integration/contracts/content-release/release.lock.json";
const LOCK_SCHEMA_VERSION = "patternly-content-lock-v1";
const ARTIFACT_SCHEMA_VERSION = "patternly-content-artifact-v2";
const SUCCESSOR_LEDGER_SCHEMA_VERSION = "patternly-content-successor-ledger-v1";
const HASH = /^[a-f0-9]{64}$/u;
const TRACK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAFE_CONTENT_VERSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const CODING_TRACK_ID = "coding-interview-dsa-problem-solving";
const CODING_PROFILE_ID = "algorithms-interview-simulation-v1";
const DESIGN_TRACK_IDS = Object.freeze(["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"]);
const DESIGN_STAGE_IDS = Object.freeze(["requirements", "architecture", "tradeoffs", "final_answer"]);
const DESIGN_RUBRIC_IDS = Object.freeze(["requirements_clarity", "architecture_coherence", "tradeoff_reasoning", "communication_completeness"]);
const CODING_SELECTION_POLICY_KEYS = Object.freeze([
  "requireUniqueItemIds", "requireDeclaredSimulationEligibility", "requireMultipleMentalUnits",
  "requireMultiplePatternFamilies", "requireEveryActiveInteractionTypeRepresented",
  "prohibitConsecutiveSameMentalUnitWhenAlternativeExists", "prohibitDuplicateContentIdentity",
  "prohibitTaxonomyWidening", "prohibitFallbackItems",
]);
const execFileAsync = promisify(execFile);
const scriptRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const validationModulesByProducerRoot = new Map();

async function producerValidationModules(producerRoot) {
  const resolvedRoot = path.resolve(producerRoot ?? process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(scriptRoot, "../patternly-content"));
  let pending = validationModulesByProducerRoot.get(resolvedRoot);
  if (!pending) {
    pending = Promise.all([
      import(pathToFileURL(path.join(resolvedRoot, "scripts/content/question-contract.mjs")).href),
      import(pathToFileURL(path.join(resolvedRoot, "scripts/content/planning-policy.mjs")).href),
    ]).then(([questionContract, planningPolicy]) => ({
      validatePackageCompletionRule: questionContract.validatePackageCompletionRule,
      PlanningPolicyError: planningPolicy.PlanningPolicyError,
      validatePlanningPolicy: planningPolicy.validatePlanningPolicy,
    }));
    validationModulesByProducerRoot.set(resolvedRoot, pending);
  }
  return pending;
}

export class CanonicalContentSyncError extends Error {
  constructor(message) { super(message); this.name = "CanonicalContentSyncError"; }
}
function fail(message) { throw new CanonicalContentSyncError(message); }
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, expected) { return isRecord(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()); }
function requireExactKeys(value, expected, label) { if (!exactKeys(value, expected)) fail(`${label} has an invalid shape`); }
function validateCertificationSimulationConfig(config, { questions, nodeIds, allowLegacyEvidence = false }) {
  const path = `simulationProfiles.certification.familyConfig`;
  const configKeys = ["schemaVersion", "source", "durationMinutes", "questionCount", "blueprint", "interactionPolicy", "nodeDomainMap"];
  const legacyEvidenceKeys = [...configKeys, "nodeDomainMapEvidence"];
  if (!exactKeys(config, configKeys) && !(allowLegacyEvidence && exactKeys(config, legacyEvidenceKeys))) fail(`${path} has an invalid shape`);
  if (config.schemaVersion !== "patternly-certification-simulation-config-v1") fail(`${path}.schemaVersion is unsupported`);
  requireExactKeys(config.source, ["url", "checkedDate", "guideVersion"], `${path}.source`);
  if ([config.source.url, config.source.checkedDate, config.source.guideVersion].some((value) => typeof value !== "string" || !value.trim())) fail(`${path}.source is invalid`);
  if (config.durationMinutes !== 120) fail(`${path}.durationMinutes is invalid`);
  requireExactKeys(config.questionCount, ["kind", "minimum", "maximum"], `${path}.questionCount`);
  if (config.questionCount.kind !== "range" || config.questionCount.minimum !== 50 || config.questionCount.maximum !== 60) fail(`${path}.questionCount is unsupported`);
  requireExactKeys(config.blueprint, ["kind", "sections"], `${path}.blueprint`);
  if (config.blueprint.kind !== "weighted_sections" || !Array.isArray(config.blueprint.sections) || config.blueprint.sections.length !== 4) fail(`${path}.blueprint is invalid`);
  const expectedWeights = new Map([["gcp-ace-standard-domain-1", 20], ["gcp-ace-standard-domain-2", 30], ["gcp-ace-standard-domain-3", 30], ["gcp-ace-standard-domain-4", 20]]);
  const weights = new Map(); const sectionIds = new Set();
  config.blueprint.sections.forEach((section, index) => {
    requireExactKeys(section, ["id", "contentDomainId", "weightPercent"], `${path}.blueprint.sections[${index}]`);
    if (typeof section.id !== "string" || !section.id.trim() || sectionIds.has(section.id)) fail(`${path}.blueprint.sections[${index}].id is invalid`);
    if (!expectedWeights.has(section.contentDomainId) || weights.has(section.contentDomainId) || section.weightPercent !== expectedWeights.get(section.contentDomainId)) fail(`${path}.blueprint.sections[${index}] has an unknown or invalid domain weight`);
    sectionIds.add(section.id); weights.set(section.contentDomainId, section.weightPercent);
  });
  if (weights.size !== expectedWeights.size) fail(`${path}.blueprint does not cover the certification domains`);
  const policy = config.interactionPolicy;
  const policyKeys = ["schemaVersion", "policyId", "policyVersion", "owner", "navigation", "answerChanges", "flagging", "navigator", "sections", "timeout", "feedbackTiming"];
  requireExactKeys(policy, policyKeys, `${path}.interactionPolicy`);
  if (policy.schemaVersion !== "patternly-certification-simulation-policy-v1" || typeof policy.policyId !== "string" || !policy.policyId.trim() || policy.policyVersion !== "1" || policy.owner !== "patternly_product" || policy.navigation !== "free" || policy.answerChanges !== "until_final_submission" || policy.flagging !== "available" || policy.navigator !== "available" || policy.sections !== "blueprint_visible" || policy.timeout !== "absolute_deadline" || policy.feedbackTiming !== "after_verified_finalization") fail(`${path}.interactionPolicy is unsupported`);
  requireExactKeys(config.nodeDomainMap, nodeIds, `${path}.nodeDomainMap`);
  const domains = new Set(expectedWeights.keys());
  for (const [nodeId, domainId] of Object.entries(config.nodeDomainMap)) if (!domains.has(domainId)) fail(`${path}.nodeDomainMap.${nodeId} has an unknown domain`);
  const sourceDomainsByNode = new Map();
  for (const question of questions) {
    if (!domains.has(question.contentDomainId)) fail(`${path}: question is missing source-derived contentDomainId`);
    const nodeDomains = sourceDomainsByNode.get(question.nodeId) ?? new Set();
    nodeDomains.add(question.contentDomainId);
    sourceDomainsByNode.set(question.nodeId, nodeDomains);
  }
  if (sourceDomainsByNode.size !== nodeIds.length || [...sourceDomainsByNode.values()].some((nodeDomains) => nodeDomains.size !== 1)) fail(`${path}: source-derived per-question domains are incomplete or ambiguous`);
  const sourceNodeDomainMap = Object.fromEntries([...sourceDomainsByNode].map(([nodeId, nodeDomains]) => [nodeId, [...nodeDomains][0]]));
  if (JSON.stringify(Object.entries(config.nodeDomainMap).sort()) !== JSON.stringify(Object.entries(sourceNodeDomainMap).sort())) fail(`${path}.nodeDomainMap differs from source-derived per-question domains`);
  if (Object.hasOwn(config, "nodeDomainMapEvidence")) {
    if (!allowLegacyEvidence) fail(`${path}.nodeDomainMapEvidence is retired from current source`);
    const evidence = config.nodeDomainMapEvidence;
    requireExactKeys(evidence, ["artifactPath", "contentVersion", "itemCount", "nodeCount", "ambiguousNodeCount"], `${path}.nodeDomainMapEvidence`);
    if (typeof evidence.artifactPath !== "string" || typeof evidence.contentVersion !== "string"
      || !Number.isSafeInteger(evidence.itemCount) || !Number.isSafeInteger(evidence.nodeCount)
      || !Number.isSafeInteger(evidence.ambiguousNodeCount)) fail(`${path}.nodeDomainMapEvidence is malformed`);
  }
}
function validateCodingSimulationConfig(config, { questions }) {
  const label = "simulationProfiles.coding_interview.familyConfig";
  const configKeys = ["schemaVersion", "blueprintId", "blueprintVersion", "requestedLength", "actualLength", "shorteningPolicy", "uniqueItemsRequired", "timerKind", "durationMinutes", "navigationPolicy", "answerChangePolicy", "reinsertPolicy", "feedbackTiming", "learningStages", "selectionPolicy", "poolId", "poolVersion", "eligibleQuestionIds"];
  requireExactKeys(config, configKeys, label);
  if (config.schemaVersion !== "patternly-coding-interview-simulation-config-v1" || config.blueprintId !== "coding-interview-interview-simulation-v1" || config.blueprintVersion !== "1") fail(`${label} blueprint identity is unsupported`);
  if (config.requestedLength !== 40 || config.actualLength !== 40 || config.shorteningPolicy !== "prohibited" || config.uniqueItemsRequired !== 40) fail(`${label} must require exactly 40 unique questions`);
  if (config.timerKind !== "foreground_countdown" || config.durationMinutes !== 45 || config.navigationPolicy !== "free_navigation" || config.answerChangePolicy !== "editable_until_finalization" || config.reinsertPolicy !== "disabled" || config.feedbackTiming !== "after_verified_finalization") fail(`${label} interaction or timer policy is unsupported`);
  if (!Array.isArray(config.learningStages) || JSON.stringify(config.learningStages) !== JSON.stringify(["simulation"])) fail(`${label}.learningStages is unsupported`);
  requireExactKeys(config.selectionPolicy, CODING_SELECTION_POLICY_KEYS, `${label}.selectionPolicy`);
  if (CODING_SELECTION_POLICY_KEYS.some((key) => config.selectionPolicy[key] !== true)) fail(`${label}.selectionPolicy must keep every declared constraint enabled`);
  if (config.poolId !== CODING_PROFILE_ID || config.poolVersion !== "1") fail(`${label} pool identity is unsupported`);
  if (!Array.isArray(config.eligibleQuestionIds) || config.eligibleQuestionIds.length !== 40 || config.eligibleQuestionIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(config.eligibleQuestionIds).size !== 40) fail(`${label}.eligibleQuestionIds must contain 40 unique identities`);
  const questionIds = new Set(questions.map((question) => question.questionId));
  if (config.eligibleQuestionIds.some((id) => !questionIds.has(id))) fail(`${label}.eligibleQuestionIds contains an identity outside the canonical artifact`);
}
function validateDesignSimulationConfig(config, { trackId }) {
  const label = "simulationProfiles.design_interview.familyConfig";
  requireExactKeys(config, ["schemaVersion", "caseId", "caseVersion", "title", "brief", "timer", "stages", "reviewCriteria", "rubric", "outcomeEvaluation"], label);
  if (config.schemaVersion !== "patternly-design-interview-simulation-config-v1" || typeof config.caseId !== "string" || !config.caseId.trim() || config.caseVersion !== "1" || typeof config.title !== "string" || !config.title.trim() || typeof config.brief !== "string" || !config.brief.trim()) fail(`${label} case identity or prompt is invalid`);
  requireExactKeys(config.timer, ["kind", "durationSeconds"], `${label}.timer`);
  if (config.timer.kind !== "absolute_deadline" || config.timer.durationSeconds !== 2700) fail(`${label}.timer must use the canonical 45-minute absolute deadline`);
  if (!Array.isArray(config.stages) || JSON.stringify(config.stages.map((stage) => stage?.stageId)) !== JSON.stringify(DESIGN_STAGE_IDS)) fail(`${label}.stages must contain the canonical ordered stages`);
  config.stages.forEach((stage, index) => {
    requireExactKeys(stage, ["stageId", "title", "response"], `${label}.stages[${index}]`);
    if (typeof stage.title !== "string" || !stage.title.trim()) fail(`${label}.stages[${index}].title is invalid`);
    requireExactKeys(stage.response, ["type", "required", "minimumCharacters"], `${label}.stages[${index}].response`);
    if (stage.response.type !== "text" || stage.response.required !== true || stage.response.minimumCharacters !== 1) fail(`${label}.stages[${index}].response must require non-empty text`);
  });
  if (!Array.isArray(config.reviewCriteria) || config.reviewCriteria.length !== DESIGN_STAGE_IDS.length || JSON.stringify(config.reviewCriteria.map((criterion) => criterion?.stageId)) !== JSON.stringify(DESIGN_STAGE_IDS)) fail(`${label}.reviewCriteria must follow the stage order`);
  const criterionIds = new Set();
  config.reviewCriteria.forEach((criterion, index) => {
    requireExactKeys(criterion, ["criterionId", "stageId", "description"], `${label}.reviewCriteria[${index}]`);
    if (typeof criterion.criterionId !== "string" || !criterion.criterionId.trim() || criterionIds.has(criterion.criterionId) || typeof criterion.description !== "string" || !criterion.description.trim()) fail(`${label}.reviewCriteria[${index}] is invalid`);
    criterionIds.add(criterion.criterionId);
  });
  requireExactKeys(config.rubric, ["kind", "dimensions"], `${label}.rubric`);
  if (config.rubric.kind !== "self_assessment_reference_only" || !Array.isArray(config.rubric.dimensions) || JSON.stringify(config.rubric.dimensions.map((dimension) => dimension?.dimensionId)) !== JSON.stringify(DESIGN_RUBRIC_IDS)) fail(`${label}.rubric must be reference-only with the canonical dimensions`);
  config.rubric.dimensions.forEach((dimension, index) => {
    requireExactKeys(dimension, ["dimensionId", "title", "levels"], `${label}.rubric.dimensions[${index}]`);
    if (typeof dimension.title !== "string" || !dimension.title.trim() || !Array.isArray(dimension.levels) || dimension.levels.length !== 4) fail(`${label}.rubric.dimensions[${index}] must define four levels`);
    dimension.levels.forEach((level, levelIndex) => {
      requireExactKeys(level, ["level", "label", "description"], `${label}.rubric.dimensions[${index}].levels[${levelIndex}]`);
      if (level.level !== levelIndex + 1 || typeof level.label !== "string" || !level.label.trim() || typeof level.description !== "string" || !level.description.trim()) fail(`${label}.rubric.dimensions[${index}].levels[${levelIndex}] is invalid`);
    });
  });
  requireExactKeys(config.outcomeEvaluation, ["machineEvaluable", "semanticScoring"], `${label}.outcomeEvaluation`);
  if (JSON.stringify(config.outcomeEvaluation.machineEvaluable) !== JSON.stringify(["response_completeness"]) || config.outcomeEvaluation.semanticScoring !== "not_evaluated") fail(`${label}.outcomeEvaluation may evaluate completeness only`);
  if (!DESIGN_TRACK_IDS.includes(trackId)) fail(`${label} is not supported for ${trackId}`);
}
function validateSimulationProfiles(profiles, { trackId, questions, allowLegacyEvidence = false }) {
  if (!Array.isArray(profiles) || profiles.length === 0) fail(`Simulation profile metadata is malformed for ${trackId}`);
  if (!["google-cloud-associate-cloud-engineer", CODING_TRACK_ID, ...DESIGN_TRACK_IDS].includes(trackId) || profiles.length !== 1) fail(`Simulation profile family is unsupported for ${trackId}`);
  const profile = profiles[0];
  requireExactKeys(profile, ["schemaVersion", "profileId", "profileVersion", "familyId", "modeId", "familyConfig"], "simulationProfiles[0]");
  if (DESIGN_TRACK_IDS.includes(trackId)) {
    if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== `${trackId}-simulation-v1` || profile.profileVersion !== "1") fail("Design Interview simulation profile envelope or profile version is unsupported");
    if (profile.familyId !== "design_interview" || profile.modeId !== "design-interview-simulation") fail("Design Interview simulation profile is not bound to Design Simulation");
    validateDesignSimulationConfig(profile.familyConfig, { trackId });
    return;
  }
  if (trackId === CODING_TRACK_ID) {
    if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== CODING_PROFILE_ID || profile.profileVersion !== "1") fail("Coding Interview simulation profile envelope or profile version is unsupported");
    if (profile.familyId !== "coding_interview" || profile.modeId !== "coding-interview-simulation") fail("Coding Interview simulation profile is not bound to Coding Mock");
    validateCodingSimulationConfig(profile.familyConfig, { questions });
    return;
  }
  if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== "google-cloud-associate-cloud-engineer-certification-exam-v1" || profile.profileVersion !== "1") fail("GCP simulation profile envelope or profile version is unsupported");
  if (profile.familyId !== "certification") fail("GCP simulation profile family is unsupported");
  if (profile.modeId !== "certification-exam-simulation") fail("GCP simulation profile mode is not bound to Exam Simulation");
  const nodeIds = [...new Set(questions.map((question) => question.nodeId))].sort();
  validateCertificationSimulationConfig(profile.familyConfig, { questions, nodeIds, allowLegacyEvidence });
}
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function equalStringSets(actual, expected) { return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort()); }
function isWithin(base, candidate) {
  const relative = path.relative(base, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

async function inspectRegularFile(filePath, allowedRoot, label) {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedFile = path.resolve(filePath);
  if (!isWithin(resolvedRoot, resolvedFile)) fail(`${label} escapes its allowed root: ${filePath}`);
  let current = resolvedRoot;
  for (const segment of path.relative(resolvedRoot, resolvedFile).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try { info = await lstat(current); } catch (error) { fail(`Cannot inspect ${label} ${current}: ${error.message}`); }
    if (info.isSymbolicLink()) fail(`Symbolic links are not allowed in ${label}: ${current}`);
  }
  const rootReal = await realpath(resolvedRoot);
  const fileReal = await realpath(resolvedFile);
  if (!isWithin(rootReal, fileReal)) fail(`${label} escapes its real root: ${filePath}`);
  const info = await lstat(resolvedFile);
  if (!info.isFile()) fail(`${label} is not a regular file: ${filePath}`);
  return readFile(resolvedFile);
}

async function inspectDirectory(directory, allowedRoot, label) {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedDirectory = path.resolve(directory);
  if (!isWithin(resolvedRoot, resolvedDirectory)) fail(`${label} escapes its allowed root: ${directory}`);
  const info = await lstat(resolvedDirectory);
  if (info.isSymbolicLink() || !info.isDirectory()) fail(`${label} must be a real directory: ${directory}`);
  const rootReal = await realpath(resolvedRoot);
  const directoryReal = await realpath(resolvedDirectory);
  if (!isWithin(rootReal, directoryReal)) fail(`${label} escapes its real root: ${directory}`);
}

async function assertSafeTargetBoundary(appRoot, targetDirectory) {
  const resolvedAppRoot = path.resolve(appRoot);
  const targetParent = path.dirname(path.resolve(targetDirectory));
  const appInfo = await lstat(resolvedAppRoot);
  if (appInfo.isSymbolicLink() || !appInfo.isDirectory()) fail(`Application root must be a real directory: ${resolvedAppRoot}`);
  const appReal = await realpath(resolvedAppRoot);
  let current = resolvedAppRoot;
  for (const segment of path.relative(resolvedAppRoot, targetParent).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try { info = await lstat(current); } catch (error) { fail(`Canonical content target parent is missing or inaccessible: ${current}: ${error.message}`); }
    if (info.isSymbolicLink() || !info.isDirectory()) fail(`Canonical content target ancestor must be a real directory: ${current}`);
  }
  const parentReal = await realpath(targetParent);
  if (!isWithin(appReal, parentReal)) fail(`Canonical content target parent escapes the real application root: ${targetParent}`);
}

async function assertSafeCheckTemporaryRoot(appRoot, temporaryRoot) {
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedTemporaryRoot = path.resolve(temporaryRoot);
  if (isWithin(resolvedAppRoot, resolvedTemporaryRoot)) fail("Check temporary root must be outside the application root");
  const [appReal, temporaryReal] = await Promise.all([realpath(resolvedAppRoot), realpath(resolvedTemporaryRoot)]);
  if (isWithin(appReal, temporaryReal)) fail("Check temporary root resolves inside the real application root");
  const info = await lstat(temporaryReal);
  if (!info.isDirectory()) fail(`Check temporary root must resolve to a directory: ${resolvedTemporaryRoot}`);
  return temporaryReal;
}

function parseJson(bytes, filePath) {
  try { return JSON.parse(bytes.toString("utf8")); } catch (error) { fail(`Invalid JSON in ${filePath}: ${error.message}`); }
}

export async function validateBuiltContent(directory, { expectedInventory = null, acceptedInventories = [], producerRoot, allowLegacySimulationEvidence = false } = {}) {
  const { validatePackageCompletionRule, PlanningPolicyError, validatePlanningPolicy } = await producerValidationModules(producerRoot);
  await inspectDirectory(directory, directory, "built content directory");
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) if (entry.isSymbolicLink() || !entry.isFile()) fail(`Built content contains a non-regular entry: ${entry.name}`);
  const names = entries.map((entry) => entry.name);
  const hasSuccessorLedger = names.includes(SUCCESSOR_LEDGER_FILE_NAME);
  const expectedNames = [...EXPECTED_TRACK_IDS.map((id) => `${id}.json`), LOCK_FILE_NAME, ...(hasSuccessorLedger ? [SUCCESSOR_LEDGER_FILE_NAME] : [])];
  if (!equalStringSets(names, expectedNames) || names.length !== expectedNames.length) fail(`Built content must contain exactly the nine registered artifacts, ${LOCK_FILE_NAME}, and optional ${SUCCESSOR_LEDGER_FILE_NAME}; received ${names.sort().join(", ")}`);

  const lockPath = path.join(directory, LOCK_FILE_NAME);
  const lockBytes = await inspectRegularFile(lockPath, directory, "content lock");
  const lock = parseJson(lockBytes, lockPath);
  if (!exactKeys(lock, ["schemaVersion", "tracks"]) || lock.schemaVersion !== LOCK_SCHEMA_VERSION || !Array.isArray(lock.tracks)) fail("Content lock has an invalid shape or schemaVersion");
  if (lock.tracks.length !== EXPECTED_TRACK_IDS.length) fail("Content lock must contain exactly nine track entries");
  const lockedIds = lock.tracks.map((entry) => entry?.trackId);
  if (!equalStringSets(lockedIds, EXPECTED_TRACK_IDS) || new Set(lockedIds).size !== EXPECTED_TRACK_IDS.length) fail("Content lock has missing, extra, or duplicate track IDs");
  if (JSON.stringify(lockedIds) !== JSON.stringify([...lockedIds].sort())) fail("Content lock track entries must be sorted by trackId");

  const nodeIds = new Set();
  const mentalUnitIds = new Set();
  const questionIds = new Set();
  const files = new Map();
  const parsedArtifacts = new Map();
  for (const entry of lock.tracks) {
    if (!exactKeys(entry, ["trackId", "contentVersion", "questionCount", "sha256"])) fail(`Invalid lock entry for ${entry?.trackId ?? "unknown"}`);
    if (!TRACK_ID.test(entry.trackId) || !EXPECTED_TRACK_IDS.includes(entry.trackId)) fail(`Unsafe or unknown trackId in lock: ${entry.trackId}`);
    if (typeof entry.contentVersion !== "string" || !entry.contentVersion || entry.contentVersion.trim() !== entry.contentVersion) fail(`Invalid contentVersion for ${entry.trackId}`);
    if (!Number.isInteger(entry.questionCount) || entry.questionCount < 1 || !HASH.test(entry.sha256)) fail(`Invalid count or SHA-256 for ${entry.trackId}`);
    const artifactPath = path.join(directory, `${entry.trackId}.json`);
    const artifactBytes = await inspectRegularFile(artifactPath, directory, "content artifact");
    if (sha256(artifactBytes) !== entry.sha256) fail(`SHA-256 mismatch for ${entry.trackId}`);
    const artifact = parseJson(artifactBytes, artifactPath);
    const artifactShapes = [
      ["schemaVersion", "trackId", "contentVersion", "questions", "planningPolicy"],
      ["schemaVersion", "trackId", "contentVersion", "questions", "planningPolicy", "simulationProfiles"],
      ["schemaVersion", "trackId", "contentVersion", "questions", "planningPolicy", "completionRule"],
      ["schemaVersion", "trackId", "contentVersion", "questions", "planningPolicy", "simulationProfiles", "completionRule"],
    ];
    if (!isRecord(artifact) || !artifactShapes.some((keys) => exactKeys(artifact, keys))) fail(`Invalid artifact shape for ${entry.trackId}`);
    if (artifact.schemaVersion !== ARTIFACT_SCHEMA_VERSION || artifact.trackId !== entry.trackId || artifact.contentVersion !== entry.contentVersion) fail(`Artifact identity mismatch for ${entry.trackId}`);
    if (!Array.isArray(artifact.questions) || artifact.questions.length !== entry.questionCount) fail(`Question count mismatch for ${entry.trackId}`);
    try { validatePlanningPolicy(artifact.planningPolicy, artifact.questions); }
    catch (error) {
      if (error instanceof PlanningPolicyError) fail(`Invalid planning policy for ${entry.trackId}: ${error.message}`);
      throw error;
    }
    if (Object.hasOwn(artifact, "completionRule")) {
      const completion = validatePackageCompletionRule(artifact.completionRule, "completionRule", artifact.questions);
      if (!completion.valid) fail(`Invalid chapter completion rule for ${entry.trackId}: ${completion.errors.join("; ")}`);
    }
    const hasSimulationProfiles = Object.hasOwn(artifact, "simulationProfiles");
    const knownGcpDomains = new Set(["gcp-ace-standard-domain-1", "gcp-ace-standard-domain-2", "gcp-ace-standard-domain-3", "gcp-ace-standard-domain-4"]);
    for (const question of artifact.questions) {
      if (!isRecord(question) || question.trackId !== entry.trackId) fail(`Foreign or malformed question in ${entry.trackId}`);
      for (const key of ["questionId", "nodeId", "mentalUnitId"]) if (typeof question[key] !== "string" || !question[key]) fail(`Question in ${entry.trackId} has invalid ${key}`);
      if (questionIds.has(question.questionId)) fail(`Duplicate questionId: ${question.questionId}`);
      if (question.contentDomainId !== undefined && (entry.trackId !== "google-cloud-associate-cloud-engineer" || !knownGcpDomains.has(question.contentDomainId))) fail(`Unexpected contentDomainId on question ${question.questionId}`);
      if (hasSimulationProfiles && entry.trackId === "google-cloud-associate-cloud-engineer" && !knownGcpDomains.has(question.contentDomainId)) fail(`Missing source-derived contentDomainId on question ${question.questionId}`);
      questionIds.add(question.questionId);
      nodeIds.add(`${entry.trackId}\0${question.nodeId}`);
      mentalUnitIds.add(`${entry.trackId}\0${question.nodeId}\0${question.mentalUnitId}`);
    }
    if (Object.hasOwn(artifact, "simulationProfiles")) validateSimulationProfiles(artifact.simulationProfiles, { trackId: entry.trackId, questions: artifact.questions, allowLegacyEvidence: allowLegacySimulationEvidence });
    files.set(`${entry.trackId}.json`, artifactBytes);
    parsedArtifacts.set(`${entry.trackId}.json`, artifact);
  }
  files.set(LOCK_FILE_NAME, lockBytes);
  if (hasSuccessorLedger) {
    const ledgerPath = path.join(directory, SUCCESSOR_LEDGER_FILE_NAME);
    const ledgerBytes = await inspectRegularFile(ledgerPath, directory, "content successor ledger");
    const ledger = parseSuccessorLedger(parseJson(ledgerBytes, ledgerPath));
    const lockByTrack = new Map(lock.tracks.map((entry) => [entry.trackId, entry]));
    for (const entry of ledger.tracks) {
      const artifact = parsedArtifacts.get(`${entry.trackId}.json`);
      const currentLock = lockByTrack.get(entry.trackId);
      const current = artifact && currentLock ? trackIdentityFromArtifact(artifact, currentLock.sha256) : null;
      if (!current || current.contentVersion !== entry.planningPolicy.contentVersion || current.artifactSha256 !== entry.planningPolicy.artifactSha256 || current.policyVersion !== entry.planningPolicy.policyVersion) fail(`Content successor ledger is stale for ${entry.trackId}`);
      const reconstructed = historicalTrainingProjection(artifact, entry.training.contentVersion);
      if (sha256(reconstructed) !== entry.training.artifactSha256 || JSON.parse(reconstructed.toString("utf8")).questions.length !== entry.training.questionCount) fail(`Content successor ledger training identity does not reconstruct exactly for ${entry.trackId}`);
    }
    files.set(SUCCESSOR_LEDGER_FILE_NAME, ledgerBytes);
  }
  const inventory = { trackCount: lock.tracks.length, nodeCount: nodeIds.size, mentalUnitCount: mentalUnitIds.size, questionCount: questionIds.size };
  const accepted = [expectedInventory, ...acceptedInventories].filter(Boolean);
  if (accepted.length > 0 && !accepted.some((entry) => JSON.stringify(inventory) === JSON.stringify(entry))) fail(`Inventory mismatch: expected ${canonicalJson(accepted)}, received ${JSON.stringify(inventory)}`);
  return { lock, inventory, files };
}

async function defaultRunBuild({ producerRoot, outputRoot }) {
  const producer = await import(pathToFileURL(path.join(producerRoot, "scripts", "build.mjs")).href);
  return producer.buildAll({ rootDirectory: producerRoot, outputRoot });
}
async function producerHead(producerRoot) {
  const { stdout } = await execFileAsync("git", ["-C", producerRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  const head = stdout.trim();
  if (!/^[a-f0-9]{40}$/u.test(head)) fail("Cannot resolve the current patternly-content HEAD");
  return head;
}
async function assertProducerRoot(producerRoot) {
  await inspectDirectory(producerRoot, path.dirname(producerRoot), "patternly-content checkout");
  await inspectRegularFile(path.join(producerRoot, "scripts", "build.mjs"), producerRoot, "canonical producer build script");
}
async function compareDirectories(actualDirectory, expectedDirectory, options) {
  const [actual, expected] = await Promise.all([validateBuiltContent(actualDirectory, options), validateBuiltContent(expectedDirectory, options)]);
  for (const fileName of [...EXPECTED_TRACK_IDS.map((id) => `${id}.json`), LOCK_FILE_NAME]) if (!actual.files.get(fileName)?.equals(expected.files.get(fileName))) fail(`Canonical content parity mismatch: ${fileName}`);
  return expected;
}

function parseSuccessorLedger(value) {
  if (!exactKeys(value, ["schemaVersion", "tracks"]) || value.schemaVersion !== SUCCESSOR_LEDGER_SCHEMA_VERSION || !Array.isArray(value.tracks) || value.tracks.length !== EXPECTED_TRACK_IDS.length) fail("Content successor ledger has an invalid shape");
  const ids = value.tracks.map((entry) => entry?.trackId);
  if (!equalStringSets(ids, EXPECTED_TRACK_IDS) || new Set(ids).size !== EXPECTED_TRACK_IDS.length || JSON.stringify(ids) !== JSON.stringify([...ids].sort())) fail("Content successor ledger has missing, extra, duplicate, or unsorted tracks");
  for (const entry of value.tracks) {
    requireExactKeys(entry, ["trackId", "training", "planningPolicy"], `successor ledger ${entry.trackId}`);
    if (!TRACK_ID.test(entry.trackId) || !EXPECTED_TRACK_IDS.includes(entry.trackId)) fail("Content successor ledger has an unknown track");
    requireExactKeys(entry.training, ["contentVersion", "artifactSha256", "questionCount"], `successor ledger ${entry.trackId}.training`);
    if (!SAFE_CONTENT_VERSION.test(entry.training.contentVersion) || !HASH.test(entry.training.artifactSha256) || !Number.isSafeInteger(entry.training.questionCount) || entry.training.questionCount < 1) fail(`Invalid training predecessor identity for ${entry.trackId}`);
    requireExactKeys(entry.planningPolicy, ["contentVersion", "artifactSha256", "policyVersion"], `successor ledger ${entry.trackId}.planningPolicy`);
    if (!SAFE_CONTENT_VERSION.test(entry.planningPolicy.contentVersion) || !HASH.test(entry.planningPolicy.artifactSha256) || typeof entry.planningPolicy.policyVersion !== "string" || !entry.planningPolicy.policyVersion.trim()) fail(`Invalid planning policy successor identity for ${entry.trackId}`);
  }
  return value;
}

export function historicalTrainingProjection(artifact, contentVersion) {
  const projection = structuredClone(artifact);
  delete projection.planningPolicy;
  projection.schemaVersion = "patternly-content-artifact-v1";
  projection.contentVersion = contentVersion;
  return Buffer.from(JSON.stringify(projection));
}

function canonicalJson(value) {
  if (value === null || ["boolean", "number", "string"].includes(typeof value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!isRecord(value)) return undefined;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function trackIdentityFromArtifact(artifact, sha256Value) {
  if (artifact.schemaVersion !== ARTIFACT_SCHEMA_VERSION || !artifact.planningPolicy || artifact.planningPolicy.schemaVersion !== "patternly-learning-planning-policy-v1") fail(`Track ${artifact.trackId} is not a versioned v2 planning-policy successor`);
  return Object.freeze({ contentVersion: artifact.contentVersion, artifactSha256: sha256Value, policyVersion: artifact.planningPolicy.policyVersion });
}

function deriveSuccessorLedger({ artifacts, lock, previousLedger }) {
  const lockByTrack = new Map(lock.tracks.map((entry) => [entry.trackId, entry]));
  const previousByTrack = previousLedger ? new Map(previousLedger.tracks.map((entry) => [entry.trackId, entry])) : null;
  const tracks = [];
  for (const trackId of EXPECTED_TRACK_IDS) {
    const artifact = artifacts.get(`${trackId}.json`);
    const currentLock = lockByTrack.get(trackId);
    if (!artifact || !currentLock) fail(`Cannot derive content successor identity for ${trackId}`);
    const currentIdentity = trackIdentityFromArtifact(artifact, currentLock.sha256);
    const currentTrainingBytes = historicalTrainingProjection(artifact, currentIdentity.contentVersion);
    const previous = previousByTrack?.get(trackId);
    const priorProjection = previous
      ? historicalTrainingProjection(artifact, previous.training.contentVersion)
      : undefined;
    const policyOnlySuccessor = previous
      && sha256(priorProjection) === previous.training.artifactSha256
      && JSON.parse(priorProjection.toString("utf8")).questions.length === previous.training.questionCount;
    const training = policyOnlySuccessor
      ? previous.training
      : Object.freeze({ contentVersion: currentIdentity.contentVersion, artifactSha256: sha256(currentTrainingBytes), questionCount: artifact.questions.length });
    tracks.push(Object.freeze({ trackId, training, planningPolicy: Object.freeze({ contentVersion: currentIdentity.contentVersion, artifactSha256: currentIdentity.artifactSha256, policyVersion: currentIdentity.policyVersion }) }));
  }
  return parseSuccessorLedger(Object.freeze({ schemaVersion: SUCCESSOR_LEDGER_SCHEMA_VERSION, tracks: Object.freeze(tracks) }));
}

async function pathKind(candidate) {
  try {
    const info = await lstat(candidate);
    if (info.isSymbolicLink()) fail(`Symbolic link is not allowed at transaction path: ${candidate}`);
    return info.isDirectory() ? "directory" : "other";
  } catch (error) { if (error?.code === "ENOENT") return "missing"; throw error; }
}
async function writeTransactionJournal(journalPath, journal) {
  const temporaryPath = `${journalPath}.tmp-${randomUUID()}`;
  await writeFile(temporaryPath, `${JSON.stringify(journal)}\n`, { flag: "wx" });
  await rename(temporaryPath, journalPath);
}

async function directoryDigestManifest(directory) {
  const names = (await readdir(directory, { withFileTypes: true })).map((entry) => entry.name).sort();
  const manifest = {};
  for (const name of names) {
    const bytes = await inspectRegularFile(path.join(directory, name), directory, "transaction content file");
    manifest[name] = sha256(bytes);
  }
  return manifest;
}

function manifestsEqual(left, right) { return canonicalJson(left) === canonicalJson(right); }

async function recoverCurrentBank({ targetDirectory, targetLockFile, remove = rm, move = rename }) {
  const journalPath = `${targetDirectory}.transaction.json`;
  const backupDirectory = `${targetDirectory}.previous`;
  const backupLockFile = `${targetLockFile}.previous`;
  const [journalKind, directoryBackupKind, lockBackupKind] = await Promise.all([pathKind(journalPath), pathKind(backupDirectory), pathKind(backupLockFile)]);
  if (journalKind === "missing") {
    if (directoryBackupKind !== "missing" || lockBackupKind !== "missing") fail(`Recoverable content-sync backups exist without a transaction journal; preserve ${backupDirectory} and ${backupLockFile} and inspect before retrying`);
    return;
  }
  if (journalKind !== "other") fail("Current-bank transaction journal must be a regular file");
  const journalBytes = await inspectRegularFile(journalPath, path.dirname(journalPath), "current-bank transaction journal");
  const journal = parseJson(journalBytes, journalPath);
  const keys = ["schemaVersion", "phase", "targetDirectory", "targetLockFile", "backupDirectory", "backupLockFile", "stagedDirectory", "stagedLockFile", "previousDirectoryDigests", "previousLockSha256", "stagedDirectoryDigests", "stagedLockSha256"];
  requireExactKeys(journal, keys, "current-bank transaction journal");
  const stagedDirectory = path.resolve(String(journal.stagedDirectory ?? ""));
  const stagedLockFile = path.resolve(String(journal.stagedLockFile ?? ""));
  const stagedLockDirectory = path.dirname(stagedLockFile);
  const contentStagePattern = /^\.canonical-content-build-[0-9]+-[A-Za-z0-9_-]+$/u;
  const lockStagePattern = /^\.current-content-lock-[0-9]+-[A-Za-z0-9_-]+$/u;
  if (journal.schemaVersion !== 1 || !["prepared", "committed"].includes(journal.phase)
    || journal.targetDirectory !== targetDirectory || journal.targetLockFile !== targetLockFile
    || journal.backupDirectory !== backupDirectory || journal.backupLockFile !== backupLockFile
    || path.dirname(stagedDirectory) !== path.dirname(targetDirectory) || !contentStagePattern.test(path.basename(stagedDirectory))
    || path.dirname(stagedLockDirectory) !== path.dirname(targetLockFile) || !lockStagePattern.test(path.basename(stagedLockDirectory))
    || path.basename(stagedLockFile) !== "release.lock.json"
    || !journal.previousDirectoryDigests || typeof journal.previousDirectoryDigests !== "object"
    || !journal.stagedDirectoryDigests || typeof journal.stagedDirectoryDigests !== "object"
    || !/^[a-f0-9]{64}$/u.test(journal.previousLockSha256 ?? "") || !/^[a-f0-9]{64}$/u.test(journal.stagedLockSha256 ?? "")) {
    fail("Current-bank transaction journal is invalid; preserve its files and inspect before retrying");
  }
  const previousDirMatches = (manifest) => manifestsEqual(manifest, journal.previousDirectoryDigests);
  const stagedDirMatches = (manifest) => manifestsEqual(manifest, journal.stagedDirectoryDigests);
  const previousLockMatches = (bytes) => sha256(bytes) === journal.previousLockSha256;
  const stagedLockMatches = (bytes) => sha256(bytes) === journal.stagedLockSha256;
  try {
    const targetDirectoryKind = await pathKind(targetDirectory);
    const targetLockKind = await pathKind(targetLockFile);
    let targetDirectoryManifest;
    let backupDirectoryManifest;
    if (targetDirectoryKind === "directory") targetDirectoryManifest = await directoryDigestManifest(targetDirectory);
    if (directoryBackupKind === "directory") backupDirectoryManifest = await directoryDigestManifest(backupDirectory);
    let targetLockBytes;
    let backupLockBytes;
    if (targetLockKind === "other") targetLockBytes = await inspectRegularFile(targetLockFile, path.dirname(targetLockFile), "transaction release lock");
    if (lockBackupKind === "other") backupLockBytes = await inspectRegularFile(backupLockFile, path.dirname(backupLockFile), "transaction release-lock backup");

    const stagedDirectoryExists = await pathKind(stagedDirectory) === "directory";
    if (stagedDirectoryExists && !stagedDirMatches(await directoryDigestManifest(stagedDirectory))) fail("Interrupted current-bank sync found changed staging files; preserve the journal and backups for review");
    const stagedLockExists = await pathKind(stagedLockFile) === "other";
    if (stagedLockExists && !stagedLockMatches(await inspectRegularFile(stagedLockFile, stagedLockDirectory, "staged release lock"))) fail("Interrupted current-bank sync found a changed staged release lock; preserve the journal and backups for review");
    if (await pathKind(stagedLockDirectory) === "directory") {
      const lockStageEntries = await readdir(stagedLockDirectory);
      if (lockStageEntries.some((entry) => entry !== "release.lock.json") || (stagedLockExists && lockStageEntries.length !== 1)) {
        fail("Interrupted current-bank sync found unexpected files in the staged release-lock directory; preserve the journal and backups for review");
      }
      if (!stagedLockExists && lockStageEntries.length !== 0) fail("Interrupted current-bank sync found a non-empty staged release-lock directory without its lock; preserve the journal and backups for review");
    }

    const targetDirIsPrevious = targetDirectoryManifest && previousDirMatches(targetDirectoryManifest);
    const targetDirIsStaged = targetDirectoryManifest && stagedDirMatches(targetDirectoryManifest);
    const backupDirIsPrevious = backupDirectoryManifest && previousDirMatches(backupDirectoryManifest);
    const targetLockIsPrevious = targetLockBytes && previousLockMatches(targetLockBytes);
    const targetLockIsStaged = targetLockBytes && stagedLockMatches(targetLockBytes);
    const backupLockIsPrevious = backupLockBytes && previousLockMatches(backupLockBytes);
    if ((targetDirectoryManifest && !targetDirIsPrevious && !targetDirIsStaged)
      || (backupDirectoryManifest && !backupDirIsPrevious)
      || (targetLockBytes && !targetLockIsPrevious && !targetLockIsStaged)
      || (backupLockBytes && !backupLockIsPrevious)) fail("Interrupted current-bank sync conflicts with concurrently changed target or backup bytes; preserve the journal and backups");

    if (journal.phase === "committed") {
      if (!targetDirIsStaged || !targetLockIsStaged) fail("Committed current-bank transaction no longer matches its staged digests; preserve the journal and backups");
      if (directoryBackupKind === "directory") await remove(backupDirectory, { recursive: true, force: false });
      if (lockBackupKind === "other") await remove(backupLockFile, { force: false });
    } else {
      if ((directoryBackupKind === "missing" && !targetDirIsPrevious)
        || (directoryBackupKind === "directory" && targetDirIsPrevious && !targetDirIsStaged)
        || (lockBackupKind === "missing" && !targetLockIsPrevious)
        || (lockBackupKind === "other" && targetLockIsPrevious && !targetLockIsStaged)) fail("Interrupted current-bank sync lost or duplicated a previous target; preserve the journal and backups");
      if (directoryBackupKind === "directory") {
        if (targetDirectoryKind !== "missing") await remove(targetDirectory, { recursive: true, force: false });
        await move(backupDirectory, targetDirectory);
      }
      if (lockBackupKind === "other") {
        if (targetLockKind !== "missing") await remove(targetLockFile, { force: false });
        await move(backupLockFile, targetLockFile);
      }
    }
    if (stagedDirectoryExists) await remove(stagedDirectory, { recursive: true, force: false });
    if (await pathKind(stagedLockDirectory) === "directory") await remove(stagedLockDirectory, { recursive: true, force: false });
    await remove(journalPath, { force: false });
  } catch (error) {
    if (error instanceof CanonicalContentSyncError) throw error;
    fail(`Interrupted current-bank sync is recoverable; automatic restoration stopped safely (${error.message}). Keep the transaction journal and .previous files intact before retrying`);
  }
}
async function assertNoInterruptedTransaction({ targetDirectory, targetLockFile }) {
  const paths = [`${targetDirectory}.transaction.json`, `${targetDirectory}.previous`, `${targetLockFile}.previous`];
  const kinds = await Promise.all(paths.map(pathKind));
  if (kinds.some((kind) => kind !== "missing")) fail(`An interrupted current-bank transaction needs recovery before check mode; inspect ${paths[0]} and its .previous backups`);
}

async function replaceCurrentBank({ stagedDirectory, targetDirectory, stagedLockFile, targetLockFile, expectedInventory, producerRoot, remove, move, expectedTargetDigests }) {
  await recoverCurrentBank({ targetDirectory, targetLockFile, remove, move });
  const current = await validateBuiltContent(targetDirectory, { expectedInventory: null, producerRoot, allowLegacySimulationEvidence: true });
  const currentLock = await readFile(targetLockFile);
  const currentDigests = Object.fromEntries([...current.files].map(([name, bytes]) => [name, sha256(bytes)]));
  if (canonicalJson(currentDigests) !== canonicalJson(expectedTargetDigests.files) || sha256(currentLock) !== expectedTargetDigests.lock) fail("Installed content changed while the new bank was being prepared; nothing was replaced");
  const targetBackup = `${targetDirectory}.previous`;
  const lockBackup = `${targetLockFile}.previous`;
  const journalPath = `${targetDirectory}.transaction.json`;
  if (await pathKind(targetBackup) !== "missing" || await pathKind(lockBackup) !== "missing") fail("Current-bank sync found unexplained .previous files; inspect them before retrying");
  const journal = { schemaVersion: 1, phase: "prepared", targetDirectory, targetLockFile, backupDirectory: targetBackup, backupLockFile: lockBackup, stagedDirectory, stagedLockFile, previousDirectoryDigests: expectedTargetDigests.files, previousLockSha256: expectedTargetDigests.lock, stagedDirectoryDigests: Object.fromEntries([...expectedTargetDigests.stagedFiles].map(([name, bytes]) => [name, sha256(bytes)])), stagedLockSha256: sha256(expectedTargetDigests.stagedLock) };
  await writeTransactionJournal(journalPath, journal);
  try {
    await move(targetDirectory, targetBackup);
    await move(targetLockFile, lockBackup);
    await move(stagedDirectory, targetDirectory);
    await move(stagedLockFile, targetLockFile);
    const installed = await validateBuiltContent(targetDirectory, { expectedInventory, producerRoot });
    const installedLock = await readFile(targetLockFile);
    if (installed.files.size !== expectedTargetDigests.stagedFiles.size) fail("Installed content inventory differs from staged bank");
    for (const [name, bytes] of expectedTargetDigests.stagedFiles) if (!installed.files.get(name)?.equals(bytes)) fail(`Installed canonical content differs from staged bytes: ${name}`);
    if (!installedLock.equals(expectedTargetDigests.stagedLock)) fail("Installed content release metadata differs from staged bytes");
    journal.phase = "committed";
    await writeTransactionJournal(journalPath, journal);
  } catch (error) {
    try { await recoverCurrentBank({ targetDirectory, targetLockFile, remove, move }); }
    catch (rollbackError) { fail(`Current bank replacement failed (${error.message}); recovery remains available in ${journalPath}: ${rollbackError.message}`); }
    fail(`Current bank replacement failed; previous bank restored: ${error.message}`);
  }
  await remove(targetBackup, { recursive: true, force: false });
  await remove(lockBackup, { force: false });
  await remove(journalPath, { force: false });
}
async function syncCanonicalContentUnlocked({ mode = "sync", appRoot = scriptRoot, producerRoot = process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(scriptRoot, "../patternly-content"), targetDirectory = path.join(appRoot, GENERATED_DIRECTORY), targetLockFile = path.join(appRoot, RELEASE_LOCK_RELATIVE_PATH), temporaryRoot = tmpdir(), runBuild = defaultRunBuild, getProducerHead = producerHead, getCurrentIdentity, getFreshSourceFingerprint, expectedInventory = null, remove = rm, move = rename } = {}) {
  if (mode !== "sync" && mode !== "check") fail(`Unknown mode: ${mode}`);
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedProducerRoot = path.resolve(producerRoot);
  const resolvedTarget = path.resolve(targetDirectory);
  const resolvedLockFile = path.resolve(targetLockFile);
  if (!isWithin(resolvedAppRoot, resolvedTarget) || resolvedTarget !== path.join(resolvedAppRoot, GENERATED_DIRECTORY)) fail(`Target must be exactly ${GENERATED_DIRECTORY} within the application root`);
  if (!isWithin(resolvedAppRoot, resolvedLockFile) || resolvedLockFile !== path.join(resolvedAppRoot, RELEASE_LOCK_RELATIVE_PATH)) fail(`Release lock target must be exactly ${RELEASE_LOCK_RELATIVE_PATH} within the application root`);
  await assertSafeTargetBoundary(resolvedAppRoot, resolvedTarget);
  if (mode === "sync") await recoverCurrentBank({ targetDirectory: resolvedTarget, targetLockFile: resolvedLockFile, remove, move });
  else await assertNoInterruptedTransaction({ targetDirectory: resolvedTarget, targetLockFile: resolvedLockFile });
  await assertProducerRoot(resolvedProducerRoot);
  const initialTarget = await validateBuiltContent(resolvedTarget, { expectedInventory: null, producerRoot: resolvedProducerRoot, allowLegacySimulationEvidence: true });
  const initialReleaseLock = await readFile(resolvedLockFile);
  const expectedTargetDigests = {
    files: Object.fromEntries([...initialTarget.files].map(([name, bytes]) => [name, sha256(bytes)])),
    lock: sha256(initialReleaseLock),
  };
  const identityModule = getCurrentIdentity && getFreshSourceFingerprint
    ? null
    : await import(pathToFileURL(path.join(resolvedProducerRoot, "scripts/content/current-source-identity.mjs")).href);
  const safeCheckTemporaryRoot = mode === "check" ? await assertSafeCheckTemporaryRoot(resolvedAppRoot, temporaryRoot) : undefined;
  const head = await getProducerHead(resolvedProducerRoot);
  const temporaryParent = mode === "sync" ? path.dirname(resolvedTarget) : safeCheckTemporaryRoot;
  const temporaryDirectory = await mkdtemp(path.join(temporaryParent, `.canonical-content-build-${process.pid}-`));
  let lockStageDirectory;
  try {
    const buildResult = await runBuild({ producerRoot: resolvedProducerRoot, outputRoot: temporaryDirectory });
    const built = await validateBuiltContent(temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
    if (!buildResult?.artifacts || !buildResult?.lock) fail("Canonical source build did not return the identity-bearing build result");
    const currentIdentity = await (getCurrentIdentity ?? identityModule.deriveCurrentSourceIdentity)({ contentRoot: resolvedProducerRoot, built: buildResult, sourceRepositoryCommit: head });
    assertBuildMatchesIdentity(built.files, currentIdentity);
    const stagedArtifacts = new Map(EXPECTED_TRACK_IDS.map((trackId) => [`${trackId}.json`, parseJson(built.files.get(`${trackId}.json`), `${trackId}.json`)]));
    const targetKind = await pathKind(resolvedTarget);
    let previousLedger = null;
    if (targetKind === "directory") {
      const existing = await validateBuiltContent(resolvedTarget, { expectedInventory: null, producerRoot: resolvedProducerRoot, allowLegacySimulationEvidence: true });
      const ledgerBytes = existing.files.get(SUCCESSOR_LEDGER_FILE_NAME);
      if (ledgerBytes) previousLedger = parseSuccessorLedger(parseJson(ledgerBytes, path.join(resolvedTarget, SUCCESSOR_LEDGER_FILE_NAME)));
    }
    const ledger = deriveSuccessorLedger({ artifacts: stagedArtifacts, lock: built.lock, previousLedger });
    await writeFile(path.join(temporaryDirectory, SUCCESSOR_LEDGER_FILE_NAME), JSON.stringify(ledger));
    const staged = await validateBuiltContent(temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
    const releaseId = `patternly-current-${currentIdentity.sourceInputFingerprint.slice(0, 20)}`;
    const releaseLock = buildCurrentReleaseLock({ currentIdentity, head, contentLockBytes: staged.files.get(LOCK_FILE_NAME), successorLedgerBytes: staged.files.get(SUCCESSOR_LEDGER_FILE_NAME), releaseId });
    const stagedReleaseLock = Buffer.from(`${JSON.stringify(releaseLock)}\n`);
    let stagedLockFile;
    if (mode === "sync") {
      lockStageDirectory = await mkdtemp(path.join(path.dirname(resolvedLockFile), `.current-content-lock-${process.pid}-`));
      stagedLockFile = path.join(lockStageDirectory, "release.lock.json");
      await writeFile(stagedLockFile, stagedReleaseLock);
    }
    const stagedFiles = new Map(staged.files);
    const stagedTargetDigests = { ...expectedTargetDigests, stagedFiles, stagedLock: stagedReleaseLock };
    if (mode === "check") {
      await compareDirectories(resolvedTarget, temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
      if (!initialReleaseLock.equals(stagedReleaseLock)) fail("Current content release metadata differs from generated source; run sync:content-release");
      return { mode, head, currentIdentity, ...staged, ledger };
    }

    const freshnessDirectory = await mkdtemp(path.join(temporaryRoot, `.content-freshness-${process.pid}-`));
    try {
      const latestFingerprint = getFreshSourceFingerprint
        ? await getFreshSourceFingerprint({ contentRoot: resolvedProducerRoot, outputRoot: freshnessDirectory })
        : (await identityModule.buildCurrentSourceSnapshot({ contentRoot: resolvedProducerRoot, outputRoot: freshnessDirectory })).sourceInputFingerprint;
      if (latestFingerprint !== currentIdentity.sourceInputFingerprint) fail("Canonical source changed while the current application bank was being prepared; bundle unchanged");
    } finally {
      if (await pathKind(freshnessDirectory) === "directory") await remove(freshnessDirectory, { recursive: true, force: false });
    }
    await replaceCurrentBank({ stagedDirectory: temporaryDirectory, targetDirectory: resolvedTarget, stagedLockFile, targetLockFile: resolvedLockFile, expectedInventory, producerRoot: resolvedProducerRoot, remove, move, expectedTargetDigests: stagedTargetDigests });
    const installed = await validateBuiltContent(resolvedTarget, { expectedInventory, producerRoot: resolvedProducerRoot });
    for (const [fileName, bytes] of staged.files) if (!installed.files.get(fileName)?.equals(bytes)) fail(`Installed canonical content differs from staged canonical bytes: ${fileName}`);
    return { mode, head, currentIdentity, ...staged, ledger };
  } finally {
    if (await pathKind(temporaryDirectory) === "directory") await remove(temporaryDirectory, { recursive: true, force: false });
    if (typeof lockStageDirectory === "string" && await pathKind(lockStageDirectory) === "directory") await remove(lockStageDirectory, { recursive: true, force: false });
  }
}

async function acquireCurrentBankSyncLock(targetDirectory) {
  const lockPath = `${targetDirectory}.sync.lock`;
  const token = randomUUID();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx", 0o600);
      try { await handle.writeFile(`${JSON.stringify({ pid: process.pid, token })}\n`); }
      catch (error) { await handle.close(); await rm(lockPath, { force: true }); throw error; }
      return async () => {
        await handle.close();
        const lock = parseJson(await readFile(lockPath), lockPath);
        if (lock?.token === token) await rm(lockPath, { force: false });
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const info = await lstat(lockPath).catch((readError) => { if (readError?.code === "ENOENT") return null; throw readError; });
      if (!info) continue;
      if (info.isSymbolicLink() || !info.isFile()) fail("Current-bank sync lock is not a regular file; preserve it and inspect before retrying");
      let lock;
      try { lock = parseJson(await readFile(lockPath), lockPath); }
      catch { fail("Current-bank sync lock has no verifiable owner; preserve it and inspect before retrying"); }
      if (!Number.isSafeInteger(lock?.pid) || lock.pid < 1 || typeof lock.token !== "string") fail("Current-bank sync lock has no verifiable owner; preserve it and inspect before retrying");
      try {
        process.kill(lock.pid, 0);
        fail(`A current-bank sync is already active (pid=${lock.pid}); wait for it to finish before retrying`);
      } catch (signalError) {
        if (signalError?.code !== "ESRCH") throw signalError;
      }
      await rm(lockPath, { force: false });
    }
  }
  fail("Could not acquire the current-bank sync lock; retry after checking for another sync process");
}

export async function syncCanonicalContent(options = {}) {
  if ((options.mode ?? "sync") === "check") return syncCanonicalContentUnlocked(options);
  const appRoot = path.resolve(options.appRoot ?? scriptRoot);
  const targetDirectory = path.resolve(options.targetDirectory ?? path.join(appRoot, GENERATED_DIRECTORY));
  const releaseLock = await acquireCurrentBankSyncLock(targetDirectory);
  try { return await syncCanonicalContentUnlocked(options); }
  finally { await releaseLock(); }
}

export function buildCurrentReleaseLock({ currentIdentity, head, contentLockBytes, successorLedgerBytes, releaseId }) {
  if (currentIdentity?.schemaVersion !== "patternly-current-content-identity-v1" || !HASH.test(currentIdentity.sourceInputFingerprint ?? "") || !Array.isArray(currentIdentity.tracks) || currentIdentity.tracks.length !== EXPECTED_TRACK_IDS.length) fail("Cannot create release metadata without a complete current source identity");
  return {
    schemaVersion: 4,
    ownerPolicy: currentIdentity.ownerPolicy,
    bundleId: `patternly-app-${currentIdentity.sourceInputFingerprint.slice(0, 12)}`,
    releaseId,
    sourceInputFingerprint: currentIdentity.sourceInputFingerprint,
    sourceRepositoryCommit: head,
    currentIdentity,
    bundledContentLockSha256: sha256(contentLockBytes),
    bundledSuccessorLedgerSha256: sha256(successorLedgerBytes),
    artifacts: currentIdentity.tracks.map((track) => ({
      checksumSha256: track.artifactSha256,
      artifactBytes: track.artifactBytes,
      contentVersion: track.contentVersion,
      questionCount: track.questionCount,
      producerCommit: head,
      releaseId,
      sourceRepositoryCommit: head,
      trackId: track.trackId,
    })),
  };
}

function assertBuildMatchesIdentity(files, identity) {
  const rows = new Map(identity.tracks.map((track) => [track.trackId, track]));
  for (const trackId of EXPECTED_TRACK_IDS) {
    const row = rows.get(trackId);
    const bytes = files.get(`${trackId}.json`);
    if (!row || !bytes || row.artifactSha256 !== sha256(bytes) || row.artifactBytes !== bytes.length) fail(`Current source identity does not bind staged application bytes for ${trackId}`);
  }
  if (rows.size !== EXPECTED_TRACK_IDS.length) fail("Current source identity does not contain the exact nine-track set");
}

function usage() { return "Usage: node scripts/syncBundledContentRelease.mjs [sync|check] [--content-root <patternly-content checkout>]"; }
export function parseArgs(argv = process.argv.slice(2)) {
  const options = { mode: "sync" };
  let index = 0;
  if (argv[0] === "sync" || argv[0] === "check") options.mode = argv[index++];
  while (index < argv.length) {
    if (argv[index] === "--content-root" && index + 1 < argv.length) { options.producerRoot = path.resolve(argv[index + 1]); index += 2; }
    else fail(usage());
  }
  return options;
}
async function runCli() {
  const result = await syncCanonicalContent(parseArgs());
  console.log(`CANONICAL_CONTENT_${result.mode.toUpperCase()}=passed`);
  console.log(`CURRENT_SOURCE_FINGERPRINT=${result.currentIdentity.sourceInputFingerprint}`);
  console.log(`CONTENT_INVENTORY=${result.inventory.trackCount}/${result.inventory.nodeCount}/${result.inventory.mentalUnitCount}/${result.inventory.questionCount}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) runCli().catch((error) => { console.error(error?.stack ?? error?.message ?? error); process.exitCode = 1; });
