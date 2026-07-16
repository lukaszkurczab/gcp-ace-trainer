import { AlgorithmsFamilyRuntime } from "./AlgorithmsFamilyRuntime";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";

export function createAlgorithmsFamilyRuntime(): AlgorithmsFamilyRuntime {
  return new AlgorithmsFamilyRuntime(getAlgorithmContentCatalog());
}
