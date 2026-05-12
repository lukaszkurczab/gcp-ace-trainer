import {
  addPracticeAnswer,
  getPracticeHistory,
  getQuestions,
  getQuestionReviewState,
  savePracticeHistory,
  saveQuestionReviewState
} from "../../storage";
import type { Confidence, ExamDomain, MistakeReason, PracticeAnswerRecord, Question } from "../../types";
import { areOptionSetsEqual, shuffleArray } from "../../utils";

export type PracticeQuestionCount = 10 | 20 | "all";

export type PracticeDomainCount = {
  domain: ExamDomain;
  count: number;
};

const examDomains: ExamDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPracticeDomainCounts(questions: readonly Question[]): PracticeDomainCount[] {
  return examDomains.map((domain) => ({
    domain,
    count: questions.filter((question) => question.domain === domain).length
  }));
}

export async function loadPracticeQuestions(domain: ExamDomain, questionCount: PracticeQuestionCount): Promise<Question[]> {
  const questions = await getQuestions();
  const domainQuestions = questions.filter((question) => question.domain === domain);
  const shuffled = shuffleArray(domainQuestions);

  if (questionCount === "all") {
    return shuffled;
  }

  return shuffled.slice(0, questionCount);
}

export async function savePracticeAnswer(input: {
  question: Question;
  selectedOptionIds: string[];
  confidence?: Confidence;
  mistakeReason?: MistakeReason;
}): Promise<PracticeAnswerRecord> {
  const isCorrect = areOptionSetsEqual(input.selectedOptionIds, input.question.correctOptionIds);
  const record: PracticeAnswerRecord = {
    id: createId("practice"),
    questionId: input.question.id,
    questionSnapshot: input.question,
    domain: input.question.domain,
    tags: input.question.tags,
    selectedOptionIds: input.selectedOptionIds,
    correctOptionIds: input.question.correctOptionIds,
    isCorrect,
    confidence: input.confidence,
    mistakeReason: isCorrect ? undefined : input.mistakeReason,
    answeredAt: new Date().toISOString()
  };

  await addPracticeAnswer(record);
  return record;
}

export async function updatePracticeAnswerMetadata(
  recordId: string,
  metadata: {
    confidence?: Confidence;
    mistakeReason?: MistakeReason;
  }
): Promise<void> {
  const history = await getPracticeHistory();

  await savePracticeHistory(
    history.map((record) =>
      record.id === recordId
        ? {
            ...record,
            confidence: metadata.confidence ?? record.confidence,
            mistakeReason: metadata.mistakeReason ?? record.mistakeReason
          }
        : record
    )
  );
}

export async function setQuestionNeedsReview(questionId: string, needsReview: boolean): Promise<void> {
  const reviewState = await getQuestionReviewState();
  const current = reviewState[questionId];

  await saveQuestionReviewState({
    ...reviewState,
    [questionId]: {
      questionId,
      isFlagged: current?.isFlagged ?? false,
      needsReview,
      confidence: current?.confidence,
      mistakeReason: current?.mistakeReason,
      notes: current?.notes,
      lastReviewedAt: current?.lastReviewedAt,
      updatedAt: new Date().toISOString()
    }
  });
}
