import type { CertificationDomain, CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/cloud-certification";
import { calculatePercent, getDomainLabel } from "../../utils";

export type SummaryMetrics = { totalCompletedExams: number; averageExamScore: number; bestExamScore: number; totalPracticeQuestionsAnswered: number };
export type ScoreTrendPoint = { label: string; scorePercent: number };
export type PerformanceScore = { id: string; label: string; correct: number; total: number; percent: number };
export type AnalyticsData = { summary: SummaryMetrics; scoreTrend: ScoreTrendPoint[]; domainPerformance: PerformanceScore[]; weakestTags: PerformanceScore[]; weaknessSummary: string[] };
const domains: CertificationDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];
type AnalyticsAnswer = { domain: CertificationDomain; tags: readonly string[]; isCorrect: boolean };

export function buildAnalyticsData(attempts: readonly CertificationExamSummaryViewModel[], practiceHistory: readonly CertificationPracticeAnswerViewModel[]): AnalyticsData {
  const completed = attempts.filter((attempt) => attempt.completedAt).sort((a, b) => (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt));
  const answers: AnalyticsAnswer[] = [...completed.flatMap((attempt) => attempt.answers.map((answer) => ({ domain: answer.questionSnapshot.domain, tags: answer.questionSnapshot.tags, isCorrect: answer.isCorrect }))), ...practiceHistory.map((answer) => ({ domain: answer.domain, tags: answer.tags, isCorrect: answer.isCorrect }))];
  const domainPerformance = domains.map((domain) => { const items = answers.filter((answer) => answer.domain === domain); const correct = items.filter((answer) => answer.isCorrect).length; return { id: domain, label: getDomainLabel(domain), correct, total: items.length, percent: calculatePercent(correct, items.length) }; });
  const tagCounts = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) for (const tag of answer.tags) { const current = tagCounts.get(tag) ?? { correct: 0, total: 0 }; current.correct += answer.isCorrect ? 1 : 0; current.total += 1; tagCounts.set(tag, current); }
  const weakestTags = [...tagCounts].map(([id, score]) => ({ id, label: id, ...score, percent: calculatePercent(score.correct, score.total) })).filter((score) => score.total >= 3).sort((a, b) => a.percent - b.percent || b.total - a.total).slice(0, 8);
  const totalScore = completed.reduce((sum, attempt) => sum + attempt.scorePercent, 0);
  const lowestDomain = [...domainPerformance].filter((score) => score.total > 0).sort((a, b) => a.percent - b.percent)[0];
  const focusTags = weakestTags.filter((tag) => tag.percent < 75).slice(0, 2).map((tag) => tag.label);
  const weaknessSummary = [...(focusTags.length ? [`Focus next on ${focusTags.join(" and ")}.`] : []), ...(lowestDomain ? [`Your lowest domain is ${lowestDomain.label}.`] : [])];
  return { summary: { totalCompletedExams: completed.length, averageExamScore: completed.length ? Math.round(totalScore / completed.length) : 0, bestExamScore: completed.reduce((best, attempt) => Math.max(best, attempt.scorePercent), 0), totalPracticeQuestionsAnswered: practiceHistory.length }, scoreTrend: completed.map((attempt, index) => ({ label: `#${index + 1}`, scorePercent: attempt.scorePercent })), domainPerformance, weakestTags, weaknessSummary: weaknessSummary.length ? weaknessSummary : ["Complete exams and practice questions to build a weakness summary."] };
}
