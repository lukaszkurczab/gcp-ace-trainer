import {
  ALGORITHM_COMPLEXITY_CLASSES,
  ALGORITHM_DIFFICULTIES,
  ALGORITHM_FEEDBACK_RESULTS,
  ALGORITHM_TRAINING_ITEM_TYPES,
  isAlgorithmMistakeType,
  type AlgorithmTrainingItem,
} from "./algorithmContentTypes";
import type { AlgorithmRoadmapTrack } from "./algorithmRoadmap";
import {
  ALGORITHM_PATTERN_FAMILIES,
  ALGORITHM_PATTERN_VARIANTS,
  ALGORITHM_PROBLEM_ARCHETYPES,
  ALGORITHM_SKILL_ATOMS,
} from "./algorithmTaxonomy";

export type AlgorithmContentQualityIssueCode =
  | "invalid_item"
  | "missing_item_id"
  | "missing_track_id"
  | "missing_item_type"
  | "invalid_item_type"
  | "missing_title"
  | "missing_prompt"
  | "missing_difficulty"
  | "invalid_difficulty"
  | "missing_primary_skill"
  | "multiple_primary_skills"
  | "too_many_secondary_skills"
  | "invalid_secondary_skills"
  | "missing_taxonomy_refs"
  | "missing_feedback_model"
  | "missing_feedback_result"
  | "invalid_feedback_result"
  | "missing_feedback_mental_model_correction"
  | "missing_feedback_decision_signal"
  | "generic_feedback_text"
  | "invalid_feedback_distractor_explanations"
  | "missing_feedback_distractor_explanation"
  | "duplicate_feedback_distractor_explanation"
  | "missing_feedback_mistake_types"
  | "invalid_feedback_mistake_type"
  | "missing_feedback_next_action"
  | "missing_content_version"
  | "invalid_static_micro_check"
  | "missing_approach_id"
  | "missing_mechanics_summary"
  | "missing_when_to_use_signals"
  | "missing_invariant"
  | "missing_pseudocode"
  | "missing_pitfalls"
  | "missing_static_micro_check"
  | "missing_expected_approaches"
  | "missing_acceptable_approaches"
  | "missing_rejected_approaches"
  | "missing_reason_signal"
  | "missing_constraint_signal"
  | "missing_problem_statement"
  | "missing_constraints"
  | "missing_approach_choice_reason"
  | "missing_step_by_step_trace"
  | "missing_why_not_alternatives"
  | "missing_common_mistakes"
  | "missing_expected_time_complexity"
  | "missing_expected_space_complexity"
  | "invalid_complexity_class"
  | "invalid_complexity_variables"
  | "missing_complexity_explanation"
  | "missing_worked_example_subgoals"
  | "missing_worked_example_solution"
  | "missing_worked_example_static_micro_check"
  | "unknown_primary_skill"
  | "unknown_secondary_skill"
  | "unknown_micro_check_skill"
  | "primary_skill_taxonomy_mismatch"
  | "active_item_references_unknown_roadmap_node"
  | "unknown_taxonomy_ref"
  | "forbidden_model_term"
  | "available_roadmap_node_below_minimum_active_items"
  | "selectable_item_unsupported_by_enabled_mode";

export type AlgorithmContentQualityIssue = {
  code: AlgorithmContentQualityIssueCode;
  itemId?: string;
  message: string;
};

export type AlgorithmContentQualityResult = {
  issues: AlgorithmContentQualityIssue[];
  valid: boolean;
};

export const ALGORITHM_FORBIDDEN_MODEL_TERMS = [
  "readiness",
  "retention",
  "mastery",
  "streak",
  "leaderboard",
  "leetcode",
  "ai-generated",
  "llm-generated",
  "mock",
  "demo",
  "legacy",
  "compatibility",
  "migration",
  "alias",
  "temporary",
  "provisional",
  "placeholder",
  "fallback",
  "draft",
] as const;

