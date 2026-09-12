import type { ContentReportInput, ContentReportOutboxEntry, ContentReportOutboxStatus } from "../../domain";
import { CONTENT_REPORT_REASONS, contentReportDescriptionIssue, isRegisteredTrackId } from "../../domain";
import { localReportOutboxRetentionDays } from "../../legal/legalVariables";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isStatus = (value: unknown): value is ContentReportOutboxStatus => value === "queued" || value === "retrying" || value === "failed" || value === "accepted";
const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[], required: readonly string[] = allowed): boolean => required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && Object.keys(value).every((key) => allowed.includes(key));
const isTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return false;
  try { return new Date(value).toISOString() === value; } catch { return false; }
};
const isReportInput = (value: unknown): value is ContentReportInput => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["clientSubmissionId", "trackId", "contentVersion", "itemId", "reason", "description", "context", "linkAccount", "contactEmail"], ["clientSubmissionId", "trackId", "contentVersion", "itemId", "reason", "description", "context"]) || !isNonEmptyString(value.clientSubmissionId) || !isNonEmptyString(value.trackId) || !isRegisteredTrackId(value.trackId) || !isNonEmptyString(value.contentVersion) || !isNonEmptyString(value.itemId) || !CONTENT_REPORT_REASONS.includes(value.reason as typeof CONTENT_REPORT_REASONS[number]) || typeof value.description !== "string" || contentReportDescriptionIssue(value.description) !== null || !isRecord(value.context) || (value.linkAccount !== undefined && typeof value.linkAccount !== "boolean") || (value.contactEmail !== undefined && !isNonEmptyString(value.contactEmail))) return false;
  const context = value.context;
  return hasOnlyKeys(context, ["releasePackageId", "trackNode", "modeRoute", "locale", "appBuild", "platform", "occurredAt"]) && isNonEmptyString(context.releasePackageId) && (context.trackNode === null || isNonEmptyString(context.trackNode)) && (context.modeRoute === "practice_feedback_details" || context.modeRoute === "answer_review") && (context.locale === "en" || context.locale === "pl") && isNonEmptyString(context.appBuild) && (context.platform === "ios" || context.platform === "android") && isTimestamp(context.occurredAt);
};
const isEntry = (value: unknown): value is ContentReportOutboxEntry => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["input", "status", "attemptCount", "createdAt", "updatedAt", "lastErrorCode"]) || !isReportInput(value.input) || !isStatus(value.status) || !Number.isSafeInteger(value.attemptCount) || Number(value.attemptCount) < 0 || !isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt) || (value.lastErrorCode !== null && !isNonEmptyString(value.lastErrorCode))) return false;
  return true;
};
const isEntries = (value: unknown): value is ContentReportOutboxEntry[] => Array.isArray(value) && value.every(isEntry);

/** Pure owner guard for read-only inventory and migration preflight callers. */
export const isContentReportOutboxEntries = isEntries;

export function getContentReportOutbox(): readonly ContentReportOutboxEntry[] {
  return Object.freeze(readCanonicalJson(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, isEntries) ?? []);
}

export function saveContentReportOutbox(entries: readonly ContentReportOutboxEntry[]): readonly ContentReportOutboxEntry[] {
  const next = [...entries];
  if (next.length === 0) {
    removeCanonicalValue(STORAGE_KEYS.CONTENT_REPORT_OUTBOX);
    return Object.freeze(next);
  }
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

/** A failed cleanup leaves the original entry intact for idempotent retry. */
export function removeContentReportOutboxEntry(clientSubmissionId: string): void {
  const current = getContentReportOutbox();
  if (!current.some((entry) => entry.input.clientSubmissionId === clientSubmissionId)) throw new Error("Content report outbox entry is unavailable.");
  saveContentReportOutbox(current.filter((entry) => entry.input.clientSubmissionId !== clientSubmissionId));
}

/** Pre-ODK-071 accepted records are terminal; preserve all uncertain states. */
export function purgeAcceptedContentReportOutboxEntries(): readonly ContentReportOutboxEntry[] {
  const current = getContentReportOutbox();
  const pending = current.filter((entry) => entry.status !== "accepted");
  return pending.length === current.length ? current : saveContentReportOutbox(pending);
}

/** Unconfirmed reports expire locally so an offline queue cannot retain free text indefinitely. */
export function purgeExpiredContentReportOutboxEntries(now: Date = new Date()): readonly ContentReportOutboxEntry[] {
  const current = getContentReportOutbox();
  const cutoff = now.getTime() - localReportOutboxRetentionDays * 24 * 60 * 60 * 1000;
  const pending = current.filter((entry) => {
    const createdAt = Date.parse(entry.createdAt);
    return !Number.isFinite(createdAt) || createdAt > cutoff;
  });
  return pending.length === current.length ? current : saveContentReportOutbox(pending);
}
