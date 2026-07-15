import type { ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../../domain";
import { isRegisteredTrackId } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { JournalWriteError } from "../errors";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession } from "./trainingModelGuards";
import { getReviewQueueItems } from "./reviewQueueRepository";

export type JournalWrite =
  | { kind: "put_session"; record: TrainingSession }
  | { kind: "put_attempt"; record: TrainingAttempt<unknown> }
  | { kind: "put_review_entry"; record: ReviewQueueEntry }
  | { kind: "update_review_entry"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "delete_review_entry"; record: ReviewQueueEntry }
  | { kind: "clear_active_session"; sessionId: string }
  | { kind: "clear_active_exam"; sessionId: string };

export type MutationOperation = "submit_training_outcome" | "complete_training_session" | "abandon_training_session" | "finalize_certification_exam" | "set_review_entry" | "remove_review_entry";
export type MutationJournalPlan = Readonly<{
  operation: MutationOperation;
  status: "prepared";
  createdAt: string;
  sessionId: string;
  trackId: string;
  commandFingerprint: string;
  writes: readonly JournalWrite[];
}>;
export type MutationJournalRecord = MutationJournalPlan & Readonly<{ journalId: string; planFingerprint: string }>;

const OPERATIONS: readonly MutationOperation[] = ["submit_training_outcome", "complete_training_session", "abandon_training_session", "finalize_certification_exam", "set_review_entry", "remove_review_entry"];
const SHA_256 = /^[a-f0-9]{64}$/;
const PLAN_FINGERPRINT = /^[a-f0-9]{32}$/;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasExactKeys(value: Record<string, unknown>, required: readonly string[]): boolean { const keys = Object.keys(value); return keys.length === required.length && required.every((key) => keys.includes(key)); }
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isTimestamp(value: unknown): value is string { return isNonEmptyString(value) && !Number.isNaN(Date.parse(value)); }
function isJournalWrite(value: unknown): value is JournalWrite {
  if (!isRecord(value) || !isNonEmptyString(value.kind)) return false;
  switch (value.kind) {
    case "put_session": return hasExactKeys(value, ["kind", "record"]) && isTrainingSession(value.record);
    case "put_attempt": return hasExactKeys(value, ["kind", "record"]) && isTrainingAttempt(value.record);
    case "put_review_entry": return hasExactKeys(value, ["kind", "record"]) && isReviewQueueEntry(value.record);
    case "update_review_entry": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "delete_review_entry": return hasExactKeys(value, ["kind", "record"]) && isReviewQueueEntry(value.record);
    case "clear_active_session":
    case "clear_active_exam": return hasExactKeys(value, ["kind", "sessionId"]) && isNonEmptyString(value.sessionId);
    default: return false;
  }
}

function writeTarget(write: JournalWrite): string {
  switch (write.kind) {
    case "put_session": return `session:${write.record.id}`;
    case "put_attempt": return `attempt:${write.record.id}`;
    case "put_review_entry": return `review:${write.record.id}`;
    case "update_review_entry": return `review:${write.record.id}`;
    case "delete_review_entry": return `review:${write.record.id}`;
    case "clear_active_exam": return "active_exam";
    case "clear_active_session": return "active_session";
  }
}

