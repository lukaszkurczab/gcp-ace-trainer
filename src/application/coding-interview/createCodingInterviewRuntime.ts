import { CodingInterviewFamilyRuntime } from "./CodingInterviewFamilyRuntime";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import { getBundledContentAvailability } from "../../content/application/validateBundledContent";

export function createCodingInterviewFamilyRuntime(): CodingInterviewFamilyRuntime {
  const availability = getBundledContentAvailability("coding-interview-dsa-problem-solving");
  if (availability.kind !== "available" || availability.familyId !== "coding_interview") {
    throw new Error("Algorithms runtime requires a validated bundled Algorithms artifact.");
  }
  return new CodingInterviewFamilyRuntime(getAlgorithmContentCatalog(), undefined, availability.taxonomyVersion);
}