export function validateAlgorithmTrainingItem(item: unknown): AlgorithmContentQualityResult {
  const issues: AlgorithmContentQualityIssue[] = [];

  if (!isRecord(item)) {
    return {
      issues: [
        {
          code: "invalid_item",
          message: "Algorithm training item must be an object.",
        },
      ],
      valid: false,
    };
  }

  const itemId = readOptionalString(item.id);
  validateBaseTrainingItemContract(item, issues, itemId);
  validateTaxonomyRefs(item as AlgorithmTrainingItem, issues);
  validateComplexityMetadata(item, issues, itemId);
  validateAlgorithmVisibleValues(item, issues, itemId);

  if (item.type === "approach_primer") {
    validateApproachPrimerContract(item, issues, itemId);
  }

  if (item.type === "strategy_choice") {
    validateStrategyChoiceContract(item, issues, itemId);
  }

  if (item.type === "complexity_check") {
    validateComplexityCheckContract(item, issues, itemId);
  }

  if (item.type === "worked_example") {
    validateWorkedExampleContract(item, issues, itemId);
  }

  return {
    issues,
    valid: issues.length === 0,
  };
}

export function validateAlgorithmTrainingItems(
  items: readonly unknown[],
): AlgorithmContentQualityResult {
  const issues = items.flatMap((item) => validateAlgorithmTrainingItem(item).issues);

  return {
    issues,
    valid: issues.length === 0,
  };
}

export function validateAlgorithmCurriculum(input: {
  enabledSessionModes: readonly {
    id: string;
    supportedItemTypes: readonly string[];
  }[];
  items: readonly AlgorithmTrainingItem[];
  roadmap: AlgorithmRoadmapTrack;
}): AlgorithmContentQualityResult {
  const issues = validateAlgorithmTrainingItems(input.items).issues;
  const activeItems = input.items.filter((item) => item.status === "active");
  const skillAtomIds = new Set<string>(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));
  const roadmapNodesById = new Map(input.roadmap.nodes.map((node) => [node.id, node]));
  const selectableActiveItemTypes = new Set<string>();

  for (const item of activeItems) {
    if (!skillAtomIds.has(item.primarySkillAtomId)) {
      addIssue(
        issues,
        "unknown_primary_skill",
        `Algorithm item references unknown primary skill atom: ${item.primarySkillAtomId}.`,
        item.id,
      );
    }

    for (const secondarySkillAtomId of item.secondarySkillAtomIds ?? []) {
      if (!skillAtomIds.has(secondarySkillAtomId)) {
        addIssue(
          issues,
          "unknown_secondary_skill",
          `Algorithm item references unknown secondary skill atom: ${secondarySkillAtomId}.`,
          item.id,
        );
      }
    }

    for (const check of item.staticMicroChecks ?? []) {
      for (const testedSkillAtomId of check.testedSkillAtomIds) {
        if (!skillAtomIds.has(testedSkillAtomId)) {
          addIssue(
            issues,
            "unknown_micro_check_skill",
            `Algorithm micro-check references unknown skill atom: ${testedSkillAtomId}.`,
            item.id,
          );
        }
      }
    }

    const roadmapNode = item.roadmapNodeId ? roadmapNodesById.get(item.roadmapNodeId) : undefined;

    if (!roadmapNode) {
      addIssue(
        issues,
        "active_item_references_unknown_roadmap_node",
        `Algorithm item references unknown roadmap node: ${String(item.roadmapNodeId)}.`,
        item.id,
      );
    } else {
      selectableActiveItemTypes.add(item.type);
    }
  }

  for (const node of input.roadmap.nodes) {
    const itemCount = activeItems.filter((item) => item.roadmapNodeId === node.id).length;
    if (itemCount < node.minimumActiveItemCount) {
      addIssue(
        issues,
        "available_roadmap_node_below_minimum_active_items",
        `Available roadmap node ${node.id} has ${itemCount} active items; expected at least ${node.minimumActiveItemCount}.`,
      );
    }
  }

  for (const itemType of selectableActiveItemTypes) {
    if (!input.enabledSessionModes.some((mode) => mode.supportedItemTypes.includes(itemType))) {
      addIssue(
        issues,
        "selectable_item_unsupported_by_enabled_mode",
        `No enabled Algorithms session mode supports selectable item type: ${itemType}.`,
      );
    }
  }

  return {
    issues,
    valid: issues.length === 0,
  };
}