function hasValidOperationPlan(record: MutationJournalPlan): boolean {
  if (record.writes.length === 0) return false;
  const targets = record.writes.map(writeTarget);
  if (new Set(targets).size !== targets.length) return false;
  const count = (kind: JournalWrite["kind"]) => record.writes.filter((write) => write.kind === kind).length;
  const only = (...kinds: JournalWrite["kind"][]) => record.writes.every((write) => kinds.includes(write.kind));
  const sessionWrite = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_session" }> => write.kind === "put_session");
  const attemptWrites = record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt");
  const attemptItemIds = new Set(record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt").map((write) => write.record.item.itemId));
  const attemptItemKeys = attemptWrites.map((write) => `${write.record.item.trackId}:${write.record.item.contentVersion}:${write.record.item.itemId}`);
  const reviewItemKeys = record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_review_entry" | "update_review_entry" }> => write.kind === "put_review_entry" || write.kind === "update_review_entry").map((write) => `${write.record.sourceItem.trackId}:${write.record.sourceItem.contentVersion}:${write.record.sourceItem.itemId}`);
  const hasUniqueOutcomeSemantics = new Set(attemptItemKeys).size === attemptItemKeys.length && new Set(reviewItemKeys).size === reviewItemKeys.length;
  const deletedReviewsMatchPlannedItems = record.writes.every((write) => write.kind !== "delete_review_entry" || attemptItemIds.has(write.record.sourceItem.itemId));
  const attemptsMatchSessionPlan = Boolean(sessionWrite) && attemptWrites.every((write) =>
    write.record.modeId === sessionWrite?.record.modeId &&
    sessionWrite?.record.itemOrder.some((item) => equalItemRef(item, write.record.item)) &&
    equalItemRef(write.record.item, write.record.reviewEvidence.sourceItem));
  const reviewsMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "put_review_entry" && write.kind !== "update_review_entry") return true;
    const attempt = attemptWrites.find((candidate) => candidate.record.id === (write.kind === "put_review_entry" ? write.record.sourceAttemptId : write.transitionId))?.record;
    if (!attempt || write.record.trackId !== attempt.trackId || !equalItemRef(write.record.sourceItem, attempt.reviewEvidence.sourceItem)) return false;
    return write.kind === "update_review_entry" || (write.record.sourceSessionId === attempt.sessionId && JSON.stringify(write.record.taxonomyOrSkillRefs) === JSON.stringify(attempt.reviewEvidence.taxonomyOrSkillRefs));
  });
  const deletedReviewsMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "delete_review_entry") return true;
    return attemptWrites.some((attempt) => equalItemRef(write.record.sourceItem, attempt.record.item));
  });

  switch (record.operation) {
    case "submit_training_outcome":
      return only("put_attempt", "put_review_entry", "update_review_entry", "delete_review_entry", "put_session") && count("put_attempt") === 1 && count("put_review_entry") + count("update_review_entry") + count("delete_review_entry") <= 1 && count("put_session") === 1 && sessionWrite?.record.status === "active" && hasUniqueOutcomeSemantics && deletedReviewsMatchPlannedItems && attemptsMatchSessionPlan && reviewsMatchAttempts && deletedReviewsMatchAttempts;
    case "complete_training_session":
      return only("put_session", "clear_active_session") && count("put_session") === 1 && count("clear_active_session") === 1 && sessionWrite?.record.status === "completed";
    case "abandon_training_session":
      return only("put_session", "clear_active_session", "clear_active_exam") && count("put_session") === 1 && count("clear_active_session") === 1 && count("clear_active_exam") <= 1 && sessionWrite?.record.status === "abandoned";
    case "finalize_certification_exam":
      return only("put_attempt", "put_review_entry", "update_review_entry", "put_session", "clear_active_session", "clear_active_exam") && count("put_session") === 1 && count("clear_active_session") === 1 && count("clear_active_exam") === 1 && sessionWrite?.record.status === "completed" && record.trackId === "cloud-certification" && hasUniqueOutcomeSemantics && attemptsMatchSessionPlan && reviewsMatchAttempts;
    case "set_review_entry":
      return only("put_review_entry", "update_review_entry") && count("put_review_entry") + count("update_review_entry") === 1;
    case "remove_review_entry":
      return only("delete_review_entry") && count("delete_review_entry") === 1;
  }
}

function equalItemRef(left: { trackId: string; itemId: string; contentVersion: string }, right: { trackId: string; itemId: string; contentVersion: string }): boolean {
  return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion;
}

function hasConsistentScope(record: MutationJournalPlan): boolean {
  return record.writes.every((write) => {
    if (write.kind === "put_session") return write.record.id === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_attempt") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_review_entry") return write.record.sourceSessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "update_review_entry") return write.record.trackId === record.trackId;
    if (write.kind === "delete_review_entry") return write.record.trackId === record.trackId;
    if (write.kind === "clear_active_session" || write.kind === "clear_active_exam") return write.sessionId === record.sessionId;
    return true;
  });
}

