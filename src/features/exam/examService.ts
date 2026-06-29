import { EXAM_DURATION_MINUTES } from "../../constants";
import {
  addAttempt,
  clearActiveExamSession,
  getActiveExamSession,
  getQuestions,
  saveActiveExamSession
} from "../../storage";
import type { ActiveExamSession, AttemptSummary, Question } from "../../types";
import { writeThroughAttemptSummary } from "../../tracks/cloud-certification";
import { buildQuestionBankSummary } from "../questions/questionBankStats";
import { buildExamQuestionViewsFromSession, selectExamQuestions } from "./examGeneration";
import { buildAttemptSummary, scoreExamSession } from "./scoringService";

export type ExamGenerationResult =
  | {
      ok: true;
      session: ActiveExamSession;
    }
  | {
      ok: false;
      reason: string;
    };

export type ExamQuestionView = Question & {
  shuffledOptions: Question["options"];
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getRemainingSeconds(session: ActiveExamSession, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - now) / 1000));
}

export function isExamExpired(session: ActiveExamSession, now = Date.now()): boolean {
  return getRemainingSeconds(session, now) <= 0;
}

export async function createExamSession(): Promise<ExamGenerationResult> {
  const questions = await getQuestions();
  const summary = buildQuestionBankSummary(questions);

  if (!summary.examReady) {
    return {
      ok: false,
      reason: "The question bank does not have enough questions for the exam blueprint."
    };
  }

  const selection = selectExamQuestions(questions);

  if (!selection.ok) {
    return {
      ok: false,
      reason: "The question bank does not have enough questions for the exam blueprint."
    };
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + EXAM_DURATION_MINUTES * 60 * 1000);

  const session: ActiveExamSession = {
    id: createId("exam"),
    startedAt: startedAt.toISOString(),
    durationMinutes: EXAM_DURATION_MINUTES,
    expiresAt: expiresAt.toISOString(),
    questionIds: selection.questions.map((question) => question.id),
    optionOrderByQuestionId: selection.optionOrderByQuestionId,
    selectedOptionIdsByQuestionId: {},
    flaggedQuestionIds: [],
    currentQuestionIndex: 0
  };

  await saveActiveExamSession(session);

  return {
    ok: true,
    session
  };
}

export function buildExamQuestionViews(session: ActiveExamSession, questions: readonly Question[]): ExamQuestionView[] {
  return buildExamQuestionViewsFromSession(session, questions);
}

export async function updateCurrentQuestionIndex(index: number): Promise<ActiveExamSession | null> {
  const session = await getActiveExamSession();

  if (!session) {
    return null;
  }

  const nextSession = {
    ...session,
    currentQuestionIndex: Math.max(0, Math.min(index, session.questionIds.length - 1))
  };

  await saveActiveExamSession(nextSession);
  return nextSession;
}

export async function updateExamAnswer(questionId: string, selectedOptionIds: string[]): Promise<ActiveExamSession | null> {
  const session = await getActiveExamSession();

  if (!session) {
    return null;
  }

  const nextSelected = {
    ...session.selectedOptionIdsByQuestionId,
    [questionId]: selectedOptionIds
  };

  if (selectedOptionIds.length === 0) {
    delete nextSelected[questionId];
  }

  const nextSession = {
    ...session,
    selectedOptionIdsByQuestionId: nextSelected
  };

  await saveActiveExamSession(nextSession);
  return nextSession;
}

export async function toggleExamFlag(questionId: string): Promise<ActiveExamSession | null> {
  const session = await getActiveExamSession();

  if (!session) {
    return null;
  }

  const flagged = new Set(session.flaggedQuestionIds);

  if (flagged.has(questionId)) {
    flagged.delete(questionId);
  } else {
    flagged.add(questionId);
  }

  const nextSession = {
    ...session,
    flaggedQuestionIds: [...flagged]
  };

  await saveActiveExamSession(nextSession);
  return nextSession;
}

export async function submitActiveExamSession(autoSubmitted = false): Promise<AttemptSummary | null> {
  const session = await getActiveExamSession();

  if (!session) {
    return null;
  }

  const questions = buildExamQuestionViews(session, await getQuestions());
  const completedAt = new Date();
  const durationSeconds = Math.max(0, Math.round((completedAt.getTime() - new Date(session.startedAt).getTime()) / 1000));
  const score = scoreExamSession(session, questions, completedAt.toISOString());
  const summary = buildAttemptSummary({
    id: createId(autoSubmitted ? "auto-attempt" : "attempt"),
    session,
    completedAt: completedAt.toISOString(),
    durationSeconds,
    score
  });

  await addAttempt(summary);
  await writeThroughAttemptSummary(summary);
  await clearActiveExamSession();

  return summary;
}
