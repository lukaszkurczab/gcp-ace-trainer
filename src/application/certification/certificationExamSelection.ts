import { allocateWeightedBlueprintQuotas } from "../../content/canonical/weightedBlueprintAllocation";
import type { CanonicalProductSimulationProfile } from "../../content/canonical/questionTypes";
import type { TrainingQuestionSummary } from "../trainingLifecycle/contracts";

/** Deterministic, fail-closed selection for the immutable full Certification Exam plan. */
export function selectCertificationExamQuestions(questions: readonly TrainingQuestionSummary[], profile: CanonicalProductSimulationProfile): readonly TrainingQuestionSummary[] {
  if (profile.familyId !== "certification" || profile.modeId !== "certification-exam-simulation") throw new Error("Certification simulation profile is invalid.");
  const { blueprint, nodeDomainMap, questionCount, examCoverage } = profile.familyConfig;
  const targetCount = questionCount.minimum;
  if (blueprint.kind !== "weighted_sections" || !Number.isSafeInteger(targetCount) || targetCount <= 0 || !Number.isSafeInteger(questionCount.maximum) || questionCount.maximum < targetCount) throw new Error("Certification simulation profile does not define a valid weighted blueprint.");
  const quotas = allocateWeightedBlueprintQuotas(targetCount, blueprint.sections);
  const byDomain = new Map(quotas.map((quota) => [quota.contentDomainId, questions.filter((question) => question.contentDomainId === quota.contentDomainId && nodeDomainMap[question.nodeId] === quota.contentDomainId && (question.sourceRefs?.length ?? 0) > 0).slice().sort(byId)]));
  for (const quota of quotas) if ((byDomain.get(quota.contentDomainId)?.length ?? 0) < quota.questionCount) throw new Error(`Certification simulation source pool ${quota.contentDomainId} requires ${quota.questionCount} unique items but has ${(byDomain.get(quota.contentDomainId) ?? []).length}.`);
  const formatMinimums = examCoverage?.formatMinimums;
  const skillMinimums = examCoverage?.skillMinimums;
  if (!examCoverage) return Object.freeze(quotas.flatMap((quota) => (byDomain.get(quota.contentDomainId) ?? []).slice(0, quota.questionCount)));
  if (examCoverage.policy !== "patternly-ccarp-v1" || !formatMinimums || !skillMinimums || profile.familyConfig.scoringPolicy?.policyId !== "patternly-ccarp-complete-item-v1" || profile.familyConfig.scoringPolicy.policyVersion !== "1" || profile.familyConfig.scoringPolicy.method !== "complete_correct_item_only") throw new Error("Certification simulation profile has an unsupported answer-format, decision-skill, or scoring policy.");
  const requiredFormats = formatMinimums, requiredSkills = skillMinimums;
  const formatKeys = ["choice_single", "choice_multiple", "decision_matrix"] as const;
  const skillKeys = ["knowledge", "diagnosis", "prerequisite", "next_action", "contextual_choice"] as const;
  const minimums = [...formatKeys.map((key) => ["format", key, requiredFormats[key]] as const), ...skillKeys.map((key) => ["skill", key, requiredSkills[key]] as const)];
  if (minimums.some(([, , minimum]) => !Number.isSafeInteger(minimum) || minimum < 0) || minimums.reduce((sum, [, , minimum]) => sum + minimum, 0) < 0) throw new Error("Certification simulation coverage minima are invalid.");
  if ([...formatKeys].reduce((sum, key) => sum + requiredFormats[key], 0) > targetCount || [...skillKeys].reduce((sum, key) => sum + requiredSkills[key], 0) > targetCount) throw new Error("Certification simulation format or skill minima exceed the configured question count.");

  const selected: TrainingQuestionSummary[] = [];
  const selectedIds = new Set<string>();
  const selectedFormat = new Map<string, number>();
  const selectedSkill = new Map<string, number>();
  const domainCounts = new Map<string, number>();
  const blockedIds = new Set<string>();
  const candidatePool = [...byDomain.values()].flat();
  const caseRecipeByQuestionId = new Map<string, string>();
  for (const candidate of candidatePool) {
    if (!candidate.caseRecipe) continue;
    for (const step of candidate.caseRecipe.steps) caseRecipeByQuestionId.set(step.questionId, candidate.caseRecipe.caseId);
  }
  const selectedCaseRecipeIds = new Set<string>();
  const selectedScenarioFamilyIds = new Set<string>();
  const formatPoolSizes = new Map<string, number>();
  const skillPoolSizes = new Map<string, number>();
  for (const question of candidatePool) {
    formatPoolSizes.set(question.interactionType, (formatPoolSizes.get(question.interactionType) ?? 0) + 1);
    if (question.examMetadata) {
      const skill = question.examMetadata.decisionSkill;
      skillPoolSizes.set(skill, (skillPoolSizes.get(skill) ?? 0) + 1);
    }
  }
  for (const [kind, key, minimum] of minimums) {
    const matching = candidatePool.filter((question) => (kind === "format" ? question.interactionType === key : question.examMetadata?.decisionSkill === key));
    const available = new Set(matching.map((question) => question.examMetadata?.scenarioFamilyId ?? `question:${question.questionId}`)).size;
    if (available < minimum) throw new Error(`Certification simulation ${kind} ${key} requires ${minimum} items but has ${available}.`);
  }
  const coversDeficit = (question: TrainingQuestionSummary) =>
    (requiredFormats[question.interactionType as keyof typeof requiredFormats] ?? 0) > (selectedFormat.get(question.interactionType) ?? 0) ||
    (question.examMetadata !== undefined && requiredSkills[question.examMetadata.decisionSkill] > (selectedSkill.get(question.examMetadata.decisionSkill) ?? 0));
  const allowed = (question: TrainingQuestionSummary) => {
    const quota = quotas.find((entry) => entry.contentDomainId === question.contentDomainId);
    return quota !== undefined && (domainCounts.get(quota.contentDomainId) ?? 0) < quota.questionCount && !selectedIds.has(question.questionId) && !blockedIds.has(question.questionId) && !(question.questionRelation && selectedIds.has(question.questionRelation.counterpartQuestionId)) && (!question.examMetadata?.scenarioFamilyId || !selectedScenarioFamilyIds.has(question.examMetadata.scenarioFamilyId)) && (!caseRecipeByQuestionId.has(question.questionId) || !selectedCaseRecipeIds.has(caseRecipeByQuestionId.get(question.questionId)!));
  };
  while (minimums.some(([kind, key, minimum]) => (kind === "format" ? selectedFormat.get(key) ?? 0 : selectedSkill.get(key) ?? 0) < minimum)) {
    let next: TrainingQuestionSummary | undefined;
    let nextScore = Number.NEGATIVE_INFINITY;
    for (const candidate of candidatePool) {
      if (!allowed(candidate) || !coversDeficit(candidate)) continue;
      const score = coverageScore(candidate);
      if (score > nextScore || (score === nextScore && next !== undefined && byId(candidate, next) < 0)) {
        next = candidate;
        nextScore = score;
      }
    }
    if (!next) throw new Error("Certification simulation answer-format, decision-skill, and domain quotas cannot be satisfied together.");
    add(next);
  }
  for (const quota of quotas) {
    for (const candidate of byDomain.get(quota.contentDomainId) ?? []) {
      if ((domainCounts.get(quota.contentDomainId) ?? 0) >= quota.questionCount) break;
      if (allowed(candidate)) add(candidate);
    }
    if ((domainCounts.get(quota.contentDomainId) ?? 0) !== quota.questionCount) throw new Error(`Certification simulation domain ${quota.contentDomainId} quota cannot be filled without duplicate or linked questions.`);
  }
  if (selected.length !== targetCount || new Set(selected.map((question) => question.questionId)).size !== targetCount || minimums.some(([kind, key, minimum]) => (kind === "format" ? selectedFormat.get(key) ?? 0 : selectedSkill.get(key) ?? 0) < minimum)) throw new Error("Certification simulation coverage profile was not fulfilled.");
  return Object.freeze(mixExamOrder(selected, profile.profileId, profile.profileVersion));

  function add(question: TrainingQuestionSummary): void {
    selected.push(question);
    selectedIds.add(question.questionId);
    const caseRecipeId = caseRecipeByQuestionId.get(question.questionId);
    if (caseRecipeId) selectedCaseRecipeIds.add(caseRecipeId);
    if (question.examMetadata?.scenarioFamilyId) selectedScenarioFamilyIds.add(question.examMetadata.scenarioFamilyId);
    const domain = question.contentDomainId!;
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    selectedFormat.set(question.interactionType, (selectedFormat.get(question.interactionType) ?? 0) + 1);
    if (question.examMetadata) selectedSkill.set(question.examMetadata.decisionSkill, (selectedSkill.get(question.examMetadata.decisionSkill) ?? 0) + 1);
    if (question.questionRelation) blockedIds.add(question.questionRelation.counterpartQuestionId);
  }
  function coverageScore(question: TrainingQuestionSummary): number {
    const formatNeed = requiredFormats[question.interactionType as keyof typeof requiredFormats] ?? 0;
    const skillNeed = question.examMetadata ? requiredSkills[question.examMetadata.decisionSkill] : 0;
    const formatDeficit = (selectedFormat.get(question.interactionType) ?? 0) < formatNeed;
    const skillDeficit = question.examMetadata !== undefined && (selectedSkill.get(question.examMetadata.decisionSkill) ?? 0) < skillNeed;
    const formatPool = formatDeficit ? formatPoolSizes.get(question.interactionType) ?? 0 : 0;
    const skillPool = skillDeficit && question.examMetadata ? skillPoolSizes.get(question.examMetadata.decisionSkill) ?? 0 : 0;
    return (formatDeficit ? 1 / formatPool : 0) + (skillDeficit ? 1 / skillPool : 0);
  }
}

