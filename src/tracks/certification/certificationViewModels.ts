import type { ContentItemRef } from "../../domain";
import type { CertificationDomain, CertificationQuestion } from "./domain/certificationQuestion";

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
  questionSnapshot: CertificationQuestion;
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
  domainScores: readonly { domain: CertificationDomain; correct: number; total: number; percent: number }[];
  tagScores: readonly { tag: string; correct: number; total: number; percent: number }[];
}>;

export type CertificationPracticeAnswerViewModel = Readonly<{
  id: string;
  questionId: string;
  questionSnapshot: CertificationQuestion;
  domain: CertificationDomain;
  tags: readonly string[];
  selectedOptionIds: readonly string[];
  correctOptionIds: readonly string[];
  isCorrect: boolean;
  answeredAt: string;
}>;
