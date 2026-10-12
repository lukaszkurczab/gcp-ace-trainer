import type { GoalSnapshot, ReviewQueueEntry, TrackId, TrainingAttempt, TrainingSession } from "../../domain";
import { isGoalPolicyForTrack, type GoalPolicy } from "../../domain/goals/goalPolicy";
import { getKeyValueStorage, isProfileTransitionActive } from "../../infrastructure/storage/mmkvClient";
import { readActiveTrackId } from "./activeTrackRepository";
import { isGoalOnboardingDismissed } from "./goalOnboardingPreferenceRepository";
import { readActiveTrainingSession, readTrainingSessions } from "./trainingSessionRepository";
import { readTrainingSessionResult } from "./trainingSessionResultRepository";
import { readGoalSnapshot } from "./goalRepository";
import { getLearningPlanSnapshot, type LearningPlanSnapshot } from "./learningPlanRepository";
import { hasPendingMutationJournal } from "./mutationJournalRepository";
import { readReviewQueueItems } from "./reviewQueueRepository";
import { readTrainingAttempts } from "./trainingAttemptRepository";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

export type LearningPlanInputSnapshot = Readonly<{
  storageScope: object;
  goal: GoalSnapshot | null;
  plan: LearningPlanSnapshot | null;
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
  sessions?: readonly TrainingSession[];
  /** The single canonical active-session pointer, cross-checked against the indexed records. */
  activeSession?: TrainingSession | null;
}>;

/** Complete canonical facts required by Home; optional proposal inputs keep their separate contract. */
export type CompleteLearningPlanInputSnapshot = LearningPlanInputSnapshot & Readonly<{
  sessions: readonly TrainingSession[];
  activeSession: TrainingSession | null;
}>;

/** Opaque published lease: callers may compare it, never read raw storage. */
export function readLearningPlanStorageScope(): object {
  if (isProfileTransitionActive()) throw new Error("Learning plan storage is transitioning.");
  return getKeyValueStorage();
}

/** No await between validated canonical reads; journaled materialization is not an empty history. */
export function readLearningPlanInputSnapshot(trackId: TrackId | null, policy: GoalPolicy | null, admission: TrackAdmissionContext): CompleteLearningPlanInputSnapshot {
  if ((trackId === null) !== (policy === null) || (trackId !== null && policy !== null && !isGoalPolicyForTrack(policy, trackId))) throw new Error("A matching goal policy is required for the selected track.");
  const storageScope = readLearningPlanStorageScope();
  if (hasPendingMutationJournal()) throw new Error("Learning plan evidence is being materialized.");
  const goal = trackId === null ? null : readGoalSnapshot(trackId, policy!);
  const plan = trackId === null ? null : getLearningPlanSnapshot(trackId, policy!);
  const attempts = readTrainingAttempts(admission);
  const reviews = readReviewQueueItems(admission);
  const sessions = readTrainingSessions(admission);
  const activeSession = readActiveTrainingSession(admission);
  if (attempts.issues?.length || reviews.issues?.length) throw new Error("Learning plan evidence could not be read.");
  if (sessions.issues?.length) throw new Error("Learning plan session evidence could not be read.");
  const indexedActive = sessions.value.filter((session) => session.status === "active");
  if (indexedActive.length > 1 || (activeSession === null) !== (indexedActive.length === 0) ||
    (activeSession !== null && (indexedActive[0]?.id !== activeSession.id || JSON.stringify(indexedActive[0]) !== JSON.stringify(activeSession)))) {
    throw new Error("Learning plan active-session pointer is inconsistent with its indexed records.");
  }
  if (readLearningPlanStorageScope() !== storageScope) throw new Error("Learning plan storage scope changed.");
  return Object.freeze({ storageScope, goal, plan, attempts: Object.freeze(attempts.value), reviews: Object.freeze(reviews.value), sessions: Object.freeze(sessions.value), activeSession });
}

/** Validated persistent sources used by the full Home shell; no await or raw projection cache. */
export function readHomeShellInputSnapshot(trackId: TrackId | null, policy: GoalPolicy | null, admission: TrackAdmissionContext) {
  const { storageScope, ...learningInputs } = readLearningPlanInputSnapshot(trackId, policy, admission);
  if (readActiveTrackId() !== trackId) throw new Error("Home selected track changed.");
  const sessions = readTrainingSessions(admission);
  if (sessions.issues?.length) throw new Error("Home session evidence could not be read.");
  const activeSession = readActiveTrainingSession(admission);
  // Only result facts read by Home Activity belong to this boundary.
  const results = sessions.value.filter(session => session.status !== "active" &&
    (session.status === "completed" || learningInputs.attempts.some(attempt => attempt.sessionId === session.id)))
    .map(session => ({ sessionId: session.id, result: readTrainingSessionResult(session.id, admission) }));
  let goalOnboardingDismissed = true;
  if (trackId !== null) {
    try { goalOnboardingDismissed = isGoalOnboardingDismissed(trackId); }
    catch { goalOnboardingDismissed = true; }
  }
  if (readLearningPlanStorageScope() !== storageScope) throw new Error("Home storage scope changed.");
  return Object.freeze({ storageScope, facts: Object.freeze({ trackId, ...learningInputs, sessions: sessions.value, activeSession, results, goalOnboardingDismissed }) });
}