export function assertValidAlgorithmTrainingItem(
  item: AlgorithmTrainingItem,
): asserts item is AlgorithmTrainingItem {
  const result = validateAlgorithmTrainingItem(item);

  if (!result.valid) {
    throw new Error(result.issues.map((issue) => issue.message).join("; "));
  }
}

function validateBaseTrainingItemContract(
  item: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyString(item.id)) {
    addIssue(issues, "missing_item_id", "Algorithm item must include a stable id.", itemId);
  }

  if (item.trackId !== "algorithms") {
    addIssue(issues, "missing_track_id", "Algorithm item must set trackId to algorithms.", itemId);
  }

  if (!isNonEmptyString(item.type)) {
    addIssue(issues, "missing_item_type", "Algorithm item must include type.", itemId);
  } else if (!isAlgorithmTrainingItemType(item.type)) {
    addIssue(issues, "invalid_item_type", "Algorithm item type must be a canonical Algorithms item type.", itemId);
  }

  if (!isNonEmptyString(item.title)) {
    addIssue(issues, "missing_title", "Algorithm item must include title.", itemId);
  }

  if (!isNonEmptyString(item.prompt)) {
    addIssue(issues, "missing_prompt", "Algorithm item must include prompt.", itemId);
  }

  if (!isNonEmptyString(item.difficulty)) {
    addIssue(issues, "missing_difficulty", "Algorithm item must include difficulty.", itemId);
  } else if (!(ALGORITHM_DIFFICULTIES as readonly string[]).includes(item.difficulty)) {
    addIssue(
      issues,
      "invalid_difficulty",
      `Algorithm item difficulty must be one of: ${ALGORITHM_DIFFICULTIES.join(", ")}.`,
      itemId,
    );
  }

  if (Array.isArray(item.primarySkillAtomId)) {
    addIssue(issues, "multiple_primary_skills", "Algorithm item must have exactly one primary skill atom.", itemId);
  } else if (!isNonEmptyString(item.primarySkillAtomId)) {
    addIssue(issues, "missing_primary_skill", "Algorithm item must have one primarySkillAtomId.", itemId);
  }

  if (item.secondarySkillAtomIds !== undefined) {
    if (!isStringArray(item.secondarySkillAtomIds)) {
      addIssue(issues, "invalid_secondary_skills", "secondarySkillAtomIds must be a string array.", itemId);
    } else if (item.secondarySkillAtomIds.length > 3) {
      addIssue(issues, "too_many_secondary_skills", "Algorithm item can have no more than three secondary skills.", itemId);
    }
  }

  if (!Array.isArray(item.taxonomyRefs) || item.taxonomyRefs.length === 0) {
    addIssue(issues, "missing_taxonomy_refs", "Algorithm item must include taxonomyRefs.", itemId);
  }

  if (!isRecord(item.feedbackModel)) {
    addIssue(issues, "missing_feedback_model", "Algorithm item must include feedbackModel.", itemId);
  } else {
    validateFeedbackModel(item.feedbackModel, item.staticMicroChecks, issues, itemId);
  }

  if (!isNonEmptyString(item.contentVersion)) {
    addIssue(issues, "missing_content_version", "Algorithm item must include contentVersion.", itemId);
  }

  if (item.status === "active" && !hasActiveStaticMicroCheck(item)) {
    addIssue(issues, "missing_static_micro_check", "Active algorithm item requires at least one active static micro-check.", itemId);
  }

  if (item.staticMicroChecks !== undefined) {
    validateStaticMicroChecks(item.staticMicroChecks, issues, itemId);
  }
}

