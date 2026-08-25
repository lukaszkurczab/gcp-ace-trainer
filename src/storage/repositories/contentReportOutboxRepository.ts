import type { ContentReportInput, ContentReportOutboxEntry, ContentReportOutboxStatus } from "../../domain";
import { CONTENT_REPORT_REASONS } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isStatus = (value: unknown): value is ContentReportOutboxStatus => value === "queued" || value === "retrying" || value === "failed" || value === "accepted";
const isReportInput = (value: unknown): value is ContentReportInput => {
  if (!isRecord(value) || !isNonEmptyString(value.clientSubmissionId) || !isNonEmptyString(value.trackId) || !isNonEmptyString(value.contentVersion) || !isNonEmptyString(value.itemId) || !CONTENT_REPORT_REASONS.includes(value.reason as typeof CONTENT_REPORT_REASONS[number]) || !isNonEmptyString(value.description) || !isRecord(value.context)) return false;
  const context = value.context;
  return isNonEmptyString(context.releasePackageId) && (context.trackNode === null || isNonEmptyString(context.trackNode)) && (context.modeRoute === "practice_feedback_details" || context.modeRoute === "answer_review") && (context.locale === "en" || context.locale === "pl") && isNonEmptyString(context.appBuild) && (context.platform === "ios" || context.platform === "android") && isNonEmptyString(context.occurredAt);
};
const isEntry = (value: unknown): value is ContentReportOutboxEntry => {
  if (!isRecord(value) || !isReportInput(value.input) || !isStatus(value.status) || !Number.isSafeInteger(value.attemptCount) || Number(value.attemptCount) < 0 || !isNonEmptyString(value.createdAt) || !isNonEmptyString(value.updatedAt) || (value.lastErrorCode !== null && !isNonEmptyString(value.lastErrorCode))) return false;
  return true;
};
const isEntries = (value: unknown): value is ContentReportOutboxEntry[] => Array.isArray(value) && value.every(isEntry);

export function getContentReportOutbox(): readonly ContentReportOutboxEntry[] {
  return Object.freeze(readCanonicalJson(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, isEntries) ?? []);
}

export function saveContentReportOutbox(entries: readonly ContentReportOutboxEntry[]): readonly ContentReportOutboxEntry[] {
  const next = [...entries];
  writeCanonicalJson(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, next);
  return Object.freeze(next);
}

export function upsertContentReportOutboxEntry(entry: ContentReportOutboxEntry): ContentReportOutboxEntry {
  const current = getContentReportOutbox();
  const existing = current.find((candidate) => candidate.input.clientSubmissionId === entry.input.clientSubmissionId);
  if (existing) {
    if (JSON.stringify(existing.input) !== JSON.stringify(entry.input)) throw new Error("Content report submission identity was reused with different data.");
    saveContentReportOutbox(current.map((candidate) => candidate.input.clientSubmissionId === entry.input.clientSubmissionId ? entry : candidate));
  } else {
    saveContentReportOutbox([...current, entry]);
  }
  return entry;
}

export function updateContentReportOutboxStatus(clientSubmissionId: string, status: ContentReportOutboxStatus, values: Readonly<{ attemptCount?: number; updatedAt: string; lastErrorCode: string | null }>): ContentReportOutboxEntry {
  const current = getContentReportOutbox();
  const existing = current.find((candidate) => candidate.input.clientSubmissionId === clientSubmissionId);
  if (!existing) throw new Error("Content report outbox entry is unavailable.");
  const next: ContentReportOutboxEntry = { ...existing, status, attemptCount: values.attemptCount ?? existing.attemptCount, updatedAt: values.updatedAt, lastErrorCode: values.lastErrorCode };
  upsertContentReportOutboxEntry(next);
  return next;
}

export function clearContentReportOutbox(): void {
  saveContentReportOutbox([]);
}
