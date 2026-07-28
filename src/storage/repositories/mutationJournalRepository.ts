import type { ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionDraft, TrainingSessionResult } from "../../domain";
import { getTrainingSessionFinalizationCleanupKind, isRegisteredTrackId } from "../../domain";
import { canonicalFingerprintPayload, canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { JournalWriteError } from "../errors";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession, isTrainingSessionDraft, isTrainingSessionResult } from "./trainingModelGuards";
import { getReviewQueueItems } from "./reviewQueueRepository";
import { getActiveTrainingSession } from "./trainingSessionRepository";

export type JournalWrite =
  | { kind: "put_session"; record: TrainingSession }
  | { kind: "put_session_result"; record: TrainingSessionResult }
  | { kind: "put_attempt"; record: TrainingAttempt<unknown> }
  | { kind: "put_review_entry"; record: ReviewQueueEntry }
  | { kind: "put_review_entry_for_attempt"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "update_review_entry"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "delete_review_entry"; record: ReviewQueueEntry }
  | { kind: "delete_review_entry_for_attempt"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "clear_active_session"; sessionId: string }
  | { kind: "clear_active_session_draft"; sessionId: string }
  | { kind: "put_active_session_draft"; record: TrainingSessionDraft }
  | { kind: "delete_active_session_draft"; record: TrainingSessionDraft; submittedOccurrenceIds: readonly string[] }
  | { kind: "clear_learning_state" };

export type MutationOperation = "start_training_session" | "advance_training_session" | "submit_training_outcome" | "complete_training_session" | "abandon_training_session" | "finalize_training_session" | "set_review_entry" | "remove_review_entry" | "reset_learning_state";
export type MutationCommandIdentity = Readonly<{ version: 1; fingerprint: string }>;
export type MutationExpectedRevision = Readonly<{ target: string; revision: number | null }>;
export type MutationJournalPlan = Readonly<{
  operation: MutationOperation;
  status: "journal_durable" | "materialized" | "verified_pending_clear";
  createdAt: string;
  sessionId: string;
  trackId: string;
  commandIdentity: MutationCommandIdentity;
  expectedRevisions: readonly MutationExpectedRevision[];
  writes: readonly JournalWrite[];
}>;
export type MutationJournalRecord = MutationJournalPlan & Readonly<{ journalId: string; planFingerprint: string }>;

const OPERATIONS: readonly MutationOperation[] = ["start_training_session", "advance_training_session", "submit_training_outcome", "complete_training_session", "abandon_training_session", "finalize_training_session", "set_review_entry", "remove_review_entry", "reset_learning_state"];
const SHA_256 = /^[a-f0-9]{64}$/;
const PLAN_FINGERPRINT = /^[a-f0-9]{64}$/;
const RESET_STATIC_TARGETS = ["active_session", "active_session_draft", "active_foreground_timer", "session_index", "attempt_index", "review_index"] as const;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasExactKeys(value: Record<string, unknown>, required: readonly string[]): boolean { const keys = Object.keys(value); return keys.length === required.length && required.every((key) => keys.includes(key)); }
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isTimestamp(value: unknown): value is string { return isNonEmptyString(value) && !Number.isNaN(Date.parse(value)); }
function isExpectedRevision(value: unknown): value is MutationExpectedRevision {
  return isRecord(value) && hasExactKeys(value, ["target", "revision"]) && isNonEmptyString(value.target) &&
    (value.revision === null || (Number.isSafeInteger(value.revision) && Number(value.revision) >= 1));
}
function isJournalWrite(value: unknown): value is JournalWrite {
  if (!isRecord(value) || !isNonEmptyString(value.kind)) return false;
  switch (value.kind) {
    case "put_session": return hasExactKeys(value, ["kind", "record"]) && isTrainingSession(value.record);
    case "put_session_result": return hasExactKeys(value, ["kind", "record"]) && isTrainingSessionResult(value.record);
    case "put_attempt": return hasExactKeys(value, ["kind", "record"]) && isTrainingAttempt(value.record);
    case "put_review_entry": return hasExactKeys(value, ["kind", "record"]) && isReviewQueueEntry(value.record);
    case "put_review_entry_for_attempt": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "update_review_entry": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "delete_review_entry": return hasExactKeys(value, ["kind", "record"]) && isReviewQueueEntry(value.record);
    case "delete_review_entry_for_attempt": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "clear_active_session":
    case "clear_active_session_draft": return hasExactKeys(value, ["kind", "sessionId"]) && isNonEmptyString(value.sessionId);
    case "clear_learning_state": return hasExactKeys(value, ["kind"]);
    case "put_active_session_draft": return hasExactKeys(value, ["kind", "record"]) && isTrainingSessionDraft(value.record);
    case "delete_active_session_draft": return hasExactKeys(value, ["kind", "record", "submittedOccurrenceIds"]) && isTrainingSessionDraft(value.record) && Array.isArray(value.submittedOccurrenceIds) && value.submittedOccurrenceIds.every(isNonEmptyString) && new Set(value.submittedOccurrenceIds).size === value.submittedOccurrenceIds.length;
    default: return false;
  }
}