export function createMutationPlanFingerprint(plan: MutationJournalPlan): string {
  const serialized = canonicalSerialize(JSON.parse(JSON.stringify(plan)));
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  return seeds.map((seed) => {
    let hash = seed;
    for (let index = 0; index < serialized.length; index += 1) {
      hash ^= serialized.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }).join("");
}

function persistedPlan(record: MutationJournalRecord): MutationJournalPlan {
  const { journalId: _journalId, planFingerprint: _planFingerprint, ...plan } = record;
  return plan;
}

export function hasValidMutationJournalIntegrity(value: unknown): value is MutationJournalRecord {
  if (!isRecord(value) || !hasExactKeys(value, ["journalId", "operation", "status", "createdAt", "sessionId", "trackId", "commandFingerprint", "planFingerprint", "writes"])) return false;
  if (!isNonEmptyString(value.commandFingerprint) || !SHA_256.test(value.commandFingerprint) || value.journalId !== `journal:${value.commandFingerprint}` ||
    !isNonEmptyString(value.planFingerprint) || !PLAN_FINGERPRINT.test(value.planFingerprint) || !(OPERATIONS as readonly unknown[]).includes(value.operation) ||
    value.status !== "prepared" || !isTimestamp(value.createdAt) || !isNonEmptyString(value.sessionId) || !isNonEmptyString(value.trackId) ||
    !isRegisteredTrackId(value.trackId) || !Array.isArray(value.writes) || !value.writes.every(isJournalWrite)) return false;
  const record = value as MutationJournalRecord;
  return hasConsistentScope(record) && createMutationPlanFingerprint(persistedPlan(record)) === record.planFingerprint;
}

export function isMutationJournalRecord(value: unknown): value is MutationJournalRecord {
  return hasValidMutationJournalIntegrity(value) && hasValidOperationPlan(value);
}

export function assertMutationJournalIntegrity(value: unknown): asserts value is MutationJournalRecord { if (!hasValidMutationJournalIntegrity(value)) throw new Error("Mutation journal record is unsupported."); }
export function assertValidMutationJournal(value: unknown): asserts value is MutationJournalRecord { if (!isMutationJournalRecord(value)) throw new Error("Mutation journal record is unsupported."); }
export async function getActiveMutationJournal(): Promise<MutationJournalRecord | null> { return readStoredJson(STORAGE_KEYS.ACTIVE_JOURNAL, isMutationJournalRecord); }
export async function persistMutationJournal(record: MutationJournalRecord): Promise<MutationJournalRecord> {
  try {
    assertValidMutationJournal(record);
    const reviewUpdates = record.writes.filter((write): write is Extract<JournalWrite, { kind: "update_review_entry" }> => write.kind === "update_review_entry");
    if (reviewUpdates.length > 0) {
      const existingReviews = (await getReviewQueueItems()).value;
      if (reviewUpdates.some((write) => { const existing = existingReviews.find((entry) => entry.id === write.record.id); return !existing || !hasSameReviewIdentity(existing, write.record); })) throw new Error("A journaled review update must preserve an existing durable review identity.");
    }
    const current = await getActiveMutationJournal();
    if (current && current.commandFingerprint !== record.commandFingerprint) throw new Error("A different mutation is already pending.");
    const prepared = current ?? record;
    writeStoredJson(STORAGE_KEYS.ACTIVE_JOURNAL, prepared);
    return prepared;
  } catch (error) {
    if (error instanceof JournalWriteError) throw error;
    throw new JournalWriteError(error);
  }
}

function hasSameReviewIdentity(left: ReviewQueueEntry, right: ReviewQueueEntry): boolean {
  const identity = (entry: ReviewQueueEntry) => ({ id: entry.id, trackId: entry.trackId, sourceAttemptId: entry.sourceAttemptId, sourceSessionId: entry.sourceSessionId, sourceItem: entry.sourceItem, taxonomyOrSkillRefs: entry.taxonomyOrSkillRefs, createdAt: entry.createdAt });
  return JSON.stringify(identity(left)) === JSON.stringify(identity(right));
}
export async function clearMutationJournal(): Promise<void> { removeStoredValue(STORAGE_KEYS.ACTIVE_JOURNAL); }
