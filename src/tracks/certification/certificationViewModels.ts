import type { ContentItemRef } from "../../domain";
import type { Question } from "../../content/canonical";

export type CertificationAnswerViewModel = Readonly<{
  questionId: string;
  questionNumber: number;
  selectedOptionIds: readonly string[];
  correctOptionIds: readonly string[];
  isAnswered: boolean;
  isCorrect: boolean;
  wasFlagged: boolean;
  answeredAt: string;
  attemptId?: string;
  elapsedSeconds?: number;
  item: ContentItemRef;
  questionSnapshot: Question;
}>;

export type CertificationExamSummaryViewModel = Readonly<{
  id: string;
  mode: "exam";
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  incorrectQuestionIds: readonly string[];
  unansweredQuestionIds: readonly string[];
  flaggedQuestionIds: readonly string[];
  answers: readonly CertificationAnswerViewModel[];
  domainScores: readonly { domain: string; correct: number; total: number; percent: number }[];
  tagScores: readonly { tag: string; correct: number; total: number; percent: number }[];
}>;

export type CertificationPracticeAnswerViewModel = Readonly<{
  id: string;
  questionId: string;
  questionSnapshot: Question;
  selectedOptionIds: readonly string[];
  correctOptionIds: readonly string[];
  isCorrect: boolean;
  answeredAt: string;
}>;