function writeTarget(write: JournalWrite): string {
  switch (write.kind) {
    case "put_session": return `session:${write.record.id}`;
    case "put_session_result": return `result:${write.record.sessionId}`;
    case "put_attempt": return `attempt:${write.record.id}`;
    case "put_review_entry": return `review:${write.record.id}`;
    case "put_review_entry_for_attempt": return `review:${write.record.id}`;
    case "update_review_entry": return `review:${write.record.id}`;
    case "delete_review_entry": return `review:${write.record.id}`;
    case "delete_review_entry_for_attempt": return `review:${write.record.id}`;
    case "put_active_session_draft":
    case "delete_active_session_draft": return "active_session_draft";
    case "clear_active_session_draft": return "active_session_draft";
    case "clear_active_session": return "active_session";
    case "clear_learning_state": return "learning_state";
  }
}

function writePreconditionTargets(write: JournalWrite): string[] {
  switch (write.kind) {
    case "put_session": return [`session:${write.record.id}`, "session_index", "active_session"];
    case "put_session_result": return [`result:${write.record.sessionId}`];
    case "put_attempt": return [`attempt:${write.record.id}`, "attempt_index"];
    case "put_review_entry":
    case "put_review_entry_for_attempt":
    case "update_review_entry":
    case "delete_review_entry":
    case "delete_review_entry_for_attempt": return [`review:${write.record.id}`, "review_index"];
    case "clear_active_session": return ["active_session", "active_foreground_timer"];
    case "clear_active_session_draft":
    case "put_active_session_draft":
    case "delete_active_session_draft": return ["active_session_draft"];
    case "clear_learning_state": return [...RESET_STATIC_TARGETS];
  }
}

function targetStorageKey(target: string): string {
  if (target === "active_session") return STORAGE_KEYS.ACTIVE_TRAINING_SESSION;
  if (target === "active_session_draft") return STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
  if (target === "active_foreground_timer") return STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER;
  if (target === "session_index") return STORAGE_KEYS.TRAINING_SESSION_INDEX;
  if (target === "attempt_index") return STORAGE_KEYS.TRAINING_ATTEMPT_INDEX;
  if (target === "review_index") return STORAGE_KEYS.REVIEW_INDEX;
  if (target.startsWith("session:")) return STORAGE_KEYS.trainingSession(target.slice("session:".length));
  if (target.startsWith("result:")) return STORAGE_KEYS.trainingSessionResult(target.slice("result:".length));
  if (target.startsWith("attempt:")) return STORAGE_KEYS.trainingAttempt(target.slice("attempt:".length));
  if (target.startsWith("review:")) return STORAGE_KEYS.reviewEntry(target.slice("review:".length));
  throw new Error(`Unknown mutation precondition target ${target}.`);
}

function isKnownPreconditionTarget(target: string): boolean {
  try { targetStorageKey(target); return true; } catch { return false; }
}

function revisionForTarget(target: string): number | null {
  return readCanonicalEnvelope(targetStorageKey(target), (_value): _value is unknown => true)?.revision ?? null;
}

