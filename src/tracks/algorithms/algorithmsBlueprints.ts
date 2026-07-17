export const ALGORITHMS_RECOMMENDATION_POLICY_VERSION = "1";

export type AlgorithmsRecommendationPolicy = Readonly<{
  policyId: "algorithms-recommendations";
  policyVersion: typeof ALGORITHMS_RECOMMENDATION_POLICY_VERSION;
  minimumBoundedEvidence: 4;
  repeatedMistakeThreshold: 2;
}>;

export const ALGORITHMS_RECOMMENDATION_POLICY: AlgorithmsRecommendationPolicy = Object.freeze({
  policyId: "algorithms-recommendations",
  policyVersion: "1",
  minimumBoundedEvidence: 4,
  repeatedMistakeThreshold: 2,
});