function validateTaxonomyRefs(
  item: AlgorithmTrainingItem,
  issues: AlgorithmContentQualityIssue[],
): void {
  const taxonomyIdsByAxis: Partial<Record<string, ReadonlySet<string>>> = {
    learning_stage: new Set([
      "foundations",
      "pattern_mechanics",
      "guided_application",
      "strategy_selection",
      "contrast_practice",
      "independent_attempt",
      "mixed_interview_practice",
    ]),
    pattern_family: new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id)),
    pattern_variant: new Set(ALGORITHM_PATTERN_VARIANTS.map((variant) => variant.id)),
    problem_archetype: new Set(ALGORITHM_PROBLEM_ARCHETYPES.map((archetype) => archetype.id)),
    skill_atom: new Set(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id)),
  };

  for (const taxonomyRef of item.taxonomyRefs) {
    if (taxonomyRef.axisId === "mistake_type") {
      if (!isAlgorithmMistakeType(taxonomyRef.nodeId)) {
        addIssue(
          issues,
          "unknown_taxonomy_ref",
          `Algorithm item references unknown mistake taxonomy node: ${taxonomyRef.nodeId}.`,
          item.id,
        );
      }
      continue;
    }

    const knownIds = taxonomyIdsByAxis[taxonomyRef.axisId];
    if (knownIds && !knownIds.has(taxonomyRef.nodeId)) {
      addIssue(
        issues,
        "unknown_taxonomy_ref",
        `Algorithm item references unknown ${taxonomyRef.axisId} taxonomy node: ${taxonomyRef.nodeId}.`,
        item.id,
      );
    }
  }

  const primarySkillRefs = item.taxonomyRefs.filter(
    (taxonomyRef) => taxonomyRef.axisId === "skill_atom" && taxonomyRef.role === "primary",
  );

  if (
    primarySkillRefs.length !== 1 ||
    primarySkillRefs[0]?.nodeId !== item.primarySkillAtomId
  ) {
    addIssue(
      issues,
      "primary_skill_taxonomy_mismatch",
      "Algorithm item must include exactly one primary skill_atom taxonomy ref matching primarySkillAtomId.",
      item.id,
    );
  }
}

function validateAlgorithmVisibleValues(
  value: unknown,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  const serialized = JSON.stringify(value).toLowerCase();

  for (const forbiddenTerm of ALGORITHM_FORBIDDEN_MODEL_TERMS) {
    if (serialized.includes(forbiddenTerm)) {
      addIssue(
        issues,
        "forbidden_model_term",
        `Algorithm content includes blocked term: ${forbiddenTerm}.`,
        itemId,
      );
    }
  }
}

function validateComplexityMetadata(
  item: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  validateOptionalComplexityClass(item.expectedTimeComplexity, "expectedTimeComplexity", issues, itemId);
  validateOptionalComplexityClass(item.expectedSpaceComplexity, "expectedSpaceComplexity", issues, itemId);
  validateComplexityVariables(item.complexityVariables, issues, itemId);

  if (isRecord(item.solution)) {
    validateOptionalComplexityClass(item.solution.timeComplexity, "solution.timeComplexity", issues, itemId);
    validateOptionalComplexityClass(item.solution.spaceComplexity, "solution.spaceComplexity", issues, itemId);
    validateComplexityVariables(item.solution.complexityVariables, issues, itemId);
  }
}

function validateOptionalComplexityClass(
  value: unknown,
  fieldName: string,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (value === undefined) {
    return;
  }

  if (!isAlgorithmComplexityClass(value)) {
    addIssue(
      issues,
      "invalid_complexity_class",
      `${fieldName} must be one of: ${ALGORITHM_COMPLEXITY_CLASSES.join(", ")}.`,
      itemId,
    );
  }
}

