import type { AlgorithmRoadmapNodeId } from "../algorithmRoadmap";
import { ALGORITHM_ROADMAP } from "../algorithmRoadmap";
import {
  ALGORITHM_QUESTION_DIFFICULTIES,
  ALGORITHM_QUESTION_LEARNING_STAGES,
  ALGORITHM_QUESTION_TYPES,
  type AlgorithmQuestion,
} from "../algorithmQuestionTypes";
import { ALGORITHM_CONTENT_VERSION } from "../algorithmContentTypes";
import arraysAndStringsQuestions from "./items/arrays-and-strings";
import backtrackingQuestions from "./items/backtracking";
import { binarySearchQuestions } from "./items/binary-search";
import { bitManipulationQuestions } from "./items/bit-manipulation";
import complexityAndConstraintsQuestions from "./items/complexity-and-constraints";
import { contrastBinarySearchVsLinearScanQuestions } from "./items/contrast-binary-search-vs-linear-scan";
import { contrastHashMapVsSortingQuestions } from "./items/contrast-hash-map-vs-sorting";
import { contrastSlidingWindowVsPrefixSumsQuestions } from "./items/contrast-sliding-window-vs-prefix-sums";
import { contrastStackVsMonotonicStackIntroQuestions } from "./items/contrast-stack-vs-monotonic-stack-intro";
import { contrastTwoPointersVsSlidingWindowQuestions } from "./items/contrast-two-pointers-vs-sliding-window";
import { dynamicProgrammingIntroQuestions } from "./items/dynamic-programming-intro";
import { graphTraversalQuestions } from "./items/graph-traversal";
import { greedyIntroQuestions } from "./items/greedy-intro";
import { hashMapAndSetQuestions } from "./items/hash-map-and-set";
import { heapPriorityQueueQuestions } from "./items/heap-priority-queue";
import { intervalsQuestions } from "./items/intervals";
import { linkedListQuestions } from "./items/linked-list";
import { mathAndGeometryQuestions } from "./items/math-and-geometry";
import { mixedPatternPracticeQuestions } from "./items/mixed-pattern-practice";
import { prefixSumsQuestions } from "./items/prefix-sums";
import { recursionBasicsQuestions } from "./items/recursion-basics";
import { slidingWindowQuestions } from "./items/sliding-window";
import { sortingBasedQuestions } from "./items/sorting-based";
import { stackQuestions } from "./items/stack";
import { strategySelectionCoreQuestions } from "./items/strategy-selection-core";
import { treeTraversalQuestions } from "./items/tree-traversal";
import { twoPointersQuestions } from "./items/two-pointers";

export type AlgorithmContentGroup = {
  id: AlgorithmRoadmapNodeId;
  questions: readonly AlgorithmQuestion[];
  roadmapNodeId: AlgorithmRoadmapNodeId;
};

function defineGroup(
  roadmapNodeId: AlgorithmRoadmapNodeId,
  questions: readonly AlgorithmQuestion[],
): AlgorithmContentGroup {
  return { id: roadmapNodeId, questions, roadmapNodeId };
}

const groups = [
  defineGroup("complexity_and_constraints", complexityAndConstraintsQuestions),
  defineGroup("arrays_and_strings", arraysAndStringsQuestions),
  defineGroup("hash_map_and_set", hashMapAndSetQuestions),
  defineGroup("two_pointers", twoPointersQuestions),
  defineGroup("sliding_window", slidingWindowQuestions),
  defineGroup("prefix_sums", prefixSumsQuestions),
  defineGroup("sorting_based", sortingBasedQuestions),
  defineGroup("stack", stackQuestions),
  defineGroup("binary_search", binarySearchQuestions),
  defineGroup("strategy_selection_core", strategySelectionCoreQuestions),
  defineGroup("contrast_hash_map_vs_sorting", contrastHashMapVsSortingQuestions),
  defineGroup("contrast_two_pointers_vs_sliding_window", contrastTwoPointersVsSlidingWindowQuestions),
  defineGroup("contrast_sliding_window_vs_prefix_sums", contrastSlidingWindowVsPrefixSumsQuestions),
  defineGroup("contrast_stack_vs_monotonic_stack_intro", contrastStackVsMonotonicStackIntroQuestions),
  defineGroup("contrast_binary_search_vs_linear_scan", contrastBinarySearchVsLinearScanQuestions),
  defineGroup("linked_list", linkedListQuestions),
  defineGroup("recursion_basics", recursionBasicsQuestions),
  defineGroup("tree_traversal", treeTraversalQuestions),
  defineGroup("heap_priority_queue", heapPriorityQueueQuestions),
  defineGroup("intervals", intervalsQuestions),
  defineGroup("backtracking", backtrackingQuestions),
  defineGroup("graph_traversal", graphTraversalQuestions),
  defineGroup("greedy_intro", greedyIntroQuestions),
  defineGroup("dynamic_programming_intro", dynamicProgrammingIntroQuestions),
  defineGroup("bit_manipulation", bitManipulationQuestions),
  defineGroup("math_and_geometry", mathAndGeometryQuestions),
  defineGroup("mixed_pattern_practice", mixedPatternPracticeQuestions),
] as const satisfies readonly AlgorithmContentGroup[];

