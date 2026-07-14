import { ALGORITHMS_TRACK_ID, createTrainingAttempt } from "../../domain";
import type { ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../../domain/learning";
import type { PracticeFeedbackMode, PracticeSessionRouteParams } from "../practice/sessionConfig";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "../../tracks/algorithms/algorithmQuestionTypes";
import {
  createAlgorithmReviewEntry,
  getAlgorithmsTrainingSessionModeId,
  getAlgorithmAttemptStatus,
  scoreAlgorithmQuestion,
  type AlgorithmQuestionScore,
  type AlgorithmResponse,
  type AlgorithmScoringStatus,
  updateAlgorithmReviewEntry,
} from "../../tracks/algorithms";
import { createAttemptId } from "../../application/learningMutations/identity";

type ComplexityDimension = "time" | "space";
export type AlgorithmComplexityAnswer = { time?: string; space?: string };

export type AlgorithmsSubmission = {
  attempt: TrainingAttempt<AlgorithmResponse>;
  reviewQueueEntries: readonly ReviewQueueEntry[];
  score: AlgorithmQuestionScore;
};

export type AlgorithmsFeedbackState = {
  hasSubmittedAnswer: boolean;
  showImmediateFeedback: boolean;
};

export type AnswerOptionVisualState =
  | "idle"
  | "selected"
  | "selected_correct"
  | "selected_incorrect"
  | "expected_correct"
  | "disabled";

export type AlgorithmsSessionReviewItem = {
  commonTrap: string;
  complexity?: string;
  correctAnswer: string;
  explanation: string;
  itemId: string;
  nextReviewTarget: string;
  recognizedPattern: string;
  result: AlgorithmScoringStatus;
  selectedAnswer: string;
  title: string;
  whyThisPattern: string;
};

export type AlgorithmsImmediateReasoning = {
  answerSummary: string;
  commonTrap?: string;
  complexity?: string;
  correctAnswerExplanation?: string;
  mistakeType?: string;
  weakerAnswerNotes: readonly string[];
};

export type AlgorithmsImmediateFeedbackModel = {
  answerSummary: string;
  keySignal: string;
  nextAction: string;
  reasoning: AlgorithmsImmediateReasoning;
  rule: string;
  status: AlgorithmScoringStatus;
  statusLabel: string;
};

export type AlgorithmsSessionSummary = {
  completed: number;
  correct: number;
  currentRoadmapNode: string;
  incorrect: number;
  mainIssue?: AlgorithmsSessionMainIssue;
  needsReview: readonly string[];
  partial: number;
  recommendedNext: readonly string[];
  reviewSession?: AlgorithmsReviewSessionSummary;
  reviewItems: readonly AlgorithmsSessionReviewItem[];
  strong: readonly string[];
};

export type AlgorithmsSessionMainIssue = {
  explanation: string;
  itemIds: readonly string[];
  mistakeType?: string;
  pattern: string;
  recommendedNextAction: string;
};

export type AlgorithmsReviewSessionSummary = {
  clearedItems: number;
  nextSuggestedAction: string;
  stillNeedsReview: number;
};

export type AlgorithmsSummaryActionKind =
  | "reviewMissed"
  | "continueRoadmap"
  | "startWeakArea"
  | "startMixedPractice"
  | "viewProgress";

export type AlgorithmsSummaryAction = {
  detail: string;
  kind: AlgorithmsSummaryActionKind;
  label: string;
  priority: "primary" | "secondary";
  reviewItemIds?: readonly string[];
};

export type AlgorithmsReviewQueueUpdate =
  | {
      action: "keep";
      reviewQueueEntries: readonly ReviewQueueEntry[];
    }
  | {
      action: "none";
    };

const MIN_MISSED_ITEMS_FOR_WEAK_AREA = 2;

export function getAlgorithmsFeedbackState(
  feedbackMode: PracticeFeedbackMode,
  score: AlgorithmQuestionScore | null,
): AlgorithmsFeedbackState {
  return {
    hasSubmittedAnswer: score !== null,
    showImmediateFeedback: feedbackMode === "afterEachAnswer" && score !== null,
  };
}

export function formatSessionItemCount(currentIndex: number, totalCount: number): string {
  return `${currentIndex + 1} OF ${totalCount}`;
}

export function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getElapsedSessionSeconds(startedAt: string, nowMs: number): number {
  const startedAtMs = Date.parse(startedAt);

  if (Number.isNaN(startedAtMs) || nowMs <= startedAtMs) {
    return 0;
  }

  return Math.floor((nowMs - startedAtMs) / 1000);
}

export function formatSubmittedSessionActionLabel(isFinalItem: boolean): "Finish" | "Next" {
  return isFinalItem ? "Finish" : "Next";
}

export function getAnswerOptionVisualState(input: {
  correct: boolean;
  selected: boolean;
  submitted: boolean;
}): AnswerOptionVisualState {
  if (!input.submitted) {
    return input.selected ? "selected" : "idle";
  }

  if (input.selected && input.correct) return "selected_correct";
  if (input.selected && !input.correct) return "selected_incorrect";
  if (!input.selected && input.correct) return "expected_correct";
  return "disabled";
}

export function hasAlgorithmsFeedbackDetails(
  feedback: AlgorithmsImmediateFeedbackModel,
): boolean {
  return Boolean(
    feedback.reasoning.commonTrap ||
    feedback.reasoning.complexity ||
    feedback.reasoning.correctAnswerExplanation ||
    feedback.reasoning.mistakeType ||
    feedback.reasoning.weakerAnswerNotes.length > 0,
  );
}

export function buildAlgorithmsImmediateFeedbackModel({
  complexityAnswer = {},
  question,
  score,
  selectedOptionIds = [],
}: {
  complexityAnswer?: AlgorithmComplexityAnswer;
  question: AlgorithmQuestion;
  score: AlgorithmQuestionScore;
  selectedOptionIds?: readonly string[];
}): AlgorithmsImmediateFeedbackModel {
  const correctAnswer = getAlgorithmsCorrectAnswerText(question);
  const selectedAnswer = getCurrentSelectedAnswerText(question, selectedOptionIds, complexityAnswer);
  const answerSummary = getImmediateAnswerSummary({
    correctAnswer,
    selectedAnswer,
  });
  const keySignal = getAlgorithmsPatternSignalText(question);
  const rule = getImmediateFeedbackRule({
    correctAnswer,
    explanation: score.feedback,
    question,
    keySignal,
  });
  const commonTrap = getAlgorithmsCommonTrapText(question, score);
  const mistakeType = score.mistakeTypes.length > 0
    ? score.mistakeTypes.map(formatAlgorithmItemType).join(", ")
    : undefined;

  return {
    answerSummary,
    keySignal,
    nextAction: question.feedbackModel.nextAction,
    reasoning: {
      answerSummary,
      commonTrap: isDuplicateFeedbackText(commonTrap, rule) || isDuplicateFeedbackText(commonTrap, mistakeType)
        ? undefined
        : commonTrap,
      complexity: getAlgorithmsComplexityText(question),
      correctAnswerExplanation: isDuplicateFeedbackText(score.feedback, rule)
        ? undefined
        : score.feedback,
      mistakeType,
      weakerAnswerNotes: getAlgorithmsWeakerAnswerNotes(question),
    },
    rule,
    status: score.status,
    statusLabel: formatAlgorithmStatus(score.status),
  };
}

export function buildAlgorithmsSummaryActions(
  summary: AlgorithmsSessionSummary,
  sessionConfig: Pick<PracticeSessionRouteParams, "mode"> | undefined,
): readonly AlgorithmsSummaryAction[] {
  const actions: AlgorithmsSummaryAction[] = [];
  const missedItemIds = uniqueStrings(
    summary.reviewItems
      .filter((item) => item.result !== "correct")
      .map((item) => item.itemId),
  );
  const missedCount = summary.incorrect + summary.partial;
  const hasStrongSession = summary.completed > 0 && summary.correct === summary.completed;

  if (missedItemIds.length > 0) {
    actions.push({
      detail: "Repair the incorrect or partial items from this session.",
      kind: "reviewMissed",
      label: "Review remediation",
      priority: "primary",
      reviewItemIds: missedItemIds,
    });
  } else if (missedCount >= MIN_MISSED_ITEMS_FOR_WEAK_AREA && sessionConfig?.mode !== "weakArea") {
    actions.push({
      detail: "Focus on the patterns missed in this session.",
      kind: "startWeakArea",
      label: "Practice weak area",
      priority: "primary",
    });
  } else if (hasStrongSession && sessionConfig?.mode !== "practice") {
    actions.push({
      detail: "Interleave unlocked Algorithms topics.",
      kind: "startMixedPractice",
      label: "Start Mixed practice",
      priority: "primary",
    });
  } else {
    actions.push({
      detail: `Continue ${summary.currentRoadmapNode}.`,
      kind: "continueRoadmap",
      label: "Continue current roadmap node",
      priority: "primary",
    });
  }

  actions.push({
    detail: "Open progress details.",
    kind: "viewProgress",
    label: "View progress",
    priority: "secondary",
  });

  return actions;
}

export function getAlgorithmsSessionModeIdForRouteMode(
  mode: PracticeSessionRouteParams["mode"] | undefined,
): TrainingSession["modeId"] {
  return getAlgorithmsTrainingSessionModeId(mode ?? "default");
}

export async function buildAlgorithmsSubmission({
  answeredAt,
  complexityAnswer,
  question,
  selectedOptionIds,
  session,
}: {
  answeredAt: string;
  complexityAnswer: AlgorithmComplexityAnswer;
  question: AlgorithmQuestion;
  selectedOptionIds: readonly string[];
  session: TrainingSession;
}): Promise<AlgorithmsSubmission> {
  const response = buildAlgorithmResponse(question, selectedOptionIds, complexityAnswer);
  const score = scoreAlgorithmQuestion(question, response);
  const sourceItem = { contentVersion: question.contentVersion, itemId: question.id, trackId: ALGORITHMS_TRACK_ID };
  const attempt: TrainingAttempt<AlgorithmResponse> = createTrainingAttempt({
    answeredAt,
    committedAt: answeredAt,
    id: await createAttemptId(session.id, question.id, response),
    item: sourceItem,
    modeId: session.modeId,
    response,
    result: score.result,
    reviewEvidence: {
      sourceItem,
      taxonomyOrSkillRefs: [
        { axisId: "algorithm-skill", nodeId: question.primarySkillAtomId, role: "primary" },
        ...(question.secondarySkillAtomIds ?? []).map((nodeId) => ({ axisId: "algorithm-skill", nodeId, role: "secondary" })),
        ...score.mistakeTypes.map((nodeId) => ({ axisId: "mistake_type", nodeId, role: "mistake_type" })),
      ],
    },
    sessionId: session.id,
    trackId: ALGORITHMS_TRACK_ID,
  });

  return {
    attempt,
    reviewQueueEntries: [createAlgorithmReviewEntry(attempt)],
    score,
  };
}

export function buildAlgorithmsSessionSummary(
  attempts: readonly TrainingAttempt<AlgorithmResponse>[],
  questions: readonly AlgorithmQuestion[],
  nodeLabel: string,
  options: { mode?: string } = {},
): AlgorithmsSessionSummary {
  const statuses = attempts.map((attempt) => getAlgorithmAttemptStatus(attempt.result));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const reviewedAttempts = attempts
    .map((attempt) => ({
      attempt,
      question: questionById.get(attempt.item.itemId),
      status: getAlgorithmAttemptStatus(attempt.result),
    }))
    .filter((entry): entry is { attempt: TrainingAttempt<AlgorithmResponse>; question: AlgorithmQuestion; status: AlgorithmScoringStatus } =>
      Boolean(entry.question && entry.status),
    );
  const missedAttempts = reviewedAttempts.filter((entry) => entry.status !== "correct");
  const mainIssue = buildSessionMainIssue(missedAttempts);

  return {
    completed: attempts.length,
    correct: statuses.filter((status) => status === "correct").length,
    currentRoadmapNode: nodeLabel,
    incorrect: statuses.filter((status) => status === "incorrect").length,
    mainIssue,
    needsReview: uniqueStrings(
      missedAttempts.map((entry) => `${getAlgorithmsRecognizedPatternText(entry.question)}: ${getAttemptReviewSignal(entry)}`),
    ).slice(0, 4),
    partial: statuses.filter((status) => status === "partial").length,
    recommendedNext: buildRecommendedNext(missedAttempts),
    reviewSession: options.mode === "review"
      ? buildReviewSessionSummary(reviewedAttempts)
      : undefined,
    reviewItems: buildSessionReviewItems(reviewedAttempts, questions),
    strong: uniqueStrings(
      reviewedAttempts
        .filter((entry) => entry.status === "correct")
        .map((entry) => getAlgorithmsRecognizedPatternText(entry.question)),
    ).slice(0, 4),
  };
}

export function buildAlgorithmsReviewQueueUpdate(
  submission: AlgorithmsSubmission,
  existingReviewEntry?: ReviewQueueEntry,
): AlgorithmsReviewQueueUpdate {
  if (!existingReviewEntry) return { action: "keep", reviewQueueEntries: submission.reviewQueueEntries };
  const updated = updateAlgorithmReviewEntry(existingReviewEntry, submission.attempt);
  return updated ? { action: "keep", reviewQueueEntries: [updated] } : { action: "none" };
}

export function getAlgorithmsCorrectAnswerText(question: AlgorithmQuestion): string {
  if (isAlgorithmChoiceQuestion(question)) {
    return question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.text)
      .join(", ");
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return question.correctOrder
      .map((subgoalId, index) => `${index + 1}. ${getQuestionOptionText(question, subgoalId)}`)
      .join("\n");
  }

  if (isAlgorithmComplexityQuestion(question)) {
    return question.correctComplexity.dimensions
      .map((dimension) => `${dimension.id === "time" ? "Time" : "space"} ${dimension.acceptedValues.join(" or ")}`)
      .join(", ");
  }

  return assertUnreachableQuestion(question);
}

