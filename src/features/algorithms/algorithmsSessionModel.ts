import { ALGORITHMS_TRACK_ID } from "../../domain";
import {
  getReviewQueueItemKind,
  type ComplexityAnswer,
  type ReviewReason,
  type ReviewQueueItem,
  type TrainingAttempt,
  type TrainingAttemptResponse,
  type TrainingSession,
} from "../../domain/training";
import type { PracticeFeedbackMode, PracticeSessionRouteParams } from "../practice/sessionConfig";
import {
  createAlgorithmsReviewQueueItems,
  getAlgorithmsTrainingSessionModeId,
  getAlgorithmAttemptStatus,
  scoreAlgorithmStaticMicroCheck,
  type AlgorithmComplexityPairAnswer,
  type AlgorithmScoringStatus,
  type AlgorithmStaticCheckScore,
  type AlgorithmStaticMicroCheck,
  type AlgorithmSubmittedAnswer,
  type AlgorithmTrainingItem,
} from "../../tracks/algorithms";

type ComplexityDimension = "time" | "space";

export type AlgorithmsSubmission = {
  attempt: TrainingAttempt;
  reviewQueueItems: readonly ReviewQueueItem[];
  score: AlgorithmStaticCheckScore;
};

export type AlgorithmsFeedbackState = {
  hasSubmittedAnswer: boolean;
  showImmediateFeedback: boolean;
};

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
      reviewQueueItems: readonly ReviewQueueItem[];
    }
  | {
      action: "none";
    };

const MIN_MISSED_ITEMS_FOR_WEAK_AREA = 2;

