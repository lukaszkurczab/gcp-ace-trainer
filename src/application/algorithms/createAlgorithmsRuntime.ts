import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import { getShuffledAlgorithmQuestionOptions, selectAlgorithmSessionItems } from "../../tracks/algorithms";
import { clearActiveForegroundTimer, getActiveForegroundTimer, getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, saveActiveForegroundTimer, saveTrainingSession, saveTrainingSessionDraft } from "../../storage/repositories";
import { commitSessionAbandonment, commitSessionCompletion, commitTrainingOutcome, commitTrainingSessionFinalization, commitTrainingSessionStart } from "../learningMutations";
import { createAttemptId } from "../learningMutations/identity";
import { AlgorithmsFamilyRuntime, type AlgorithmsRuntimeDependencies } from "./AlgorithmsFamilyRuntime";

const productionDependencies: AlgorithmsRuntimeDependencies = {
  catalog: getAlgorithmContentCatalog,
  commitAbandonment: commitSessionAbandonment,
  commitCompletion: commitSessionCompletion,
  commitFinalization: commitTrainingSessionFinalization,
  commitOutcome: commitTrainingOutcome,
  commitStart: commitTrainingSessionStart,
  clearForegroundTimer: clearActiveForegroundTimer,
  createAttemptId,
  createSessionId: (now) => `algorithms-session:${now}:${Math.random().toString(36).slice(2, 10)}`,
  getActiveDraft: getActiveTrainingSessionDraft,
  getActiveSession: getActiveTrainingSession,
  getForegroundTimer: getActiveForegroundTimer,
  getAttempts: async () => (await getTrainingAttempts()).value,
  getReviews: async () => (await getReviewQueueItems()).value,
  now: () => new Date().toISOString(),
  monotonicClock: { now: () => performance.now() },
  planOptionIds: (question) => getShuffledAlgorithmQuestionOptions(question).map((option) => option.id),
  resolveNextOccurrenceIndex: ({ session }) => session.currentItemIndex + 1,
  saveDraft: saveTrainingSessionDraft,
  saveForegroundTimer: saveActiveForegroundTimer,
  saveSession: saveTrainingSession,
  select: selectAlgorithmSessionItems,
};

export function createAlgorithmsRuntimeDependencies(overrides: Partial<AlgorithmsRuntimeDependencies> = {}): AlgorithmsRuntimeDependencies {
  return { ...productionDependencies, ...overrides };
}

export function createAlgorithmsFamilyRuntime(): AlgorithmsFamilyRuntime {
  return new AlgorithmsFamilyRuntime(createAlgorithmsRuntimeDependencies());
}
