export const LEARNING_PLAN_PROPOSAL_FIXTURE_URL = "com.lkurczab.patternly://audit/learning-plan-proposal";

export const LEARNING_PLAN_PROPOSAL_FIXTURE_CASES = Object.freeze([
  "ready3-no-target", "ready1-target", "ready7-target", "shortened", "shortfall",
  "quality-unmet-target", "quality-unmet-open-ended",
  "delayed-loading", "stale", "unavailable", "accept-validation", "accept-stale",
  "edit-storage", "edit-stale",
] as const);
export type LearningPlanProposalFixtureCase = (typeof LEARNING_PLAN_PROPOSAL_FIXTURE_CASES)[number];

export function parseLearningPlanProposalFixtureUrl(url: string | null, enabled: boolean): LearningPlanProposalFixtureCase | null {
  if (!enabled || !url) return null;
  for (const scenario of LEARNING_PLAN_PROPOSAL_FIXTURE_CASES) {
    if (url === `${LEARNING_PLAN_PROPOSAL_FIXTURE_URL}?case=${scenario}`) return scenario;
  }
  return null;
}

export type LearningPlanProposalFixtureLaunch = Readonly<{ scenario: LearningPlanProposalFixtureCase; launchId: number }>;

export function nextLearningPlanProposalFixtureLaunch(
  previous: LearningPlanProposalFixtureLaunch | null,
  scenario: LearningPlanProposalFixtureCase,
): LearningPlanProposalFixtureLaunch {
  return Object.freeze({ scenario, launchId: (previous?.launchId ?? 0) + 1 });
}
