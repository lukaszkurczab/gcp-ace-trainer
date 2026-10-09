import type { TrainingAttempt } from "./trainingAttempt";
import type { TrainingSession } from "./trainingSession";
import type { PlanningScopeRef } from "./planningWorkEstimate";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";

export type CalibrationQuestion = Readonly<{ questionId: string; nodeId: string; mentalUnitId: string }>;
export type CalibrationPolicy = Readonly<{ policyVersion: string; workEstimates: readonly Readonly<{ estimateId: string; modeId: string; scopeRefs: readonly PlanningScopeRef[] }>[] }>;
export type ObservedTimeCalibration =
  | Readonly<{ kind: "unavailable"; reason: "insufficient_comparable_sessions" | "invalid_input" }>
  | Readonly<{
      kind: "observed";
      methodVersion: "patternly-time-calibration-median-v1";
      policyVersion: string;
      estimateId: string;
      modeId: string;
      contentVersion: string;
      artifactSha256: string;
      planningPolicyIdentity: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
      observationCount: number;
      sessionCount: number;
      answerCount: number;
      medianActiveMinutesPerResponse: number;
      sessionIds: readonly string[];
    }>;

/** Median foreground minutes per answered occurrence from completed, comparable sessions only. */
export function calibrateObservedPlanningTime(input: Readonly<{
  sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt[];
  questions: readonly CalibrationQuestion[];
  policy: CalibrationPolicy;
  estimateId: string;
  trackId: string;
  modeId: string;
  contentVersion: string;
  artifactSha256: string;
  planningPolicyIdentity: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
}>): ObservedTimeCalibration {
  if (!input.trackId.trim() || !input.modeId.trim() || !input.contentVersion.trim() || !/^[a-f0-9]{64}$/u.test(input.artifactSha256) || !input.policy.policyVersion.trim() || !input.planningPolicyIdentity.contentVersion.trim() || !/^[a-f0-9]{64}$/u.test(input.planningPolicyIdentity.artifactSha256) || input.planningPolicyIdentity.policyVersion !== input.policy.policyVersion) return unavailable("invalid_input");
  const questionById = new Map(input.questions.map((question) => [question.questionId, question]));
  const targetEstimate = input.policy.workEstimates.find((estimate) => estimate.modeId === input.modeId && estimate.estimateId === input.estimateId);
  if (!targetEstimate) return unavailable("invalid_input");
  const estimateScopes = new Set(targetEstimate.scopeRefs.map(scopeKey));
  const attemptsBySession = groupAttempts(input.attempts);
  const eligible: Array<{ session: TrainingSession; estimateId: string; answerCount: number; minutesPerResponse: number }> = [];
  for (const session of input.sessions) {
    if (session.status !== "completed" || !session.completedAt || !Number.isFinite(Date.parse(session.completedAt)) ||
      session.trackId !== input.trackId || session.modeId !== input.modeId || session.contentVersion !== input.contentVersion ||
      session.artifactSha256 !== input.artifactSha256 || !Number.isFinite(session.activeForegroundMs) || session.activeForegroundMs <= 0) continue;
    const grouped = attemptsBySession.get(session.id);
    if (!grouped || grouped.conflicted) continue;
    const estimates = new Set<string>();
    const answered = new Set<string>();
    let unclassified = false;
    for (const attempt of grouped.byOccurrence.values()) {
      if (attempt.trackId !== session.trackId || attempt.modeId !== session.modeId || attempt.item.contentVersion !== session.contentVersion || attempt.item.artifactSha256 !== session.artifactSha256) { unclassified = true; continue; }
      const occurrence = session.itemOrder.find((candidate) => candidate.occurrenceId === attempt.occurrenceId);
      if (!occurrence || occurrence.item.questionId !== attempt.item.questionId) { unclassified = true; continue; }
      const question = questionById.get(attempt.item.questionId);
      if (!question) { unclassified = true; continue; }
      if (!estimateScopes.has(scopeKey(question))) { unclassified = true; continue; }
      estimates.add(targetEstimate.estimateId);
      answered.add(attempt.occurrenceId);
    }
    // A session whose answers span distinct authored work classes cannot be
    // apportioned from one aggregate foreground timer without inventing data.
    if (unclassified || answered.size !== session.actualLength || estimates.size !== 1) continue;
    eligible.push({ session, estimateId: [...estimates][0]!, answerCount: answered.size, minutesPerResponse: session.activeForegroundMs / 60_000 / answered.size });
  }
  eligible.sort((left, right) => Date.parse(right.session.completedAt!) - Date.parse(left.session.completedAt!) || left.session.id.localeCompare(right.session.id));
  const recent = eligible.slice(0, 10);
  const answerCount = recent.reduce((sum, entry) => sum + entry.answerCount, 0);
  if (recent.length < 5 || answerCount < 20 || new Set(recent.map((entry) => entry.estimateId)).size !== 1) return unavailable("insufficient_comparable_sessions");
  const median = medianOf(recent.map((entry) => entry.minutesPerResponse));
  return Object.freeze({
    kind: "observed",
    methodVersion: "patternly-time-calibration-median-v1",
    policyVersion: input.policy.policyVersion,
    estimateId: recent[0]!.estimateId,
    modeId: input.modeId,
    contentVersion: input.contentVersion,
    artifactSha256: input.artifactSha256,
    planningPolicyIdentity: input.planningPolicyIdentity,
    observationCount: answerCount,
    sessionCount: recent.length,
    answerCount,
    medianActiveMinutesPerResponse: median,
    sessionIds: Object.freeze(recent.map(({ session }) => session.id)),
  });
}

function groupAttempts(attempts: readonly TrainingAttempt[]): Map<string, { byOccurrence: Map<string, TrainingAttempt>; conflicted: boolean }> {
  const grouped = new Map<string, { byOccurrence: Map<string, TrainingAttempt>; conflicted: boolean }>();
  for (const attempt of attempts) {
    const sessions = grouped.get(attempt.sessionId) ?? { byOccurrence: new Map<string, TrainingAttempt>(), conflicted: false };
    const existing = sessions.byOccurrence.get(attempt.occurrenceId);
    if (!existing) sessions.byOccurrence.set(attempt.occurrenceId, attempt);
    else if (existing.id !== attempt.id || canonicalSerialize(existing) !== canonicalSerialize(attempt)) sessions.conflicted = true;
    grouped.set(attempt.sessionId, sessions);
  }
  return grouped;
}
function scopeKey(scope: PlanningScopeRef): string { return `${scope.nodeId}\0${scope.mentalUnitId}`; }
function medianOf(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
function unavailable(reason: "insufficient_comparable_sessions" | "invalid_input"): ObservedTimeCalibration { return Object.freeze({ kind: "unavailable", reason }); }
