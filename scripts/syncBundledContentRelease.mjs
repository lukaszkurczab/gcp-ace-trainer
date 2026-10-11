import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
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
export const EXPECTED_INVENTORY = Object.freeze({ trackCount: 9, nodeCount: 117, mentalUnitCount: 943, questionCount: 16_622 });
export const GENERATED_DIRECTORY = "src/content/generated/canonical-content";
export const LOCK_FILE_NAME = "content-lock.json";
export const SUCCESSOR_LEDGER_FILE_NAME = "content-successor-ledger.json";
const LOCK_SCHEMA_VERSION = "patternly-content-lock-v1";
const ARTIFACT_SCHEMA_VERSION = "patternly-content-artifact-v2";
const SUCCESSOR_LEDGER_SCHEMA_VERSION = "patternly-content-successor-ledger-v1";
const BESD_TRACK_ID = "backend-system-design-interview";
const BESD_SUCCESSOR_PROOF = Object.freeze({
  path: "evidence/business-quality/bizq-01-besd-cohort-15.json",
  sha256: "548e65b0ec000419d719f7ba5da3ae7c3e1225fe5bb09917a11edef803af4cb3",
  schemaVersion: "patternly-bizq-semantic-replacement-v1",
  trackId: BESD_TRACK_ID,
  beforeProducerCommit: "0f4e6912d7d0cdb1a1c41b9d7885d7e867f80f34",
  beforeContentVersion: "backend-system-design-interview-authoring-v2026.10.03-bizq01-14-bizq02-v2-bizq03-planning-v2",
  beforeTraining: Object.freeze({
    contentVersion: "backend-system-design-interview-authoring-v2026.10.03-bizq01-14-bizq02-v2",
    artifactSha256: "d7f2762e8cc71e41addb775a5221cf1b79cd5ef2e885a7cef8fce914069d1481",
    questionCount: 1569,
  }),
  contentVersion: "backend-system-design-interview-authoring-v2026.10.11-bizq01-15-bizq02-v2-bizq03-planning-v2",
  trainingSha256: "8bcd0856d97fbbd7902461b9e205818e0f806bde7eadf9fb373b339df0469899",
  questionCount: 1569,
  replacementCount: 134,
});
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
  const resolvedRoot = path.resolve(producerRoot ?? process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(scriptRoot, "../../patternly-content"));
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
function validateCertificationSimulationConfig(config, { trackId, contentVersion, questions, nodeIds }) {
  const path = `simulationProfiles.certification.familyConfig`;
  const configKeys = ["schemaVersion", "source", "durationMinutes", "questionCount", "blueprint", "interactionPolicy", "nodeDomainMap", "nodeDomainMapEvidence"];
  requireExactKeys(config, configKeys, path);
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
  const evidence = config.nodeDomainMapEvidence;
  requireExactKeys(evidence, ["artifactPath", "contentVersion", "itemCount", "nodeCount", "ambiguousNodeCount"], `${path}.nodeDomainMapEvidence`);
  if (typeof evidence.contentVersion !== "string" || !SAFE_CONTENT_VERSION.test(evidence.contentVersion) ||
    evidence.artifactPath !== `artifacts/tracks/${trackId}/${evidence.contentVersion}/track-artifact.json` ||
    evidence.itemCount !== questions.length || evidence.nodeCount !== nodeIds.length || evidence.ambiguousNodeCount !== 0) {
    fail(`${path}.nodeDomainMapEvidence does not match its pinned artifact identity or node coverage`);
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
function validateSimulationProfiles(profiles, { trackId, contentVersion, questions }) {
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
  validateCertificationSimulationConfig(profile.familyConfig, { trackId, contentVersion, questions, nodeIds });
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

export async function validateBuiltContent(directory, { expectedInventory = EXPECTED_INVENTORY, producerRoot } = {}) {
  const { validatePackageCompletionRule, PlanningPolicyError, validatePlanningPolicy } = await producerValidationModules(producerRoot);
  await inspectDirectory(directory, directory, "built content directory");
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) if (entry.isSymbolicLink() || !entry.isFile()) fail(`Built content contains a non-regular entry: ${entry.name}`);
  const names = entries.map((entry) => entry.name);
  const hasSuccessorLedger = names.includes(SUCCESSOR_LEDGER_FILE_NAME);
  const expectedNames = [...EXPECTED_TRACK_IDS.map((id) => `${id}.json`), LOCK_FILE_NAME, ...(hasSuccessorLedger ? [SUCCESSOR_LEDGER_FILE_NAME] : [])];
  if (!equalStringSets(names, expectedNames) || names.length !== expectedNames.length) fail(`Built content must contain exactly the nine registered artifacts, ${LOCK_FILE_NAME}, and optional ${SUCCESSOR_LEDGER_FILE_NAME}`);

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
    if (Object.hasOwn(artifact, "simulationProfiles")) validateSimulationProfiles(artifact.simulationProfiles, { trackId: entry.trackId, contentVersion: entry.contentVersion, questions: artifact.questions });
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
      const isApprovedBESDSuccessor = entry.trackId === BESD_TRACK_ID && sameJsonValue(entry.training, {
        contentVersion: BESD_SUCCESSOR_PROOF.contentVersion,
        artifactSha256: BESD_SUCCESSOR_PROOF.trainingSha256,
        questionCount: BESD_SUCCESSOR_PROOF.questionCount,
      });
      const reconstructed = historicalTrainingProjection(artifact, entry.training.contentVersion);
      if (isApprovedBESDSuccessor) {
        if (artifact.contentVersion !== BESD_SUCCESSOR_PROOF.contentVersion || sha256(reconstructed) !== BESD_SUCCESSOR_PROOF.trainingSha256 || JSON.parse(reconstructed.toString("utf8")).questions.length !== BESD_SUCCESSOR_PROOF.questionCount) fail(`Content successor ledger training pin does not match ${entry.trackId}`);
      } else if (sha256(reconstructed) !== entry.training.artifactSha256 || JSON.parse(reconstructed.toString("utf8")).questions.length !== entry.training.questionCount) fail(`Content successor ledger training pin does not match ${entry.trackId}`);
    }
    files.set(SUCCESSOR_LEDGER_FILE_NAME, ledgerBytes);
  }
  const inventory = { trackCount: lock.tracks.length, nodeCount: nodeIds.size, mentalUnitCount: mentalUnitIds.size, questionCount: questionIds.size };
  if (JSON.stringify(inventory) !== JSON.stringify(expectedInventory)) fail(`Inventory mismatch: expected ${JSON.stringify(expectedInventory)}, received ${JSON.stringify(inventory)}`);
  return { lock, inventory, files };
}