function validateComplexityVariables(
  value: unknown,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value) || Object.keys(value).length === 0) {
    addIssue(issues, "invalid_complexity_variables", "complexityVariables must be a non-empty object.", itemId);
    return;
  }

  for (const [variableName, variableDescription] of Object.entries(value)) {
    if (!isNonEmptyString(variableName) || !isNonEmptyString(variableDescription)) {
      addIssue(
        issues,
        "invalid_complexity_variables",
        "complexityVariables must map non-empty variable names to non-empty descriptions.",
        itemId,
      );
    }
  }
}

function validateFeedbackModel(
  feedbackModel: Record<string, unknown>,
  staticMicroChecks: unknown,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyString(feedbackModel.result)) {
    addIssue(issues, "missing_feedback_result", "feedbackModel.result is required.", itemId);
  } else if (!(ALGORITHM_FEEDBACK_RESULTS as readonly string[]).includes(feedbackModel.result)) {
    addIssue(
      issues,
      "invalid_feedback_result",
      `feedbackModel.result must be one of: ${ALGORITHM_FEEDBACK_RESULTS.join(", ")}.`,
      itemId,
    );
  }

  if (!isNonEmptyString(feedbackModel.mentalModelCorrection)) {
    addIssue(
      issues,
      "missing_feedback_mental_model_correction",
      "feedbackModel.mentalModelCorrection is required.",
      itemId,
    );
  } else if (isGenericFeedbackText(feedbackModel.mentalModelCorrection)) {
    addIssue(issues, "generic_feedback_text", "feedbackModel.mentalModelCorrection is too generic.", itemId);
  }

  if (!isNonEmptyString(feedbackModel.decisionSignal)) {
    addIssue(issues, "missing_feedback_decision_signal", "feedbackModel.decisionSignal is required.", itemId);
  } else if (isGenericFeedbackText(feedbackModel.decisionSignal)) {
    addIssue(issues, "generic_feedback_text", "feedbackModel.decisionSignal is too generic.", itemId);
  }

  if (!Array.isArray(feedbackModel.mistakeTypes) || feedbackModel.mistakeTypes.length === 0) {
    addIssue(issues, "missing_feedback_mistake_types", "feedbackModel.mistakeTypes is required.", itemId);
  } else {
    for (const mistakeType of feedbackModel.mistakeTypes) {
      if (!isAlgorithmMistakeType(mistakeType)) {
        addIssue(
          issues,
          "invalid_feedback_mistake_type",
          `Unsupported algorithm mistake type: ${String(mistakeType)}.`,
          itemId,
        );
      }
    }
  }

  if (!isNonEmptyString(feedbackModel.nextAction)) {
    addIssue(issues, "missing_feedback_next_action", "feedbackModel.nextAction is required.", itemId);
  } else if (isGenericFeedbackText(feedbackModel.nextAction)) {
    addIssue(issues, "generic_feedback_text", "feedbackModel.nextAction is too generic.", itemId);
  }

  validateDistractorExplanations(feedbackModel, staticMicroChecks, issues, itemId);
}

function validateDistractorExplanations(
  feedbackModel: Record<string, unknown>,
  staticMicroChecks: unknown,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!Array.isArray(staticMicroChecks)) {
    return;
  }

  const distractorExplanations = feedbackModel.distractorExplanations;

  for (const check of staticMicroChecks) {
    if (!isRecord(check) || check.status !== "active" || !Array.isArray(check.options)) {
      continue;
    }

    const correctOptionIds = getCorrectOptionIds(check.correctAnswer);
    if (correctOptionIds.size === 0) {
      continue;
    }

    const distractorOptionIds = check.options
      .filter((option): option is { id: string; text?: unknown } => isRecord(option) && isNonEmptyString(option.id))
      .map((option) => option.id)
      .filter((optionId) => !correctOptionIds.has(optionId));

    if (distractorOptionIds.length === 0) {
      continue;
    }

    if (!isRecord(distractorExplanations)) {
      addIssue(
        issues,
        "invalid_feedback_distractor_explanations",
        "feedbackModel.distractorExplanations must explain every incorrect option.",
        itemId,
      );
      continue;
    }

    const normalizedExplanations = new Set<string>();

    for (const optionId of distractorOptionIds) {
      const explanation = distractorExplanations[optionId];

      if (!isNonEmptyString(explanation)) {
        addIssue(
          issues,
          "missing_feedback_distractor_explanation",
          `feedbackModel.distractorExplanations must explain incorrect option ${optionId}.`,
          itemId,
        );
      } else if (isGenericFeedbackText(explanation)) {
        addIssue(
          issues,
          "generic_feedback_text",
          `feedbackModel.distractorExplanations.${optionId} is too generic.`,
          itemId,
        );
      } else {
        const normalizedExplanation = normalizeFeedbackText(explanation);

        if (normalizedExplanations.has(normalizedExplanation)) {
          addIssue(
            issues,
            "duplicate_feedback_distractor_explanation",
            "feedbackModel.distractorExplanations must explain each incorrect option distinctly.",
            itemId,
          );
        }

        normalizedExplanations.add(normalizedExplanation);
      }
    }
  }
}

