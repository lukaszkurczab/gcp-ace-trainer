import type { CertificationExamViewModel } from "../../tracks/cloud-certification";
import type { ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { JournalWriteError } from "../errors";

export type JournalWrite =
  | { kind: "put_session"; session: TrainingSession }
  | { kind: "put_attempt"; attempt: TrainingAttempt<unknown> }
  | { kind: "put_review_entry"; entry: ReviewQueueEntry }
  | { kind: "delete_review_entry"; trackId: string; itemId: string }
  | { kind: "put_certification_exam"; exam: CertificationExamViewModel }
  | { kind: "clear_active_session" }
  | { kind: "clear_active_exam" };
export type MutationJournalRecord = { journalId: string; operation: "submit_training_outcome" | "complete_training_session" | "abandon_training_session" | "finalize_certification_exam"; status: "prepared"; createdAt: string; sessionId: string; trackId: string; inputFingerprint: string; writes: readonly JournalWrite[] };
function isJournal(value: unknown): value is MutationJournalRecord { return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as MutationJournalRecord).journalId === "string" && (value as MutationJournalRecord).status === "prepared" && Array.isArray((value as MutationJournalRecord).writes); }
export async function getActiveMutationJournal(): Promise<MutationJournalRecord | null> { return readStoredJson(STORAGE_KEYS.ACTIVE_JOURNAL, isJournal); }
export async function persistMutationJournal(record: MutationJournalRecord): Promise<void> { const current = await getActiveMutationJournal(); if (current && current.inputFingerprint !== record.inputFingerprint) throw new JournalWriteError(new Error("A different mutation is already pending.")); try { writeStoredJson(STORAGE_KEYS.ACTIVE_JOURNAL, current ?? record); } catch (error) { throw new JournalWriteError(error); } }
export async function clearMutationJournal(): Promise<void> { removeStoredValue(STORAGE_KEYS.ACTIVE_JOURNAL); }
