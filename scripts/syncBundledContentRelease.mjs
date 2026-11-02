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
export const APPROACH_CHALLENGE_TRACK_ID = "coding-interview-dsa-problem-solving";
export const APPROACH_CHALLENGE_BANK_CONTRACT = Object.freeze({
  problemCount: 472,
  questionCount: 944,
  freeProblemCount: 16,
  premiumProblemCount: 456,
  freeFamilyId: "complexity_and_constraints",
  familyCounts: Object.freeze({
    complexity_and_constraints: 26, arrays_and_strings: 24, hash_map_and_set: 24, two_pointers: 22,
    sliding_window: 24, prefix_sums: 22, sorting_based: 22, stack: 22, binary_search: 22,
    tree_traversal: 22, intervals: 22, graph_traversal: 22, dynamic_programming_intro: 22,
    monotonic_stack: 22, linked_list: 22, recursion_basics: 22, heap_priority_queue: 22,
    backtracking: 22, greedy_intro: 22, bit_manipulation: 22, math_and_geometry: 22,
  }),
});
const PREVIOUS_APPROACH_CHALLENGE_BASELINE = Object.freeze({
  problemCount: 36,
  questionCount: 72,
  familyCounts: Object.freeze({
    complexity_and_constraints: 6, arrays_and_strings: 4, hash_map_and_set: 4, two_pointers: 2,
    sliding_window: 4, prefix_sums: 2, sorting_based: 2, stack: 2, binary_search: 2,
    tree_traversal: 2, intervals: 2, graph_traversal: 2, dynamic_programming_intro: 2,
  }),
});
const PRE_SYNC_APPROACH_CHALLENGE_BASELINE = Object.freeze({
  problemCount: 52,
  questionCount: 104,
  freeProblemCount: 6,
  premiumProblemCount: 46,
  freeFamilyId: "complexity_and_constraints",
  familyCounts: Object.freeze({
    complexity_and_constraints: 6, arrays_and_strings: 4, hash_map_and_set: 4, two_pointers: 2,
    sliding_window: 4, prefix_sums: 2, sorting_based: 2, stack: 2, binary_search: 2,
    tree_traversal: 2, intervals: 2, graph_traversal: 2, dynamic_programming_intro: 2,
    monotonic_stack: 2, linked_list: 2, recursion_basics: 2, heap_priority_queue: 2,
    backtracking: 2, greedy_intro: 2, bit_manipulation: 2, math_and_geometry: 2,
  }),
});
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
function matchesApproachChallengeCounts(problemCount, questionCount, actualFamilyCounts, contract) {
  return problemCount === contract.problemCount && questionCount === contract.questionCount &&
    Object.entries(actualFamilyCounts).every(([familyId, count]) => count === (contract.familyCounts[familyId] ?? 0));
}
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
function validateClaudeSimulationConfig(config, { questions, nodeIds }) {
  const label = "simulationProfiles.claude_ccarp.familyConfig";
  const keys = ["schemaVersion", "source", "durationMinutes", "questionCount", "blueprint", "interactionPolicy", "nodeDomainMap", "examCoverage", "scoringPolicy"];
  requireExactKeys(config, keys, label);
  if (config.schemaVersion !== "patternly-certification-simulation-config-v2") fail(`${label}.schemaVersion is unsupported`);
  requireExactKeys(config.source, ["url", "checkedDate", "guideVersion"], `${label}.source`);
  if ([config.source.url, config.source.checkedDate, config.source.guideVersion].some((value) => typeof value !== "string" || !value.trim())) fail(`${label}.source is invalid`);
  if (config.durationMinutes !== 120) fail(`${label}.durationMinutes is invalid`);
  requireExactKeys(config.questionCount, ["kind", "minimum", "maximum"], `${label}.questionCount`);
  if (config.questionCount.kind !== "range" || config.questionCount.minimum !== 63 || config.questionCount.maximum !== 63) fail(`${label}.questionCount is unsupported`);
  requireExactKeys(config.blueprint, ["kind", "sections"], `${label}.blueprint`);
  const expectedWeights = new Map([["ccarp-domain-1", 17], ["ccarp-domain-2", 13], ["ccarp-domain-3", 19], ["ccarp-domain-4", 16], ["ccarp-domain-5", 14], ["ccarp-domain-6", 14], ["ccarp-domain-7", 7]]);
  if (config.blueprint.kind !== "weighted_sections" || !Array.isArray(config.blueprint.sections) || config.blueprint.sections.length !== expectedWeights.size) fail(`${label}.blueprint is invalid`);
  const sections = new Set(); const ids = new Set();
  config.blueprint.sections.forEach((section, index) => {
    requireExactKeys(section, ["id", "contentDomainId", "weightPercent"], `${label}.blueprint.sections[${index}]`);
    if (typeof section.id !== "string" || !section.id.trim() || ids.has(section.id) || !expectedWeights.has(section.contentDomainId) || sections.has(section.contentDomainId) || section.weightPercent !== expectedWeights.get(section.contentDomainId)) fail(`${label}.blueprint.sections[${index}] has an unknown or invalid domain weight`);
    ids.add(section.id); sections.add(section.contentDomainId);
  });
  if (sections.size !== expectedWeights.size) fail(`${label}.blueprint does not cover all CCAR-P domains`);
  requireExactKeys(config.nodeDomainMap, nodeIds, `${label}.nodeDomainMap`);
  const sourceDomains = new Map();
  for (const question of questions) {
    if (!expectedWeights.has(question.contentDomainId) || config.nodeDomainMap[question.nodeId] !== question.contentDomainId) fail(`${label}: question ${question.questionId} has missing or conflicting domain attribution`);
    const domains = sourceDomains.get(question.nodeId) ?? new Set(); domains.add(question.contentDomainId); sourceDomains.set(question.nodeId, domains);
  }
  if (sourceDomains.size !== nodeIds.length || [...sourceDomains.values()].some((domains) => domains.size !== 1)) fail(`${label}.nodeDomainMap is ambiguous or incomplete`);
  const sourceMap = Object.fromEntries([...sourceDomains].map(([nodeId, domains]) => [nodeId, [...domains][0]]));
  if (JSON.stringify(Object.entries(config.nodeDomainMap).sort()) !== JSON.stringify(Object.entries(sourceMap).sort())) fail(`${label}.nodeDomainMap differs from source-derived per-question domains`);

  const policy = config.interactionPolicy;
  const policyKeys = ["schemaVersion", "policyId", "policyVersion", "owner", "navigation", "answerChanges", "flagging", "navigator", "sections", "timeout", "feedbackTiming"];
  requireExactKeys(policy, policyKeys, `${label}.interactionPolicy`);
  if (policy.schemaVersion !== "patternly-certification-simulation-policy-v1" || !policy.policyId || policy.policyVersion !== "1" || policy.owner !== "patternly_product" || policy.navigation !== "free" || policy.answerChanges !== "until_final_submission" || policy.flagging !== "available" || policy.navigator !== "available" || policy.sections !== "blueprint_visible" || policy.timeout !== "absolute_deadline" || policy.feedbackTiming !== "after_verified_finalization") fail(`${label}.interactionPolicy is unsupported`);
  const coverage = config.examCoverage;
  requireExactKeys(coverage, ["policy", "provenance", "formatMinimums", "skillMinimums"], `${label}.examCoverage`);
  if (coverage.policy !== "patternly-ccarp-v1") fail(`${label}.examCoverage.policy is unsupported`);
  requireExactKeys(coverage.provenance, ["decidedDate", "guideAvailability", "retainedProfileParameters"], `${label}.examCoverage.provenance`);
  if (coverage.provenance.decidedDate !== "2026-10-26" || coverage.provenance.guideAvailability !== "http_403" || typeof coverage.provenance.retainedProfileParameters !== "string" || !coverage.provenance.retainedProfileParameters.trim()) fail(`${label}.examCoverage.provenance is invalid`);
  const formatKeys = ["choice_single", "choice_multiple", "decision_matrix"];
  const skillKeys = ["knowledge", "diagnosis", "prerequisite", "next_action", "contextual_choice"];
  requireExactKeys(coverage.formatMinimums, formatKeys, `${label}.examCoverage.formatMinimums`);
  requireExactKeys(coverage.skillMinimums, skillKeys, `${label}.examCoverage.skillMinimums`);
  for (const [name, values] of [["formatMinimums", coverage.formatMinimums], ["skillMinimums", coverage.skillMinimums]]) {
    if (Object.values(values).some((value) => !Number.isSafeInteger(value) || value < 0) || Object.values(values).reduce((sum, value) => sum + value, 0) > 63) fail(`${label}.examCoverage.${name} exceeds the configured question count`);
  }
  const counts = { choice_single: 0, choice_multiple: 0, decision_matrix: 0 };
  const skills = Object.fromEntries(skillKeys.map((key) => [key, 0]));
  for (const question of questions) {
    if (!Object.hasOwn(counts, question.interaction?.type)) fail(`${label}: unsupported CCAR-P interaction on ${question.questionId}`);
    counts[question.interaction.type] += 1;
    const skill = question.examMetadata?.decisionSkill;
    if (skill !== undefined) {
      if (!Object.hasOwn(skills, skill)) fail(`${label}: question ${question.questionId} has an invalid dominant decision skill`);
      skills[skill] += 1;
    }
    if (question.interaction.type === "choice_multiple") {
      const required = question.interaction.requiredSelectionCount;
      if (!Number.isSafeInteger(required) || required < 2 || required > question.interaction.options.length || question.answer.optionIds.length !== required) fail(`${label}: question ${question.questionId} has an invalid required selection count`);
    }
  }
  for (const key of formatKeys) if (counts[key] < coverage.formatMinimums[key]) fail(`${label}: format pool ${key} is below its configured minimum`);
  for (const key of skillKeys) if (skills[key] < coverage.skillMinimums[key]) fail(`${label}: decision-skill pool ${key} is below its configured minimum`);
  requireExactKeys(config.scoringPolicy, ["policyId", "policyVersion", "method"], `${label}.scoringPolicy`);
  if (config.scoringPolicy.policyId !== "patternly-ccarp-complete-item-v1" || config.scoringPolicy.policyVersion !== "1" || config.scoringPolicy.method !== "complete_correct_item_only") fail(`${label}.scoringPolicy is unsupported`);
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
  if (!["google-cloud-associate-cloud-engineer", CLAUDE_TRACK_ID, CODING_TRACK_ID, ...DESIGN_TRACK_IDS].includes(trackId) || profiles.length !== 1) fail(`Simulation profile family is unsupported for ${trackId}`);
  const profile = profiles[0];
  requireExactKeys(profile, ["schemaVersion", "profileId", "profileVersion", "familyId", "modeId", "familyConfig"], "simulationProfiles[0]");
  if (DESIGN_TRACK_IDS.includes(trackId)) {
    if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== `${trackId}-simulation-v1` || profile.profileVersion !== "1") fail("Design Interview simulation profile envelope or profile version is unsupported");
    if (profile.familyId !== "design_interview" || profile.modeId !== "design-interview-simulation") fail("Design Interview simulation profile is not bound to Design Simulation");
    validateDesignSimulationConfig(profile.familyConfig, { trackId });
    return;
  }
  if (trackId === CLAUDE_TRACK_ID) {
    if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== `${trackId}-patternly-practice-v2` || profile.profileVersion !== "2") fail("CCAR-P simulation profile envelope or profile version is unsupported");
    if (profile.familyId !== "certification" || profile.modeId !== "certification-exam-simulation") fail("CCAR-P simulation profile is not bound to Certification Exam");
    const nodeIds = [...new Set(questions.map((question) => question.nodeId))].sort();
    validateClaudeSimulationConfig(profile.familyConfig, { questions, nodeIds });
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
  const allQuestionIds = new Set();
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
    const artifactRequired = ["schemaVersion", "trackId", "contentVersion", "questions", "planningPolicy"];
    const artifactOptional = ["simulationProfiles", "completionRule", "approachChallengeProblems"];
    const artifactShapes = Array.from({ length: 1 << artifactOptional.length }, (_, mask) => [
      ...artifactRequired,
      ...artifactOptional.filter((_, index) => mask & (1 << index)),
    ]);
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
    const knownClaudeDomains = new Set(Array.from({ length: 7 }, (_, index) => `ccarp-domain-${index + 1}`));
    for (const question of artifact.questions) {
      if (!isRecord(question) || question.trackId !== entry.trackId) fail(`Foreign or malformed question in ${entry.trackId}`);
      for (const key of ["questionId", "nodeId", "mentalUnitId"]) if (typeof question[key] !== "string" || !question[key]) fail(`Question in ${entry.trackId} has invalid ${key}`);
      if (allQuestionIds.has(question.questionId)) fail(`Duplicate questionId: ${question.questionId}`);
      if (question.contentDomainId !== undefined && !((entry.trackId === "google-cloud-associate-cloud-engineer" && knownGcpDomains.has(question.contentDomainId)) || (entry.trackId === CLAUDE_TRACK_ID && knownClaudeDomains.has(question.contentDomainId)))) fail(`Unexpected contentDomainId on question ${question.questionId}`);
      if (hasSimulationProfiles && entry.trackId === "google-cloud-associate-cloud-engineer" && !knownGcpDomains.has(question.contentDomainId)) fail(`Missing source-derived contentDomainId on question ${question.questionId}`);
      if (hasSimulationProfiles && entry.trackId === CLAUDE_TRACK_ID && !knownClaudeDomains.has(question.contentDomainId)) fail(`Missing source-derived CCAR-P domain attribution on question ${question.questionId}`);
      questionIds.add(question.questionId);
      allQuestionIds.add(question.questionId);
      nodeIds.add(`${entry.trackId}\0${question.nodeId}`);
      mentalUnitIds.add(`${entry.trackId}\0${question.nodeId}\0${question.mentalUnitId}`);
    }
    if (Object.hasOwn(artifact, "approachChallengeProblems")) {
      const problems = artifact.approachChallengeProblems;
      if (entry.trackId !== APPROACH_CHALLENGE_TRACK_ID || !Array.isArray(problems)) fail(`Invalid approach-challenge paired bank for ${entry.trackId}`);
      const { validateApproachChallengeProblem } = await import(pathToFileURL(path.join(path.resolve(producerRoot ?? path.resolve(scriptRoot, "../patternly-content")), "scripts/content/approach-challenge-contract.mjs")).href);
      const problemIds = new Set();
      const pairedQuestionIds = new Set();
      const familyCounts = Object.fromEntries(Object.keys(APPROACH_CHALLENGE_BANK_CONTRACT.familyCounts).map((familyId) => [familyId, 0]));
      for (const [index, problem] of problems.entries()) {
        const errors = validateApproachChallengeProblem(problem);
        if (errors.length) fail(`Invalid paired problem ${index} in ${entry.trackId}: ${errors.join("; ")}`);
        if (!Object.hasOwn(familyCounts, problem.primaryFamilyId)) fail(`Unknown paired problem family: ${problem.primaryFamilyId}`);
        familyCounts[problem.primaryFamilyId] += 1;
        if (problemIds.has(problem.problemId)) fail(`Duplicate paired problemId: ${problem.problemId}`);
        problemIds.add(problem.problemId);
        for (const stage of [problem.approachQuestion, problem.complexityQuestion]) {
          if (allQuestionIds.has(stage.questionId) || pairedQuestionIds.has(stage.questionId)) fail(`Duplicate ordinary or paired questionId: ${stage.questionId}`);
          pairedQuestionIds.add(stage.questionId);
        }
      }
      if (!matchesApproachChallengeCounts(problems.length, pairedQuestionIds.size, familyCounts, APPROACH_CHALLENGE_BANK_CONTRACT) &&
        !matchesApproachChallengeCounts(problems.length, pairedQuestionIds.size, familyCounts, PRE_SYNC_APPROACH_CHALLENGE_BASELINE) &&
        !matchesApproachChallengeCounts(problems.length, pairedQuestionIds.size, familyCounts, PREVIOUS_APPROACH_CHALLENGE_BASELINE)) {
        fail("Approach-challenge bank totals or exact family counts differ from the current or supported pre-sync baseline contracts");
      }
      const isFree = (problem) => problem.primaryFamilyId === APPROACH_CHALLENGE_BANK_CONTRACT.freeFamilyId &&
        problem.requiredFamilyIds.every((familyId) => familyId === APPROACH_CHALLENGE_BANK_CONTRACT.freeFamilyId) &&
        problem.approachQuestion.nodeId === APPROACH_CHALLENGE_BANK_CONTRACT.freeFamilyId &&
        problem.complexityQuestion.nodeId === APPROACH_CHALLENGE_BANK_CONTRACT.freeFamilyId;
      const freeProblems = problems.filter(isFree);
      const expectedFreeCount = problems.length === APPROACH_CHALLENGE_BANK_CONTRACT.problemCount
        ? APPROACH_CHALLENGE_BANK_CONTRACT.freeProblemCount
        : problems.length === PRE_SYNC_APPROACH_CHALLENGE_BASELINE.problemCount
          ? PRE_SYNC_APPROACH_CHALLENGE_BASELINE.freeProblemCount
          : PREVIOUS_APPROACH_CHALLENGE_BASELINE.familyCounts[APPROACH_CHALLENGE_BANK_CONTRACT.freeFamilyId];
      if (freeProblems.length !== expectedFreeCount) {
        fail(`Free paired-problem count differs from the accepted per-problem classification for ${APPROACH_CHALLENGE_BANK_CONTRACT.freeFamilyId}`);
      }
      for (const id of pairedQuestionIds) allQuestionIds.add(id);
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
async function inspectProducerSource(producerRoot, { expectedContentCommit, previousHead, allowDirtyCandidate = false, allowAuthorizedCurrentBank = false } = {}) {
  let root, head, main, remote, status;
  try {
    const git = async (...args) => (await execFileAsync("git", ["-C", producerRoot, ...args], { encoding: "utf8" })).stdout.trim();
    [root, head, main, remote, status] = await Promise.all([
      git("rev-parse", "--show-toplevel"),
      git("rev-parse", "--verify", "HEAD^{commit}"),
      git("rev-parse", "--verify", "refs/remotes/origin/master^{commit}"),
      git("remote", "get-url", "origin"),
      git("status", "--porcelain=v1", "--untracked-files=all", "--ignore-submodules=none"),
    ]);
  } catch { fail("Current content source is unavailable; use the canonical patternly-content checkout with origin/master present"); }
  if (await realpath(root) !== await realpath(producerRoot)) fail("Current content source must be the patternly-content repository root");
  if (!/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)lukaszkurczab\/patternly-content(?:\.git)?$/iu.test(remote)) {
    fail("Current content source origin must identify lukaszkurczab/patternly-content");
  }
  if (!/^[a-f0-9]{40}$/u.test(head) || head !== main) fail("Current content source HEAD must match origin/master; application bank unchanged");
  if (expectedContentCommit && head !== expectedContentCommit) fail("Selected content checkout HEAD differs from the expected exact SHA");
  if (previousHead && head !== previousHead) fail("Current content source commit changed during preparation; application bank unchanged");
  if (status && !allowDirtyCandidate && !allowAuthorizedCurrentBank) fail("Current content source has working changes; preserve WIP and use clean master before preparing the application bank");
  if (!status && allowDirtyCandidate) fail("Local candidate preparation requires explicit uncommitted content changes");
  return { head, sourceTree: status ? "dirty" : "clean" };
}
async function assertCurrentProducerSource(producerRoot, options = {}) {
  return (await inspectProducerSource(producerRoot, options)).head;
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

export function deriveAcceptedApproachChallengeContract(sourceManifest, codingArtifactBytes, currentIdentity) {
  const manifestKeys = ["registryVersion", "problemCount", "questionCount", "freeProblemCount", "premiumProblemCount", "familyCounts", "sourceEntries"];
  if (!exactKeys(sourceManifest, manifestKeys) || typeof sourceManifest.registryVersion !== "string" || !sourceManifest.registryVersion.trim() ||
    sourceManifest.problemCount !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount || sourceManifest.questionCount !== APPROACH_CHALLENGE_BANK_CONTRACT.questionCount ||
    sourceManifest.freeProblemCount !== APPROACH_CHALLENGE_BANK_CONTRACT.freeProblemCount || sourceManifest.premiumProblemCount !== APPROACH_CHALLENGE_BANK_CONTRACT.premiumProblemCount ||
    canonicalJson(sourceManifest.familyCounts) !== canonicalJson(APPROACH_CHALLENGE_BANK_CONTRACT.familyCounts) || !Array.isArray(sourceManifest.sourceEntries) ||
    sourceManifest.sourceEntries.length !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount) {
    fail("Current paired bank source manifest differs from the accepted 472/944/21 source contract");
  }
  const artifact = parseJson(codingArtifactBytes, `${APPROACH_CHALLENGE_TRACK_ID}.json`);
  if (!Array.isArray(artifact.approachChallengeProblems) || artifact.approachChallengeProblems.length !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount) {
    fail("Current Coding artifact does not contain the accepted paired bank");
  }
  const problemsById = new Map(artifact.approachChallengeProblems.map((problem) => [problem.problemId, problem]));
  if (problemsById.size !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount) fail("Current paired bank has duplicate problem IDs");
  const sourceIds = new Set();
  for (const entry of sourceManifest.sourceEntries) {
    if (!exactKeys(entry, ["familyId", "problemId", "problemVersion", "sourcePath", "sourceSha256", "questionIds"]) ||
      typeof entry.familyId !== "string" || !Object.hasOwn(APPROACH_CHALLENGE_BANK_CONTRACT.familyCounts, entry.familyId) ||
      typeof entry.problemId !== "string" || typeof entry.problemVersion !== "string" || typeof entry.sourcePath !== "string" || !HASH.test(entry.sourceSha256 ?? "") ||
      !Array.isArray(entry.questionIds) || entry.questionIds.length !== 2 || entry.questionIds.some((id) => typeof id !== "string") || sourceIds.has(entry.problemId)) {
      fail("Current paired bank source manifest has an invalid or duplicate source entry");
    }
    sourceIds.add(entry.problemId);
    const problem = problemsById.get(entry.problemId);
    if (!problem || problem.primaryFamilyId !== entry.familyId || problem.problemVersion !== entry.problemVersion ||
      entry.questionIds[0] !== problem.approachQuestion?.questionId || entry.questionIds[1] !== problem.complexityQuestion?.questionId) {
      fail(`Current paired bank source identity does not match its artifact entry: ${entry.problemId}`);
    }
  }
  if (sourceIds.size !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount) fail("Current paired bank source manifest omits an artifact entry");
  const artifactSha256 = sha256(codingArtifactBytes);
  const codingIdentity = currentIdentity?.tracks?.find((entry) => entry.trackId === APPROACH_CHALLENGE_TRACK_ID);
  if (!codingIdentity || codingIdentity.artifactSha256 !== artifactSha256) fail("Current source identity does not bind the actual paired-bank artifact hash");
  return Object.freeze({ registryVersion: sourceManifest.registryVersion, artifactSha256, sourceEntries: sourceManifest.sourceEntries });
}

function assertAuthorizedApproachChallengeDelta(beforeFiles, stagedFiles, sourceManifest, currentIdentity) {
  const codingName = `${APPROACH_CHALLENGE_TRACK_ID}.json`;
  const beforeBytes = beforeFiles.get(codingName);
  const stagedBytes = stagedFiles.get(codingName);
  if (!beforeBytes || !stagedBytes) fail("Authorized current-bank sync requires the existing and staged Coding artifact");
  const acceptedContract = deriveAcceptedApproachChallengeContract(sourceManifest, stagedBytes, currentIdentity);
  const before = parseJson(beforeBytes, codingName);
  const staged = parseJson(stagedBytes, codingName);
  if (!Array.isArray(before.questions) || !Array.isArray(staged.questions) || before.questions.length !== 3404 || staged.questions.length !== 3404 ||
    canonicalJson(before.questions) !== canonicalJson(staged.questions)) fail("Authorized current-bank sync must preserve all 3,404 ordinary Coding questions");
  if (!Array.isArray(before.simulationProfiles) || !Array.isArray(staged.simulationProfiles) ||
    canonicalJson(before.simulationProfiles) !== canonicalJson(staged.simulationProfiles)) fail("Authorized current-bank sync must preserve the existing Coding simulation profile");
  if (!Array.isArray(before.approachChallengeProblems) || before.approachChallengeProblems.length !== PRE_SYNC_APPROACH_CHALLENGE_BASELINE.problemCount ||
    !Array.isArray(staged.approachChallengeProblems) || staged.approachChallengeProblems.length !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount) {
    fail("Authorized current-bank sync requires the exact pre-sync 52-pair bank and accepted 472-pair bank");
  }
  const stagedProblemsById = new Map(staged.approachChallengeProblems.map((problem) => [problem.problemId, problem]));
  if (stagedProblemsById.size !== APPROACH_CHALLENGE_BANK_CONTRACT.problemCount || before.approachChallengeProblems.some((problem) =>
    canonicalJson(problem) !== canonicalJson(stagedProblemsById.get(problem.problemId)))) {
    fail("Authorized current-bank sync must preserve every existing paired problem byte-for-byte by problem ID");
  }
  const oldKeys = Object.keys(before).sort();
  const newKeys = Object.keys(staged).sort();
  if (canonicalJson(oldKeys) !== canonicalJson(newKeys)) fail("Authorized current-bank sync changed the Coding artifact field set");
  for (const key of oldKeys) {
    if (key === "approachChallengeProblems") continue;
    if (canonicalJson(before[key]) !== canonicalJson(staged[key])) fail(`Authorized current-bank sync changed existing Coding artifact field: ${key}`);
  }
  for (const trackId of EXPECTED_TRACK_IDS) {
    if (trackId === APPROACH_CHALLENGE_TRACK_ID) continue;
    const fileName = `${trackId}.json`;
    if (!beforeFiles.get(fileName)?.equals(stagedFiles.get(fileName))) fail(`Authorized current-bank sync changed unrelated track artifact: ${trackId}`);
  }

  const beforeLock = parseJson(beforeFiles.get(LOCK_FILE_NAME), LOCK_FILE_NAME);
  const stagedLock = parseJson(stagedFiles.get(LOCK_FILE_NAME), LOCK_FILE_NAME);
  for (const beforeEntry of beforeLock.tracks) {
    const stagedEntry = stagedLock.tracks.find((entry) => entry.trackId === beforeEntry.trackId);
    if (!stagedEntry) fail(`Authorized current-bank sync removed content lock track ${beforeEntry.trackId}`);
    if (beforeEntry.trackId !== APPROACH_CHALLENGE_TRACK_ID && canonicalJson(beforeEntry) !== canonicalJson(stagedEntry)) fail(`Authorized current-bank sync changed unrelated content lock entry: ${beforeEntry.trackId}`);
    if (beforeEntry.trackId === APPROACH_CHALLENGE_TRACK_ID && (stagedEntry.contentVersion !== beforeEntry.contentVersion || stagedEntry.questionCount !== 3404 || stagedEntry.sha256 !== acceptedContract.artifactSha256)) {
      fail("Authorized current-bank sync must preserve Coding content version and ordinary question count while binding the source-derived artifact hash");
    }
  }

  const beforeLedgerBytes = beforeFiles.get(SUCCESSOR_LEDGER_FILE_NAME);
  const stagedLedgerBytes = stagedFiles.get(SUCCESSOR_LEDGER_FILE_NAME);
  if (!beforeLedgerBytes || !stagedLedgerBytes) fail("Authorized current-bank sync requires an existing and regenerated successor ledger");
  const beforeLedger = parseJson(beforeLedgerBytes, SUCCESSOR_LEDGER_FILE_NAME);
  const stagedLedger = parseJson(stagedLedgerBytes, SUCCESSOR_LEDGER_FILE_NAME);
  for (const beforeEntry of beforeLedger.tracks) {
    const stagedEntry = stagedLedger.tracks.find((entry) => entry.trackId === beforeEntry.trackId);
    if (!stagedEntry) fail(`Authorized current-bank sync removed successor ledger track ${beforeEntry.trackId}`);
    if (beforeEntry.trackId !== APPROACH_CHALLENGE_TRACK_ID && canonicalJson(beforeEntry) !== canonicalJson(stagedEntry)) fail(`Authorized current-bank sync changed unrelated successor ledger entry: ${beforeEntry.trackId}`);
    if (beforeEntry.trackId === APPROACH_CHALLENGE_TRACK_ID && canonicalJson(stagedEntry.training) !== canonicalJson(beforeEntry.training)) fail("Authorized current-bank sync changed the existing Coding training predecessor identity");
  }
}

// Exact, separately reviewed exceptions; this mode never admits other prompt edits.
const CODING_EXPLANATION_PROMPTS = Object.freeze({
  "alg-hms-choose-015-distinct-membership": Object.freeze([
    "Which state is sufficient when the output asks for the number of distinct values only?",
    "Which minimal hash-based state is sufficient when the output asks only for the number of distinct values?",
  ]),
  "alg-tp-dup-13-both-sides": Object.freeze([
    "Why may both pointers need duplicate skipping after a successful pair match?",
    "After emitting a unique value pair from a sorted array, which symmetric policy skips repetitions of both just-used boundary values before the next comparison?",
  ]),
});
const EXPLANATIONS_SCHEMA = "patternly-coding-explanations-review-v1";
function explanationVersionSuccessor(version) {
  const parts = version.split(".");
  if ((parts.length !== 1 && parts.length !== 3) || parts.some((part) => !/^(0|[1-9][0-9]*)$/u.test(part) || !Number.isSafeInteger(Number(part)))) return undefined;
  const last = Number(parts.at(-1));
  if (!Number.isSafeInteger(last + 1)) return undefined;
  parts[parts.length - 1] = String(last + 1);
  return parts.join(".");
}

const valueDigest = (value) => sha256(canonicalJson(value === undefined ? { exists: false } : { exists: true, value }));
const fileDigests = (files) => Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, bytes]) => [name, sha256(bytes)]));