function validateApproachPrimerContract(
  item: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyString(item.approachId)) {
    addIssue(issues, "missing_approach_id", "approach_primer requires approachId.", itemId);
  }

  if (!isNonEmptyString(item.mechanicsSummary)) {
    addIssue(issues, "missing_mechanics_summary", "approach_primer requires mechanicsSummary.", itemId);
  }

  if (!isNonEmptyStringArray(item.whenToUseSignals)) {
    addIssue(issues, "missing_when_to_use_signals", "approach_primer requires whenToUseSignals.", itemId);
  }

  if (!isRecord(item.invariant)) {
    addIssue(issues, "missing_invariant", "approach_primer requires invariant.", itemId);
  }

  if (!hasPseudocode(item)) {
    addIssue(issues, "missing_pseudocode", "approach_primer requires pseudocodeTemplate or pseudocodeLines.", itemId);
  }

  if (!Array.isArray(item.pitfalls) || item.pitfalls.length === 0) {
    addIssue(issues, "missing_pitfalls", "approach_primer requires pitfalls.", itemId);
  }

  if (!hasActiveStaticMicroCheck(item)) {
    addIssue(issues, "missing_static_micro_check", "approach_primer requires at least one active static micro-check.", itemId);
  }
}

function validateStrategyChoiceContract(
  item: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyStringArray(item.expectedApproachIds)) {
    addIssue(issues, "missing_expected_approaches", "strategy_choice requires expectedApproachIds.", itemId);
  }

  if (!Array.isArray(item.acceptableApproachIds) || !isStringArray(item.acceptableApproachIds)) {
    addIssue(
      issues,
      "missing_acceptable_approaches",
      "strategy_choice requires acceptableApproachIds, even when empty.",
      itemId,
    );
  }

  if (!isNonEmptyStringArray(item.rejectedApproachIds)) {
    addIssue(issues, "missing_rejected_approaches", "strategy_choice requires rejectedApproachIds.", itemId);
  }

  if (!isNonEmptyString(item.reasonSignal)) {
    addIssue(issues, "missing_reason_signal", "strategy_choice requires reasonSignal.", itemId);
  }

  if (!isNonEmptyString(item.constraintSignal)) {
    addIssue(issues, "missing_constraint_signal", "strategy_choice requires constraintSignal.", itemId);
  }
}

function validateComplexityCheckContract(
  item: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyString(item.expectedTimeComplexity)) {
    addIssue(
      issues,
      "missing_expected_time_complexity",
      "complexity_check requires expectedTimeComplexity.",
      itemId,
    );
  }

  if (!isNonEmptyString(item.expectedSpaceComplexity)) {
    addIssue(
      issues,
      "missing_expected_space_complexity",
      "complexity_check requires expectedSpaceComplexity.",
      itemId,
    );
  }

  if (!isNonEmptyString(item.complexityExplanation)) {
    addIssue(issues, "missing_complexity_explanation", "complexity_check requires complexityExplanation.", itemId);
  }
}

