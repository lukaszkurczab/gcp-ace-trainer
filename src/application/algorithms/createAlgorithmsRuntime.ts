import { AlgorithmsFamilyRuntime } from "./AlgorithmsFamilyRuntime";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import { getBundledContentAvailability } from "../../content/application/validateBundledContent";

export function createAlgorithmsFamilyRuntime(): AlgorithmsFamilyRuntime {
  const availability = getBundledContentAvailability("algorithms");
  if (availability.kind !== "available" || availability.familyId !== "algorithms") {
    throw new Error("Algorithms runtime requires a validated bundled Algorithms artifact.");
  }
  return new AlgorithmsFamilyRuntime(getAlgorithmContentCatalog(), undefined, availability.taxonomyVersion);
}
