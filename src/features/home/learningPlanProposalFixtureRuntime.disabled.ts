import type { LearningPlanProposalFixtureCase } from "./learningPlanProposalFixtureCommand";
import type { LearningPlanProposalScreenRuntime } from "./learningPlanProposalRuntime";

/** Metro selects this peer outside the smoke runtime; fixture calls are unavailable. */
export function createLearningPlanProposalFixtureRuntime(_scenario: LearningPlanProposalFixtureCase, _onExit?: () => void): LearningPlanProposalScreenRuntime {
  throw new Error("Learning plan proposal fixtures are unavailable in this runtime.");
}
