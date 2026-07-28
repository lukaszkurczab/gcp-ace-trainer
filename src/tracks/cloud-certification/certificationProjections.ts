import type { TrainingAttempt, TrainingSession } from "../../domain";
import { calculatePercent } from "../../utils";
import { getCertificationContentCatalog } from "../../content/catalogRepository";
import { isCertificationPracticeModeId, type CertificationDomain, type CertificationResponse } from "./domain";
import type { CertificationAnswerViewModel, CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "./certificationViewModels";

export function buildCertificationExamSummaries(sessions: readonly TrainingSession[], attempts: readonly TrainingAttempt<unknown>[]): CertificationExamSummaryViewModel[] {
  return sessions.filter((session) => session.modeId === "certification-exam-simulation" && session.status === "completed").map<CertificationExamSummaryViewModel>((session) => {
    const byOccurrence = new Map(attempts.filter((attempt) => attempt.sessionId === session.id).map((attempt) => [attempt.occurrenceId, attempt]));
    const answeredAt = session.completedAt ?? session.startedAt;
    const answers: CertificationAnswerViewModel[] = session.itemOrder.map((occurrence, index) => {
      const question = getCertificationContentCatalog().getItemById(occurrence.item.itemId);
      const attempt = byOccurrence.get(occurrence.occurrenceId);
      const response = attempt && isCertificationResponse(attempt.response) ? attempt.response : undefined;
      return { questionId: occurrence.item.itemId, questionNumber: index + 1, questionSnapshot: question, selectedOptionIds: response?.selectedOptionIds ?? [], correctOptionIds: question.correctOptionIds, isAnswered: Boolean(response), isCorrect: attempt?.result.kind === "correct", wasFlagged: attempt?.reviewEvidence.taxonomyOrSkillRefs.some((ref) => ref.axisId === "exam-state" && ref.nodeId === "flagged") ?? false, answeredAt };
    });
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const scorePercent = calculatePercent(correctCount, answers.length);
    return { id: session.id, mode: "exam", startedAt: session.startedAt, completedAt: session.completedAt, durationSeconds: session.completedAt ? Math.max(0, Math.round((Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000)) : 0, questionCount: answers.length, correctCount, scorePercent, incorrectQuestionIds: answers.filter((answer) => answer.isAnswered && !answer.isCorrect).map((answer) => answer.questionId), unansweredQuestionIds: answers.filter((answer) => !answer.isAnswered).map((answer) => answer.questionId), flaggedQuestionIds: answers.filter((answer) => answer.wasFlagged).map((answer) => answer.questionId), answers, domainScores: buildDomainScores(answers), tagScores: buildTagScores(answers) };
  }).sort((left, right) => (right.completedAt ?? right.startedAt).localeCompare(left.completedAt ?? left.startedAt));
}

export function buildCertificationPracticeHistory(attempts: readonly TrainingAttempt<unknown>[]): CertificationPracticeAnswerViewModel[] {
  return attempts.flatMap((attempt) => {
    if (!isCertificationPracticeModeId(attempt.modeId) || !isCertificationResponse(attempt.response)) return [];
    const question = getCertificationContentCatalog().getItemById(attempt.item.itemId);
    return [{ id: attempt.id, questionId: question.id, questionSnapshot: question, domain: question.domain, tags: question.tags, selectedOptionIds: attempt.response.selectedOptionIds, correctOptionIds: question.correctOptionIds, isCorrect: attempt.result.kind === "correct", answeredAt: attempt.answeredAt }];
  });
}

function isCertificationResponse(value: unknown): value is CertificationResponse { return typeof value === "object" && value !== null && "kind" in value && value.kind === "option_selection" && "selectedOptionIds" in value && Array.isArray(value.selectedOptionIds) && value.selectedOptionIds.every((id) => typeof id === "string"); }
function buildDomainScores(answers: readonly CertificationAnswerViewModel[]) { const domains: CertificationDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"]; return domains.map((domain) => { const items = answers.filter((answer) => answer.questionSnapshot.domain === domain); const correct = items.filter((answer) => answer.isCorrect).length; return { domain, correct, total: items.length, percent: calculatePercent(correct, items.length) }; }); }
function buildTagScores(answers: readonly CertificationAnswerViewModel[]) { const scores = new Map<string, { tag: string; correct: number; total: number; percent: number }>(); for (const answer of answers) for (const tag of answer.questionSnapshot.tags) { const current = scores.get(tag) ?? { tag, correct: 0, total: 0, percent: 0 }; current.correct += answer.isCorrect ? 1 : 0; current.total += 1; current.percent = calculatePercent(current.correct, current.total); scores.set(tag, current); } return [...scores.values()].sort((a, b) => a.percent - b.percent || b.total - a.total); }
