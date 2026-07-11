import type { AlgorithmRoadmapNodeId } from "../algorithmRoadmap";
import { ALGORITHM_ROADMAP } from "../algorithmRoadmap";
import {
  ALGORITHM_CONTENT_VERSION,
  ALGORITHM_QUESTION_DIFFICULTIES,
  ALGORITHM_QUESTION_LEARNING_STAGES,
  ALGORITHM_QUESTION_TYPES,
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "../algorithmQuestionTypes";
export { ALGORITHM_CONTENT_VERSION } from "../algorithmQuestionTypes";
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
  if (!isNonEmptyString(question.id)) issues.push(`${label}: id must be non-empty.`);
  if (questionIds.has(question.id)) issues.push(`${label}: duplicate question id.`);
  questionIds.add(question.id);

  if (!ALGORITHM_QUESTION_DIFFICULTIES.includes(question.difficulty)) {
    issues.push(`${label}: unsupported difficulty ${question.difficulty}.`);
  }
  if (!ALGORITHM_QUESTION_LEARNING_STAGES.includes(question.learningStage)) {
    issues.push(`${label}: unsupported learning stage ${question.learningStage}.`);
  }
  if (!ALGORITHM_QUESTION_TYPES.includes(question.type)) {
    issues.push(`${label}: unsupported question type ${question.type}.`);
  }
  for (const [field, value] of [
    ["prompt", question.prompt],
    ["primarySkillAtomId", question.primarySkillAtomId],
    ["feedback.decisionSignal", question.feedbackModel.decisionSignal],
    ["feedback.mentalModelCorrection", question.feedbackModel.mentalModelCorrection],
    ["feedback.nextAction", question.feedbackModel.nextAction],
  ] as const) {
    if (!isNonEmptyString(value)) issues.push(`${label}: ${field} must be non-empty.`);
  }
  if (question.feedbackModel.mistakeTypes.some((mistake) => !isNonEmptyString(mistake))) {
    issues.push(`${label}: feedback mistake types must be non-empty strings.`);
  }
  for (const [optionId, explanation] of Object.entries(
    question.feedbackModel.distractorExplanations ?? {},
  )) {
    if (!isNonEmptyString(optionId) || !isNonEmptyString(explanation)) {
      issues.push(`${label}: distractor explanations must map non-empty ids to non-empty text.`);
    }
  }

  if (isAlgorithmChoiceQuestion(question)) {
    validateChoiceQuestion(question, label, issues);
    return;
  }
  if (isAlgorithmOrderingQuestion(question)) {
    validateOrderingQuestion(question, label, issues);
    return;
  }
  if (isAlgorithmComplexityQuestion(question)) {
    validateComplexityQuestion(question, label, issues);
    return;
  }
  issues.push(`${label}: question has no supported response contract.`);
}

function validateChoiceQuestion(
  question: Extract<AlgorithmQuestion, { options: readonly unknown[] }>,
  label: string,
  issues: string[],
): void {
  if (question.options.length < 2) issues.push(`${label}: choice question requires at least two options.`);
  const optionIds = new Set<string>();
  let correctCount = 0;
  for (const option of question.options) {
    if (!isNonEmptyString(option.id) || !isNonEmptyString(option.text)) {
      issues.push(`${label}: option id and text must be non-empty.`);
    }
    if (optionIds.has(option.id)) issues.push(`${label}: duplicate option id ${option.id}.`);
    optionIds.add(option.id);
    if (option.isCorrect) correctCount += 1;
  }
  if (correctCount === 0) issues.push(`${label}: choice question has no correct option.`);
}

function validateOrderingQuestion(
  question: Extract<AlgorithmQuestion, { correctOrder: readonly string[] }>,
  label: string,
  issues: string[],
): void {
  if (question.type !== "subgoal_ordering") {
    issues.push(`${label}: ordering response requires type subgoal_ordering.`);
  }
  const subgoalIds = question.subgoals.map((subgoal) => subgoal.id);
  if (subgoalIds.length < 2 || new Set(subgoalIds).size !== subgoalIds.length) {
    issues.push(`${label}: ordering subgoals must contain at least two unique ids.`);
  }
  if (
    question.correctOrder.length !== subgoalIds.length ||
    new Set(question.correctOrder).size !== question.correctOrder.length ||
    question.correctOrder.some((id) => !subgoalIds.includes(id))
  ) {
    issues.push(`${label}: correctOrder must contain every subgoal id exactly once.`);
  }
}

function validateComplexityQuestion(
  question: Extract<AlgorithmQuestion, { correctComplexity: object }>,
  label: string,
  issues: string[],
): void {
  if (
    !isNonEmptyString(question.correctComplexity.time) ||
    !isNonEmptyString(question.correctComplexity.space)
  ) {
    issues.push(`${label}: correctComplexity requires non-empty time and space values.`);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
