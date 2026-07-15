import { recoverPendingMutation } from "../learningMutations";
import { AlgorithmsImmediatePracticeController, type AlgorithmsImmediatePracticeControllerDependencies } from "./AlgorithmsImmediatePracticeController";
import { createAlgorithmsFamilyRuntime } from "./createAlgorithmsRuntime";

const productionDependencies: AlgorithmsImmediatePracticeControllerDependencies = {
  createRuntime: createAlgorithmsFamilyRuntime,
  recoverPendingMutation,
};

/** Production composition root. Algorithms presentation never imports storage or mutations. */
export function createAlgorithmsImmediatePracticeController(
  overrides: Partial<AlgorithmsImmediatePracticeControllerDependencies> = {},
): AlgorithmsImmediatePracticeController {
  return new AlgorithmsImmediatePracticeController({ ...productionDependencies, ...overrides });
}