/** Classify the complete artifact delta, never inferring authorization from it. */
export function describeCodingExplanationDelta(before, after) {
  if (before.questions?.length !== 3404 || after.questions?.length !== 3404 ||
      before.approachChallengeProblems?.length !== 472 || after.approachChallengeProblems?.length !== 472) fail("coding_explanations_inventory: expected the existing 3404/472 bank");
  const masked = structuredClone(after);
  const items = [];
  const diff = (changes, path, oldValue, newValue) => {
    if (canonicalJson(oldValue) !== canonicalJson(newValue)) changes.push({ path, beforeSha256: valueDigest(oldValue), afterSha256: valueDigest(newValue) });
  };
  const text = (changes, path, oldValue, newValue) => {
    if (typeof newValue !== "string" || !newValue.trim()) fail("coding_explanations_text: expected nonempty text");
    diff(changes, path, oldValue, newValue);
  };
  const feedback = (oldQuestion, question, clone, prefix, changes) => {
    if (!isRecord(oldQuestion.feedback) || !isRecord(question.feedback)) fail("coding_explanations_feedback: feedback is required");
    for (const key of ["reason", "details"]) {
      if (key === "reason") text(changes, `${prefix}/feedback/${key}`, oldQuestion.feedback[key], question.feedback[key]);
      else diff(changes, `${prefix}/feedback/${key}`, oldQuestion.feedback[key], question.feedback[key]);
      clone.feedback[key] = structuredClone(oldQuestion.feedback[key]);
    }
    const oldMessages = oldQuestion.feedback.messages, messages = question.feedback.messages;
    if ((oldMessages === undefined) !== (messages === undefined)) fail("coding_explanations_messages: message arrays cannot be added or removed");
    if (oldMessages !== undefined) {
      if (!Array.isArray(messages) || messages.length !== oldMessages.length) fail("coding_explanations_messages: existing message inventory must be preserved");
      for (let i = 0; i < messages.length; i += 1) {
        text(changes, `${prefix}/feedback/messages/${i}/text`, oldMessages[i].text, messages[i].text);
        clone.feedback.messages[i].text = oldMessages[i].text;
      }
    }
  };
  for (let i = 0; i < before.questions.length; i += 1) {
    const old = before.questions[i], next = after.questions[i], clone = masked.questions[i], changes = [];
    if (old.questionId !== next.questionId) fail("coding_explanations_order: ordinary stable IDs/order differ");
    feedback(old, next, clone, "", changes);
    if (old.prompt !== next.prompt) {
      const approved = CODING_EXPLANATION_PROMPTS[old.questionId];
      if (!approved || old.prompt !== approved[0] || next.prompt !== approved[1]) fail("coding_explanations_prompt: unapproved prompt or wording");
      text(changes, "/prompt", old.prompt, next.prompt);
      clone.prompt = old.prompt;
    }
    if (changes.length) items.push({ kind: "ordinary", itemId: old.questionId, beforeSha256: valueDigest(old), afterSha256: valueDigest(next), changes });
  }
  for (let i = 0; i < before.approachChallengeProblems.length; i += 1) {
    const old = before.approachChallengeProblems[i], next = after.approachChallengeProblems[i], clone = masked.approachChallengeProblems[i], changes = [];
    if (old.problemId !== next.problemId) fail("coding_explanations_order: ACM stable IDs/order differ");
    for (const stage of ["approachQuestion", "complexityQuestion"]) feedback(old[stage], next[stage], clone[stage], `/${stage}`, changes);
    const options = next.approachQuestion.interaction.options, oldOptions = old.approachQuestion.interaction.options;
    if (options.length !== oldOptions.length) fail("coding_explanations_options: option inventory differs");
    for (let j = 0; j < options.length; j += 1) {
      if (options[j].optionId !== oldOptions[j].optionId) fail("coding_explanations_options: option stable IDs/order differ");
      text(changes, `/approachQuestion/interaction/options/${j}/feedback`, oldOptions[j].feedback, options[j].feedback);
      clone.approachQuestion.interaction.options[j].feedback = oldOptions[j].feedback;
    }
    for (const key of ["title", "description"]) {
      text(changes, `/methodReveal/${key}`, old.methodReveal[key], next.methodReveal[key]);
      clone.methodReveal[key] = old.methodReveal[key];
    }
    if (old.problemVersion !== next.problemVersion) {
      if (!changes.length || next.problemVersion !== explanationVersionSuccessor(old.problemVersion)) fail("coding_explanations_version: version must increment once with an actual explanation change");
      diff(changes, "/problemVersion", old.problemVersion, next.problemVersion);
      clone.problemVersion = old.problemVersion;
    } else if (changes.length) fail("coding_explanations_version: changed ACM text requires its successor problem version");
    if (changes.length) items.push({ kind: "acm", itemId: old.problemId, beforeSha256: valueDigest(old), afterSha256: valueDigest(next), changes });
  }
  // This catches every non-allowlisted field, including grade, option text, message targets,
  // objectives, schemas, simulation profiles, policy, and arbitrary additions/removals.
  if (canonicalJson(before) !== canonicalJson(masked)) fail("coding_explanations_protected: a non-explanation field changed");
  if (!items.length) fail("coding_explanations_empty: no explanation changes");
  return items;
}