function resetRecordTargets(): string[] {
  const ids = (key: string) => readCanonicalJson(key, (value): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string")) ?? [];
  return [
    ...ids(STORAGE_KEYS.TRAINING_SESSION_INDEX).map((id) => `session:${id}`),
    ...ids(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX).map((id) => `attempt:${id}`),
    ...ids(STORAGE_KEYS.REVIEW_INDEX).map((id) => `review:${id}`),
  ];
}

/** Captures every mutable canonical record that the immutable plan can touch. */
export function captureMutationExpectedRevisions(writes: readonly JournalWrite[]): readonly MutationExpectedRevision[] {
  const targets = writes.some((write) => write.kind === "clear_learning_state")
    ? [...RESET_STATIC_TARGETS, ...resetRecordTargets()]
    : writes.flatMap(writePreconditionTargets);
  const uniqueTargets = [...new Set(targets)].sort();
  return uniqueTargets.map((target) => ({ target, revision: revisionForTarget(target) }));
}

function hasExpectedRevisionPlan(record: MutationJournalPlan): boolean {
  const targets = record.expectedRevisions.map((condition) => condition.target);
  if (new Set(targets).size !== targets.length || !record.expectedRevisions.every((condition) => isKnownPreconditionTarget(condition.target))) return false;
  if (record.operation === "reset_learning_state") {
    return RESET_STATIC_TARGETS.every((target) => targets.includes(target));
  }
  const expectedTargets = [...new Set(record.writes.flatMap(writePreconditionTargets))];
  return targets.length === expectedTargets.length && expectedTargets.every((target) => targets.includes(target));
}

function hasValidOperationPlan(record: MutationJournalPlan): boolean {
  if (record.writes.length === 0) return false;
  const targets = record.writes.map(writeTarget);
  if (new Set(targets).size !== targets.length) return false;
  const count = (kind: JournalWrite["kind"]) => record.writes.filter((write) => write.kind === kind).length;
  const only = (...kinds: JournalWrite["kind"][]) => record.writes.every((write) => kinds.includes(write.kind));
  const sessionWrite = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_session" }> => write.kind === "put_session");
  const resultWrite = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_session_result" }> => write.kind === "put_session_result");
  const attemptWrites = record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt");
  const attemptItemIds = new Set(record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt").map((write) => write.record.item.itemId));
  const attemptOccurrenceIds = attemptWrites.map((write) => write.record.occurrenceId);
  const reviewItemKeys = record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_review_entry" | "put_review_entry_for_attempt" | "update_review_entry" | "delete_review_entry_for_attempt" }> => write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry" || write.kind === "delete_review_entry_for_attempt").map((write) => `${write.record.sourceItem.trackId}:${write.record.sourceItem.contentVersion}:${write.record.sourceItem.itemId}`);
  const hasUniqueOutcomeSemantics = new Set(attemptOccurrenceIds).size === attemptOccurrenceIds.length && new Set(reviewItemKeys).size === reviewItemKeys.length;
  const deletedReviewsMatchPlannedItems = record.writes.every((write) => write.kind !== "delete_review_entry" || attemptItemIds.has(write.record.sourceItem.itemId));
  const attemptsMatchSessionPlan = Boolean(sessionWrite) && attemptWrites.every((write) =>
    write.record.modeId === sessionWrite?.record.modeId &&
    sessionWrite?.record.itemOrder.some((occurrence) => occurrence.occurrenceId === write.record.occurrenceId && equalItemRef(occurrence.item, write.record.item)) &&
    equalItemRef(write.record.item, write.record.reviewEvidence.sourceItem));
  const reviewsMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "put_review_entry" && write.kind !== "put_review_entry_for_attempt" && write.kind !== "update_review_entry") return true;
    const attempt = attemptWrites.find((candidate) => candidate.record.id === (write.kind === "put_review_entry" ? write.record.sourceAttemptId : write.transitionId))?.record;
    if (!attempt || write.record.trackId !== attempt.trackId || !equalItemRef(write.record.sourceItem, attempt.reviewEvidence.sourceItem)) return false;
    if (write.kind === "put_review_entry_for_attempt") {
      const sourceAttempt = attemptWrites.find((candidate) => candidate.record.id === write.record.sourceAttemptId)?.record;
      return Boolean(sourceAttempt && write.record.sourceSessionId === sourceAttempt.sessionId && equalItemRef(write.record.sourceItem, sourceAttempt.item) && JSON.stringify(write.record.taxonomyOrSkillRefs) === JSON.stringify(sourceAttempt.reviewEvidence.taxonomyOrSkillRefs));
    }
    return write.kind === "update_review_entry" || (write.record.sourceSessionId === attempt.sessionId && JSON.stringify(write.record.taxonomyOrSkillRefs) === JSON.stringify(attempt.reviewEvidence.taxonomyOrSkillRefs));
  });
  const deletedReviewsMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "delete_review_entry") return true;
    return attemptWrites.some((attempt) => equalItemRef(write.record.sourceItem, attempt.record.item));
  });
  const transitionedReviewDeletesMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "delete_review_entry_for_attempt") return true;
    const attempt = attemptWrites.find((candidate) => candidate.record.id === write.transitionId)?.record;
    return Boolean(attempt && write.record.trackId === attempt.trackId && equalItemRef(write.record.sourceItem, attempt.reviewEvidence.sourceItem));
  });
  const immediateAttemptMatchesCurrentOccurrence = attemptWrites.length === 1 &&
    sessionWrite?.record.itemOrder[sessionWrite.record.currentItemIndex]?.occurrenceId === attemptWrites[0]?.record.occurrenceId;
  const draftDelete = record.writes.find((write): write is Extract<JournalWrite, { kind: "delete_active_session_draft" }> => write.kind === "delete_active_session_draft");
  const draftResponsesMatchAttempts = !draftDelete || (
    draftDelete.record.sessionId === sessionWrite?.record.id &&
    draftDelete.record.trackId === sessionWrite.record.trackId &&
    draftDelete.submittedOccurrenceIds.length === attemptWrites.length &&
    draftDelete.submittedOccurrenceIds.every((occurrenceId) => Object.prototype.hasOwnProperty.call(draftDelete.record.responsesByOccurrenceId, occurrenceId)) &&
    attemptWrites.every((write) => draftDelete.submittedOccurrenceIds.includes(write.record.occurrenceId) &&
      canonicalSerialize(draftDelete.record.responsesByOccurrenceId[write.record.occurrenceId]) === canonicalSerialize(write.record.response))
  );
  const draftPut = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_active_session_draft" }> => write.kind === "put_active_session_draft");

  switch (record.operation) {
    case "start_training_session": {
      const draftExpected = Boolean(sessionWrite && getTrainingSessionFinalizationCleanupKind(sessionWrite.record) === "session_draft");
      const draftMatches = !draftExpected || Boolean(draftPut && draftPut.record.sessionId === sessionWrite?.record.id && draftPut.record.trackId === sessionWrite.record.trackId && Object.keys(draftPut.record.responsesByOccurrenceId).length === 0 && draftPut.record.flaggedOccurrenceIds.length === 0);
      return only("put_session", "put_active_session_draft") && count("put_session") === 1 && sessionWrite?.record.status === "active" && count("put_active_session_draft") === (draftExpected ? 1 : 0) && draftMatches;
    }
    case "advance_training_session":
      return only("put_session") && count("put_session") === 1 && sessionWrite?.record.status === "active";
    case "submit_training_outcome":
      return only("put_attempt", "put_review_entry", "update_review_entry", "delete_review_entry", "put_session") && count("put_attempt") === 1 && count("put_review_entry") + count("update_review_entry") + count("delete_review_entry") <= 1 && count("put_session") === 1 && sessionWrite?.record.status === "active" && immediateAttemptMatchesCurrentOccurrence && hasUniqueOutcomeSemantics && deletedReviewsMatchPlannedItems && attemptsMatchSessionPlan && reviewsMatchAttempts && deletedReviewsMatchAttempts;
    case "complete_training_session":
      return only("put_session_result", "put_session", "clear_active_session") && count("put_session") === 1 && count("put_session_result") <= 1 && count("clear_active_session") === 1 && sessionWrite?.record.status === "completed" && (!resultWrite || (resultWrite.record.sessionId === sessionWrite.record.id && resultWrite.record.trackId === sessionWrite.record.trackId));
    case "abandon_training_session": {
      const draftExpected = Boolean(sessionWrite && getTrainingSessionFinalizationCleanupKind(sessionWrite.record) === "session_draft");
      return only("put_session", "clear_active_session", "clear_active_session_draft") &&
        count("put_session") === 1 && count("clear_active_session") === 1 &&
        count("clear_active_session_draft") === (draftExpected ? 1 : 0) &&
        record.writes.filter((write): write is Extract<JournalWrite, { kind: "clear_active_session_draft" }> => write.kind === "clear_active_session_draft").every((write) => write.sessionId === sessionWrite?.record.id) &&
        sessionWrite?.record.status === "abandoned";
    }
    case "finalize_training_session": {
      const cleanupKind = sessionWrite ? getTrainingSessionFinalizationCleanupKind(sessionWrite.record) : null;
      const cleanupMatchesSession = cleanupKind === "session_draft" && count("delete_active_session_draft") === 1 && draftResponsesMatchAttempts;
      return only("put_attempt", "put_review_entry_for_attempt", "update_review_entry", "delete_review_entry_for_attempt", "put_session_result", "put_session", "clear_active_session", "delete_active_session_draft") &&
        count("put_session") === 1 && count("clear_active_session") === 1 && sessionWrite?.record.status === "completed" &&
        cleanupMatchesSession && hasUniqueOutcomeSemantics && attemptsMatchSessionPlan && reviewsMatchAttempts && transitionedReviewDeletesMatchAttempts &&
        (!resultWrite || (resultWrite.record.sessionId === sessionWrite.record.id && resultWrite.record.trackId === sessionWrite.record.trackId && resultWrite.record.totalOccurrences === sessionWrite.record.itemOrder.length));
    }
    case "set_review_entry":
      return only("put_review_entry", "update_review_entry") && count("put_review_entry") + count("update_review_entry") === 1;
    case "remove_review_entry":
      return only("delete_review_entry") && count("delete_review_entry") === 1;
    case "reset_learning_state":
      return only("clear_learning_state") && count("clear_learning_state") === 1;
  }
}

