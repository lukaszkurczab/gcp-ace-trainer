import type { ActiveExamSession, AttemptSummary, PracticeAnswerRecord, Question } from "../src/types";

export function makeQuestion(overrides: Partial<Question> = {}): Question {
  const id = overrides.id ?? "q-1";

  return {
    id,
    domain: overrides.domain ?? "setup_environment",
    difficulty: overrides.difficulty ?? "easy",
    type: overrides.type ?? "single",
    question: overrides.question ?? `Question ${id}?`,
    options: overrides.options ?? [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" }
    ],
    correctOptionIds: overrides.correctOptionIds ?? ["a"],
    explanation: overrides.explanation ?? "Because A is correct.",
    whyOthersAreWrong: overrides.whyOthersAreWrong,
    watchOutFor: overrides.watchOutFor,
    tags: overrides.tags ?? ["iam"],
    examSignals: overrides.examSignals
  };
}

export function makeQuestionBank(): Question[] {
  const counts = {
    setup_environment: 12,
    planning_implementation: 15,
    operations: 13,
    access_security: 10
  } as const;

  return Object.entries(counts).flatMap(([domain, count]) =>
    Array.from({ length: count }, (_, index) =>
      makeQuestion({
        id: `${domain}-${index + 1}`,
        domain: domain as Question["domain"],
        tags: [domain, index % 2 === 0 ? "iam" : "networking"]
      })
    )
  );
}

export function makeSession(questions: readonly Question[], selected: Record<string, string[]> = {}): ActiveExamSession {
  return {
    id: "exam-1",
    startedAt: "2026-01-01T10:00:00.000Z",
    durationMinutes: 120,
    expiresAt: "2026-01-01T12:00:00.000Z",
    questionIds: questions.map((question) => question.id),
    optionOrderByQuestionId: questions.reduce<Record<string, string[]>>((orders, question) => {
      orders[question.id] = question.options.map((option) => option.id).reverse();
      return orders;
    }, {}),
    selectedOptionIdsByQuestionId: selected,
    flaggedQuestionIds: [questions[0]?.id ?? ""].filter(Boolean),
    currentQuestionIndex: 0
  };
}

export function makeAttempt(overrides: Partial<AttemptSummary> = {}): AttemptSummary {
  const question = makeQuestion({ id: "attempt-q-1", domain: "operations", tags: ["operations", "logging"] });

  return {
    id: overrides.id ?? "attempt-1",
    mode: "exam",
    startedAt: "2026-01-01T10:00:00.000Z",
    completedAt: overrides.completedAt ?? "2026-01-01T11:00:00.000Z",
    durationSeconds: 3600,
    questionCount: 1,
    correctCount: overrides.correctCount ?? 1,
    scorePercent: overrides.scorePercent ?? 100,
    passedTrainingThreshold: overrides.passedTrainingThreshold ?? true,
    incorrectQuestionIds: overrides.incorrectQuestionIds ?? [],
    unansweredQuestionIds: overrides.unansweredQuestionIds ?? [],
    flaggedQuestionIds: overrides.flaggedQuestionIds ?? [],
    answers:
      overrides.answers ?? [
        {
          questionId: question.id,
          questionNumber: 1,
          questionSnapshot: question,
          selectedOptionIds: ["a"],
          correctOptionIds: ["a"],
          isAnswered: true,
          isCorrect: true,
          wasFlagged: false,
          answeredAt: "2026-01-01T11:00:00.000Z"
        }
      ],
    domainScores: overrides.domainScores ?? [],
    tagScores: overrides.tagScores ?? []
  };
}

export function makePracticeRecord(overrides: Partial<PracticeAnswerRecord> = {}): PracticeAnswerRecord {
  const question = overrides.questionSnapshot ?? makeQuestion({ id: "practice-q-1", domain: "access_security", tags: ["iam"] });

  return {
    id: overrides.id ?? "practice-1",
    questionId: question.id,
    questionSnapshot: question,
    domain: overrides.domain ?? question.domain,
    tags: overrides.tags ?? question.tags,
    selectedOptionIds: overrides.selectedOptionIds ?? ["b"],
    correctOptionIds: overrides.correctOptionIds ?? question.correctOptionIds,
    isCorrect: overrides.isCorrect ?? false,
    confidence: overrides.confidence,
    mistakeReason: overrides.mistakeReason,
    answeredAt: overrides.answeredAt ?? "2026-01-02T10:00:00.000Z"
  };
}
