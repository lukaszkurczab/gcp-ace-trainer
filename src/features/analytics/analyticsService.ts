import { TRAINING_PASS_THRESHOLD } from "../../constants";
import type { AnswerRecord, AttemptSummary, Confidence, ExamDomain, MistakeReason, PracticeAnswerRecord } from "../../types";
import { calculatePercent, getDomainLabel } from "../../utils";

export type SummaryMetrics = {
  totalCompletedExams: number;
  averageExamScore: number;
  bestExamScore: number;
  trainingPassRate: number;
  totalPracticeQuestionsAnswered: number;
};

export type ScoreTrendPoint = {
  label: string;
  scorePercent: number;
};

export type PerformanceScore = {
  id: string;
  label: string;
  correct: number;
  total: number;
  percent: number;
};

export type ConfidenceAccuracy = {
  confidence: Confidence;
  correct: number;
  total: number;
  percent: number;
  warning?: string;
};

export type MistakeReasonDistribution = {
  reason: MistakeReason;
  count: number;
  percent: number;
};

export type AnalyticsData = {
  summary: SummaryMetrics;
  scoreTrend: ScoreTrendPoint[];
  domainPerformance: PerformanceScore[];
  weakestTags: PerformanceScore[];
  confidenceAccuracy: ConfidenceAccuracy[];
  mistakeReasons: MistakeReasonDistribution[];
  mostCommonMistakeReason?: MistakeReason;
  weaknessSummary: string[];
};

const domains: ExamDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];
const confidenceValues: Confidence[] = ["sure", "unsure", "guess"];
const minimumTagSampleSize = 3;

type AnalyticsAnswer = {
  domain: ExamDomain;
  tags: string[];
  isCorrect: boolean;
  confidence?: Confidence;
  mistakeReason?: MistakeReason;
};

export function buildAnalyticsData(attempts: readonly AttemptSummary[], practiceHistory: readonly PracticeAnswerRecord[]): AnalyticsData {
  const completedExamAttempts = attempts
    .filter((attempt) => attempt.mode === "exam" && attempt.completedAt)
    .sort((left, right) => new Date(left.completedAt ?? left.startedAt).getTime() - new Date(right.completedAt ?? right.startedAt).getTime());
  const answers = [...completedExamAttempts.flatMap(mapExamAnswers), ...practiceHistory.map(mapPracticeAnswer)];
  const domainPerformance = buildDomainPerformance(answers);
  const weakestTags = buildTagPerformance(answers);
  const confidenceAccuracy = buildConfidenceAccuracy(answers);
  const mistakeReasons = buildMistakeReasons(answers);

  return {
    summary: buildSummary(completedExamAttempts, practiceHistory),
    scoreTrend: completedExamAttempts.map((attempt, index) => ({
      label: `#${index + 1}`,
      scorePercent: attempt.scorePercent
    })),
    domainPerformance,
    weakestTags,
    confidenceAccuracy,
    mistakeReasons,
    mostCommonMistakeReason: mistakeReasons[0]?.reason,
    weaknessSummary: buildWeaknessSummary(domainPerformance, weakestTags, mistakeReasons)
  };
}

function buildSummary(
  completedExamAttempts: readonly AttemptSummary[],
  practiceHistory: readonly PracticeAnswerRecord[]
): SummaryMetrics {
  const totalCompletedExams = completedExamAttempts.length;
  const totalScore = completedExamAttempts.reduce((sum, attempt) => sum + attempt.scorePercent, 0);
  const passedAttempts = completedExamAttempts.filter((attempt) => attempt.scorePercent >= TRAINING_PASS_THRESHOLD).length;

  return {
    totalCompletedExams,
    averageExamScore: totalCompletedExams > 0 ? Math.round(totalScore / totalCompletedExams) : 0,
    bestExamScore: completedExamAttempts.reduce((best, attempt) => Math.max(best, attempt.scorePercent), 0),
    trainingPassRate: calculatePercent(passedAttempts, totalCompletedExams),
    totalPracticeQuestionsAnswered: practiceHistory.length
  };
}

function mapExamAnswers(attempt: AttemptSummary): AnalyticsAnswer[] {
  return attempt.answers.flatMap((answer) => {
    if (!answer.questionSnapshot || !Array.isArray(answer.questionSnapshot.tags)) {
      return [];
    }

    return [
      {
        domain: answer.questionSnapshot.domain,
        tags: answer.questionSnapshot.tags,
        isCorrect: answer.isCorrect,
        confidence: answer.confidence,
        mistakeReason: answer.mistakeReason
      }
    ];
  });
}

