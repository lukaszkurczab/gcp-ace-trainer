import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import type { AlgorithmSelectionScope } from "../../tracks/coding-interview/algorithmSessionSelection";
import { ALGORITHM_MODE_IDS } from "../../tracks/coding-interview/domain";

export type AlgorithmsDeclaredScopeMode =
  | typeof ALGORITHM_MODE_IDS.recognizePatterns
  | typeof ALGORITHM_MODE_IDS.contrastPractice
  | typeof ALGORITHM_MODE_IDS.independentPractice;

export type AlgorithmsDeclaredScopeOption = Readonly<{
  detail: string;
  scope: AlgorithmSelectionScope;
  title: string;
  topicId: string;
}>;

/** Direct entry to an excluded whole-track mode must fail; package discovery never substitutes another mode. */
export function getCodingInterviewDeclaredScopeOptions(input: Readonly<{
  modeId: AlgorithmsDeclaredScopeMode;
  targetMentalUnitId?: string;
}>): readonly AlgorithmsDeclaredScopeOption[] {
  contentPackageRuntimeOwner
    .getPreparedDiscovery("coding-interview-dsa-problem-solving")
    .profile.getMode(input.modeId);
  throw new Error(`Algorithms mode ${input.modeId} has no declared scope in the bundled Free package.`);
}