function mixExamOrder(items: readonly TrainingQuestionSummary[], profileId: string, profileVersion: string): TrainingQuestionSummary[] {
  const formats = ["choice_single", "choice_multiple", "decision_matrix"] as const;
  const groups = new Map(formats.map((format) => [format, items.filter((item) => item.interactionType === format).slice()]));
  const totals = new Map(formats.map((format) => [format, groups.get(format)!.length]));
  const used = new Map(formats.map((format) => [format, 0]));
  const ordered: TrainingQuestionSummary[] = [];
  while (ordered.length < items.length) {
    const nextIndex = ordered.length + 1;
    const format = formats.filter((candidate) => (groups.get(candidate)?.length ?? 0) > 0)
      .sort((left, right) => ((nextIndex * totals.get(right)! / items.length) - (used.get(right) ?? 0)) - ((nextIndex * totals.get(left)! / items.length) - (used.get(left) ?? 0)) || formats.indexOf(left) - formats.indexOf(right))[0]!;
    const previous = ordered.at(-1);
    const candidates = groups.get(format)!;
    candidates.sort((left, right) => {
      const score = (question: TrainingQuestionSummary) => previous
        ? Number(question.contentDomainId === previous.contentDomainId) * 20 + Number(question.mentalUnitId === previous.mentalUnitId) * 50 + Number(question.examMetadata?.decisionSkill === previous.examMetadata?.decisionSkill) * 5
        : 0;
      return score(left) - score(right) || stableOrderKey(profileId, profileVersion, left.questionId) - stableOrderKey(profileId, profileVersion, right.questionId) || byId(left, right);
    });
    ordered.push(candidates.shift()!);
    used.set(format, (used.get(format) ?? 0) + 1);
  }
  return ordered;
}

function stableOrderKey(profileId: string, profileVersion: string, questionId: string): number {
  let hash = 0x811c9dc5;
  for (const character of `${profileId}:${profileVersion}:${questionId}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function byId(left: TrainingQuestionSummary, right: TrainingQuestionSummary): number { return left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0; }
