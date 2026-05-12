import type { ExamDomain, Question } from "./question";

export type AttemptMode = "exam" | "practice";

export type Confidence = "sure" | "unsure" | "guess";

export type MistakeReason =
  | "knowledge_gap"
  | "misread_question"
  | "confused_services"
  | "iam_misunderstanding"
  | "networking_misunderstanding"
  | "rushed"
  | "other";

export type AnswerRecord = {
  questionId: string;
  questionNumber: number;
  questionSnapshot: Question;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isAnswered: boolean;
  isCorrect: boolean;
  wasFlagged: boolean;
  answeredAt: string;
  elapsedSeconds?: number;
  confidence?: Confidence;
  mistakeReason?: MistakeReason;
};

export type DomainScore = {
  domain: ExamDomain;
  correct: number;
  total: number;
  percent: number;
};

export type TagScore = {
  tag: string;
  correct: number;
  total: number;
  percent: number;
};

export type AttemptSummary = {
  id: string;
  mode: AttemptMode;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  passedTrainingThreshold: boolean;
  incorrectQuestionIds: string[];
  unansweredQuestionIds: string[];
  flaggedQuestionIds: string[];
  answers: AnswerRecord[];
  domainScores: DomainScore[];
  tagScores: TagScore[];
};

export type ActiveExamAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  answeredAt?: string;
};

export type ActiveExamSession = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  expiresAt: string;
  questionIds: string[];
  optionOrderByQuestionId: Record<string, string[]>;
  selectedOptionIdsByQuestionId: Record<string, string[]>;
  flaggedQuestionIds: string[];
  currentQuestionIndex: number;
};

export type QuestionReviewItem = {
  questionId: string;
  isFlagged: boolean;
  needsReview: boolean;
  confidence?: Confidence;
  mistakeReason?: MistakeReason;
  notes?: string;
  lastReviewedAt?: string;
  updatedAt: string;
};

export type QuestionReviewState = Record<string, QuestionReviewItem>;

export type PracticeAnswerRecord = {
  id: string;
  questionId: string;
  questionSnapshot: Question;
  domain: ExamDomain;
  tags: string[];
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
  confidence?: Confidence;
  mistakeReason?: MistakeReason;
  answeredAt: string;
};
