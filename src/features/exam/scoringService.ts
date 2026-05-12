import { TRAINING_PASS_THRESHOLD } from "../../constants";
import type {
  ActiveExamSession,
  AnswerRecord,
  AttemptSummary,
  DomainScore,
  ExamDomain,
  Question,
  TagScore
} from "../../types";
import { areOptionSetsEqual, calculatePercent } from "../../utils";

export type ExamScoreResult = {
  answers: AnswerRecord[];
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  passedTrainingThreshold: boolean;
  domainScores: DomainScore[];
  tagScores: TagScore[];
  incorrectQuestionIds: string[];
  unansweredQuestionIds: string[];
  flaggedQuestionIds: string[];
};

const examDomains: ExamDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];

export function scoreExamSession(
  session: ActiveExamSession,
  questions: readonly Question[],
  answeredAt: string
): ExamScoreResult {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const flaggedQuestionIds = session.flaggedQuestionIds;

  const answers = session.questionIds.flatMap((questionId, index) => {
    const question = questionById.get(questionId);

    if (!question) {
      return [];
    }

    const selectedOptionIds = session.selectedOptionIdsByQuestionId[questionId] ?? [];
    const isAnswered = selectedOptionIds.length > 0;

    return [
      {
        questionId,
        questionNumber: index + 1,
        questionSnapshot: question,
        selectedOptionIds,
        correctOptionIds: question.correctOptionIds,
        isAnswered,
        isCorrect: isAnswered && areOptionSetsEqual(selectedOptionIds, question.correctOptionIds),
        wasFlagged: flaggedQuestionIds.includes(questionId),
        answeredAt
      }
    ];
  });

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const unansweredQuestionIds = answers.filter((answer) => !answer.isAnswered).map((answer) => answer.questionId);
  const incorrectQuestionIds = answers
    .filter((answer) => answer.isAnswered && !answer.isCorrect)
    .map((answer) => answer.questionId);
  const scorePercent = calculatePercent(correctCount, answers.length);

  return {
    answers,
    correctCount,
    totalQuestions: answers.length,
    scorePercent,
    passedTrainingThreshold: scorePercent >= TRAINING_PASS_THRESHOLD,
    domainScores: buildDomainScores(answers),
    tagScores: buildTagScores(answers),
    incorrectQuestionIds,
    unansweredQuestionIds,
    flaggedQuestionIds
  };
}

export function buildAttemptSummary(input: {
  id: string;
  session: ActiveExamSession;
  completedAt: string;
  durationSeconds: number;
  score: ExamScoreResult;
}): AttemptSummary {
  return {
    id: input.id,
    mode: "exam",
    startedAt: input.session.startedAt,
    completedAt: input.completedAt,
    durationSeconds: input.durationSeconds,
    questionCount: input.score.totalQuestions,
    correctCount: input.score.correctCount,
    scorePercent: input.score.scorePercent,
    passedTrainingThreshold: input.score.passedTrainingThreshold,
    incorrectQuestionIds: input.score.incorrectQuestionIds,
    unansweredQuestionIds: input.score.unansweredQuestionIds,
    flaggedQuestionIds: input.score.flaggedQuestionIds,
    answers: input.score.answers,
    domainScores: input.score.domainScores,
    tagScores: input.score.tagScores
  };
}

function buildDomainScores(answers: readonly AnswerRecord[]): DomainScore[] {
  return examDomains.map((domain) => {
    const domainAnswers = answers.filter((answer) => answer.questionSnapshot.domain === domain);
    const correct = domainAnswers.filter((answer) => answer.isCorrect).length;

    return {
      domain,
      correct,
      total: domainAnswers.length,
      percent: calculatePercent(correct, domainAnswers.length)
    };
  });
}

function buildTagScores(answers: readonly AnswerRecord[]): TagScore[] {
  const totals = new Map<string, { correct: number; total: number }>();

  answers.forEach((answer) => {
    answer.questionSnapshot.tags.forEach((tag) => {
      const current = totals.get(tag) ?? { correct: 0, total: 0 };

      totals.set(tag, {
        correct: current.correct + (answer.isCorrect ? 1 : 0),
        total: current.total + 1
      });
    });
  });

  return [...totals.entries()]
    .map(([tag, score]) => ({
      tag,
      correct: score.correct,
      total: score.total,
      percent: calculatePercent(score.correct, score.total)
    }))
    .sort((left, right) => left.percent - right.percent || right.total - left.total);
}