async function bindCodingExplanationSources({ items, built, producerRoot }) {
  const coding = built.artifacts.find((entry) => entry.trackId === CODING_TRACK_ID);
  const sources = new Map();
  for (const file of coding.sourceFiles) {
    const absolute = path.resolve(file);
    if (!isWithin(path.join(producerRoot, "content", CODING_TRACK_ID), absolute)) fail("coding_explanations_source: ordinary source outside its bank");
    const bytes = await inspectRegularFile(absolute, producerRoot, "ordinary authoring source");
    const questions = parseJson(bytes, "ordinary authoring source");
    if (!Array.isArray(questions)) fail("coding_explanations_source: ordinary authoring must be an array");
    const sourcePath = path.relative(producerRoot, absolute).split(path.sep).join("/"), sourceSha256 = sha256(bytes);
    for (const question of questions) {
      if (sources.has(question.questionId)) fail("coding_explanations_source: duplicate ordinary source ID");
      sources.set(question.questionId, { sourcePath, sourceSha256, value: question });
    }
  }
  const acmSources = new Map();
  for (const entry of coding.approachChallengeManifest.sourceEntries) {
    const absolute = path.resolve(producerRoot, entry.sourcePath);
    if (!isWithin(path.join(producerRoot, "content", "approach-challenges", CODING_TRACK_ID), absolute)) fail("coding_explanations_source: ACM source outside its bank");
    const bytes = await inspectRegularFile(absolute, producerRoot, "ACM authoring source");
    if (sha256(bytes) !== entry.sourceSha256) fail("coding_explanations_source: ACM registry hash does not match actual source");
    const value = parseJson(bytes, "ACM authoring source");
    const staged = coding.artifact.approachChallengeProblems.find((problem) => problem.problemId === entry.problemId);
    if (canonicalJson(value) !== canonicalJson(staged)) fail("coding_explanations_source: ACM source differs from built artifact");
    acmSources.set(entry.problemId, { sourcePath: entry.sourcePath, sourceSha256: entry.sourceSha256, value });
  }
  const { validateQuestion } = await import(pathToFileURL(path.join(producerRoot, "scripts/content/question-contract.mjs")).href);
  return items.map((item) => {
    const source = (item.kind === "ordinary" ? sources : acmSources).get(item.itemId);
    if (!source || valueDigest(source.value) !== item.afterSha256) fail("coding_explanations_source: stable ID source differs from changed built record");
    for (const question of item.kind === "ordinary" ? [source.value] : [source.value.approachQuestion, source.value.complexityQuestion]) {
      const validation = validateQuestion(question, { allowApproachChoice: question.interaction.type === "approach_choice" });
      if (!validation.valid) fail(`coding_explanations_contract: invalid changed question ${question.questionId}`);
    }
    return { ...item, sourcePath: source.sourcePath, sourceSha256: source.sourceSha256 };
  });
}

