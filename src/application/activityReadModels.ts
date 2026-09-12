import { isContentIdentityTombstone, type EvidenceRef, type TrainingAttempt, type TrainingSession, type TrainingSessionResult } from "../domain";
import { getArchivalHistoryRecords, getTrainingAttempts, getTrainingSessionResult, getTrainingSessions, type ContentIdentityArchivalHistoryRecord } from "../storage/repositories";
import { StorageReadError } from "../storage/errors";
import type { StorageRepositoryResult } from "../storage/repositories/result";

export type ActivitySessionRecord = Readonly<{
  attemptCount: number;
  latestAttemptAt: string | null;
  result: TrainingSessionResult | null;
  session: TrainingSession;
  scopeRefs: readonly EvidenceRef[];
}>;

export type ActivityArchivedResultSummary = Readonly<{
  answeredCount: number;
  completedAt: string | null;
  totalCount: number;
  unansweredCount: number;
}>;

/** Immutable presentation facts for a migrated session whose content is unavailable. */
export type ActivityUnavailableSessionRecord = Readonly<{
  archive: ContentIdentityArchivalHistoryRecord;
  attemptCount: number;
  answeredCount: number;
  completedAt: string | null;
  contentVersion: string | null;
  id: string;
  kind: "unavailable";
  latestAttemptAt: string | null;
  modeId: string;
  result: ActivityArchivedResultSummary | null;
  scopeRefs: readonly EvidenceRef[];
  sessionId: string;
  startedAt: string | null;
  status: "abandoned" | "completed";
  totalCount: number;
  trackId: string;
  unavailableReasons: readonly string[];
}>;

export type ActivityRecord = ActivitySessionRecord | ActivityUnavailableSessionRecord;

type ActivityReadDependencies = Readonly<Partial<{
  getArchivalHistory: typeof getArchivalHistoryRecords;
  getAttempts: typeof getTrainingAttempts;
  getResult: typeof getTrainingSessionResult;
  getSessions: typeof getTrainingSessions;
}>>;

export type ActivityReadOutcome =
  | Readonly<{ kind: "ready"; records: readonly ActivityRecord[] }>
  | Readonly<{ kind: "error"; error: unknown }>
  | Readonly<{ kind: "stale" }>;

export type ActivityReadToken = Readonly<{ generation: number }>;

/**
 * Activity is rebuilt from durable terminal session facts. Active sessions and
 * abandoned sessions without a committed attempt are intentionally excluded.
 */
export async function loadActivitySessionRecords(
  dependencies: ActivityReadDependencies = {},
): Promise<readonly ActivitySessionRecord[]> {
  const getAttempts = dependencies.getAttempts ?? getTrainingAttempts;
  const getResult = dependencies.getResult ?? getTrainingSessionResult;
  const getSessions = dependencies.getSessions ?? getTrainingSessions;
  const [sessionsResult, attemptsResult] = await Promise.all([
    getSessions(),
    getAttempts(),
  ]);
  assertNoActivityReadIssues(sessionsResult, attemptsResult);
  const attemptsBySession = groupAttemptsBySession(attemptsResult.value);
  const terminalSessions = sessionsResult.value.filter((session) => {
    if (session.status === "active") return false;
    return session.status === "completed" || (attemptsBySession.get(session.id)?.length ?? 0) > 0;
  });

  const records = await Promise.all(terminalSessions.map(async (session) => {
    const attempts = attemptsBySession.get(session.id) ?? [];
    const latestAttemptAt = latestAttemptTimestamp(attempts);
    return {
      attemptCount: attempts.length,
      latestAttemptAt,
      result: await getResult(session.id),
      session,
      scopeRefs: activityScopeRefs(attempts),
    } satisfies ActivitySessionRecord;
  }));

  return Object.freeze([...records].sort((left, right) => activityTimestamp(right).localeCompare(activityTimestamp(left))));
}