export function validateAlgorithmContentGroups(
  contentGroups: readonly AlgorithmContentGroup[],
): readonly AlgorithmContentGroup[] {
  const issues: string[] = [];
  const roadmapNodeIds = new Set(ALGORITHM_ROADMAP.nodes.map((node) => node.id));
  const groupIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const group of contentGroups) {
    if (groupIds.has(group.roadmapNodeId)) {
      issues.push(`Algorithms content duplicates group: ${group.roadmapNodeId}.`);
    }
    groupIds.add(group.roadmapNodeId);

    if (!roadmapNodeIds.has(group.roadmapNodeId)) {
      issues.push(`Algorithms content references unknown roadmap node: ${group.roadmapNodeId}.`);
    }
    if (group.questions.length === 0) {
      issues.push(`Algorithms content group has no questions: ${group.roadmapNodeId}.`);
    }

    for (const question of group.questions) {
      validateQuestion(question, group, questionIds, issues);
    }
  }

  if (issues.length > 0) throw new Error(issues.join("\n"));
  return contentGroups;
}

function validateQuestion(
  question: AlgorithmQuestion,
  group: AlgorithmContentGroup,
  questionIds: Set<string>,
  issues: string[],
): void {
  const label = question.id || `${group.roadmapNodeId}:unknown-question`;
  if (questionIds.has(question.id)) issues.push(`${label}: duplicate question id.`);
  questionIds.add(question.id);
  try {
    validateAlgorithmQuestion(question);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : `${label}: validation failed.`);
  }
}

const ALGORITHM_QUESTION_FIELDS = new Set([
  "acceptableApproachIds", "answerFeedback", "complexityExplanation", "complexityVariables",
  "constraintSignal", "contentVersion", "correctComplexity", "correctOrder", "difficulty",
  "expectedApproachIds", "expectedSpaceComplexity", "expectedTimeComplexity", "feedbackModel",
  "id", "instruction", "learningStage", "options", "primarySkillAtomId", "prompt", "reasonSignal",
  "rejectedApproachIds", "roadmapNodeId", "secondarySkillAtomIds", "status", "stepByStepTrace",
  "subgoals", "taxonomyRefs", "title", "trackId", "type",
]);
const OBSOLETE_RESPONSE_FIELDS = [
  "correctAnswerId", "correctOptionId", "responseSpec", "staticMicroChecks",
] as const;

export function validateAlgorithmQuestion(question: unknown): void {
  if (!isRecord(question)) throw new Error("Algorithms question must be an object.");
  const label = isNonEmptyString(question.id) ? question.id : "unknown-question";
  const foundIssues: string[] = [];

  for (const field of Object.keys(question)) {
    if (!ALGORITHM_QUESTION_FIELDS.has(field)) foundIssues.push(`${label}: unknown field ${field}.`);
  }
  for (const field of OBSOLETE_RESPONSE_FIELDS) {
    if (field in question) foundIssues.push(`${label}: obsolete response field ${field}.`);
  }
  for (const [field, value] of [
    ["id", question.id], ["prompt", question.prompt], ["primarySkillAtomId", question.primarySkillAtomId],
  ] as const) {
    if (!isNonEmptyString(value)) foundIssues.push(`${label}: ${field} must be non-empty.`);
  }
  if (question.contentVersion !== ALGORITHM_CONTENT_VERSION) {
    foundIssues.push(`${label}: unsupported content version ${String(question.contentVersion)}.`);
  }
  if (!isNonEmptyString(question.difficulty) || !ALGORITHM_QUESTION_DIFFICULTIES.some((value) => value === question.difficulty)) {
    foundIssues.push(`${label}: unsupported difficulty ${String(question.difficulty)}.`);
  }
  if (!isNonEmptyString(question.learningStage) || !ALGORITHM_QUESTION_LEARNING_STAGES.some((value) => value === question.learningStage)) {
    foundIssues.push(`${label}: unsupported learning stage ${String(question.learningStage)}.`);
  }
  if (!isNonEmptyString(question.type) || !ALGORITHM_QUESTION_TYPES.some((value) => value === question.type)) {
    foundIssues.push(`${label}: unsupported question type ${String(question.type)}.`);
  }
  if (!isRecord(question.feedbackModel)) {
    foundIssues.push(`${label}: feedbackModel must be an object.`);
  } else {
    for (const field of ["decisionSignal", "mentalModelCorrection", "nextAction"] as const) {
      if (!isNonEmptyString(question.feedbackModel[field])) {
        foundIssues.push(`${label}: feedback.${field} must be non-empty.`);
      }
    }
    if (!Array.isArray(question.feedbackModel.mistakeTypes) || question.feedbackModel.mistakeTypes.some((value) => !isNonEmptyString(value))) {
      foundIssues.push(`${label}: feedback mistake types must be strings.`);
    }
  }

  const hasChoice = "options" in question;
  const hasOrdering = "subgoals" in question || "correctOrder" in question;
  const hasComplexity = "correctComplexity" in question;
  if ([hasChoice, hasOrdering, hasComplexity].filter(Boolean).length !== 1) {
    foundIssues.push(`${label}: question must use exactly one root response contract.`);
  } else if (hasChoice) {
    validateChoice(question.options, label, foundIssues);
  } else if (hasOrdering) {
    validateOrdering(question.subgoals, question.correctOrder, label, foundIssues);
  } else {
    validateComplexity(question.correctComplexity, label, foundIssues);
  }

  if (foundIssues.length > 0) throw new Error(foundIssues.join("\n"));
}