function equalItemRef(left: { trackId: string; itemId: string; contentVersion: string }, right: { trackId: string; itemId: string; contentVersion: string }): boolean {
  return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion;
}

function hasConsistentScope(record: MutationJournalPlan): boolean {
  return record.writes.every((write) => {
    if (write.kind === "put_session") return write.record.id === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_session_result") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_attempt") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt") return write.record.sourceSessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "update_review_entry") return write.record.trackId === record.trackId;
    if (write.kind === "delete_review_entry") return write.record.trackId === record.trackId;
    if (write.kind === "delete_review_entry_for_attempt") return write.record.trackId === record.trackId;
    if (write.kind === "clear_active_session" || write.kind === "clear_active_session_draft") return write.sessionId === record.sessionId;
    if (write.kind === "put_active_session_draft" || write.kind === "delete_active_session_draft") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "clear_learning_state") return record.sessionId === "learning-state-reset";
    return true;
  });
}

export function createMutationPlanFingerprint(plan: MutationJournalPlan): string {
  const serialized = canonicalFingerprintPayload(JSON.parse(JSON.stringify(plan)));
  return sha256Utf8(serialized);
}

function persistedPlan(record: MutationJournalRecord): MutationJournalPlan {
  const { journalId: _journalId, planFingerprint: _planFingerprint, status: _status, ...plan } = record;
  return { ...plan, status: "journal_durable" };
}

