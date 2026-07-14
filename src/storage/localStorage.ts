import AsyncStorage from "@react-native-async-storage/async-storage";

import { UnsupportedStoredRecordError, isRegisteredTrackId, type TrackId } from "../domain";
import { mergeWithDefaultQuestionBank } from "../features/questions/defaultQuestionBank";
import { buildCertificationExamSummaries, buildCertificationPracticeHistory, type CertificationExamSummaryViewModel, type CertificationExamViewModel, type CertificationPracticeAnswerViewModel, type CertificationQuestion } from "../tracks/cloud-certification";
import { getTrainingAttempts, getTrainingSessions } from "./repositories";
import { getStorageClearKeys, getStorageReadKeys, STORAGE_KEYS, type StorageKeyName } from "./keys";
import { decodeLocalJson, getStorageErrorMessage, type LocalStorageIssue } from "./storageCodec";
import { isTrainingSession } from "./repositories/trainingModelGuards";

const MAX_STORAGE_ISSUES = 5;
let storageIssues: LocalStorageIssue[] = [];

export function recordStorageIssue(issue: LocalStorageIssue): void { storageIssues = [issue, ...storageIssues].slice(0, MAX_STORAGE_ISSUES); }
export function getStorageIssues(): readonly LocalStorageIssue[] { return storageIssues; }

async function readLocalJson<T>(keyName: StorageKeyName, missingValue: T): Promise<T> {
  for (const key of getStorageReadKeys(keyName)) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) continue;
      const decoded = decodeLocalJson<T>(key, value, missingValue);
      if (!decoded.ok) throw new UnsupportedStoredRecordError(keyName);
      return decoded.value;
    } catch (error) {
      if (error instanceof UnsupportedStoredRecordError) throw error;
      recordStorageIssue({ key, message: getStorageErrorMessage(error), operation: "read" });
      throw error;
    }
  }
  return missingValue;
}

async function writeLocalJson<T>(keyName: StorageKeyName, value: T): Promise<void> {
  const key = STORAGE_KEYS[keyName];
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { recordStorageIssue({ key, message: getStorageErrorMessage(error), operation: "write" }); throw error; }
}

async function removeStorageValue(keyName: StorageKeyName): Promise<void> {
  await Promise.all(getStorageClearKeys(keyName).map(async (key) => { try { await AsyncStorage.removeItem(key); } catch (error) { recordStorageIssue({ key, message: getStorageErrorMessage(error), operation: "remove" }); throw error; } }));
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
function isQuestion(value: unknown): value is CertificationQuestion {
  return isRecord(value) && typeof value.id === "string" && typeof value.domain === "string" && typeof value.difficulty === "string" && typeof value.type === "string" && typeof value.question === "string" && Array.isArray(value.options) && value.options.every((option) => isRecord(option) && typeof option.id === "string" && typeof option.text === "string") && isStringArray(value.correctOptionIds) && typeof value.explanation === "string";
}

export async function getActiveTrackId(): Promise<TrackId | null> {
  const value = await readLocalJson<unknown>("ACTIVE_TRACK", null);
  if (value === null) return null;
  if (typeof value !== "string" || !isRegisteredTrackId(value)) throw new UnsupportedStoredRecordError("active track");
  return value;
}
export async function saveActiveTrackId(trackId: TrackId): Promise<void> { await writeLocalJson("ACTIVE_TRACK", trackId); }

export async function getQuestions(): Promise<readonly CertificationQuestion[]> {
  const value = await readLocalJson<unknown>("QUESTIONS", []);
  if (!Array.isArray(value) || !value.every(isQuestion)) throw new UnsupportedStoredRecordError("questions");
  return mergeWithDefaultQuestionBank(value);
}
export async function saveQuestions(questions: readonly CertificationQuestion[]): Promise<void> { await writeLocalJson("QUESTIONS", questions); }
export async function clearQuestions(): Promise<void> { await removeStorageValue("QUESTIONS"); }

export async function getCertificationExam(): Promise<CertificationExamViewModel | null> {
  const value = await readLocalJson<unknown>("ACTIVE_EXAM_SESSION", null);
  if (value === null) return null;
  if (!isRecord(value) || !isTrainingSession(value.session) || !isRecord(value.examState) ||
    value.examState.sessionId !== value.session.id || typeof value.examState.deadlineAt !== "string" ||
    !isRecord(value.examState.responsesByItemId) || !isStringArray(value.examState.flaggedItemIds)) {
    throw new UnsupportedStoredRecordError("certification exam");
  }
  const responses: Record<string, { kind: "option_selection"; selectedOptionIds: readonly string[] }> = {};
  for (const [itemId, response] of Object.entries(value.examState.responsesByItemId)) {
    if (!isRecord(response) || response.kind !== "option_selection" || !isStringArray(response.selectedOptionIds)) throw new UnsupportedStoredRecordError("certification exam response");
    responses[itemId] = { kind: "option_selection", selectedOptionIds: response.selectedOptionIds };
  }
  return { session: value.session, examState: { sessionId: value.session.id, deadlineAt: value.examState.deadlineAt, responsesByItemId: responses, flaggedItemIds: value.examState.flaggedItemIds } };
}
export async function saveCertificationExam(runtime: CertificationExamViewModel): Promise<void> { await writeLocalJson("ACTIVE_EXAM_SESSION", runtime); }
export async function clearCertificationExam(): Promise<void> { await removeStorageValue("ACTIVE_EXAM_SESSION"); }

export async function clearAttempts(): Promise<void> { await removeStorageValue("ATTEMPTS"); }
export async function clearPracticeHistory(): Promise<void> { await removeStorageValue("PRACTICE_HISTORY"); }

export async function getAttempts(): Promise<CertificationExamSummaryViewModel[]> {
  const [sessions, attempts] = await Promise.all([getTrainingSessions(), getTrainingAttempts()]);
  return buildCertificationExamSummaries(sessions.value, attempts.value);
}
export async function getPracticeHistory(): Promise<CertificationPracticeAnswerViewModel[]> {
  return buildCertificationPracticeHistory((await getTrainingAttempts()).value);
}
