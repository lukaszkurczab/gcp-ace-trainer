import type { TrainingAttempt, TrainingSession } from "../../domain";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getTrainingAttempts,
  getTrainingSessions,
} from "../../storage/repositories";
import { recoverPendingMutation } from "../learningMutations";
import {
  AlgorithmsInterviewSimulationController,
  type AlgorithmsInterviewSimulationControllerDependencies,
} from "./AlgorithmsInterviewSimulationController";
import { createAlgorithmsFamilyRuntime } from "./createAlgorithmsRuntime";

const productionDependencies: AlgorithmsInterviewSimulationControllerDependencies = {
  catalog: getAlgorithmContentCatalog,
  createRuntime: createAlgorithmsFamilyRuntime,
  getActiveDraft: getActiveTrainingSessionDraft,
  getActiveSession: getActiveTrainingSession,
  getAttempts: async (): Promise<readonly TrainingAttempt<unknown>[]> => (await getTrainingAttempts()).value,
  getSessionById: async (sessionId: string): Promise<TrainingSession | null> =>
    (await getTrainingSessions()).value.find((session) => session.id === sessionId) ?? null,
  recoverPendingMutation,
};

/** Production composition root. Presentation imports this factory, never repository internals. */
export function createAlgorithmsInterviewSimulationController(
  overrides: Partial<AlgorithmsInterviewSimulationControllerDependencies> = {},
): AlgorithmsInterviewSimulationController {
  return new AlgorithmsInterviewSimulationController({ ...productionDependencies, ...overrides });
}
