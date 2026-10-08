import { getTrackRegistration, resolvedContentRefsEqual, type AttemptResultKind, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import { isCanonicalResponseComplete, scoreCanonicalQuestion, type CanonicalFeedbackMessage, type JsonValue, type Question } from "../../content/canonical";
import { isCertificationPracticeModeId, type CertificationPracticeModeId } from "../../tracks/certification";
import { projectCanonicalSourceLinks, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import { projectCanonicalChoiceFeedbackMessages } from "../canonical/canonicalInteractionPresentation";
import { overallScoreCredit } from "../canonical/overallScoreCredit";
import { TrainingApplicationFailure } from "../trainingLifecycle";

export type CertificationPracticeReviewItem = Readonly<{
  contentDomainId?: string;
  constraints: readonly string[];
  correctOptionIds: readonly string[];
  details: JsonValue;
  messages?: readonly CanonicalFeedbackMessage[];
  sources?: readonly CanonicalSourceLink[];
  item: CompletedTrainingSession["itemOrder"][number]["item"];
  mentalUnitId?: string;
  nodeId?: string;
  occurrenceId: string;
  options: readonly Readonly<{ optionId: string; text: string }>[];
  ordinal: number;
  prompt: string;
  questionId: string;
  reason: string;
  result: AttemptResultKind;
  selectedOptionIds: readonly string[];
  sourceAttemptId: string;
  selectionMode: "single" | "multiple";
}>;
export type CertificationDiagnosticUnitSummary = Readonly<{
  contentDomainIds: readonly string[];
  correctCount: number;
  incorrectCount: number;
  mentalUnitId: string;
  unansweredCount: number;
  unitNumber: number;
  nodeId: string;
  partialCount: number;
  questionCount: number;
  repeatExposureCount: number | null;
  firstRecordedExposureCount: number | null;
  exposureHistoryKnown: boolean;
  firstOrdinal: number;
}>;
export type CertificationDiagnosticRecommendation =
  | Readonly<{ kind: "observed_gap"; nodeId: string; mentalUnitId: string; unitNumber: number; incorrectCount: number; partialCount: number; sampledQuestionCount: number; eligibleQuestionCount: number }>
  | Readonly<{ kind: "neutral_practice"; nodeId: string; mentalUnitId: string; unitNumber: number; eligibleQuestionCount: number }>
  | Readonly<{ kind: "unavailable"; reason: "no_eligible_unit" | "unit_pool_below_minimum" }>;
export type CertificationDiagnosticReport = Readonly<{
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  unansweredCount: number;
  totalCount: number;
  sampledMentalUnitIds: readonly string[];
  unsampledMentalUnitCount: number;
  exposureHistory: "available" | "unknown";
  units: readonly CertificationDiagnosticUnitSummary[];
  recommendation: CertificationDiagnosticRecommendation;
}>;
export type CertificationPracticeReviewProjection = Readonly<{
  diagnosticReport?: CertificationDiagnosticReport;
  feedbackMode: "afterEachAnswer" | "atSessionEnd";
  items: readonly CertificationPracticeReviewItem[];
  modeId: CertificationPracticeModeId;
  overallPointsEarned: number;
  relatedPracticeLimitation?: "related_question_pair";
  sessionId: string;
  total: number;
}>;

/** Projects verified completed practice evidence using its exact immutable occurrence references. */
export async function projectCertificationPracticeReview(input: Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
  diagnosticContext?: Readonly<{ focusPool: readonly Question[]; focusMinimumActualLength: number; diagnosticQuestionIds: readonly string[]; exposureHistoryAvailable: boolean }>;
  resolveQuestion: (item: CompletedTrainingSession["itemOrder"][number]["item"]) => Promise<Question>;
  result: TrainingSessionResult;
  session: CompletedTrainingSession;
}>): Promise<CertificationPracticeReviewProjection> {
  const { attempts, resolveQuestion, result, session } = input;
  const fail = (message: string): never => { throw new TrainingApplicationFailure("summary_unavailable", message); };
  if (session.id !== result.sessionId || session.status !== "completed" || !session.completedAt ||
    getTrackRegistration(session.trackId).familyId !== "certification" || !isCertificationPracticeModeId(session.modeId) || result.trackId !== session.trackId || result.completedAt !== session.completedAt || result.evidence.familyId !== "certification") {
    return fail("Answer review requires one verified completed Certification Practice session.");
  }
  const occurrenceIds = session.itemOrder.map((occurrence) => occurrence.occurrenceId);
  if (result.totalOccurrences !== session.actualLength || JSON.stringify(result.answeredOccurrenceIds) !== JSON.stringify(occurrenceIds) || result.unansweredOccurrenceIds.length !== 0) {
    return fail("Certification Practice completion evidence is incomplete.");
  }
  const sessionAttempts = attempts.filter((attempt) => attempt.sessionId === session.id);
  const attemptByOccurrenceId = new Map(sessionAttempts.map((attempt) => [attempt.occurrenceId, attempt]));
  if (sessionAttempts.length !== session.actualLength || attemptByOccurrenceId.size !== session.actualLength) {
    return fail("Certification Practice answer evidence is missing or duplicated.");
  }
  const feedbackMode = session.configurationSnapshot.feedbackMode;
  if (feedbackMode !== "afterEachAnswer" && feedbackMode !== "atSessionEnd") {
    throw new TrainingApplicationFailure("corrupt_state", "Certification Practice is missing its immutable feedback timing.");
  }
  const reviewInputs = session.itemOrder.map((occurrence, index) => {
    const attempt = attemptByOccurrenceId.get(occurrence.occurrenceId);
    if (!attempt || attempt.trackId !== session.trackId || attempt.modeId !== session.modeId || !resolvedContentRefsEqual(attempt.item, occurrence.item)) {
      return fail("Certification Practice answer evidence does not match its immutable session plan.");
    }
    return { attempt, occurrence, index };
  });
  const questionById = new Map<string, Question>();
  const items = await Promise.all(reviewInputs.map(async ({ attempt, occurrence, index }): Promise<CertificationPracticeReviewItem> => {
    const question = await resolveQuestion(occurrence.item);
    const response = attempt.response;
    if (question.questionId !== occurrence.item.questionId || !isCanonicalResponseComplete(question, response)) return fail("Certification Practice answer evidence does not match its immutable session plan.");
    questionById.set(question.questionId, question);
    const scored = scoreCanonicalQuestion(question, response);
    if (JSON.stringify(scored) !== JSON.stringify(attempt.result)) return fail("Certification Practice answer evidence has an invalid result.");
    if ((question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") || (question.answer.type !== "choice_single" && question.answer.type !== "choice_multiple")) {
      return fail("Certification Practice review supports only declared choice interactions.");
    }
    const selectedOptionIds = response.type === "choice_single" ? [response.optionId] : response.type === "choice_multiple" ? response.optionIds : [];
    const correctOptionIds = question.answer.type === "choice_single" ? [question.answer.optionId] : question.answer.type === "choice_multiple" ? question.answer.optionIds : [];
    if (selectedOptionIds.length === 0 || correctOptionIds.length === 0) return fail("Certification Practice review evidence is incomplete.");
    const messages = projectCanonicalChoiceFeedbackMessages(question, response);
    return Object.freeze({
      ...(question.contentDomainId === undefined ? {} : { contentDomainId: question.contentDomainId }),
      constraints: Object.freeze([...(question.constraints ?? [])]),
      correctOptionIds: Object.freeze([...correctOptionIds]),
      details: question.feedback.details,
      ...(messages === undefined ? {} : { messages }),
      sources: projectCanonicalSourceLinks(question),
      item: occurrence.item,
      mentalUnitId: question.mentalUnitId,
      nodeId: question.nodeId,
      occurrenceId: occurrence.occurrenceId,
      options: Object.freeze(question.interaction.options.map((option) => Object.freeze({ optionId: option.optionId, text: option.text }))),
      ordinal: index + 1,
      prompt: question.prompt,
      questionId: question.questionId,
      reason: question.feedback.reason,
      result: attempt.result.kind,
      selectedOptionIds: Object.freeze([...selectedOptionIds]),
      sourceAttemptId: attempt.id,
      selectionMode: question.interaction.type === "choice_multiple" ? "multiple" : "single",
    });
  }));
  if (!certificationReviewEvidenceMatches(result.evidence.details, sessionAttempts)) {
    return fail("Certification Practice result evidence does not match its committed answers.");
  }
  const overallPointsEarned = sessionAttempts.reduce((sum, attempt) => sum + overallScoreCredit(attempt.result), 0);
  const diagnosticReport = session.modeId === "certification-diagnostic-baseline"
    ? projectDiagnosticReport({ items, attempts, session, ...(input.diagnosticContext ? { context: input.diagnosticContext } : {}) })
    : undefined;
  const relatedPracticeLimitation = hasRecordedRelatedQuestionPair({ attempts, items, questionById, session, attemptByOccurrenceId })
    ? "related_question_pair" as const
    : undefined;
  return Object.freeze({ ...(diagnosticReport ? { diagnosticReport } : {}), feedbackMode, items: Object.freeze(items), modeId: session.modeId, overallPointsEarned, ...(relatedPracticeLimitation ? { relatedPracticeLimitation } : {}), sessionId: session.id, total: session.actualLength });
}

function hasRecordedRelatedQuestionPair(input: Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
  items: readonly CertificationPracticeReviewItem[];
  questionById: ReadonlyMap<string, Question>;
  session: CompletedTrainingSession;
  attemptByOccurrenceId: ReadonlyMap<string, TrainingAttempt<unknown>>;
}>): boolean {
  const { attempts, items, questionById, session, attemptByOccurrenceId } = input;
  for (const item of items) {
    const question = questionById.get(item.questionId);
    const relation = question?.questionRelation;
    if (!relation) continue;
    const peerInSession = questionById.get(relation.counterpartQuestionId);
    if (peerInSession?.questionRelation?.kind === relation.kind
      && peerInSession.questionRelation.counterpartQuestionId === question.questionId
      && peerInSession.questionRelation.changedCondition === relation.changedCondition
      && peerInSession.questionRelation.decisionBoundary === relation.decisionBoundary
      && peerInSession.trackId === question.trackId && peerInSession.nodeId === question.nodeId && peerInSession.mentalUnitId === question.mentalUnitId) return true;

    const currentAttempt = attemptByOccurrenceId.get(item.occurrenceId);
    const currentAnsweredAt = currentAttempt ? Date.parse(currentAttempt.answeredAt) : Number.NaN;
    if (!Number.isFinite(currentAnsweredAt)) continue;
    const priorPeerRecorded = attempts.some((attempt) => attempt.sessionId !== session.id
      && attempt.trackId === session.trackId
      && attempt.item.trackId === session.trackId
      && attempt.item.contentVersion === session.contentVersion
      && attempt.item.artifactSha256 === session.artifactSha256
      && attempt.item.questionId === relation.counterpartQuestionId
      && Number.isFinite(Date.parse(attempt.answeredAt))
      && Date.parse(attempt.answeredAt) < currentAnsweredAt);
    if (priorPeerRecorded) return true;
  }
  return false;
}

function projectDiagnosticReport(input: Readonly<{
  items: readonly CertificationPracticeReviewItem[];
  attempts: readonly TrainingAttempt<unknown>[];
  session: CompletedTrainingSession;
  context?: Readonly<{ focusPool: readonly Question[]; focusMinimumActualLength: number; diagnosticQuestionIds: readonly string[]; exposureHistoryAvailable: boolean }>;
}>): CertificationDiagnosticReport | undefined {
  const { items, attempts, session, context } = input;
  if (session.trackId !== "google-cloud-associate-cloud-engineer" || !context ||
    !Number.isSafeInteger(context.focusMinimumActualLength) || context.focusMinimumActualLength < 1 ||
    session.actualLength !== context.diagnosticQuestionIds.length || items.length !== context.diagnosticQuestionIds.length ||
    JSON.stringify(items.map((item) => item.questionId)) !== JSON.stringify(context.diagnosticQuestionIds) ||
    new Set(items.map((item) => item.occurrenceId)).size !== items.length || new Set(items.map((item) => item.questionId)).size !== items.length) return undefined;
  const firstOrdinal = new Map<string, number>();
  const grouped = new Map<string, { nodeId: string; mentalUnitId: string; contentDomainIds: Set<string>; correctCount: number; partialCount: number; incorrectCount: number; questionCount: number; repeatExposureCount: number; firstRecordedExposureCount: number; exposureHistoryKnown: boolean; }>();
  const pinnedHistory = attempts.filter((attempt) => attempt.trackId === session.trackId && attempt.sessionId !== session.id && attempt.item.trackId === session.trackId && attempt.item.contentVersion === session.contentVersion && attempt.item.artifactSha256 === session.artifactSha256);
  const sourceAttemptByOccurrence = new Map(items.map((item) => [item.occurrenceId, attempts.find((attempt) => attempt.sessionId === session.id && attempt.occurrenceId === item.occurrenceId)]));
  const exposureFor = (item: CertificationPracticeReviewItem): "first" | "repeat" | "unknown" => {
    if (!context.exposureHistoryAvailable) return "unknown";
    const sourceAttempt = sourceAttemptByOccurrence.get(item.occurrenceId);
    const sourceAnsweredAt = sourceAttempt ? Date.parse(sourceAttempt.answeredAt) : Number.NaN;
    if (!Number.isFinite(sourceAnsweredAt)) return "unknown";
    const history = pinnedHistory.filter((attempt) => attempt.item.questionId === item.questionId);
    const timestamps = history.map((attempt) => Date.parse(attempt.answeredAt));
    if (timestamps.some((timestamp) => !Number.isFinite(timestamp) || timestamp === sourceAnsweredAt)) return "unknown";
    return timestamps.some((timestamp) => timestamp < sourceAnsweredAt) ? "repeat" : "first";
  };
  for (const item of items) {
    if (!item.nodeId || !item.mentalUnitId) return undefined;
    const existing = grouped.get(item.mentalUnitId) ?? { nodeId: item.nodeId, mentalUnitId: item.mentalUnitId, contentDomainIds: new Set<string>(), correctCount: 0, partialCount: 0, incorrectCount: 0, questionCount: 0, repeatExposureCount: 0, firstRecordedExposureCount: 0, exposureHistoryKnown: context.exposureHistoryAvailable };
    if (existing.nodeId !== item.nodeId) return undefined;
    if (item.contentDomainId) existing.contentDomainIds.add(item.contentDomainId);
    existing.questionCount += 1;
    if (item.result === "correct") existing.correctCount += 1;
    else if (item.result === "partial") existing.partialCount += 1;
    else existing.incorrectCount += 1;
    const exposure = exposureFor(item);
    if (exposure === "repeat") existing.repeatExposureCount += 1;
    else if (exposure === "first") existing.firstRecordedExposureCount += 1;
    else existing.exposureHistoryKnown = false;
    grouped.set(item.mentalUnitId, existing);
    if (!firstOrdinal.has(item.mentalUnitId)) firstOrdinal.set(item.mentalUnitId, item.ordinal);
  }
  const units = [...grouped.values()].map((unit) => Object.freeze({
    contentDomainIds: Object.freeze([...unit.contentDomainIds].sort()),
    correctCount: unit.correctCount,
    incorrectCount: unit.incorrectCount,
    mentalUnitId: unit.mentalUnitId,
    nodeId: unit.nodeId,
    partialCount: unit.partialCount,
    questionCount: unit.questionCount,
    repeatExposureCount: unit.exposureHistoryKnown ? unit.repeatExposureCount : null,
    firstRecordedExposureCount: unit.exposureHistoryKnown ? unit.firstRecordedExposureCount : null,
    exposureHistoryKnown: unit.exposureHistoryKnown,
    firstOrdinal: firstOrdinal.get(unit.mentalUnitId)!,
  }));
  const sampledMentalUnitIds = new Set(units.map((unit) => unit.mentalUnitId));
  const diagnosticNodeId = units[0]?.nodeId;
  if (!diagnosticNodeId || units.some((unit) => unit.nodeId !== diagnosticNodeId) || context.focusPool.some((question) => question.trackId !== session.trackId)) return undefined;
  const focusQuestionsById = new Map(context.focusPool.map((question) => [question.questionId, question]));
  if (focusQuestionsById.size !== context.focusPool.length || items.some((item) => {
    const focusQuestion = focusQuestionsById.get(item.questionId);
    return !focusQuestion || focusQuestion.nodeId !== item.nodeId || focusQuestion.mentalUnitId !== item.mentalUnitId || focusQuestion.contentDomainId !== item.contentDomainId;
  })) return undefined;
  const focusPool = context.focusPool.filter((question) => question.nodeId === diagnosticNodeId);
  const unitNumberById = new Map<string, number>();
  for (const question of focusPool) {
    if (!question.mentalUnitId.trim()) return undefined;
    if (!unitNumberById.has(question.mentalUnitId)) unitNumberById.set(question.mentalUnitId, unitNumberById.size + 1);
  }
  if (units.some((unit) => !unitNumberById.has(unit.mentalUnitId))) return undefined;
  const numberedUnits = Object.freeze(units.map((unit) => Object.freeze({ ...unit, unansweredCount: 0, unitNumber: unitNumberById.get(unit.mentalUnitId)! })));
  const eligibleCount = (mentalUnitId: string) => focusPool.filter((question) => question.mentalUnitId === mentalUnitId).length;
  const withEligible = (mentalUnitId: string) => eligibleCount(mentalUnitId) >= context.focusMinimumActualLength;
  const gaps = units.filter((unit) => unit.incorrectCount + unit.partialCount > 0)
    .sort((left, right) => (right.incorrectCount + right.partialCount) - (left.incorrectCount + left.partialCount) || left.firstOrdinal - right.firstOrdinal);
  let recommendation: CertificationDiagnosticRecommendation;
  if (gaps.length > 0) {
    const target = gaps[0]!;
    recommendation = withEligible(target.mentalUnitId)
      ? Object.freeze({ kind: "observed_gap", nodeId: target.nodeId, mentalUnitId: target.mentalUnitId, unitNumber: unitNumberById.get(target.mentalUnitId)!, incorrectCount: target.incorrectCount, partialCount: target.partialCount, sampledQuestionCount: target.questionCount, eligibleQuestionCount: eligibleCount(target.mentalUnitId) })
      : Object.freeze({ kind: "unavailable", reason: "unit_pool_below_minimum" });
  } else {
    const neutral = focusPool.find((question) => !sampledMentalUnitIds.has(question.mentalUnitId) && withEligible(question.mentalUnitId));
    recommendation = neutral
      ? Object.freeze({ kind: "neutral_practice", nodeId: neutral.nodeId, mentalUnitId: neutral.mentalUnitId, unitNumber: unitNumberById.get(neutral.mentalUnitId)!, eligibleQuestionCount: eligibleCount(neutral.mentalUnitId) })
      : Object.freeze({ kind: "unavailable", reason: "no_eligible_unit" });
  }
  const answeredCount = items.length;
  return Object.freeze({
    answeredCount,
    correctCount: items.filter((item) => item.result === "correct").length,
    incorrectCount: items.filter((item) => item.result === "incorrect").length,
    partialCount: items.filter((item) => item.result === "partial").length,
    unansweredCount: Math.max(0, session.actualLength - answeredCount),
    totalCount: session.actualLength,
    sampledMentalUnitIds: Object.freeze([...sampledMentalUnitIds]),
    unsampledMentalUnitCount: new Set(focusPool.map((question) => question.mentalUnitId)).size - sampledMentalUnitIds.size,
    exposureHistory: units.every((unit) => unit.exposureHistoryKnown) ? "available" : "unknown",
    units: numberedUnits,
    recommendation,
  });
}

export function certificationReviewEvidenceMatches(
  details: unknown,
  attempts: readonly Readonly<{ result: Readonly<{ earnedPoints: number; kind: AttemptResultKind; maxPoints: number }> }>[],
): boolean {
  if (!details || typeof details !== "object" || Array.isArray(details)) return false;
  const evidence = details as Record<string, unknown>;
  const expected = {
    correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length,
    incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length,
    maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0),
    partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length,
    pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0),
  };
  return Object.entries(expected).every(([key, value]) => evidence[key] === value);
}