/**
 * Activity's full history includes strict terminal sessions and immutable
 * archival summaries. Archived rows never become runtime TrainingSessions.
 */
export async function loadActivityRecords(
  dependencies: ActivityReadDependencies = {},
): Promise<readonly ActivityRecord[]> {
  const getArchivalHistory = dependencies.getArchivalHistory ?? getArchivalHistoryRecords;
  const [canonicalRecords, archivalResult] = await Promise.all([
    loadActivitySessionRecords(dependencies),
    getArchivalHistory(),
  ]);
  if (archivalResult.issues && archivalResult.issues.length > 0) {
    throw new StorageReadError("activity archival history", archivalResult.issues);
  }
  const archivalRecords = archivalResult.value.map(toActivityUnavailableRecord);
  const archivalIds = new Set(archivalRecords.map((record) => record.sessionId));
  return Object.freeze([
    ...canonicalRecords.filter((record) => !archivalIds.has(record.session.id)),
    ...archivalRecords,
  ].sort((left, right) => activityTimestamp(right).localeCompare(activityTimestamp(left))));
}

function assertNoActivityReadIssues(
  sessionsResult: StorageRepositoryResult<TrainingSession[]>,
  attemptsResult: StorageRepositoryResult<TrainingAttempt<unknown>[]>,
): void {
  const issues = [...(sessionsResult.issues ?? []), ...(attemptsResult.issues ?? [])];
  if (issues.length > 0) throw new StorageReadError("activity", issues);
}

/** Owns Activity's one read generation so blur and retry cannot publish stale data. */
export function createActivityReadOwner<T extends ActivityRecord = ActivitySessionRecord>(
  read: () => Promise<readonly T[]> = loadActivitySessionRecords as () => Promise<readonly T[]>,
) {
  let currentGeneration = 0;

  function begin(): ActivityReadToken {
    currentGeneration += 1;
    return Object.freeze({ generation: currentGeneration });
  }

  function isCurrent(token: ActivityReadToken): boolean {
    return token.generation === currentGeneration;
  }

  function invalidate(token: ActivityReadToken): void {
    if (isCurrent(token)) currentGeneration += 1;
  }

  async function resolve(token: ActivityReadToken): Promise<Readonly<{ kind: "ready"; records: readonly T[] } | { kind: "error"; error: unknown } | { kind: "stale" }>> {
    if (!isCurrent(token)) return { kind: "stale" };
    try {
      const records = await read();
      return isCurrent(token) ? { kind: "ready", records } : { kind: "stale" };
    } catch (error) {
      return isCurrent(token) ? { error, kind: "error" } : { kind: "stale" };
    }
  }

  return Object.freeze({ begin, invalidate, isCurrent, resolve });
}

