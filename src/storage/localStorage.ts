import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ActiveExamSession, AttemptSummary, PracticeAnswerRecord, Question, QuestionReviewState } from "../types";
import { STORAGE_KEYS } from "./keys";

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function readLocalJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return safeJsonParse(value, fallback);
  } catch {
    return fallback;
  }
}

async function writeLocalJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage writes should not crash the app shell.
  }
}

export async function removeLocalValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Local storage cleanup should never crash the app.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readNullableRecord<T>(value: unknown): T | null {
  return isRecord(value) ? (value as T) : null;
}

function isActiveExamSession(value: unknown): value is ActiveExamSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.startedAt === "string" &&
    typeof value.expiresAt === "string" &&
    typeof value.durationMinutes === "number" &&
    Array.isArray(value.questionIds) &&
    isRecord(value.optionOrderByQuestionId) &&
    isRecord(value.selectedOptionIdsByQuestionId) &&
    Array.isArray(value.flaggedQuestionIds) &&
    typeof value.currentQuestionIndex === "number"
  );
}

function isQuestion(value: unknown): value is Question {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.domain === "string" &&
    typeof value.difficulty === "string" &&
    typeof value.type === "string" &&
    typeof value.question === "string" &&
    Array.isArray(value.options) &&
    Array.isArray(value.correctOptionIds) &&
    typeof value.explanation === "string"
  );
}

function isAttemptSummary(value: unknown): value is AttemptSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.mode === "exam" &&
    typeof value.startedAt === "string" &&
    typeof value.questionCount === "number" &&
    typeof value.correctCount === "number" &&
    typeof value.scorePercent === "number" &&
    Array.isArray(value.answers) &&
    Array.isArray(value.domainScores) &&
    Array.isArray(value.tagScores)
  );
}

function isPracticeAnswerRecord(value: unknown): value is PracticeAnswerRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.questionId === "string" &&
    isQuestion(value.questionSnapshot) &&
    typeof value.domain === "string" &&
    Array.isArray(value.tags) &&
    Array.isArray(value.selectedOptionIds) &&
    Array.isArray(value.correctOptionIds) &&
    typeof value.isCorrect === "boolean" &&
    typeof value.answeredAt === "string"
  );
}

export async function getQuestions(): Promise<Question[]> {
  const value = await readLocalJson<unknown>(STORAGE_KEYS.QUESTIONS, []);
  return readArray<unknown>(value).filter(isQuestion);
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  await writeLocalJson(STORAGE_KEYS.QUESTIONS, questions);
}

export async function clearQuestions(): Promise<void> {
  await removeLocalValue(STORAGE_KEYS.QUESTIONS);
}

export async function getAttempts(): Promise<AttemptSummary[]> {
  const value = await readLocalJson<unknown>(STORAGE_KEYS.ATTEMPTS, []);
  return readArray<unknown>(value).filter(isAttemptSummary);
}

export async function saveAttempts(attempts: AttemptSummary[]): Promise<void> {
  await writeLocalJson(STORAGE_KEYS.ATTEMPTS, attempts);
}

export async function addAttempt(attempt: AttemptSummary): Promise<void> {
  const attempts = await getAttempts();
  await saveAttempts([attempt, ...attempts]);
}

export async function clearAttempts(): Promise<void> {
  await removeLocalValue(STORAGE_KEYS.ATTEMPTS);
}

export async function getPracticeHistory(): Promise<PracticeAnswerRecord[]> {
  const value = await readLocalJson<unknown>(STORAGE_KEYS.PRACTICE_HISTORY, []);
  return readArray<unknown>(value).filter(isPracticeAnswerRecord);
}

export async function savePracticeHistory(records: PracticeAnswerRecord[]): Promise<void> {
  await writeLocalJson(STORAGE_KEYS.PRACTICE_HISTORY, records);
}

export async function addPracticeAnswer(record: PracticeAnswerRecord): Promise<void> {
  const history = await getPracticeHistory();
  await savePracticeHistory([record, ...history]);
}

export async function clearPracticeHistory(): Promise<void> {
  await removeLocalValue(STORAGE_KEYS.PRACTICE_HISTORY);
}

export async function getActiveExamSession(): Promise<ActiveExamSession | null> {
  const value = await readLocalJson<unknown>(STORAGE_KEYS.ACTIVE_EXAM_SESSION, null);
  const session = readNullableRecord<ActiveExamSession>(value);
  return isActiveExamSession(session) ? session : null;
}

export async function saveActiveExamSession(session: ActiveExamSession): Promise<void> {
  await writeLocalJson(STORAGE_KEYS.ACTIVE_EXAM_SESSION, session);
}

export async function clearActiveExamSession(): Promise<void> {
  await removeLocalValue(STORAGE_KEYS.ACTIVE_EXAM_SESSION);
}

export async function getQuestionReviewState(): Promise<QuestionReviewState> {
  const value = await readLocalJson<unknown>(STORAGE_KEYS.QUESTION_REVIEW_STATE, {});
  return isRecord(value) ? (value as QuestionReviewState) : {};
}

export async function saveQuestionReviewState(reviewState: QuestionReviewState): Promise<void> {
  await writeLocalJson(STORAGE_KEYS.QUESTION_REVIEW_STATE, reviewState);
}
