import type { EvidenceRef, TrainingAttempt, TrainingSession, TrainingSessionResult } from "../domain";
import { getTrainingAttempts, getTrainingSessionResult, getTrainingSessions } from "../storage/repositories";

export type ActivitySessionRecord = Readonly<{
  attemptCount: number;
  latestAttemptAt: string | null;
  result: TrainingSessionResult | null;
  session: TrainingSession;
  scopeRefs: readonly EvidenceRef[];
}>;

/**
 * Activity is rebuilt from durable terminal session facts. Active sessions and
 * abandoned sessions without a committed attempt are intentionally excluded.
 */
export async function loadActivitySessionRecords(): Promise<readonly ActivitySessionRecord[]> {
  const [sessionsResult, attemptsResult] = await Promise.all([getTrainingSessions(), getTrainingAttempts()]);
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
      result: await getTrainingSessionResult(session.id),
      session,
      scopeRefs: activityScopeRefs(attempts),
    } satisfies ActivitySessionRecord;
  }));

  return Object.freeze([...records].sort((left, right) => activityTimestamp(right).localeCompare(activityTimestamp(left))));
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
