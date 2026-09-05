import type { EvidenceRef, TrainingAttempt, TrainingSession, TrainingSessionResult } from "../domain";
import { getTrainingAttempts, getTrainingSessionResult, getTrainingSessions } from "../storage/repositories";
import { StorageReadError } from "../storage/errors";
import type { StorageRepositoryResult } from "../storage/repositories/result";

export type ActivitySessionRecord = Readonly<{
  attemptCount: number;
  latestAttemptAt: string | null;
  result: TrainingSessionResult | null;
  session: TrainingSession;
  scopeRefs: readonly EvidenceRef[];
}>;

type ActivityReadDependencies = Readonly<Partial<{
  getAttempts: typeof getTrainingAttempts;
  getResult: typeof getTrainingSessionResult;
  getSessions: typeof getTrainingSessions;
}>>;

export type ActivityReadOutcome =
  | Readonly<{ kind: "ready"; records: readonly ActivitySessionRecord[] }>
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

function assertNoActivityReadIssues(
  sessionsResult: StorageRepositoryResult<TrainingSession[]>,
  attemptsResult: StorageRepositoryResult<TrainingAttempt<unknown>[]>,
): void {
  const issues = [...(sessionsResult.issues ?? []), ...(attemptsResult.issues ?? [])];
  if (issues.length > 0) throw new StorageReadError("activity", issues);
}

/** Owns Activity's one read generation so blur and retry cannot publish stale data. */
export function createActivityReadOwner(
  read: () => Promise<readonly ActivitySessionRecord[]> = loadActivitySessionRecords,
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

  async function resolve(token: ActivityReadToken): Promise<ActivityReadOutcome> {
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

export function activityTimestamp(record: Pick<ActivitySessionRecord, "latestAttemptAt" | "session">): string {
  return record.session.completedAt ?? record.latestAttemptAt ?? record.session.startedAt;
}
