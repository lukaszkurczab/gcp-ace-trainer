import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_TRACK_ID, isTrackId, type TrackId } from "../domain";
import { mergeWithDefaultQuestionBank } from "../features/questions/defaultQuestionBank";
import type { ActiveExamSession, AttemptSummary, PracticeAnswerRecord, Question, QuestionReviewState } from "../types";
import {
  getStorageClearKeys,
  getStorageReadKeys,
  STORAGE_KEYS,
  type StorageKeyName,
} from "./keys";
import {
  decodeLocalJson,
  getStorageErrorMessage,
  type LocalStorageIssue,
} from "./storageCodec";

const MAX_STORAGE_ISSUES = 5;

let storageIssues: LocalStorageIssue[] = [];

export function recordStorageIssue(issue: LocalStorageIssue): void {
  storageIssues = [issue, ...storageIssues].slice(0, MAX_STORAGE_ISSUES);
}

export function getStorageIssues(): readonly LocalStorageIssue[] {
  return storageIssues;
}

async function readLocalJson<T>(keyName: StorageKeyName, fallback: T): Promise<T> {
  for (const key of getStorageReadKeys(keyName)) {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        continue;
      }

      const decoded = decodeLocalJson(key, value, fallback);

      if (!decoded.ok) {
        recordStorageIssue(decoded.issue);
      }

      return decoded.value;
    } catch (error) {
      recordStorageIssue({
        key,
        message: getStorageErrorMessage(error),
        operation: "read",
      });
      return fallback;
    }
  }

  return fallback;
}

async function writeLocalJson<T>(keyName: StorageKeyName, value: T): Promise<void> {
  const key = STORAGE_KEYS[keyName];

  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    recordStorageIssue({
      key,
      message: getStorageErrorMessage(error),
      operation: "write",
    });
  }
}

async function removeStorageValue(keyName: StorageKeyName): Promise<void> {
  await Promise.all(getStorageClearKeys(keyName).map(removeLocalValue));
}

async function removeLocalValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    recordStorageIssue({
      key,
      message: getStorageErrorMessage(error),
      operation: "remove",
    });
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

export async function getActiveTrackId(): Promise<TrackId> {
  const value = await readLocalJson<unknown>("ACTIVE_TRACK", DEFAULT_TRACK_ID);
  return typeof value === "string" && isTrackId(value) ? value : DEFAULT_TRACK_ID;
}

export async function saveActiveTrackId(trackId: TrackId): Promise<void> {
  await writeLocalJson("ACTIVE_TRACK", trackId);
}

export async function getQuestions(): Promise<Question[]> {
  const value = await readLocalJson<unknown>("QUESTIONS", []);
  return mergeWithDefaultQuestionBank(readArray<unknown>(value).filter(isQuestion));
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  await writeLocalJson("QUESTIONS", questions);
}

export async function clearQuestions(): Promise<void> {
  await removeStorageValue("QUESTIONS");
}

export async function getAttempts(): Promise<AttemptSummary[]> {
  const value = await readLocalJson<unknown>("ATTEMPTS", []);
  return readArray<unknown>(value).filter(isAttemptSummary);
}

export async function saveAttempts(attempts: AttemptSummary[]): Promise<void> {
  await writeLocalJson("ATTEMPTS", attempts);
}

export async function addAttempt(attempt: AttemptSummary): Promise<void> {
  const attempts = await getAttempts();
  await saveAttempts([attempt, ...attempts]);
}

export async function clearAttempts(): Promise<void> {
  await removeStorageValue("ATTEMPTS");
}

export async function getPracticeHistory(): Promise<PracticeAnswerRecord[]> {
  const value = await readLocalJson<unknown>("PRACTICE_HISTORY", []);
  return readArray<unknown>(value).filter(isPracticeAnswerRecord);
}

export async function savePracticeHistory(records: PracticeAnswerRecord[]): Promise<void> {
  await writeLocalJson("PRACTICE_HISTORY", records);
}

export async function addPracticeAnswer(record: PracticeAnswerRecord): Promise<void> {
  const history = await getPracticeHistory();
  await savePracticeHistory([record, ...history]);
}

export async function clearPracticeHistory(): Promise<void> {
  await removeStorageValue("PRACTICE_HISTORY");
}

export async function getActiveExamSession(): Promise<ActiveExamSession | null> {
  const value = await readLocalJson<unknown>("ACTIVE_EXAM_SESSION", null);
  const session = readNullableRecord<ActiveExamSession>(value);
  return isActiveExamSession(session) ? session : null;
}

export async function saveActiveExamSession(session: ActiveExamSession): Promise<void> {
  await writeLocalJson("ACTIVE_EXAM_SESSION", session);
}

export async function clearActiveExamSession(): Promise<void> {
  await removeStorageValue("ACTIVE_EXAM_SESSION");
}

export async function getQuestionReviewState(): Promise<QuestionReviewState> {
  const value = await readLocalJson<unknown>("QUESTION_REVIEW_STATE", {});
  return isRecord(value) ? (value as QuestionReviewState) : {};
}

export async function saveQuestionReviewState(reviewState: QuestionReviewState): Promise<void> {
  await writeLocalJson("QUESTION_REVIEW_STATE", reviewState);
}

export async function clearQuestionReviewState(): Promise<void> {
  await removeStorageValue("QUESTION_REVIEW_STATE");
}
