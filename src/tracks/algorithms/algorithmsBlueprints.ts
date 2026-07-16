import { ALGORITHM_MODE_IDS, type AlgorithmModeId } from "./domain/algorithmModes";

export const ALGORITHMS_PRACTICE_BLUEPRINT_VERSION = "1";
export const ALGORITHMS_RECOMMENDATION_POLICY_VERSION = "1";
export const ALGORITHMS_INTERVIEW_SIMULATION_PROFILE_VERSION = "1";

export type AlgorithmsPracticeBlueprint = Readonly<{
  blueprintId: "algorithms-practice";
  blueprintVersion: typeof ALGORITHMS_PRACTICE_BLUEPRINT_VERSION;
  supportedLengthsByMode: Readonly<Record<AlgorithmModeId, readonly number[]>>;
  modeStageDistribution: Readonly<Partial<Record<AlgorithmModeId, readonly string[]>>>;
  simulationDistribution: Readonly<{ fixedLength: 40; foregroundDurationMs: 2_700_000 }>;
  independentPracticeMayShorten: boolean;
}>;

export type AlgorithmsRecommendationPolicy = Readonly<{
  policyId: "algorithms-recommendations";
  policyVersion: typeof ALGORITHMS_RECOMMENDATION_POLICY_VERSION;
  minimumBoundedEvidence: 4;
  repeatedMistakeThreshold: 2;
}>;

export type AlgorithmsInterviewSimulationProfile = Readonly<{
  profileId: "algorithms-interview-simulation";
  profileVersion: typeof ALGORITHMS_INTERVIEW_SIMULATION_PROFILE_VERSION;
  requiredLength: 40;
  foregroundDurationMs: 2_700_000;
  includedRoadmapNodeIds: readonly string[];
}>;

export const ALGORITHMS_PRACTICE_BLUEPRINT: AlgorithmsPracticeBlueprint = Object.freeze({
  blueprintId: "algorithms-practice",
  blueprintVersion: "1",
  supportedLengthsByMode: Object.freeze({
    [ALGORITHM_MODE_IDS.learnApproach]: Object.freeze([10]),
    [ALGORITHM_MODE_IDS.guidedPractice]: Object.freeze([10, 20, 40]),
    [ALGORITHM_MODE_IDS.recognizePatterns]: Object.freeze([10, 20, 40]),
    [ALGORITHM_MODE_IDS.contrastPractice]: Object.freeze([10, 20, 40]),
    [ALGORITHM_MODE_IDS.weakAreaReview]: Object.freeze([10, 20]),
    [ALGORITHM_MODE_IDS.independentPractice]: Object.freeze([10, 20, 40]),
    [ALGORITHM_MODE_IDS.interviewSimulation]: Object.freeze([40]),
  }),
  modeStageDistribution: Object.freeze({
    [ALGORITHM_MODE_IDS.learnApproach]: Object.freeze(["approach_model", "guided_application"]),
    [ALGORITHM_MODE_IDS.guidedPractice]: Object.freeze(["guided_application"]),
    [ALGORITHM_MODE_IDS.recognizePatterns]: Object.freeze(["recognition"]),
    [ALGORITHM_MODE_IDS.contrastPractice]: Object.freeze(["contrast"]),
    [ALGORITHM_MODE_IDS.weakAreaReview]: Object.freeze(["spaced_review"]),
    [ALGORITHM_MODE_IDS.independentPractice]: Object.freeze(["independent_transfer"]),
    [ALGORITHM_MODE_IDS.interviewSimulation]: Object.freeze(["simulation"]),
  }),
  simulationDistribution: Object.freeze({ fixedLength: 40, foregroundDurationMs: 2_700_000 }),
  independentPracticeMayShorten: true,
});

export const ALGORITHMS_RECOMMENDATION_POLICY: AlgorithmsRecommendationPolicy = Object.freeze({
  policyId: "algorithms-recommendations",
  policyVersion: "1",
  minimumBoundedEvidence: 4,
  repeatedMistakeThreshold: 2,
});

export function createAlgorithmsInterviewSimulationProfile(
  includedRoadmapNodeIds: readonly string[],
): AlgorithmsInterviewSimulationProfile {
  if (includedRoadmapNodeIds.length === 0 || new Set(includedRoadmapNodeIds).size !== includedRoadmapNodeIds.length) {
    throw new Error("Algorithms Interview Simulation profile requires unique declared roadmap scope.");
  }
  return Object.freeze({
    profileId: "algorithms-interview-simulation",
    profileVersion: "1",
    requiredLength: 40,
    foregroundDurationMs: 2_700_000,
    includedRoadmapNodeIds: Object.freeze([...includedRoadmapNodeIds]),
  });
}

export function assertAlgorithmsPracticeBlueprint(
  blueprint: AlgorithmsPracticeBlueprint,
): void {
  if (blueprint.blueprintId !== "algorithms-practice" || blueprint.blueprintVersion !== "1") {
    throw new Error("Algorithms practice blueprint identity is unsupported.");
  }
  for (const modeId of Object.values(ALGORITHM_MODE_IDS)) {
    const lengths = blueprint.supportedLengthsByMode[modeId];
    if (!lengths || lengths.length === 0 || lengths.some((length) => !Number.isInteger(length) || length <= 0)) {
      throw new Error(`Algorithms practice blueprint has invalid lengths for ${modeId}.`);
    }
  }
  if (blueprint.simulationDistribution.fixedLength !== 40 || blueprint.simulationDistribution.foregroundDurationMs !== 2_700_000) {
    throw new Error("Algorithms practice blueprint has an unsupported simulation distribution.");
  }
}
