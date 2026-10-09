import type { GoalSnapshot, ReviewQueueEntry, TrackId, TrainingAttempt, TrainingSession } from "../../domain";
import { getKeyValueStorage, isProfileTransitionActive } from "../../infrastructure/storage/mmkvClient";
import { readActiveTrackId } from "./activeTrackRepository";
import { isGoalOnboardingDismissed } from "./goalOnboardingPreferenceRepository";
import { readActiveTrainingSession, readTrainingSessions } from "./trainingSessionRepository";
import { readTrainingSessionResult } from "./trainingSessionResultRepository";
import { readGoalSnapshot } from "./goalRepository";
import { getLearningPlanSnapshot, type LearningPlanSnapshot } from "./learningPlanRepository";
import { readActiveMutationJournal } from "./mutationJournalRepository";
import { readReviewQueueItems } from "./reviewQueueRepository";
import { readTrainingAttempts } from "./trainingAttemptRepository";

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

/** Opaque published lease: callers may compare it, never read raw storage. */
export function readLearningPlanStorageScope(): object {
  if (isProfileTransitionActive()) throw new Error("Learning plan storage is transitioning.");
  return getKeyValueStorage();
}

/** No await between validated canonical reads; journaled materialization is not an empty history. */
export function readLearningPlanInputSnapshot(trackId: TrackId | null): LearningPlanInputSnapshot {
  const storageScope = readLearningPlanStorageScope();
  if (readActiveMutationJournal()) throw new Error("Learning plan evidence is being materialized.");
  const goal = trackId === null ? null : readGoalSnapshot(trackId);
  const plan = trackId === null ? null : getLearningPlanSnapshot(trackId);
  const attempts = readTrainingAttempts();
  const reviews = readReviewQueueItems();
  const sessions = readTrainingSessions();
  const activeSession = readActiveTrainingSession();
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
export function readHomeShellInputSnapshot(trackId: TrackId | null) {
  const { storageScope, ...learningInputs } = readLearningPlanInputSnapshot(trackId);
  if (readActiveTrackId() !== trackId) throw new Error("Home selected track changed.");
  const sessions = readTrainingSessions();
  if (sessions.issues?.length) throw new Error("Home session evidence could not be read.");
  const activeSession = readActiveTrainingSession();
  // Only result facts read by Home Activity belong to this boundary.
  const results = sessions.value.filter(session => session.status !== "active" &&
    (session.status === "completed" || learningInputs.attempts.some(attempt => attempt.sessionId === session.id)))
    .map(session => ({ sessionId: session.id, result: readTrainingSessionResult(session.id) }));
  let goalOnboardingDismissed = true;
  if (trackId !== null) {
    try { goalOnboardingDismissed = isGoalOnboardingDismissed(trackId); }
    catch { goalOnboardingDismissed = true; }
  }
  if (readLearningPlanStorageScope() !== storageScope) throw new Error("Home storage scope changed.");
  return Object.freeze({ storageScope, facts: Object.freeze({ trackId, ...learningInputs, sessions: sessions.value, activeSession, results, goalOnboardingDismissed }) });
}