function validateChoice(options: unknown, label: string, issues: string[]): void {
  if (!Array.isArray(options) || options.length < 2) {
    issues.push(`${label}: choice question requires at least two options.`);
    return;
  }
  const ids = new Set<string>();
  let correctCount = 0;
  for (const option of options) {
    if (!isRecord(option) || !isNonEmptyString(option.id) || !isNonEmptyString(option.text) || typeof option.isCorrect !== "boolean") {
      issues.push(`${label}: every option requires id, text, and isCorrect.`);
      continue;
    }
    if (ids.has(option.id)) issues.push(`${label}: duplicate option id ${option.id}.`);
    ids.add(option.id);
    if (option.isCorrect) correctCount += 1;
  }
  if (correctCount === 0) issues.push(`${label}: choice question has no correct option.`);
}

function validateOrdering(subgoals: unknown, correctOrder: unknown, label: string, issues: string[]): void {
  if (!Array.isArray(subgoals) || !Array.isArray(correctOrder)) {
    issues.push(`${label}: ordering requires subgoals and correctOrder.`);
    return;
  }
  const ids = subgoals.map((subgoal) => isRecord(subgoal) && isNonEmptyString(subgoal.id) && isNonEmptyString(subgoal.text) ? subgoal.id : "");
  if (ids.length < 2 || ids.includes("") || new Set(ids).size !== ids.length) {
    issues.push(`${label}: ordering subgoals must contain at least two unique ids.`);
  }
  if (correctOrder.some((id) => !isNonEmptyString(id)) || correctOrder.length !== ids.length || new Set(correctOrder).size !== correctOrder.length || correctOrder.some((id) => !ids.includes(id))) {
    issues.push(`${label}: correctOrder must contain every subgoal id exactly once.`);
  }
}

function validateComplexity(value: unknown, label: string, issues: string[]): void {
  if (!isRecord(value) || !Array.isArray(value.dimensions) || value.dimensions.length === 0) {
    issues.push(`${label}: complexity requires at least one declared dimension.`);
    return;
  }
  const ids = new Set<string>();
  for (const dimension of value.dimensions) {
    if (!isRecord(dimension) || (dimension.id !== "time" && dimension.id !== "space")) {
      issues.push(`${label}: complexity dimension id must be time or space.`);
      continue;
    }
    if (ids.has(dimension.id)) issues.push(`${label}: duplicate complexity dimension ${dimension.id}.`);
    ids.add(dimension.id);
    if (!isStringArray(dimension.values) || dimension.values.length === 0 || new Set(dimension.values).size !== dimension.values.length) {
      issues.push(`${label}: complexity dimension requires unique selectable values.`);
    }
    if (!isStringArray(dimension.acceptedValues) || dimension.acceptedValues.length === 0 || dimension.acceptedValues.some((accepted) => !Array.isArray(dimension.values) || !dimension.values.includes(accepted))) {
      issues.push(`${label}: accepted complexity values must come from declared selectable values.`);
    }
    if (dimension.acceptedAliases !== undefined && !isStringArray(dimension.acceptedAliases)) {
      issues.push(`${label}: accepted complexity aliases must be strings.`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const algorithmContentGroups = validateAlgorithmContentGroups(groups);
export const algorithmContentItems = algorithmContentGroups.flatMap((group) => group.questions);

export const algorithmContentManifest = {
  contentVersion: ALGORITHM_CONTENT_VERSION,
  groups: algorithmContentGroups.map((group) => ({
    itemCount: group.questions.length,
    roadmapNodeId: group.roadmapNodeId,
  })),
  itemCount: algorithmContentItems.length,
  itemOrder: algorithmContentItems.map((question) => question.id),
  trackId: "algorithms",
} as const;