export function getAlgorithmsRecognizedPatternText(question: AlgorithmQuestion): string {
  return formatAlgorithmItemType(question.primarySkillAtomId);
}

export function getAlgorithmsPatternSignalText(question: AlgorithmQuestion): string {
  return question.feedbackModel.decisionSignal;
}

export function getAlgorithmsComplexityText(question: AlgorithmQuestion): string | undefined {
  const complexityParts = [
    question.expectedTimeComplexity ? `Time ${question.expectedTimeComplexity}` : undefined,
    question.expectedSpaceComplexity ? `space ${question.expectedSpaceComplexity}` : undefined,
  ].filter((part): part is string => Boolean(part));

  if (complexityParts.length === 0 && !question.complexityExplanation) {
    return undefined;
  }

  return [
    complexityParts.join(", "),
    question.complexityExplanation,
  ].filter(Boolean).join(". ");
}

export function getAlgorithmsCommonTrapText(
  question: AlgorithmQuestion,
  score: { mistakeTypes: readonly string[] },
): string {
  const mistakeTypes = score.mistakeTypes.length > 0
    ? `Review ${score.mistakeTypes.map(formatAlgorithmItemType).join(", ")}.`
    : undefined;

  return mistakeTypes ?? question.feedbackModel.mentalModelCorrection;
}

