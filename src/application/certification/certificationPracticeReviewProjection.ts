import { getTrackRegistration, resolvedContentRefsEqual, type AttemptResultKind, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import { isCanonicalResponseComplete, scoreCanonicalQuestion, type CanonicalFeedbackMessage, type JsonValue, type Question } from "../../content/canonical";
import { isCertificationPracticeModeId, type CertificationPracticeModeId } from "../../tracks/certification";
import { projectCanonicalSourceLinks, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import { projectCanonicalChoiceFeedbackMessages } from "../canonical/canonicalInteractionPresentation";
import { overallScoreCredit } from "../canonical/overallScoreCredit";
import { TrainingApplicationFailure } from "../trainingLifecycle";

export type CertificationPracticeReviewItem = Readonly<{
  constraints: readonly string[];
  correctOptionIds: readonly string[];
  details: JsonValue;
  messages?: readonly CanonicalFeedbackMessage[];
  sources?: readonly CanonicalSourceLink[];
  item: CompletedTrainingSession["itemOrder"][number]["item"];
  occurrenceId: string;
  options: readonly Readonly<{ optionId: string; text: string }>[];
  ordinal: number;
  prompt: string;
  questionId: string;
  reason: string;
  result: AttemptResultKind;
  selectedOptionIds: readonly string[];
  selectionMode: "single" | "multiple";
}>;
export type CertificationPracticeReviewProjection = Readonly<{
  feedbackMode: "afterEachAnswer" | "atSessionEnd";
  items: readonly CertificationPracticeReviewItem[];
  modeId: CertificationPracticeModeId;
  overallPointsEarned: number;
  sessionId: string;
  total: number;
}>;

/** Projects verified completed practice evidence using its exact immutable occurrence references. */
export async function projectCertificationPracticeReview(input: Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
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
  const items = await Promise.all(reviewInputs.map(async ({ attempt, occurrence, index }): Promise<CertificationPracticeReviewItem> => {
    const question = await resolveQuestion(occurrence.item);
    const response = attempt.response;
    if (question.questionId !== occurrence.item.questionId || !isCanonicalResponseComplete(question, response)) return fail("Certification Practice answer evidence does not match its immutable session plan.");
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
      constraints: Object.freeze([...(question.constraints ?? [])]),
      correctOptionIds: Object.freeze([...correctOptionIds]),
      details: question.feedback.details,
      ...(messages === undefined ? {} : { messages }),
      sources: projectCanonicalSourceLinks(question),
      item: occurrence.item,
      occurrenceId: occurrence.occurrenceId,
      options: Object.freeze(question.interaction.options.map((option) => Object.freeze({ optionId: option.optionId, text: option.text }))),
      ordinal: index + 1,
      prompt: question.prompt,
      questionId: question.questionId,
      reason: question.feedback.reason,
      result: attempt.result.kind,
      selectedOptionIds: Object.freeze([...selectedOptionIds]),
      selectionMode: question.interaction.type === "choice_multiple" ? "multiple" : "single",
    });
  }));
  if (!certificationReviewEvidenceMatches(result.evidence.details, sessionAttempts)) {
    return fail("Certification Practice result evidence does not match its committed answers.");
  }
  const overallPointsEarned = sessionAttempts.reduce((sum, attempt) => sum + overallScoreCredit(attempt.result), 0);
  return Object.freeze({ feedbackMode, items: Object.freeze(items), modeId: session.modeId, overallPointsEarned, sessionId: session.id, total: session.actualLength });
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
