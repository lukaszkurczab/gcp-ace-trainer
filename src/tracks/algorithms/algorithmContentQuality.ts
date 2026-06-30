import {
  isAlgorithmMistakeType,
  type AlgorithmTrainingItem,
} from "./algorithmContentTypes";

export type AlgorithmContentQualityIssueCode =
  | "invalid_item"
  | "missing_primary_skill"
  | "multiple_primary_skills"
  | "too_many_secondary_skills"
  | "invalid_secondary_skills"
  | "missing_taxonomy_refs"
  | "missing_feedback_model"
  | "missing_feedback_result"
  | "missing_feedback_mental_model_correction"
  | "missing_feedback_decision_signal"
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
  | "missing_complexity_explanation"
  | "missing_worked_example_subgoals"
  | "missing_worked_example_solution"
  | "missing_worked_example_static_micro_check";

export type AlgorithmContentQualityIssue = {
  code: AlgorithmContentQualityIssueCode;
  itemId?: string;
  message: string;
};

export type AlgorithmContentQualityResult = {
  issues: AlgorithmContentQualityIssue[];
  valid: boolean;
};

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
  if (Array.isArray(item.primarySkillAtomId)) {
    addIssue(issues, "multiple_primary_skills", "Algorithm item must have exactly one primary skill atom.", itemId);
  } else if (!isNonEmptyString(item.primarySkillAtomId)) {
    addIssue(issues, "missing_primary_skill", "Algorithm item must have one primarySkillAtomId.", itemId);
  }

  if (item.secondarySkillAtomIds !== undefined) {
    if (!isStringArray(item.secondarySkillAtomIds)) {
      addIssue(issues, "invalid_secondary_skills", "secondarySkillAtomIds must be a string array.", itemId);
    } else if (item.secondarySkillAtomIds.length > 2) {
      addIssue(issues, "too_many_secondary_skills", "Algorithm item can have no more than two secondary skills.", itemId);
    }
  }

  if (!Array.isArray(item.taxonomyRefs) || item.taxonomyRefs.length === 0) {
    addIssue(issues, "missing_taxonomy_refs", "Algorithm item must include taxonomyRefs.", itemId);
  }

  if (!isRecord(item.feedbackModel)) {
    addIssue(issues, "missing_feedback_model", "Algorithm item must include feedbackModel.", itemId);
  } else {
    validateFeedbackModel(item.feedbackModel, issues, itemId);
  }

  if (!isNonEmptyString(item.contentVersion)) {
    addIssue(issues, "missing_content_version", "Algorithm item must include contentVersion.", itemId);
  }

  if (item.staticMicroChecks !== undefined) {
    validateStaticMicroChecks(item.staticMicroChecks, issues, itemId);
  }
}

function validateFeedbackModel(
  feedbackModel: Record<string, unknown>,
  issues: AlgorithmContentQualityIssue[],
  itemId?: string,
): void {
  if (!isNonEmptyString(feedbackModel.result)) {
    addIssue(issues, "missing_feedback_result", "feedbackModel.result is required.", itemId);
  }

  if (!isNonEmptyString(feedbackModel.mentalModelCorrection)) {
    addIssue(
      issues,
      "missing_feedback_mental_model_correction",
      "feedbackModel.mentalModelCorrection is required.",
      itemId,
    );
  }

  if (!isNonEmptyString(feedbackModel.decisionSignal)) {
    addIssue(issues, "missing_feedback_decision_signal", "feedbackModel.decisionSignal is required.", itemId);
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

    if (
      Array.isArray(check.mistakeTypes) &&
      check.mistakeTypes.some((mistakeType) => !isAlgorithmMistakeType(mistakeType))
    ) {
      addIssue(issues, "invalid_static_micro_check", "Static micro-check includes an unsupported mistake type.", itemId);
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

function isComplexityPairAnswer(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.time) &&
    isNonEmptyString(value.space)
  );
}
