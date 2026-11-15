import type { ApproachChallengeProblem } from "../../content/canonical/approachChallengeProblem";
import type { PairedTaskArtifact, TrainingCatalog } from "../trainingLifecycle";

/**
 * The lifecycle catalog routes paired tasks opaquely (PairedTaskArtifact). The
 * Coding Interview family owns their shape: the bank is validated as
 * Approach Challenge problems when the package is admitted (questionValidation),
 * so narrowing here does not validate again.
 */
export function approachChallengeProblemsOf(catalog: Pick<TrainingCatalog, "approachChallengeProblems">): readonly ApproachChallengeProblem[] | undefined {
  return catalog.approachChallengeProblems as readonly ApproachChallengeProblem[] | undefined;
}

export function asApproachChallengeProblem(problem: PairedTaskArtifact | undefined): ApproachChallengeProblem | undefined {
  return problem as ApproachChallengeProblem | undefined;
}
