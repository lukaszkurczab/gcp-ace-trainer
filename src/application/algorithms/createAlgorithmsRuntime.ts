import { AlgorithmsFamilyRuntime } from "./AlgorithmsFamilyRuntime";

/** The prior persistence-owning Algorithms composition root was removed. */
export function createAlgorithmsFamilyRuntime(): AlgorithmsFamilyRuntime {
  throw new Error("Algorithms runtime is unavailable until the canonical family runtime is installed.");
}