export function hasValidMutationJournalIntegrity(value: unknown): value is MutationJournalRecord {
  if (!isRecord(value) || !hasExactKeys(value, ["journalId", "operation", "status", "createdAt", "sessionId", "trackId", "commandIdentity", "expectedRevisions", "planFingerprint", "writes"])) return false;
  if (!isRecord(value.commandIdentity) || !hasExactKeys(value.commandIdentity, ["version", "fingerprint"]) || value.commandIdentity.version !== 1 || !isNonEmptyString(value.commandIdentity.fingerprint) || !SHA_256.test(value.commandIdentity.fingerprint) || value.journalId !== `journal:${value.commandIdentity.fingerprint}` ||
    !isNonEmptyString(value.planFingerprint) || !PLAN_FINGERPRINT.test(value.planFingerprint) || !(OPERATIONS as readonly unknown[]).includes(value.operation) ||
    !["journal_durable", "materialized", "verified_pending_clear"].includes(value.status as string) || !isTimestamp(value.createdAt) || !isNonEmptyString(value.sessionId) || !isNonEmptyString(value.trackId) ||
    !isRegisteredTrackId(value.trackId) || !Array.isArray(value.expectedRevisions) || !value.expectedRevisions.every(isExpectedRevision) || !Array.isArray(value.writes) || !value.writes.every(isJournalWrite)) return false;
  const record = value as MutationJournalRecord;
  return hasConsistentScope(record) && hasExpectedRevisionPlan(record) && createMutationPlanFingerprint(persistedPlan(record)) === record.planFingerprint;
}

export function isMutationJournalRecord(value: unknown): value is MutationJournalRecord {
  return hasValidMutationJournalIntegrity(value) && hasValidOperationPlan(value);
}