async function defaultRunBuild({ producerRoot, outputRoot }) {
  await execFileAsync(process.execPath, [path.join(producerRoot, "scripts", "build.mjs"), "build-all", "--root", producerRoot, "--output-root", outputRoot], { cwd: producerRoot, maxBuffer: 32 * 1024 * 1024 });
}
async function producerHead(producerRoot) {
  const { stdout } = await execFileAsync("git", ["-C", producerRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  const head = stdout.trim();
  if (!/^[a-f0-9]{40}$/u.test(head)) fail("Cannot resolve the current patternly-content HEAD");
  return head;
}
async function verifyProducerState(producerRoot) {
  const { stdout } = await execFileAsync("git", [
    "-C", producerRoot, "status", "--porcelain", "--untracked-files=all", "--",
    "content", "schemas", "scripts/build.mjs", "scripts/content", "evidence/business-quality/bizq-01-besd-cohort-15.json",
  ], { encoding: "utf8" });
  if (stdout.trim()) fail("Canonical producer inputs differ from patternly-content HEAD");
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

function sameJsonValue(left, right) { return canonicalJson(left) === canonicalJson(right); }

// The descriptor is passed explicitly only so unit tests can verify the proof contract
// with synthetic bytes. Production always supplies the module-private fixed descriptor.
export function verifyApprovedTrainingSuccessor({ previousTraining, previousArtifact, currentArtifact, proof, descriptor }) {
  if (!descriptor || !isRecord(proof) || !Array.isArray(proof.replacements)) fail("Approved BESD successor proof is missing or malformed");
  if (!sameJsonValue(previousTraining, descriptor.beforeTraining)) fail("Training material changed for backend-system-design-interview; the v1 training predecessor cannot be silently replaced");
  for (const [field, expected] of Object.entries({
    schemaVersion: descriptor.schemaVersion,
    trackId: descriptor.trackId,
    beforeProducerCommit: descriptor.beforeProducerCommit,
    beforeContentVersion: descriptor.beforeContentVersion,
    contentVersion: descriptor.contentVersion,
  })) if (proof[field] !== expected) fail(`Approved BESD successor proof ${field} differs from its fixed identity`);
  if (proof.replacements.length !== descriptor.replacementCount || previousArtifact?.trackId !== descriptor.trackId || currentArtifact?.trackId !== descriptor.trackId) fail("Approved BESD successor proof does not bind the fixed cohort and track");

  const previousById = new Map(previousArtifact.questions.map((question) => [question.questionId, question]));
  const currentById = new Map(currentArtifact.questions.map((question) => [question.questionId, question]));
  if (previousById.size !== previousArtifact.questions.length || currentById.size !== currentArtifact.questions.length || previousById.size !== currentById.size) fail("Approved BESD successor changed the question inventory");
  const beforeIds = new Set();
  const currentIds = new Set();
  for (const replacement of proof.replacements) {
    if (!isRecord(replacement) || typeof replacement.beforeQuestionId !== "string" || typeof replacement.questionId !== "string" || typeof replacement.mentalUnitId !== "string" || !isRecord(replacement.beforeQuestion) || !isRecord(replacement.currentQuestion)) fail("Approved BESD successor proof contains a malformed replacement");
    if (beforeIds.has(replacement.beforeQuestionId) || currentIds.has(replacement.questionId)) fail("Approved BESD successor proof contains duplicate question identities");
    beforeIds.add(replacement.beforeQuestionId);
    currentIds.add(replacement.questionId);
    const previousQuestion = previousById.get(replacement.beforeQuestionId);
    const currentQuestion = currentById.get(replacement.questionId);
    if (!previousQuestion || !currentQuestion || replacement.beforeQuestion.questionId !== replacement.beforeQuestionId || replacement.currentQuestion.questionId !== replacement.questionId || replacement.beforeQuestion.mentalUnitId !== replacement.mentalUnitId || replacement.currentQuestion.mentalUnitId !== replacement.mentalUnitId || !sameJsonValue(previousQuestion, replacement.beforeQuestion) || !sameJsonValue(currentQuestion, replacement.currentQuestion)) fail("Approved BESD successor proof differs from an exact predecessor or current question");
  }
  for (const [questionId, previousQuestion] of previousById) {
    if (beforeIds.has(questionId)) continue;
    const currentQuestion = currentById.get(questionId);
    if (!currentQuestion || !sameJsonValue(previousQuestion, currentQuestion)) fail("Approved BESD successor changed a question outside its fixed cohort");
  }
  for (const questionId of currentById.keys()) if (!currentIds.has(questionId) && !previousById.has(questionId)) fail("Approved BESD successor introduced a question outside its fixed cohort");

  const projection = historicalTrainingProjection(currentArtifact, descriptor.contentVersion);
  if (JSON.parse(projection.toString("utf8")).questions.length !== descriptor.questionCount || sha256(projection) !== descriptor.trainingSha256) fail("Approved BESD successor does not match its exact successor training identity");
  return Object.freeze({ contentVersion: descriptor.contentVersion, artifactSha256: descriptor.trainingSha256, questionCount: descriptor.questionCount });
}

export async function readApprovedBESDSuccessorProof(producerRoot, descriptor = BESD_SUCCESSOR_PROOF) {
  if (!HASH.test(descriptor.sha256) || !HASH.test(descriptor.trainingSha256)) fail("Approved BESD successor pins are not finalized");
  const proofPath = path.join(producerRoot, descriptor.path);
  const proofBytes = await inspectRegularFile(proofPath, producerRoot, "approved BESD successor proof");
  if (sha256(proofBytes) !== descriptor.sha256) fail("Approved BESD successor proof hash differs from its fixed pin");
  return parseJson(proofBytes, descriptor.path);
}

function trackIdentityFromArtifact(artifact, sha256Value) {
  if (artifact.schemaVersion !== ARTIFACT_SCHEMA_VERSION || !artifact.planningPolicy || artifact.planningPolicy.schemaVersion !== "patternly-learning-planning-policy-v1") fail(`Track ${artifact.trackId} is not a versioned v2 planning-policy successor`);
  return Object.freeze({ contentVersion: artifact.contentVersion, artifactSha256: sha256Value, policyVersion: artifact.planningPolicy.policyVersion });
}

function deriveSuccessorLedger({ artifacts, lock, previousLedger, predecessor, previousArtifacts, approvedBESDProof }) {
  const lockByTrack = new Map(lock.tracks.map((entry) => [entry.trackId, entry]));
  const previousByTrack = previousLedger ? new Map(previousLedger.tracks.map((entry) => [entry.trackId, entry])) : null;
  const predecessorByTrack = predecessor ? new Map(predecessor.lock.tracks.map((entry) => [entry.trackId, entry])) : null;
  const tracks = [];
  for (const trackId of EXPECTED_TRACK_IDS) {
    const artifact = artifacts.get(`${trackId}.json`);
    const currentLock = lockByTrack.get(trackId);
    if (!artifact || !currentLock) fail(`Cannot derive content successor identity for ${trackId}`);
    const currentIdentity = trackIdentityFromArtifact(artifact, currentLock.sha256);
    let training;
    if (previousByTrack) {
      const previous = previousByTrack.get(trackId);
      const projection = historicalTrainingProjection(artifact, previous.training.contentVersion);
      if (sha256(projection) !== previous.training.artifactSha256 || JSON.parse(projection.toString("utf8")).questions.length !== previous.training.questionCount) {
        if (trackId !== BESD_TRACK_ID || !approvedBESDProof || !previousArtifacts?.has(`${trackId}.json`)) fail(`Training material changed for ${trackId}; the v1 training predecessor cannot be silently replaced`);
        training = verifyApprovedTrainingSuccessor({
          previousTraining: previous.training,
          previousArtifact: previousArtifacts.get(`${trackId}.json`),
          currentArtifact: artifact,
          proof: approvedBESDProof,
          descriptor: BESD_SUCCESSOR_PROOF,
        });
      } else {
        training = previous.training;
      }
    } else {
      const oldLock = predecessorByTrack?.get(trackId);
      const oldBytes = predecessor?.artifacts.get(`${trackId}.json`);
      if (!oldLock || !oldBytes || oldLock.contentVersion === currentIdentity.contentVersion || !HASH.test(oldLock.sha256)) fail(`Exact v1 training predecessor is unavailable for ${trackId}`);
      const oldArtifact = parseJson(oldBytes, `HEAD:${GENERATED_DIRECTORY}/${trackId}.json`);
      if (oldArtifact.schemaVersion !== "patternly-content-artifact-v1" || oldArtifact.trackId !== trackId || oldArtifact.contentVersion !== oldLock.contentVersion || oldLock.sha256 !== sha256(oldBytes)) fail(`HEAD training predecessor identity is invalid for ${trackId}`);
      const reconstructed = historicalTrainingProjection(artifact, oldLock.contentVersion);
      if (!reconstructed.equals(oldBytes) || sha256(reconstructed) !== oldLock.sha256 || oldArtifact.questions.length !== artifact.questions.length) fail(`v2 successor is not a byte-exact policy-only successor of APP HEAD for ${trackId}`);
      training = Object.freeze({ contentVersion: oldLock.contentVersion, artifactSha256: oldLock.sha256, questionCount: oldLock.questionCount });
    }
    tracks.push(Object.freeze({ trackId, training, planningPolicy: Object.freeze({ contentVersion: currentIdentity.contentVersion, artifactSha256: currentIdentity.artifactSha256, policyVersion: currentIdentity.policyVersion }) }));
  }
  return parseSuccessorLedger(Object.freeze({ schemaVersion: SUCCESSOR_LEDGER_SCHEMA_VERSION, tracks: Object.freeze(tracks) }));
}

async function defaultBootstrapPredecessor(appRoot) {
  const prefix = `HEAD:${GENERATED_DIRECTORY}/`;
  const [lockResult, ...artifactResults] = await Promise.all([
    execFileAsync("git", ["-C", appRoot, "show", `${prefix}${LOCK_FILE_NAME}`], { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 }),
    ...EXPECTED_TRACK_IDS.map((trackId) => execFileAsync("git", ["-C", appRoot, "show", `${prefix}${trackId}.json`], { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 })),
  ]).catch((error) => { fail(`Cannot load the one-time APP HEAD predecessor for the training ledger: ${error.message}`); });
  const lockBytes = Buffer.from(lockResult.stdout);
  const lock = parseJson(lockBytes, `HEAD:${prefix}${LOCK_FILE_NAME}`);
  const artifacts = new Map(EXPECTED_TRACK_IDS.map((trackId, index) => [`${trackId}.json`, Buffer.from(artifactResults[index].stdout)]));
  return { lock, artifacts };
}

async function pathKind(candidate) {
  try {
    const info = await lstat(candidate);
    if (info.isSymbolicLink()) fail(`Symbolic link is not allowed at transaction path: ${candidate}`);
    return info.isDirectory() ? "directory" : "other";
  } catch (error) { if (error?.code === "ENOENT") return "missing"; throw error; }
}
async function recoverTransaction({ targetDirectory, backupDirectory, expectedInventory, producerRoot, remove = rm, move = rename }) {
  const [targetKind, backupKind] = await Promise.all([pathKind(targetDirectory), pathKind(backupDirectory)]);
  if (targetKind === "other" || backupKind === "other") fail("Canonical content transaction paths must be directories");
  if (targetKind === "missing" && backupKind === "directory") await move(backupDirectory, targetDirectory);
  else if (targetKind === "directory" && backupKind === "directory") {
    await validateBuiltContent(targetDirectory, { expectedInventory, producerRoot });
    await remove(backupDirectory, { recursive: true, force: false });
  }
}
async function replaceDirectory({ stagedDirectory, targetDirectory, expectedInventory, producerRoot, remove = rm, move = rename }) {
  const backupDirectory = `${targetDirectory}.backup`;
  await recoverTransaction({ targetDirectory, backupDirectory, expectedInventory, producerRoot, remove, move });
  const targetKind = await pathKind(targetDirectory);
  let movedOld = false;
  let installedNew = false;
  try {
    if (targetKind === "directory") { await move(targetDirectory, backupDirectory); movedOld = true; }
    await move(stagedDirectory, targetDirectory);
    installedNew = true;
    await validateBuiltContent(targetDirectory, { expectedInventory, producerRoot });
  } catch (error) {
    const failedDirectory = `${targetDirectory}.failed-${randomUUID()}`;
    try {
      if (installedNew && await pathKind(targetDirectory) === "directory") await move(targetDirectory, failedDirectory);
      if (movedOld && await pathKind(backupDirectory) === "directory") await move(backupDirectory, targetDirectory);
      if (await pathKind(failedDirectory) === "directory") await remove(failedDirectory, { recursive: true, force: false });
    } catch (rollbackError) { fail(`Canonical content replacement failed (${error.message}) and rollback failed: ${rollbackError.message}`); }
    fail(`Canonical content replacement failed; previous directory restored: ${error.message}`);
  }
  if (movedOld) await remove(backupDirectory, { recursive: true, force: false });
}

export async function syncCanonicalContent({ mode = "sync", appRoot = scriptRoot, producerRoot = path.resolve(scriptRoot, "../patternly-content"), targetDirectory = path.join(appRoot, GENERATED_DIRECTORY), temporaryRoot = tmpdir(), runBuild = defaultRunBuild, getProducerHead = producerHead, getBootstrapPredecessor = defaultBootstrapPredecessor, verifyProducer = verifyProducerState, expectedInventory = EXPECTED_INVENTORY, remove = rm, move = rename } = {}) {
  if (mode !== "sync" && mode !== "check") fail(`Unknown mode: ${mode}`);
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedProducerRoot = path.resolve(producerRoot);
  const resolvedTarget = path.resolve(targetDirectory);
  if (!isWithin(resolvedAppRoot, resolvedTarget) || resolvedTarget !== path.join(resolvedAppRoot, GENERATED_DIRECTORY)) fail(`Target must be exactly ${GENERATED_DIRECTORY} within the application root`);
  await assertSafeTargetBoundary(resolvedAppRoot, resolvedTarget);
  const safeCheckTemporaryRoot = mode === "check" ? await assertSafeCheckTemporaryRoot(resolvedAppRoot, temporaryRoot) : undefined;
  await assertProducerRoot(resolvedProducerRoot);
  const head = await getProducerHead(resolvedProducerRoot);
  await verifyProducer(resolvedProducerRoot);
  const temporaryParent = mode === "sync" ? path.dirname(resolvedTarget) : safeCheckTemporaryRoot;
  const temporaryDirectory = await mkdtemp(path.join(temporaryParent, `.canonical-content-build-${process.pid}-`));
  try {
    await runBuild({ producerRoot: resolvedProducerRoot, outputRoot: temporaryDirectory });
    const built = await validateBuiltContent(temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
    const stagedArtifacts = new Map(EXPECTED_TRACK_IDS.map((trackId) => [`${trackId}.json`, parseJson(built.files.get(`${trackId}.json`), `${trackId}.json`)]));
    const targetKind = await pathKind(resolvedTarget);
    let previousLedger = null;
    let predecessor = null;
    let previousArtifacts = null;
    if (targetKind === "directory") {
      const existing = await validateBuiltContent(resolvedTarget, { expectedInventory, producerRoot: resolvedProducerRoot });
      const existingLedgerBytes = existing.files.get(SUCCESSOR_LEDGER_FILE_NAME);
      previousArtifacts = new Map(EXPECTED_TRACK_IDS.map((trackId) => [`${trackId}.json`, parseJson(existing.files.get(`${trackId}.json`), `${trackId}.json`)]));
      if (existingLedgerBytes) previousLedger = parseSuccessorLedger(parseJson(existingLedgerBytes, path.join(resolvedTarget, SUCCESSOR_LEDGER_FILE_NAME)));
    }
    if (!previousLedger) predecessor = await getBootstrapPredecessor(resolvedAppRoot);
    if (!previousLedger && targetKind === "directory") {
      const existing = await validateBuiltContent(resolvedTarget, { expectedInventory, producerRoot: resolvedProducerRoot });
      const oldLockByTrack = new Map(predecessor.lock.tracks.map((entry) => [entry.trackId, entry]));
      for (const trackId of EXPECTED_TRACK_IDS) {
        const oldLock = oldLockByTrack.get(trackId);
        const oldBytes = predecessor.artifacts.get(`${trackId}.json`);
        const currentBytes = existing.files.get(`${trackId}.json`);
        const currentArtifact = parseJson(currentBytes, `${trackId}.json`);
        const compatible = currentArtifact.schemaVersion === "patternly-content-artifact-v1"
          ? currentBytes.equals(oldBytes)
          : currentArtifact.schemaVersion === ARTIFACT_SCHEMA_VERSION && historicalTrainingProjection(currentArtifact, oldLock.contentVersion).equals(oldBytes);
        if (!compatible) fail(`Existing bundled content does not match the exact APP HEAD training predecessor for ${trackId}`);
      }
    }
    let approvedBESDProof;
    if (previousLedger) {
      const previousBESD = previousLedger.tracks.find((entry) => entry.trackId === BESD_TRACK_ID);
      const currentBESD = stagedArtifacts.get(`${BESD_TRACK_ID}.json`);
      const projection = historicalTrainingProjection(currentBESD, previousBESD.training.contentVersion);
      if (sha256(projection) !== previousBESD.training.artifactSha256) approvedBESDProof = await readApprovedBESDSuccessorProof(resolvedProducerRoot);
    }
    const ledger = deriveSuccessorLedger({ artifacts: stagedArtifacts, lock: built.lock, previousLedger, predecessor, previousArtifacts, approvedBESDProof });
    await writeFile(path.join(temporaryDirectory, SUCCESSOR_LEDGER_FILE_NAME), JSON.stringify(ledger));
    const staged = await validateBuiltContent(temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
    if (mode === "check") {
      await compareDirectories(resolvedTarget, temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
      return { mode, head, ...staged, ledger };
    }
    await replaceDirectory({ stagedDirectory: temporaryDirectory, targetDirectory: resolvedTarget, expectedInventory, producerRoot: resolvedProducerRoot, remove, move });
    const installed = await validateBuiltContent(resolvedTarget, { expectedInventory, producerRoot: resolvedProducerRoot });
    for (const [fileName, bytes] of staged.files) if (!installed.files.get(fileName)?.equals(bytes)) fail(`Installed canonical content differs from staged canonical bytes: ${fileName}`);
    return { mode, head, ...staged, ledger };
  } finally {
    if (await pathKind(temporaryDirectory) === "directory") await remove(temporaryDirectory, { recursive: true, force: false });
  }
}

function usage() { return "Usage: node scripts/syncBundledContentRelease.mjs [sync|check] [--content-root <patternly-content checkout>]"; }
export function parseArgs(argv = process.argv.slice(2)) {
  const options = { mode: "sync" };
  let index = 0;
  if (argv[0] === "sync" || argv[0] === "check") options.mode = argv[index++];
  while (index < argv.length) {
    if (argv[index] !== "--content-root" || index + 1 >= argv.length) fail(usage());
    options.producerRoot = path.resolve(argv[index + 1]);
    index += 2;
  }
  return options;
}
async function runCli() {
  const result = await syncCanonicalContent(parseArgs());
  console.log(`CANONICAL_CONTENT_${result.mode.toUpperCase()}=passed`);
  console.log(`PATTERNLY_CONTENT_HEAD=${result.head}`);
  console.log(`CONTENT_INVENTORY=${result.inventory.trackCount}/${result.inventory.nodeCount}/${result.inventory.mentalUnitCount}/${result.inventory.questionCount}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) runCli().catch((error) => { console.error(error?.stack ?? error?.message ?? error); process.exitCode = 1; });