export function getAlgorithmsWeakerAnswerNotes(
  question: AlgorithmQuestion,
): readonly string[] {
  if (!isAlgorithmChoiceQuestion(question)) {
    return [];
  }

  const explanationsByOptionId = question.feedbackModel.distractorExplanations ?? {};
  return question.options
    .filter((option) => !option.isCorrect && explanationsByOptionId[option.id])
    .slice(0, 3)
    .map((option) =>
      `${option.text}: ${explanationsByOptionId[option.id]}`,
    );
}

export function formatAlgorithmStatus(status: AlgorithmScoringStatus): string {
  if (status === "partial") {
    return "Partial";
  }

  return capitalize(status);
}

export function formatAlgorithmItemType(value: string): string {
  return value.split("_").map(capitalize).join(" ");
}

function buildSessionReviewItems(
  reviewedAttempts: readonly {
    attempt: TrainingAttempt<AlgorithmResponse>;
    question: AlgorithmQuestion;
    status: AlgorithmScoringStatus;
  }[],
  questions: readonly AlgorithmQuestion[],
): readonly AlgorithmsSessionReviewItem[] {
  const orderByQuestionId = new Map(questions.map((question, index) => [question.id, index]));

  return [...reviewedAttempts]
    .sort((left, right) =>
      (orderByQuestionId.get(left.question.id) ?? Number.MAX_SAFE_INTEGER) -
      (orderByQuestionId.get(right.question.id) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((entry) => {
      const mistakeTypes = entry.attempt.reviewEvidence.taxonomyOrSkillRefs
        .filter((ref) => ref.axisId === "mistake_type")
        .map((ref) => ref.nodeId);

      return {
        commonTrap: getAlgorithmsCommonTrapText(entry.question, { mistakeTypes }),
        complexity: getAlgorithmsComplexityText(entry.question),
        correctAnswer: getAlgorithmsCorrectAnswerText(entry.question),
        explanation: entry.question.feedbackModel.mentalModelCorrection,
        itemId: entry.question.id,
        nextReviewTarget: entry.question.feedbackModel.nextAction,
        recognizedPattern: getAlgorithmsRecognizedPatternText(entry.question),
        result: entry.status,
        selectedAnswer: getSelectedAnswerText(entry.question, entry.attempt.response),
        title: formatAlgorithmItemType(entry.question.type),
        whyThisPattern: getAlgorithmsPatternSignalText(entry.question),
      };
    });
}

function buildReviewSessionSummary(
  reviewedAttempts: readonly {
    attempt: TrainingAttempt<AlgorithmResponse>;
    question: AlgorithmQuestion;
    status: AlgorithmScoringStatus;
  }[],
): AlgorithmsReviewSessionSummary {
  const clearedItems = reviewedAttempts.filter((entry) => entry.status === "correct").length;
  const stillNeedsReview = reviewedAttempts.length - clearedItems;

  return {
    clearedItems,
    nextSuggestedAction: stillNeedsReview > 0
      ? "Continue with the remaining review items."
      : "Return to the roadmap when you are ready.",
    stillNeedsReview,
  };
}

function buildAlgorithmResponse(
  question: AlgorithmQuestion,
  selectedOptionIds: readonly string[],
  complexityAnswer: AlgorithmComplexityAnswer,
): AlgorithmResponse {
  if (isAlgorithmComplexityQuestion(question)) {
    return {
      kind: "complexity",
      selectedValuesByDimension: Object.fromEntries(
        Object.entries(complexityAnswer).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      ),
    };
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return {
      kind: "ordering",
      orderedSubgoalIds: [...selectedOptionIds],
    };
  }

  if (isAlgorithmChoiceQuestion(question)) return { kind: "choice", selectedOptionIds: [...selectedOptionIds] };

  return assertUnreachableQuestion(question);
}

function getSelectedAnswerText(
  question: AlgorithmQuestion,
  response: AlgorithmResponse,
): string {
  if (response.kind === "complexity") {
    return formatComplexityAnswer(response.selectedValuesByDimension);
  }

  if (response.kind === "ordering") {
      return response.orderedSubgoalIds
        .map((optionId, index) => `${index + 1}. ${getQuestionOptionText(question, optionId)}`)
        .join("\n");
  }

  if (response.kind === "choice") {
    return response.selectedOptionIds.map((optionId) => getQuestionOptionText(question, optionId)).join(", ");
  }

  return "Answer unavailable.";
}

function getCurrentSelectedAnswerText(
  question: AlgorithmQuestion,
  selectedOptionIds: readonly string[],
  complexityAnswer: AlgorithmComplexityAnswer,
): string {
  if (isAlgorithmComplexityQuestion(question)) {
    return formatComplexityAnswer(complexityAnswer);
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return selectedOptionIds
      .map((optionId, index) => `${index + 1}. ${getQuestionOptionText(question, optionId)}`)
      .join("\n");
  }

  if (isAlgorithmChoiceQuestion(question)) {
    return selectedOptionIds.map((optionId) => getQuestionOptionText(question, optionId)).join(", ");
  }

  return assertUnreachableQuestion(question);
}

function formatComplexityAnswer(answer: Readonly<Record<string, string | undefined>>): string {
  const values: Record<ComplexityDimension, string | undefined> = {
    space: answer.space,
    time: answer.time,
  };

  return [
    values.time ? `Time ${values.time}` : undefined,
    values.space ? `space ${values.space}` : undefined,
  ].filter(Boolean).join(", ") || "No answer selected.";
}

function getAttemptReviewSignal(entry: {
  attempt: TrainingAttempt<AlgorithmResponse>;
  question: AlgorithmQuestion;
  status: AlgorithmScoringStatus;
}): string {
  const mistakeType = entry.attempt.reviewEvidence.taxonomyOrSkillRefs.find((ref) => ref.axisId === "mistake_type")?.nodeId;

  if (mistakeType) {
    return formatAlgorithmItemType(mistakeType);
  }

  return entry.question.feedbackModel.mentalModelCorrection;
}

function buildRecommendedNext(
  missedAttempts: readonly {
    attempt: TrainingAttempt<AlgorithmResponse>;
    question: AlgorithmQuestion;
    status: AlgorithmScoringStatus;
  }[],
): readonly string[] {
  if (missedAttempts.length === 0) {
    return ["Continue with the next roadmap session."];
  }

  const missedStrategyCount = missedAttempts.filter((entry) => entry.question.type === "strategy_choice").length;
  const recommendations = missedStrategyCount > 0
    ? [`Review ${missedStrategyCount} missed strategy ${missedStrategyCount === 1 ? "item" : "items"}.`]
    : [];

  return uniqueStrings([
    ...recommendations,
    ...missedAttempts.map((entry) => entry.question.feedbackModel.nextAction),
  ]).slice(0, 3);
}

function buildSessionMainIssue(
  missedAttempts: readonly {
    attempt: TrainingAttempt<AlgorithmResponse>;
    question: AlgorithmQuestion;
    status: AlgorithmScoringStatus;
  }[],
): AlgorithmsSessionMainIssue | undefined {
  if (missedAttempts.length === 0) {
    return undefined;
  }

  const patternCounts = new Map<string, { count: number; itemIds: string[] }>();
  const mistakeTypeCounts = new Map<string, number>();

  for (const entry of missedAttempts) {
    const pattern = getAlgorithmsRecognizedPatternText(entry.question);
    const currentPattern = patternCounts.get(pattern) ?? { count: 0, itemIds: [] };
    currentPattern.count += entry.status === "incorrect" ? 2 : 1;
    currentPattern.itemIds.push(entry.question.id);
    patternCounts.set(pattern, currentPattern);

    for (const mistakeType of entry.attempt.reviewEvidence.taxonomyOrSkillRefs.filter((ref) => ref.axisId === "mistake_type").map((ref) => ref.nodeId)) {
      mistakeTypeCounts.set(mistakeType, (mistakeTypeCounts.get(mistakeType) ?? 0) + 1);
    }
  }

  const [pattern, patternStats] = [...patternCounts.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))[0] ?? [];
  const mistakeType = [...mistakeTypeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
  const representativeQuestion = missedAttempts.find((entry) =>
    getAlgorithmsRecognizedPatternText(entry.question) === pattern,
  )?.question ?? missedAttempts[0]?.question;

  if (!pattern || !representativeQuestion || !patternStats) {
    return undefined;
  }

  const formattedMistake = mistakeType ? formatAlgorithmItemType(mistakeType) : undefined;
  const explanation = formattedMistake
    ? `Most missed items pointed to ${pattern}. The recurring issue was ${formattedMistake.toLowerCase()}, so review the recognition signal before trying a larger mixed set.`
    : `Most missed items pointed to ${pattern}. Review the recognition signal before trying a larger mixed set.`;

  return {
    explanation,
    itemIds: uniqueStrings(patternStats.itemIds),
    mistakeType: formattedMistake,
    pattern,
    recommendedNextAction: buildMainIssueNextAction({
      defaultAction: representativeQuestion.feedbackModel.nextAction,
      formattedMistake,
      pattern,
    }),
  };
}

function buildMainIssueNextAction(input: {
  defaultAction: string;
  formattedMistake?: string;
  pattern: string;
}): string {
  if (!input.formattedMistake) {
    return input.defaultAction;
  }

  return `Review ${input.pattern} with a short ${input.formattedMistake.toLowerCase()} drill before mixed practice.`;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getImmediateAnswerSummary({
  correctAnswer,
  selectedAnswer,
}: {
  correctAnswer: string;
  selectedAnswer: string;
}): string {
  if (isDuplicateFeedbackText(selectedAnswer, correctAnswer)) {
    return correctAnswer;
  }

  if (selectedAnswer.trim().length === 0) {
    return `Expected: ${correctAnswer}`;
  }

  return `Your answer: ${selectedAnswer}\nExpected: ${correctAnswer}`;
}

function getImmediateFeedbackRule({
  correctAnswer,
  explanation,
  question,
  keySignal,
}: {
  correctAnswer: string;
  explanation: string;
  question: AlgorithmQuestion;
  keySignal: string;
}): string {
  const candidates = [
    question.feedbackModel.mentalModelCorrection,
    explanation,
  ];
  const distinctRule = candidates.find((candidate) =>
    !isDuplicateFeedbackText(candidate, correctAnswer) &&
    !isDuplicateFeedbackText(candidate, keySignal),
  );

  return distinctRule ?? explanation;
}

function isDuplicateFeedbackText(left: string | undefined, right: string | undefined): boolean {
  const normalizedLeft = normalizeFeedbackText(left);
  const normalizedRight = normalizeFeedbackText(right);

  return normalizedLeft.length > 0 && normalizedLeft === normalizedRight;
}

function normalizeFeedbackText(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "");
}


function getQuestionOptionText(question: AlgorithmQuestion, optionId: string): string {
  if (isAlgorithmChoiceQuestion(question)) {
    const option = question.options.find((candidate) => candidate.id === optionId);

    if (!option) {
      throw new Error(`Algorithms question ${question.id} has no option ${optionId}.`);
    }

    return option.text;
  }

  if (isAlgorithmOrderingQuestion(question)) {
    const subgoal = question.subgoals.find((candidate) => candidate.id === optionId);

    if (!subgoal) {
      throw new Error(`Algorithms question ${question.id} has no subgoal ${optionId}.`);
    }

    return subgoal.text;
  }

  if (isAlgorithmComplexityQuestion(question)) {
    throw new Error(`Algorithms complexity question ${question.id} does not have selectable options.`);
  }

  return assertUnreachableQuestion(question);
}

function assertUnreachableQuestion(question: never): never {
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