export function assertMutationJournalIntegrity(value: unknown): asserts value is MutationJournalRecord { if (!hasValidMutationJournalIntegrity(value)) throw new Error("Mutation journal record is unsupported."); }
export function assertValidMutationJournal(value: unknown): asserts value is MutationJournalRecord { if (!isMutationJournalRecord(value)) throw new Error("Mutation journal record is unsupported."); }
export async function getActiveMutationJournal(): Promise<MutationJournalRecord | null> { return readCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, isMutationJournalRecord); }
let journalCriticalSection: Promise<void> = Promise.resolve();
async function inJournalCriticalSection<T>(operation: () => Promise<T>): Promise<T> {
  const previous = journalCriticalSection;
  let release!: () => void;
  journalCriticalSection = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await operation(); } finally { release(); }
}
export async function persistMutationJournal(record: MutationJournalRecord): Promise<MutationJournalRecord> {
  return inJournalCriticalSection(async () => { try {
    assertValidMutationJournal(record);
    const reviewUpdates = record.writes.filter((write): write is Extract<JournalWrite, { kind: "update_review_entry" }> => write.kind === "update_review_entry");
    if (reviewUpdates.length > 0) {
      const existingReviews = (await getReviewQueueItems()).value;
      if (reviewUpdates.some((write) => { const existing = existingReviews.find((entry) => entry.id === write.record.id); return !existing || !hasSameReviewIdentity(existing, write.record); })) throw new Error("A journaled review update must preserve an existing durable review identity.");
    }
    const current = await getActiveMutationJournal();
    if (current && current.commandIdentity.fingerprint !== record.commandIdentity.fingerprint) throw new Error("A different mutation is already pending.");
    if (!current && record.expectedRevisions.some((condition) => revisionForTarget(condition.target) !== condition.revision)) {
      throw new Error("Mutation journal expected revisions are stale.");
    }
    if (record.operation === "start_training_session") {
      const activeSession = await getActiveTrainingSession();
      if (activeSession && activeSession.id !== record.sessionId) {
        const message = `Active session ${activeSession.id} was claimed before this start command.`;
        throw new JournalWriteError(new Error(message), message);
      }
    }
    const prepared = current ?? record;
    writeCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, prepared);
    return prepared;
  } catch (error) {
    if (error instanceof JournalWriteError) throw error;
    throw new JournalWriteError(error);
  } });
}

export async function updateMutationJournalPhase(record: MutationJournalRecord, status: MutationJournalRecord["status"]): Promise<MutationJournalRecord> {
  return inJournalCriticalSection(async () => {
    const current = await getActiveMutationJournal();
    if (!current || current.commandIdentity.fingerprint !== record.commandIdentity.fingerprint) throw new JournalWriteError(new Error("Pending mutation ownership changed."));
    // The plan fingerprint is computed over the immutable operation, scope,
    // command, expected revisions and write set with status normalized.
    if (current.planFingerprint !== record.planFingerprint || current.journalId !== record.journalId ||
      current.operation !== record.operation || current.sessionId !== record.sessionId || current.trackId !== record.trackId) {
      throw new JournalWriteError(new Error("Pending mutation plan ownership changed."));
    }
    const phases: readonly MutationJournalRecord["status"][] = ["journal_durable", "materialized", "verified_pending_clear"];
    const from = phases.indexOf(current.status);
    const to = phases.indexOf(status);
    if (from < 0 || to !== from + 1) throw new JournalWriteError(new Error("Mutation journal phase transition is not monotonic."));
    const updated = { ...current, status } as MutationJournalRecord;
    writeCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, updated);
    return updated;
  });
}

function hasSameReviewIdentity(left: ReviewQueueEntry, right: ReviewQueueEntry): boolean {
  const identity = (entry: ReviewQueueEntry) => ({ id: entry.id, trackId: entry.trackId, sourceAttemptId: entry.sourceAttemptId, sourceSessionId: entry.sourceSessionId, sourceItem: entry.sourceItem, taxonomyOrSkillRefs: entry.taxonomyOrSkillRefs, createdAt: entry.createdAt });
  return JSON.stringify(identity(left)) === JSON.stringify(identity(right));
}
export async function clearMutationJournal(expectedCommandFingerprint?: string): Promise<void> {
  await inJournalCriticalSection(async () => {
    const current = await getActiveMutationJournal();
    if (!current) return;
    if (expectedCommandFingerprint && current.commandIdentity.fingerprint !== expectedCommandFingerprint) {
      throw new JournalWriteError(new Error("Mutation journal ownership changed before clear."), "Mutation journal ownership changed before clear.");
    }
    removeCanonicalValue(STORAGE_KEYS.ACTIVE_JOURNAL);
  });
}