function activityScopeRefs(attempts: readonly TrainingAttempt[]): readonly EvidenceRef[] {
  const seen = new Set<string>();
  const refs: EvidenceRef[] = [];
  for (const attempt of attempts) {
    for (const ref of attempt.reviewEvidence.taxonomyOrSkillRefs) {
      if (ref.axisId !== "roadmap_node" && ref.axisId !== "cloud-domain") continue;
      const key = `${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      refs.push(ref);
    }
  }
  return Object.freeze(refs.map((ref) => Object.freeze({ ...ref })));
}

function groupAttemptsBySession(attempts: readonly TrainingAttempt[]): Map<string, TrainingAttempt[]> {
  const grouped = new Map<string, TrainingAttempt[]>();
  for (const attempt of attempts) {
    const current = grouped.get(attempt.sessionId) ?? [];
    current.push(attempt);
    grouped.set(attempt.sessionId, current);
  }
  return grouped;
}

function latestAttemptTimestamp(attempts: readonly TrainingAttempt[]): string | null {
  return [...attempts]
    .map((attempt) => attempt.committedAt || attempt.answeredAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

export function activityTimestamp(record: Pick<ActivitySessionRecord, "latestAttemptAt" | "session"> | Pick<ActivityUnavailableSessionRecord, "completedAt" | "latestAttemptAt" | "startedAt">): string {
  if ("session" in record) return record.session.completedAt ?? record.latestAttemptAt ?? record.session.startedAt;
  return record.completedAt ?? record.latestAttemptAt ?? record.startedAt ?? "";
}

function toActivityUnavailableRecord(archive: ContentIdentityArchivalHistoryRecord): ActivityUnavailableSessionRecord {
  const session = archive.session;
  const status = session.status === "completed" ? "completed" : "abandoned";
  const attempts = archive.attempts;
  const resultRecord = archive.results.find((result) => result.sessionId === archive.sessionId) ?? null;
  const answeredCount = stringArray(resultRecord?.answeredOccurrenceIds).length;
  const unansweredCount = stringArray(resultRecord?.unansweredOccurrenceIds).length;
  const totalCount = safeCount(resultRecord?.totalOccurrences) ?? safeCount(session.actualLength) ?? Math.max(attempts.length, answeredCount + unansweredCount);
  const latestAttemptAt = latestJsonTimestamp(attempts);
  return Object.freeze({
    archive,
    attemptCount: attempts.length,
    answeredCount,
    completedAt: stringValue(session.completedAt),
    contentVersion: stringValue(session.contentVersion),
    id: archive.sessionId,
    kind: "unavailable" as const,
    latestAttemptAt,
    modeId: stringValue(session.modeId) ?? "unknown",
    result: resultRecord ? Object.freeze({
      answeredCount,
      completedAt: stringValue(resultRecord.completedAt),
      totalCount,
      unansweredCount,
    }) : null,
    scopeRefs: activityScopeRefsFromJson(attempts),
    sessionId: archive.sessionId,
    startedAt: stringValue(session.startedAt),
    status,
    totalCount,
    trackId: stringValue(session.trackId) ?? "unknown",
    unavailableReasons: Object.freeze(unavailableReasons(archive)),
  });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function safeCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];
}

function latestJsonTimestamp(attempts: readonly Record<string, unknown>[]): string | null {
  return attempts.map((attempt) => stringValue(attempt.committedAt) ?? stringValue(attempt.answeredAt)).filter((value): value is string => value !== null).sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function activityScopeRefsFromJson(attempts: readonly Record<string, unknown>[]): readonly EvidenceRef[] {
  const refs: EvidenceRef[] = [];
  const seen = new Set<string>();
  for (const attempt of attempts) {
    const evidence = isRecord(attempt.reviewEvidence) ? attempt.reviewEvidence : null;
    const candidates = evidence && Array.isArray(evidence.taxonomyOrSkillRefs) ? evidence.taxonomyOrSkillRefs : [];
    for (const candidate of candidates) {
      if (!isRecord(candidate) || typeof candidate.axisId !== "string" || typeof candidate.nodeId !== "string") continue;
      if (candidate.axisId !== "roadmap_node" && candidate.axisId !== "cloud-domain") continue;
      const key = `${candidate.axisId}:${candidate.nodeId}:${typeof candidate.role === "string" ? candidate.role : ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      refs.push({ axisId: candidate.axisId, nodeId: candidate.nodeId, ...(typeof candidate.role === "string" ? { role: candidate.role } : {}) });
    }
  }
  return Object.freeze(refs.map((ref) => Object.freeze(ref)));
}

function unavailableReasons(value: unknown, found = new Set<string>()): readonly string[] {
  if (value === null || typeof value !== "object") return [...found];
  if (isContentIdentityTombstone(value)) found.add(value.reason);
  if (Array.isArray(value)) {
    value.forEach((entry) => unavailableReasons(entry, found));
    return [...found];
  }
  if (!isRecord(value)) return [...found];
  Object.values(value).forEach((entry) => unavailableReasons(entry, found));
  return [...found];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
