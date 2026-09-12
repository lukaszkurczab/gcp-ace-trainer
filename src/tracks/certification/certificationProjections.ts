import type { TrainingAttempt, TrainingSession } from "../../domain";
import { calculatePercent } from "../../utils";
import type { ContentItemRef } from "../../domain";
import { isCertificationPracticeModeId } from "./domain/certificationModes";
import type { CertificationResponse } from "./domain/certificationResponse";
import type { Question } from "../../content/canonical";
import type { CertificationAnswerViewModel, CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "./certificationViewModels";

export async function buildCertificationExamSummaries(
  sessions: readonly TrainingSession[],
  attempts: readonly TrainingAttempt<unknown>[],
  resolveItem: (ref: ContentItemRef) => Promise<Question>,
): Promise<CertificationExamSummaryViewModel[]> {
  const summaries = await Promise.all(sessions.filter((session) => session.modeId === "certification-exam-simulation" && session.status === "completed").map(async (session): Promise<CertificationExamSummaryViewModel> => {
    const byOccurrence = new Map(attempts.filter((attempt) => attempt.sessionId === session.id).map((attempt) => [attempt.occurrenceId, attempt]));
    const answeredAt = session.completedAt ?? session.startedAt;
    const answers: CertificationAnswerViewModel[] = await Promise.all(session.itemOrder.map(async (occurrence, index) => {
      const question = await resolveItem(occurrence.item);
      const attempt = byOccurrence.get(occurrence.occurrenceId);
      const response = attempt && isCertificationResponse(attempt.response) ? attempt.response : undefined;
      return { questionId: occurrence.item.itemId, questionNumber: index + 1, questionSnapshot: question, selectedOptionIds: response?.selectedOptionIds ?? [], correctOptionIds: canonicalOptionIds(question), isAnswered: Boolean(response), isCorrect: attempt?.result.kind === "correct", wasFlagged: attempt?.reviewEvidence.taxonomyOrSkillRefs.some((ref) => ref.axisId === "exam-state" && ref.nodeId === "flagged") ?? false, answeredAt, attemptId: attempt?.id, item: occurrence.item };
    }));
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const scorePercent = calculatePercent(correctCount, answers.length);
    return { id: session.id, mode: "exam", startedAt: session.startedAt, completedAt: session.completedAt, durationSeconds: session.completedAt ? Math.max(0, Math.round((Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000)) : 0, questionCount: answers.length, correctCount, scorePercent, incorrectQuestionIds: answers.filter((answer) => answer.isAnswered && !answer.isCorrect).map((answer) => answer.questionId), unansweredQuestionIds: answers.filter((answer) => !answer.isAnswered).map((answer) => answer.questionId), flaggedQuestionIds: answers.filter((answer) => answer.wasFlagged).map((answer) => answer.questionId), answers, domainScores: buildDomainScores(answers), tagScores: buildTagScores(answers) };
  }));
  return summaries.sort((left, right) => (right.completedAt ?? right.startedAt).localeCompare(left.completedAt ?? left.startedAt));
}

export async function buildCertificationPracticeHistory(
  attempts: readonly TrainingAttempt<unknown>[],
  resolveItem: (ref: ContentItemRef) => Promise<Question>,
): Promise<CertificationPracticeAnswerViewModel[]> {
  const histories = await Promise.all(attempts.map(async (attempt) => {
    if (!isCertificationPracticeModeId(attempt.modeId) || !isCertificationResponse(attempt.response)) return [];
    const question = await resolveItem(attempt.item);
    return [{ id: attempt.id, questionId: question.questionId, questionSnapshot: question, selectedOptionIds: attempt.response.selectedOptionIds, correctOptionIds: canonicalOptionIds(question), isCorrect: attempt.result.kind === "correct", answeredAt: attempt.answeredAt }];
  }));
  return histories.flat();
}

function isCertificationResponse(value: unknown): value is CertificationResponse { return typeof value === "object" && value !== null && "kind" in value && value.kind === "option_selection" && "selectedOptionIds" in value && Array.isArray(value.selectedOptionIds) && value.selectedOptionIds.every((id) => typeof id === "string"); }
function buildDomainScores(answers: readonly CertificationAnswerViewModel[]) { const domains = [...new Set(answers.map((answer) => answer.questionSnapshot.nodeId ?? "unknown"))]; return domains.map((domain) => { const items = answers.filter((answer) => (answer.questionSnapshot.nodeId ?? "unknown") === domain); const correct = items.filter((answer) => answer.isCorrect).length; return { domain, correct, total: items.length, percent: calculatePercent(correct, items.length) }; }); }
function buildTagScores(_answers: readonly CertificationAnswerViewModel[]) { return []; }
function canonicalOptionIds(question: Question): readonly string[] { return question.answer.type === "choice_single" ? [question.answer.optionId] : question.answer.type === "choice_multiple" ? question.answer.optionIds : []; }