/** Preparation computes a proposal only. Installation separately requires its reviewed byte hash. */
export async function prepareCodingExplanationsManifest({ beforeFiles, beforeReleaseLock, built, currentIdentity, producerRoot }) {
  if (!/^[a-f0-9]{40}$/u.test(currentIdentity?.sourceRepositoryCommit ?? "") || !HASH.test(currentIdentity?.sourceInputFingerprint ?? "")) fail("coding_explanations_identity: actual source commit and full producer fingerprint are required for preparation");
  const stagedFiles = new Map(built.artifacts.map((entry) => [`${entry.trackId}.json`, Buffer.from(entry.artifactBytes)]));
  stagedFiles.set(LOCK_FILE_NAME, await readFile(built.lockPath));
  assertBuildMatchesIdentity(stagedFiles, currentIdentity);
  const artifacts = new Map([...stagedFiles].filter(([name]) => name !== LOCK_FILE_NAME).map(([name, bytes]) => [name, parseJson(bytes, name)]));
  const previousLedger = parseSuccessorLedger(parseJson(beforeFiles.get(SUCCESSOR_LEDGER_FILE_NAME), SUCCESSOR_LEDGER_FILE_NAME));
  stagedFiles.set(SUCCESSOR_LEDGER_FILE_NAME, Buffer.from(JSON.stringify(deriveSuccessorLedger({ artifacts, lock: built.lock, previousLedger }))));
  for (const trackId of EXPECTED_TRACK_IDS.filter((id) => id !== CODING_TRACK_ID)) {
    if (!beforeFiles.get(`${trackId}.json`)?.equals(stagedFiles.get(`${trackId}.json`))) fail("coding_explanations_unrelated: another bank changed");
  }
  const name = `${CODING_TRACK_ID}.json`, before = parseJson(beforeFiles.get(name), name), after = artifacts.get(name);
  const items = await bindCodingExplanationSources({ items: describeCodingExplanationDelta(before, after), built, producerRoot });
  const sourceManifest = built.artifacts.find((entry) => entry.trackId === CODING_TRACK_ID).approachChallengeManifest;
  deriveAcceptedApproachChallengeContract(sourceManifest, stagedFiles.get(name), currentIdentity);
  return {
    schemaVersion: EXPLANATIONS_SCHEMA,
    baselineFiles: fileDigests(beforeFiles), baselineReleaseLockSha256: sha256(beforeReleaseLock),
    stagedFiles: fileDigests(stagedFiles), sourceRepositoryCommit: currentIdentity.sourceRepositoryCommit,
    sourceInputFingerprint: currentIdentity.sourceInputFingerprint,
    acmManifest: sourceManifest,
    registrySha256: sha256(await inspectRegularFile(path.join(producerRoot, "config/approach-challenge-registries", `${CODING_TRACK_ID}.json`), producerRoot, "ACM registry")), items,
  };
}