function mapPracticeAnswer(record: PracticeAnswerRecord): AnalyticsAnswer {
  return {
    domain: record.domain,
    tags: record.tags,
    isCorrect: record.isCorrect,
    confidence: record.confidence,
    mistakeReason: record.mistakeReason
  };
}

function buildDomainPerformance(answers: readonly AnalyticsAnswer[]): PerformanceScore[] {
  return domains.map((domain) => {
    const domainAnswers = answers.filter((answer) => answer.domain === domain);
    const correct = domainAnswers.filter((answer) => answer.isCorrect).length;

    return {
      id: domain,
      label: getDomainLabel(domain),
      correct,
      total: domainAnswers.length,
      percent: calculatePercent(correct, domainAnswers.length)
    };
  });
}

function buildTagPerformance(answers: readonly AnalyticsAnswer[]): PerformanceScore[] {
  const scores = new Map<string, { correct: number; total: number }>();

  answers.forEach((answer) => {
    answer.tags.forEach((tag) => {
      const current = scores.get(tag) ?? { correct: 0, total: 0 };
      scores.set(tag, {
        correct: current.correct + (answer.isCorrect ? 1 : 0),
        total: current.total + 1
      });
    });
  });

  return [...scores.entries()]
    .map(([tag, score]) => ({
      id: tag,
      label: tag,
      correct: score.correct,
      total: score.total,
      percent: calculatePercent(score.correct, score.total)
    }))
    .filter((score) => score.total >= minimumTagSampleSize)
    .sort((left, right) => left.percent - right.percent || right.total - left.total)
    .slice(0, 8);
}

function buildConfidenceAccuracy(answers: readonly AnalyticsAnswer[]): ConfidenceAccuracy[] {
  return confidenceValues.map((confidence) => {
    const confidenceAnswers = answers.filter((answer) => answer.confidence === confidence);
    const correct = confidenceAnswers.filter((answer) => answer.isCorrect).length;
    const percent = calculatePercent(correct, confidenceAnswers.length);

    return {
      confidence,
      correct,
      total: confidenceAnswers.length,
      percent,
      warning: getConfidenceWarning(confidence, percent, confidenceAnswers.length)
    };
  });
}

function getConfidenceWarning(confidence: Confidence, percent: number, total: number): string | undefined {
  if (total < 3) {
    return undefined;
  }

  if (confidence === "sure" && percent < 75) {
    return "Sure accuracy is low.";
  }

  if (confidence === "guess" && percent >= 70) {
    return "Guess accuracy is high.";
  }

  return undefined;
}

function buildMistakeReasons(answers: readonly AnalyticsAnswer[]): MistakeReasonDistribution[] {
  const reasons = new Map<MistakeReason, number>();
  const incorrectAnswers = answers.filter((answer) => !answer.isCorrect && answer.mistakeReason);

  incorrectAnswers.forEach((answer) => {
    if (!answer.mistakeReason) {
      return;
    }

    reasons.set(answer.mistakeReason, (reasons.get(answer.mistakeReason) ?? 0) + 1);
  });

  return [...reasons.entries()]
    .map(([reason, count]) => ({
      reason,
      count,
      percent: calculatePercent(count, incorrectAnswers.length)
    }))
    .sort((left, right) => right.count - left.count);
}

function buildWeaknessSummary(
  domainPerformance: readonly PerformanceScore[],
  weakestTags: readonly PerformanceScore[],
  mistakeReasons: readonly MistakeReasonDistribution[]
): string[] {
  const summary: string[] = [];
  const lowestDomain = [...domainPerformance]
    .filter((score) => score.total > 0)
    .sort((left, right) => left.percent - right.percent || right.total - left.total)[0];
  const weakFocusTags = weakestTags
    .filter((tag) => tag.percent < 75)
    .slice(0, 2)
    .map((tag) => tag.label);

  if (weakFocusTags.length > 0) {
    summary.push(`Focus next on ${formatList(weakFocusTags)}.`);
  }

  if (lowestDomain) {
    summary.push(`Your lowest domain is ${lowestDomain.label}.`);
  }

  if (mistakeReasons[0]) {
    summary.push(`You often miss questions due to ${mistakeReasons[0].reason}.`);
  }

  if (summary.length === 0) {
    summary.push("Complete exams and practice questions to build a weakness summary.");
  }

  return summary;
}

function formatList(values: readonly string[]): string {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}