function validateWorkedExampleContract(
  item: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyString(item.problemStatement)) {
    addIssue(issues, "missing_problem_statement", "worked_example requires problemStatement.", itemId);
  }

  if (!isNonEmptyStringArray(item.constraints)) {
    addIssue(issues, "missing_constraints", "worked_example requires constraints.", itemId);
  }

  if (!isNonEmptyString(item.approachId)) {
    addIssue(issues, "missing_approach_id", "worked_example requires approachId.", itemId);
  }

  if (!isNonEmptyString(item.approachChoiceReason)) {
    addIssue(issues, "missing_approach_choice_reason", "worked_example requires approachChoiceReason.", itemId);
  }

  if (!Array.isArray(item.subgoals) || item.subgoals.length === 0) {
    addIssue(issues, "missing_worked_example_subgoals", "worked_example requires subgoals.", itemId);
  }

  if (!Array.isArray(item.stepByStepTrace) || item.stepByStepTrace.length === 0) {
    addIssue(issues, "missing_step_by_step_trace", "worked_example requires stepByStepTrace.", itemId);
  }

  if (!hasPseudocode(item)) {
    addIssue(issues, "missing_pseudocode", "worked_example requires pseudocodeTemplate or pseudocodeLines.", itemId);
  }

  if (!isNonEmptyString(item.expectedTimeComplexity)) {
    addIssue(
      issues,
      "missing_expected_time_complexity",
      "worked_example requires expectedTimeComplexity.",
      itemId,
    );
  }

  if (!isNonEmptyString(item.expectedSpaceComplexity)) {
    addIssue(
      issues,
      "missing_expected_space_complexity",
      "worked_example requires expectedSpaceComplexity.",
      itemId,
    );
  }

  if (!isNonEmptyString(item.complexityExplanation)) {
    addIssue(issues, "missing_complexity_explanation", "worked_example requires complexityExplanation.", itemId);
  }

  if (!Array.isArray(item.whyNotAlternatives) || item.whyNotAlternatives.length === 0) {
    addIssue(issues, "missing_why_not_alternatives", "worked_example requires whyNotAlternatives.", itemId);
  }

  if (!Array.isArray(item.commonMistakes) || item.commonMistakes.length === 0) {
    addIssue(issues, "missing_common_mistakes", "worked_example requires commonMistakes.", itemId);
  }

  if (!isRecord(item.solution)) {
    addIssue(issues, "missing_worked_example_solution", "worked_example requires solution.", itemId);
  }

  if (!hasActiveStaticMicroCheck(item)) {
    addIssue(
      issues,
      "missing_worked_example_static_micro_check",
      "worked_example requires at least one active static micro-check.",
      itemId,
    );
  }
}

function hasPseudocode(item: Record<string, unknown>): boolean {
  const hasTemplate =
    isRecord(item.pseudocodeTemplate) &&
    Array.isArray(item.pseudocodeTemplate.lines) &&
    item.pseudocodeTemplate.lines.length > 0;
  const hasLines = Array.isArray(item.pseudocodeLines) && item.pseudocodeLines.length > 0;

  return hasTemplate || hasLines;
}

function hasActiveStaticMicroCheck(item: Record<string, unknown>): boolean {
  return (
    Array.isArray(item.staticMicroChecks) &&
    item.staticMicroChecks.some((check) => isRecord(check) && check.status === "active")
  );
}

