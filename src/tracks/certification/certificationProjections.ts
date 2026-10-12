import type { ResolvedContentRef, TrainingAttempt, TrainingSession } from "../../domain";
import { calculatePercent } from "../../utils";
import { isCertificationPracticeModeId } from "./domain/certificationModes";
import type { CertificationResponse } from "./domain/certificationResponse";
import type { CertificationAnswerViewModel, CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "./certificationViewModels";

type ResolvedCertificationItem = Readonly<{
  question: Readonly<{ questionId: string; nodeId: string; interactionType: string }>;
  interactions: Readonly<{
    isComplete(questionId: string, response: unknown): boolean;
    presentReview(questionId: string, response: unknown | null, displayOrder?: readonly string[]): Readonly<{ diagnostics: unknown }>;
  }>;
}>;

export async function buildCertificationExamSummaries(
  sessions: readonly TrainingSession[],
  attempts: readonly TrainingAttempt<unknown>[],
  resolveItem: (ref: ResolvedContentRef) => Promise<ResolvedCertificationItem>,
): Promise<CertificationExamSummaryViewModel[]> {
  const summaries = await Promise.all(sessions.filter((session) => session.modeId === "certification-exam-simulation" && session.status === "completed").map(async (session): Promise<CertificationExamSummaryViewModel> => {
    const byOccurrence = new Map(attempts.filter((attempt) => attempt.sessionId === session.id).map((attempt) => [attempt.occurrenceId, attempt]));
    const answeredAt = session.completedAt ?? session.startedAt;
    const answers: CertificationAnswerViewModel[] = await Promise.all(session.itemOrder.map(async (occurrence, index) => {
      const resolved = await resolveItem(occurrence.item);
      const question = resolved.question;
      const attempt = byOccurrence.get(occurrence.occurrenceId);
      const response = attempt && isCertificationResponse(attempt.response) ? attempt.response : undefined;
      const exactResponse = response ? toCanonicalChoiceResponse(question.interactionType, response) : null;
      if (exactResponse !== null && !resolved.interactions.isComplete(question.questionId, exactResponse)) throw new Error("Certification Exam contains a response that does not match its exact content.");
      const review = resolved.interactions.presentReview(question.questionId, exactResponse, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []);
      return { questionId: occurrence.item.questionId, questionNumber: index + 1, questionSnapshot: question, selectedOptionIds: response?.selectedOptionIds ?? [], correctOptionIds: correctOptionIds(review.diagnostics), isAnswered: Boolean(response), isCorrect: attempt?.result.kind === "correct", wasFlagged: attempt?.reviewEvidence.taxonomyOrSkillRefs.some((ref) => ref.axisId === "exam-state" && ref.nodeId === "flagged") ?? false, answeredAt, attemptId: attempt?.id, item: occurrence.item };
    }));
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const scorePercent = calculatePercent(correctCount, answers.length);
    return { id: session.id, mode: "exam", startedAt: session.startedAt, completedAt: session.completedAt, durationSeconds: session.completedAt ? Math.max(0, Math.round((Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000)) : 0, questionCount: answers.length, correctCount, scorePercent, incorrectQuestionIds: answers.filter((answer) => answer.isAnswered && !answer.isCorrect).map((answer) => answer.questionId), unansweredQuestionIds: answers.filter((answer) => !answer.isAnswered).map((answer) => answer.questionId), flaggedQuestionIds: answers.filter((answer) => answer.wasFlagged).map((answer) => answer.questionId), answers, domainScores: buildDomainScores(answers), tagScores: buildTagScores(answers) };
  }));
  return summaries.sort((left, right) => (right.completedAt ?? right.startedAt).localeCompare(left.completedAt ?? left.startedAt));
}

export async function buildCertificationPracticeHistory(
  attempts: readonly TrainingAttempt<unknown>[],
  resolveItem: (ref: ResolvedContentRef) => Promise<ResolvedCertificationItem>,
): Promise<CertificationPracticeAnswerViewModel[]> {
  const histories = await Promise.all(attempts.map(async (attempt) => {
    if (!isCertificationPracticeModeId(attempt.modeId) || !isCertificationResponse(attempt.response)) return [];
    const resolved = await resolveItem(attempt.item);
    const question = resolved.question;
    const exactResponse = toCanonicalChoiceResponse(question.interactionType, attempt.response);
    if (!resolved.interactions.isComplete(question.questionId, exactResponse)) throw new Error("Certification Practice history contains a response that does not match its exact content.");
    const review = resolved.interactions.presentReview(question.questionId, exactResponse, []);
    return [{ id: attempt.id, questionId: question.questionId, questionSnapshot: question, selectedOptionIds: attempt.response.selectedOptionIds, correctOptionIds: correctOptionIds(review.diagnostics), isCorrect: attempt.result.kind === "correct", answeredAt: attempt.answeredAt }];
  }));
  return histories.flat();
}

function isCertificationResponse(value: unknown): value is CertificationResponse { return typeof value === "object" && value !== null && "kind" in value && value.kind === "option_selection" && "selectedOptionIds" in value && Array.isArray(value.selectedOptionIds) && value.selectedOptionIds.every((id) => typeof id === "string"); }
function toCanonicalChoiceResponse(interactionType: string, response: CertificationResponse): unknown {
  if (interactionType === "choice_single" && response.selectedOptionIds.length === 1) return Object.freeze({ type: interactionType, optionId: response.selectedOptionIds[0] });
  if (interactionType === "choice_multiple") return Object.freeze({ type: interactionType, optionIds: Object.freeze([...response.selectedOptionIds]) });
  throw new Error("Certification response cannot be projected by its exact content interaction.");
}
function buildDomainScores(answers: readonly CertificationAnswerViewModel[]) { const domains = [...new Set(answers.map((answer) => answer.questionSnapshot.nodeId ?? "unknown"))]; return domains.map((domain) => { const items = answers.filter((answer) => (answer.questionSnapshot.nodeId ?? "unknown") === domain); const correct = items.filter((answer) => answer.isCorrect).length; return { domain, correct, total: items.length, percent: calculatePercent(correct, items.length) }; }); }
function buildTagScores(_answers: readonly CertificationAnswerViewModel[]) { return []; }
function correctOptionIds(diagnostics: unknown): readonly string[] {
  if (!Array.isArray(diagnostics)) return [];
  return diagnostics.filter((entry): entry is Readonly<{ id: string; state: string }> => typeof entry === "object" && entry !== null && "id" in entry && typeof entry.id === "string" && "state" in entry && typeof entry.state === "string")
    .filter((entry) => entry.state === "correct" || entry.state === "omitted_correct")
    .map((entry) => entry.id);
}