export function getAlgorithmsFeedbackState(
  feedbackMode: PracticeFeedbackMode,
  score: AlgorithmStaticCheckScore | null,
): AlgorithmsFeedbackState {
  return {
    hasSubmittedAnswer: score !== null,
    showImmediateFeedback: feedbackMode === "afterEachAnswer" && score !== null,
  };
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
  check,
  complexityAnswer = {},
  item,
  score,
  selectedOptionIds = [],
}: {
  check: AlgorithmStaticMicroCheck;
  complexityAnswer?: ComplexityAnswer;
  item: AlgorithmTrainingItem;
  score: AlgorithmStaticCheckScore;
  selectedOptionIds?: readonly string[];
}): AlgorithmsImmediateFeedbackModel {
  const correctAnswer = getAlgorithmsCorrectAnswerText(check);
  const selectedAnswer = getCurrentSelectedAnswerText(check, selectedOptionIds, complexityAnswer);
  const answerSummary = getImmediateAnswerSummary({
    correctAnswer,
    selectedAnswer,
  });
  const keySignal = getAlgorithmsPatternSignalText(item);
  const rule = getImmediateFeedbackRule({
    correctAnswer,
    explanation: score.feedback,
    item,
    keySignal,
  });
  const commonTrap = getAlgorithmsCommonTrapText(item, score);
  const mistakeType = score.mistakeTypes.length > 0
    ? score.mistakeTypes.map(formatAlgorithmItemType).join(", ")
    : undefined;

  return {
    answerSummary,
    keySignal,
    nextAction: item.feedbackModel.nextAction,
    reasoning: {
      answerSummary,
      commonTrap: isDuplicateFeedbackText(commonTrap, rule) || isDuplicateFeedbackText(commonTrap, mistakeType)
        ? undefined
        : commonTrap,
      complexity: getAlgorithmsComplexityText(item),
      correctAnswerExplanation: isDuplicateFeedbackText(score.feedback, rule)
        ? undefined
        : score.feedback,
      mistakeType,
      weakerAnswerNotes: getAlgorithmsWeakerAnswerNotes(check, item),
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

export function buildAlgorithmsSubmission({
  answeredAt,
  check,
  complexityAnswer,
  item,
  selectedOptionIds,
  session,
}: {
  answeredAt: string;
  check: AlgorithmStaticMicroCheck;
  complexityAnswer: ComplexityAnswer;
  item: AlgorithmTrainingItem;
  selectedOptionIds: readonly string[];
  session: TrainingSession;
}): AlgorithmsSubmission {
  const answer = getSubmittedAnswer(check, selectedOptionIds, complexityAnswer);
  const score = scoreAlgorithmStaticMicroCheck(check, answer);
  const attempt: TrainingAttempt = {
    answeredAt,
    feedbackSignals: [score.status === "correct" ? "correct" : "review_recommended"],
    id: `attempt:${session.id}:${item.id}:${answeredAt}`,
    itemId: item.id,
    itemType: item.type,
    mistakeTypeRefs: score.mistakeTypes.map((mistakeType) => ({
      axisId: "mistake_type",
      nodeId: mistakeType,
      role: "mistake_type",
      trackId: ALGORITHMS_TRACK_ID,
    })),
    modeId: session.modeId,
    response: buildTrainingAttemptResponse(check, selectedOptionIds, complexityAnswer),
    result: score.result,
    sessionId: session.id,
    trackId: ALGORITHMS_TRACK_ID,
  };

  return {
    attempt,
    reviewQueueItems: createAlgorithmsReviewQueueItems(attempt, undefined, {
      now: answeredAt,
    }),
    score,
  };
}

export function buildAlgorithmsSessionSummary(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[],
  nodeLabel: string,
  options: { mode?: string } = {},
): AlgorithmsSessionSummary {
  const statuses = attempts.map((attempt) => getAlgorithmAttemptStatus(attempt.result));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const reviewedAttempts = attempts
    .map((attempt) => ({
      attempt,
      item: itemById.get(attempt.itemId),
      status: getAlgorithmAttemptStatus(attempt.result),
    }))
    .filter((entry): entry is { attempt: TrainingAttempt; item: AlgorithmTrainingItem; status: AlgorithmScoringStatus } =>
      Boolean(entry.item && entry.status),
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
      missedAttempts.map((entry) => `${getAlgorithmsRecognizedPatternText(entry.item)}: ${getAttemptReviewSignal(entry)}`),
    ).slice(0, 4),
    partial: statuses.filter((status) => status === "partial").length,
    recommendedNext: buildRecommendedNext(missedAttempts),
    reviewSession: options.mode === "review"
      ? buildReviewSessionSummary(reviewedAttempts)
      : undefined,
    reviewItems: buildSessionReviewItems(reviewedAttempts, items),
    strong: uniqueStrings(
      reviewedAttempts
        .filter((entry) => entry.status === "correct")
        .map((entry) => getAlgorithmsRecognizedPatternText(entry.item)),
    ).slice(0, 4),
  };
}

export function buildAlgorithmsReviewQueueUpdate(
  submission: AlgorithmsSubmission,
  existingReviewItem?: ReviewQueueItem,
): AlgorithmsReviewQueueUpdate {
  const answeredAt = submission.attempt.answeredAt;
  const isExistingItemDue = Boolean(
    existingReviewItem &&
    existingReviewItem.trackId === ALGORITHMS_TRACK_ID &&
    existingReviewItem.itemId === submission.attempt.itemId &&
    existingReviewItem.dueAt <= answeredAt,
  );
  const existingKind = existingReviewItem
    ? getReviewQueueItemKind(existingReviewItem)
    : undefined;

  if (submission.score.status === "correct") {
    const retentionItem = submission.reviewQueueItems.find((item) => item.kind === "retention");
    if (retentionItem) {
      const passedDueRetention = isExistingItemDue && existingKind === "retention";
      return {
        action: "keep",
        reviewQueueItems: [{
          ...retentionItem,
          lastReviewedAt: isExistingItemDue ? answeredAt : undefined,
          retentionPassedAt: passedDueRetention ? answeredAt : undefined,
        }],
      };
    }
    return { action: "none" };
  }

  if (submission.reviewQueueItems.length === 0) {
    return { action: "none" };
  }

  return {
    action: "keep",
    reviewQueueItems: submission.reviewQueueItems.map((item) => ({
      ...item,
      lastReviewedAt: isExistingItemDue ? answeredAt : undefined,
      reasons: submission.score.status === "incorrect" && existingKind === "remediation"
        ? uniqueReasons([...item.reasons, "repeated_mistake"])
        : item.reasons,
    })),
  };
}

export function getAlgorithmsCorrectAnswerText(check: AlgorithmStaticMicroCheck): string {
  if (check.type === "complexity_pair" && isComplexityPairAnswer(check.correctAnswer)) {
    return `Time ${check.correctAnswer.time}, space ${check.correctAnswer.space}`;
  }

  if (Array.isArray(check.correctAnswer)) {
    return check.correctAnswer.map((optionId, index) => `${index + 1}. ${getOptionText(check, optionId)}`).join("\n");
  }

  if (typeof check.correctAnswer === "string") {
    return getOptionText(check, check.correctAnswer);
  }

  return "No static answer available.";
}

export function getAlgorithmsRecognizedPatternText(item: AlgorithmTrainingItem): string {
  const taxonomyPattern = item.taxonomyRefs.find((ref) => ref.axisId === "pattern_family");

  return formatAlgorithmItemType(item.roadmapNodeId ?? taxonomyPattern?.nodeId ?? item.primarySkillAtomId);
}

export function getAlgorithmsPatternSignalText(item: AlgorithmTrainingItem): string {
  return item.reasonSignal ??
    item.constraintSignal ??
    item.approachChoiceReason ??
    item.feedbackModel.decisionSignal;
}

export function getAlgorithmsComplexityText(item: AlgorithmTrainingItem): string | undefined {
  const complexityParts = [
    item.expectedTimeComplexity ? `Time ${item.expectedTimeComplexity}` : undefined,
    item.expectedSpaceComplexity ? `space ${item.expectedSpaceComplexity}` : undefined,
  ].filter((part): part is string => Boolean(part));

  if (complexityParts.length === 0 && !item.complexityExplanation && !item.solution?.complexityExplanation) {
    return undefined;
  }

  return [
    complexityParts.join(", "),
    item.complexityExplanation ?? item.solution?.complexityExplanation,
  ].filter(Boolean).join(". ");
}

export function getAlgorithmsCommonTrapText(
  item: AlgorithmTrainingItem,
  score: { mistakeTypes: readonly string[] },
): string {
  const pitfall = item.pitfalls?.[0]?.description;
  const alternative = item.whyNotAlternatives?.[0]?.reason;
  const mistakeTypes = score.mistakeTypes.length > 0
    ? `Review ${score.mistakeTypes.map(formatAlgorithmItemType).join(", ")}.`
    : undefined;

  return pitfall ??
    alternative ??
    mistakeTypes ??
    item.feedbackModel.mentalModelCorrection;
}

export function getAlgorithmsWeakerAnswerNotes(
  check: AlgorithmStaticMicroCheck,
  item: AlgorithmTrainingItem,
): readonly string[] {
  const correctIds = getCorrectAnswerIds(check.correctAnswer);
  const explanationsByOptionId = item.feedbackModel.distractorExplanations ?? {};
  const weakerOptions = (check.options ?? [])
    .filter((option) => !correctIds.has(option.id))
    .slice(0, 3)
    .map((option) =>
      `${option.text}: ${explanationsByOptionId[option.id] ?? "No distractor explanation is authored for this option."}`,
    );

  if (weakerOptions.length > 0) {
    return weakerOptions;
  }

  return (item.whyNotAlternatives ?? [])
    .slice(0, 3)
    .map((alternative) => alternative.reason);
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
    attempt: TrainingAttempt;
    item: AlgorithmTrainingItem;
    status: AlgorithmScoringStatus;
  }[],
  items: readonly AlgorithmTrainingItem[],
): readonly AlgorithmsSessionReviewItem[] {
  const orderByItemId = new Map(items.map((item, index) => [item.id, index]));

  return [...reviewedAttempts]
    .sort((left, right) =>
      (orderByItemId.get(left.item.id) ?? Number.MAX_SAFE_INTEGER) -
      (orderByItemId.get(right.item.id) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((entry) => {
      const check = getActiveReviewCheck(entry.item);
      const mistakeTypes = entry.attempt.mistakeTypeRefs?.map((ref) => ref.nodeId) ?? [];

      return {
        commonTrap: getAlgorithmsCommonTrapText(entry.item, { mistakeTypes }),
        complexity: getAlgorithmsComplexityText(entry.item),
        correctAnswer: getAlgorithmsCorrectAnswerText(check),
        explanation: check.feedback || entry.item.feedbackModel.result,
        itemId: entry.item.id,
        nextReviewTarget: entry.item.feedbackModel.nextAction,
        recognizedPattern: getAlgorithmsRecognizedPatternText(entry.item),
        result: entry.status,
        selectedAnswer: getSelectedAnswerText(check, entry.attempt.response),
        title: entry.item.title,
        whyThisPattern: getAlgorithmsPatternSignalText(entry.item),
      };
    });
}

function buildReviewSessionSummary(
  reviewedAttempts: readonly {
    attempt: TrainingAttempt;
    item: AlgorithmTrainingItem;
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

function getSubmittedAnswer(
  check: AlgorithmStaticMicroCheck,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
): AlgorithmSubmittedAnswer {
  if (check.type === "complexity_pair") {
    return complexityAnswer;
  }

  if (check.type === "single_choice" || check.type === "select_pseudocode_line" || check.type === "trace_next_step") {
    return selectedOptionIds[0] ?? "";
  }

  return selectedOptionIds;
}

function buildTrainingAttemptResponse(
  check: AlgorithmStaticMicroCheck,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
): TrainingAttemptResponse {
  if (check.type === "complexity_pair") {
    return {
      kind: "complexity_check",
      selectedComplexityAnswer: complexityAnswer,
    };
  }

  return {
    kind: "option_selection",
    selectedOptionIds: [...selectedOptionIds],
  };
}

function getSelectedAnswerText(
  check: AlgorithmStaticMicroCheck,
  response: TrainingAttemptResponse,
): string {
  if (response.kind === "complexity_check") {
    return formatComplexityAnswer(response.selectedComplexityAnswer);
  }

  if (response.kind === "option_selection") {
    if (check.type === "order_steps") {
      return response.selectedOptionIds
        .map((optionId, index) => `${index + 1}. ${getOptionText(check, optionId)}`)
        .join("\n");
    }

    return response.selectedOptionIds.map((optionId) => getOptionText(check, optionId)).join(", ");
  }

  return "Answer unavailable.";
}

function getCurrentSelectedAnswerText(
  check: AlgorithmStaticMicroCheck,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
): string {
  if (check.type === "complexity_pair") {
    return formatComplexityAnswer(complexityAnswer);
  }

  if (check.type === "order_steps") {
    return selectedOptionIds
      .map((optionId, index) => `${index + 1}. ${getOptionText(check, optionId)}`)
      .join("\n");
  }

  return selectedOptionIds.map((optionId) => getOptionText(check, optionId)).join(", ");
}

function formatComplexityAnswer(answer: ComplexityAnswer): string {
  const values: Record<ComplexityDimension, string | undefined> = {
    space: answer.space,
    time: answer.time,
  };

  return [
    values.time ? `Time ${values.time}` : undefined,
    values.space ? `space ${values.space}` : undefined,
  ].filter(Boolean).join(", ") || "No answer selected.";
}

function getActiveReviewCheck(item: AlgorithmTrainingItem): AlgorithmStaticMicroCheck {
  const check = item.staticMicroChecks?.find((candidate) => candidate.status === "active");

  if (!check) {
    throw new Error(`Algorithms item has no active static micro-check: ${item.id}`);
  }

  return check;
}

function getAttemptReviewSignal(entry: {
  attempt: TrainingAttempt;
  item: AlgorithmTrainingItem;
  status: AlgorithmScoringStatus;
}): string {
  const mistakeType = entry.attempt.mistakeTypeRefs?.[0]?.nodeId;

  if (mistakeType) {
    return formatAlgorithmItemType(mistakeType);
  }

  return entry.item.feedbackModel.mentalModelCorrection;
}

function buildRecommendedNext(
  missedAttempts: readonly {
    attempt: TrainingAttempt;
    item: AlgorithmTrainingItem;
    status: AlgorithmScoringStatus;
  }[],
): readonly string[] {
  if (missedAttempts.length === 0) {
    return ["Continue with the next roadmap session."];
  }

  const missedStrategyCount = missedAttempts.filter((entry) => entry.item.type === "strategy_choice").length;
  const recommendations = missedStrategyCount > 0
    ? [`Review ${missedStrategyCount} missed strategy ${missedStrategyCount === 1 ? "item" : "items"}.`]
    : [];

  return uniqueStrings([
    ...recommendations,
    ...missedAttempts.map((entry) => entry.item.feedbackModel.nextAction),
  ]).slice(0, 3);
}

function buildSessionMainIssue(
  missedAttempts: readonly {
    attempt: TrainingAttempt;
    item: AlgorithmTrainingItem;
    status: AlgorithmScoringStatus;
  }[],
): AlgorithmsSessionMainIssue | undefined {
  if (missedAttempts.length === 0) {
    return undefined;
  }

  const patternCounts = new Map<string, { count: number; itemIds: string[] }>();
  const mistakeTypeCounts = new Map<string, number>();

  for (const entry of missedAttempts) {
    const pattern = getAlgorithmsRecognizedPatternText(entry.item);
    const currentPattern = patternCounts.get(pattern) ?? { count: 0, itemIds: [] };
    currentPattern.count += entry.status === "incorrect" ? 2 : 1;
    currentPattern.itemIds.push(entry.item.id);
    patternCounts.set(pattern, currentPattern);

    for (const mistakeType of entry.attempt.mistakeTypeRefs?.map((ref) => ref.nodeId) ?? []) {
      mistakeTypeCounts.set(mistakeType, (mistakeTypeCounts.get(mistakeType) ?? 0) + 1);
    }
  }

  const [pattern, patternStats] = [...patternCounts.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))[0] ?? [];
  const mistakeType = [...mistakeTypeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
  const representativeItem = missedAttempts.find((entry) =>
    getAlgorithmsRecognizedPatternText(entry.item) === pattern,
  )?.item ?? missedAttempts[0]?.item;

  if (!pattern || !representativeItem || !patternStats) {
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
      defaultAction: representativeItem.feedbackModel.nextAction,
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
  item,
  keySignal,
}: {
  correctAnswer: string;
  explanation: string;
  item: AlgorithmTrainingItem;
  keySignal: string;
}): string {
  const candidates = [
    item.feedbackModel.mentalModelCorrection,
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

function uniqueReasons(values: readonly ReviewReason[]): ReviewReason[] {
  return [...new Set(values)];
}

function getCorrectAnswerIds(answer: AlgorithmStaticMicroCheck["correctAnswer"]): ReadonlySet<string> {
  if (Array.isArray(answer)) {
    return new Set(answer);
  }

  if (typeof answer === "string") {
    return new Set([answer]);
  }

  return new Set();
}

function getOptionText(check: AlgorithmStaticMicroCheck, optionId: string): string {
  return check.options?.find((option) => option.id === optionId)?.text ?? optionId;
}

function isComplexityPairAnswer(
  value: AlgorithmStaticMicroCheck["correctAnswer"],
): value is AlgorithmComplexityPairAnswer {
  return typeof value === "object" && !Array.isArray(value) && "space" in value && "time" in value;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