export async function loadCodingExplanationsReview(manifestPath, expectedManifestSha256) {
  if (typeof manifestPath !== "string" || !manifestPath || !HASH.test(expectedManifestSha256 ?? "")) fail("coding_explanations_review: manifest path and separately supplied expected SHA-256 are required");
  const bytes = await inspectRegularFile(path.resolve(manifestPath), path.dirname(path.resolve(manifestPath)), "reviewed explanations manifest");
  if (sha256(bytes) !== expectedManifestSha256) fail("coding_explanations_review: reviewed manifest bytes differ from expected SHA-256");
  const manifest = parseJson(bytes, "reviewed explanations manifest");
  if (!isRecord(manifest) || manifest.schemaVersion !== EXPLANATIONS_SCHEMA) fail("coding_explanations_review: unsupported manifest schema");
  return Object.freeze({ manifest, sha256: expectedManifestSha256 });
}

async function assertCodingExplanationsReview({ review, beforeFiles, beforeReleaseLock, stagedFiles, stagedReleaseLock, built, currentIdentity, producerRoot }) {
  const actual = await prepareCodingExplanationsManifest({ beforeFiles, beforeReleaseLock, built, currentIdentity, producerRoot });
  if (canonicalJson(actual) !== canonicalJson(review.manifest)) fail("coding_explanations_review: actual source-to-built delta differs from the reviewed manifest");
  if (canonicalJson(fileDigests(stagedFiles)) !== canonicalJson(actual.stagedFiles)) fail("coding_explanations_identity: staged output differs from reviewed producer output");
  const oldLedger = parseJson(beforeFiles.get(SUCCESSOR_LEDGER_FILE_NAME), SUCCESSOR_LEDGER_FILE_NAME);
  const nextLedger = parseJson(stagedFiles.get(SUCCESSOR_LEDGER_FILE_NAME), SUCCESSOR_LEDGER_FILE_NAME);
  const oldLock = parseJson(beforeFiles.get(LOCK_FILE_NAME), LOCK_FILE_NAME);
  const nextLock = parseJson(stagedFiles.get(LOCK_FILE_NAME), LOCK_FILE_NAME);
  for (const id of EXPECTED_TRACK_IDS.filter((id) => id !== CODING_TRACK_ID)) {
    for (const [oldData, newData] of [[oldLedger, nextLedger], [oldLock, nextLock]]) {
      if (canonicalJson(oldData.tracks.find((row) => row.trackId === id)) !== canonicalJson(newData.tracks.find((row) => row.trackId === id))) fail("coding_explanations_identity: unrelated lock/ledger entry changed");
    }
  }
  const releaseId = `patternly-current-${currentIdentity.sourceInputFingerprint.slice(0, 20)}`;
  const expectedRelease = Buffer.from(`${JSON.stringify(buildCurrentReleaseLock({ currentIdentity, head: currentIdentity.sourceRepositoryCommit, contentLockBytes: stagedFiles.get(LOCK_FILE_NAME), successorLedgerBytes: stagedFiles.get(SUCCESSOR_LEDGER_FILE_NAME), releaseId }))}\n`);
  if (!expectedRelease.equals(stagedReleaseLock)) fail("coding_explanations_identity: release lock differs from actual identity");
  return { manifestSha256: review.sha256, changedOrdinary: actual.items.filter((item) => item.kind === "ordinary").length, changedAcm: actual.items.filter((item) => item.kind === "acm").length, beforeFiles: actual.baselineFiles, afterFiles: actual.stagedFiles, beforeReleaseLockSha256: actual.baselineReleaseLockSha256, afterReleaseLockSha256: sha256(stagedReleaseLock) };
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
  delete projection.approachChallengeProblems;
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
async function syncCanonicalContentUnlocked({ mode = "sync", appRoot = scriptRoot, producerRoot = process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(scriptRoot, "../patternly-content"), targetDirectory = path.join(appRoot, GENERATED_DIRECTORY), targetLockFile = path.join(appRoot, RELEASE_LOCK_RELATIVE_PATH), temporaryRoot = tmpdir(), runBuild = defaultRunBuild, expectedContentCommit = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA, getCurrentIdentity, getFreshSourceFingerprint, expectedInventory = null, remove = rm, move = rename, explanationsManifestPath, expectedManifestSha256 } = {}) {
  if (mode !== "sync" && mode !== "check" && mode !== "candidate" && mode !== "authorized-current-approach-challenge" && mode !== "coding-explanations") fail(`Unknown mode: ${mode}`);
  const explanations = mode === "coding-explanations";
  const explanationReview = explanations ? await loadCodingExplanationsReview(explanationsManifestPath, expectedManifestSha256) : undefined;
  const candidate = mode === "candidate";
  const authorizedCurrentBank = mode === "authorized-current-approach-challenge";
  const buildMode = candidate || authorizedCurrentBank || explanations ? "sync" : mode;
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedProducerRoot = path.resolve(producerRoot);
  const resolvedTarget = path.resolve(targetDirectory);
  const resolvedLockFile = path.resolve(targetLockFile);
  if (!isWithin(resolvedAppRoot, resolvedTarget) || resolvedTarget !== path.join(resolvedAppRoot, GENERATED_DIRECTORY)) fail(`Target must be exactly ${GENERATED_DIRECTORY} within the application root`);
  if (!isWithin(resolvedAppRoot, resolvedLockFile) || resolvedLockFile !== path.join(resolvedAppRoot, RELEASE_LOCK_RELATIVE_PATH)) fail(`Release lock target must be exactly ${RELEASE_LOCK_RELATIVE_PATH} within the application root`);
  await assertSafeTargetBoundary(resolvedAppRoot, resolvedTarget);
  const source = await inspectProducerSource(resolvedProducerRoot, { expectedContentCommit, allowDirtyCandidate: candidate, allowAuthorizedCurrentBank: authorizedCurrentBank || explanations });
  const { head } = source;
  if (buildMode === "sync" && !authorizedCurrentBank && !explanations) await recoverCurrentBank({ targetDirectory: resolvedTarget, targetLockFile: resolvedLockFile, remove, move });
  else await assertNoInterruptedTransaction({ targetDirectory: resolvedTarget, targetLockFile: resolvedLockFile });
  await assertProducerRoot(resolvedProducerRoot);
  const initialTarget = await validateBuiltContent(resolvedTarget, { expectedInventory: null, producerRoot: resolvedProducerRoot, allowLegacySimulationEvidence: true });
  const initialReleaseLock = await readFile(resolvedLockFile);
  if (explanations && (canonicalJson(fileDigests(initialTarget.files)) !== canonicalJson(explanationReview.manifest.baselineFiles) || sha256(initialReleaseLock) !== explanationReview.manifest.baselineReleaseLockSha256)) fail("coding_explanations_baseline: installed APP differs from the reviewed baseline");
  const expectedTargetDigests = {
    files: Object.fromEntries([...initialTarget.files].map(([name, bytes]) => [name, sha256(bytes)])),
    lock: sha256(initialReleaseLock),
  };
  const identityModule = getCurrentIdentity && getFreshSourceFingerprint
    ? null
    : await import(pathToFileURL(path.join(resolvedProducerRoot, "scripts/content/current-source-identity.mjs")).href);
  const safeCheckTemporaryRoot = buildMode === "check" ? await assertSafeCheckTemporaryRoot(resolvedAppRoot, temporaryRoot) : undefined;
  const temporaryParent = buildMode === "sync" ? path.dirname(resolvedTarget) : safeCheckTemporaryRoot;
  const temporaryDirectory = await mkdtemp(path.join(temporaryParent, `.canonical-content-build-${process.pid}-`));
  let lockStageDirectory;
  try {
    const buildResult = await runBuild({ producerRoot: resolvedProducerRoot, outputRoot: temporaryDirectory });
    const built = await validateBuiltContent(temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
    if (!buildResult?.artifacts || !buildResult?.lock) fail("Canonical source build did not return the identity-bearing build result");
    const derivedIdentity = await (getCurrentIdentity ?? identityModule.deriveCurrentSourceIdentity)({ contentRoot: resolvedProducerRoot, built: buildResult, sourceRepositoryCommit: head });
    const currentIdentity = candidate ? { ...derivedIdentity, sourceTree: "dirty" } : derivedIdentity;
    assertBuildMatchesIdentity(built.files, currentIdentity);
    if (explanations && (currentIdentity.sourceRepositoryCommit !== head || currentIdentity.sourceTree !== source.sourceTree)) fail("coding_explanations_identity: provenance differs from actual producer state");
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
    if (authorizedCurrentBank) {
      const codingBuild = buildResult.artifacts?.find((entry) => entry.trackId === APPROACH_CHALLENGE_TRACK_ID);
      assertAuthorizedApproachChallengeDelta(initialTarget.files, staged.files, codingBuild?.approachChallengeManifest, currentIdentity);
    }
    const releaseId = `${candidate ? "patternly-local-candidate" : "patternly-current"}-${currentIdentity.sourceInputFingerprint.slice(0, 20)}`;
    const releaseLock = buildCurrentReleaseLock({ currentIdentity, head, contentLockBytes: staged.files.get(LOCK_FILE_NAME), successorLedgerBytes: staged.files.get(SUCCESSOR_LEDGER_FILE_NAME), releaseId });
    const stagedReleaseLock = Buffer.from(`${JSON.stringify(releaseLock)}\n`);
    let explanationReceipt;
    if (explanations) explanationReceipt = await assertCodingExplanationsReview({ review: explanationReview, beforeFiles: initialTarget.files, beforeReleaseLock: initialReleaseLock, stagedFiles: staged.files, stagedReleaseLock, built: buildResult, currentIdentity, producerRoot: resolvedProducerRoot });
    let stagedLockFile;
    if (buildMode === "sync") {
      lockStageDirectory = await mkdtemp(path.join(path.dirname(resolvedLockFile), `.current-content-lock-${process.pid}-`));
      stagedLockFile = path.join(lockStageDirectory, "release.lock.json");
      await writeFile(stagedLockFile, stagedReleaseLock);
    }
    const stagedFiles = new Map(staged.files);
    const stagedTargetDigests = { ...expectedTargetDigests, stagedFiles, stagedLock: stagedReleaseLock };
    if (buildMode === "check") {
      await compareDirectories(resolvedTarget, temporaryDirectory, { expectedInventory, producerRoot: resolvedProducerRoot });
      if (!initialReleaseLock.equals(stagedReleaseLock)) fail("Current content release metadata differs from generated source; run sync:content-release");
      await assertCurrentProducerSource(resolvedProducerRoot, { expectedContentCommit, previousHead: head });
      return { mode, head, currentIdentity, ...staged, ledger, ...(explanationReceipt ? { explanationReceipt } : {}) };
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
    await inspectProducerSource(resolvedProducerRoot, { expectedContentCommit, previousHead: head, allowDirtyCandidate: candidate, allowAuthorizedCurrentBank: authorizedCurrentBank || explanations });
    if (candidate) {
      const before = new Map([...initialTarget.files].filter(([name]) => name !== "content-lock.json" && name !== SUCCESSOR_LEDGER_FILE_NAME));
      for (const [fileName, bytes] of before) {
        if (fileName === `${CLAUDE_TRACK_ID}.json`) continue;
        if (!staged.files.get(fileName)?.equals(bytes)) fail(`Local candidate changes a non-CCAR-P generated artifact: ${fileName}`);
      }
    }
    await replaceCurrentBank({ stagedDirectory: temporaryDirectory, targetDirectory: resolvedTarget, stagedLockFile, targetLockFile: resolvedLockFile, expectedInventory, producerRoot: resolvedProducerRoot, remove, move, expectedTargetDigests: stagedTargetDigests });
    const installed = await validateBuiltContent(resolvedTarget, { expectedInventory, producerRoot: resolvedProducerRoot });
    for (const [fileName, bytes] of staged.files) if (!installed.files.get(fileName)?.equals(bytes)) fail(`Installed canonical content differs from staged canonical bytes: ${fileName}`);
    return { mode, head, currentIdentity, ...staged, ledger, ...(explanationReceipt ? { explanationReceipt } : {}) };
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

function usage() { return "Usage: node scripts/syncBundledContentRelease.mjs [sync|check|candidate|sync-current-approach-challenge|sync-coding-explanations] [--content-root <patternly-content checkout>] [--explanations-manifest <file> --expected-manifest-sha256 <sha256>]"; }
export function parseArgs(argv = process.argv.slice(2)) {
  const options = { mode: "sync" };
  let index = 0;
  if (argv[0] === "sync" || argv[0] === "check" || argv[0] === "candidate") options.mode = argv[index++];
  else if (argv[0] === "sync-current-approach-challenge") { options.mode = "authorized-current-approach-challenge"; index += 1; }
  else if (argv[0] === "sync-coding-explanations") { options.mode = "coding-explanations"; index += 1; }
  while (index < argv.length) {
    if (argv[index] === "--content-root" && index + 1 < argv.length) { options.producerRoot = path.resolve(argv[index + 1]); index += 2; }
    else if (options.mode === "coding-explanations" && argv[index] === "--explanations-manifest" && index + 1 < argv.length && !options.explanationsManifestPath) { options.explanationsManifestPath = path.resolve(argv[index + 1]); index += 2; }
    else if (options.mode === "coding-explanations" && argv[index] === "--expected-manifest-sha256" && index + 1 < argv.length && !options.expectedManifestSha256) { options.expectedManifestSha256 = argv[index + 1]; index += 2; }
    else fail(usage());
  }
  if (options.mode === "coding-explanations" && (!options.explanationsManifestPath || !HASH.test(options.expectedManifestSha256 ?? ""))) fail(usage());
  return options;
}
async function runCli() {
  const result = await syncCanonicalContent(parseArgs());
  console.log(`CANONICAL_CONTENT_${result.mode.toUpperCase()}=passed`);
  console.log(`CURRENT_SOURCE_FINGERPRINT=${result.currentIdentity.sourceInputFingerprint}`);
  if (result.mode === "candidate") console.log(`CANDIDATE_PROVENANCE=local_unpublished sourceTree=${result.currentIdentity.sourceTree} sourceCommit=${result.head}`);
  if (result.mode === "authorized-current-approach-challenge") console.log(`AUTHORIZED_CURRENT_PROVENANCE=source_derived_paired_bank_contract sourceTree=${result.currentIdentity.sourceTree} sourceCommit=${result.head}`);
  if (result.explanationReceipt) console.log(`CODING_EXPLANATIONS_RECEIPT=${JSON.stringify(result.explanationReceipt)}`);
  console.log(`CONTENT_INVENTORY=${result.inventory.trackCount}/${result.inventory.nodeCount}/${result.inventory.mentalUnitCount}/${result.inventory.questionCount}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) runCli().catch((error) => { console.error(error?.stack ?? error?.message ?? error); process.exitCode = 1; });