function validateStaticMicroChecks(
  staticMicroChecks: unknown,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!Array.isArray(staticMicroChecks)) {
    addIssue(issues, "invalid_static_micro_check", "staticMicroChecks must be an array.", itemId);
    return;
  }

  for (const check of staticMicroChecks) {
    if (!isRecord(check)) {
      addIssue(issues, "invalid_static_micro_check", "Each static micro-check must be an object.", itemId);
      continue;
    }

    if (
      !isNonEmptyString(check.id) ||
      !isNonEmptyString(check.type) ||
      !isNonEmptyString(check.prompt) ||
      !hasStaticAnswer(check.correctAnswer) ||
      !isNonEmptyString(check.feedback) ||
      !isStringArray(check.testedSkillAtomIds) ||
      check.testedSkillAtomIds.length === 0 ||
      !Array.isArray(check.mistakeTypes) ||
      check.mistakeTypes.length === 0 ||
      !isNonEmptyString(check.status)
    ) {
      addIssue(issues, "invalid_static_micro_check", "Static micro-check is missing required static fields.", itemId);
    }

    if (isNonEmptyString(check.feedback) && isGenericFeedbackText(check.feedback)) {
      addIssue(issues, "generic_feedback_text", "Static micro-check feedback is too generic.", itemId);
    }

    if (Array.isArray(check.options)) {
      validateStaticMicroCheckOptions(check, issues, itemId);
    }

    if (
      Array.isArray(check.mistakeTypes) &&
      check.mistakeTypes.some((mistakeType) => !isAlgorithmMistakeType(mistakeType))
    ) {
      addIssue(issues, "invalid_static_micro_check", "Static micro-check includes an unsupported mistake type.", itemId);
    }

    if (check.type === "complexity_pair" && !isComplexityPairAnswer(check.correctAnswer)) {
      addIssue(
        issues,
        "invalid_static_micro_check",
        `Static micro-check complexity_pair answers must use supported complexity classes: ${ALGORITHM_COMPLEXITY_CLASSES.join(", ")}.`,
        itemId,
      );
    }
  }
}

function validateStaticMicroCheckOptions(
  check: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  const options = check.options;
  if (!Array.isArray(options)) {
    return;
  }

  const optionIds = new Set<string>();

  for (const option of options) {
    if (!isRecord(option) || !isNonEmptyString(option.id) || !isNonEmptyString(option.text)) {
      addIssue(issues, "invalid_static_micro_check", "Static micro-check options require id and text.", itemId);
      continue;
    }

    if (optionIds.has(option.id)) {
      addIssue(issues, "invalid_static_micro_check", `Static micro-check duplicates option id ${option.id}.`, itemId);
    }

    optionIds.add(option.id);
  }

  for (const correctOptionId of getCorrectOptionIds(check.correctAnswer)) {
    if (!optionIds.has(correctOptionId)) {
      addIssue(
        issues,
        "invalid_static_micro_check",
        `Static micro-check correctAnswer references unknown option ${correctOptionId}.`,
        itemId,
      );
    }
  }
}

function addIssue(
  issues: AlgorithmContentQualityIssue[],
  code: AlgorithmContentQualityIssueCode,
  message: string,
  itemId?: string,
): void {
  issues.push({
    code,
    itemId,
    message,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return isStringArray(value) && value.length > 0;
}

function hasStaticAnswer(value: unknown): boolean {
  return isNonEmptyString(value) || isNonEmptyStringArray(value) || isComplexityPairAnswer(value);
}

function getCorrectOptionIds(value: unknown): ReadonlySet<string> {
  if (isNonEmptyString(value)) {
    return new Set([value]);
  }

  if (isNonEmptyStringArray(value)) {
    return new Set(value);
  }

  return new Set();
}

function isComplexityPairAnswer(value: unknown): boolean {
  return (
    isRecord(value) &&
    isAlgorithmComplexityClass(value.time) &&
    isAlgorithmComplexityClass(value.space)
  );
}

function isAlgorithmComplexityClass(value: unknown): boolean {
  return (ALGORITHM_COMPLEXITY_CLASSES as readonly unknown[]).includes(value);
}

function isAlgorithmTrainingItemType(value: unknown): boolean {
  return (ALGORITHM_TRAINING_ITEM_TYPES as readonly unknown[]).includes(value);
}

function isGenericFeedbackText(value: string): boolean {
  const normalized = normalizeFeedbackText(value);

  return [
    "correct because this is correct",
    "this is correct",
    "that is correct",
    "incorrect because this is incorrect",
    "try again",
    "good job",
  ].includes(normalized);
}

function normalizeFeedbackText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/g, "");
}
