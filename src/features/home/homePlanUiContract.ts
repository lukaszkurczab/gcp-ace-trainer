import type { TrackId, ProposalOutcome, TargetAssessment } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import type { HomePlanReady } from "../../application/homePlanSnapshotReader";
import { ROUTES } from "../../constants/routes";

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export function localizeHomePlanArea(plan: HomePlanReady, translate: Translate): string {
  return translate(plan.session.areaLabel);
}

export function buildHomePlanPracticeSetupParams(
  plan: HomePlanReady,
  trackId: TrackId,
): NonNullable<RootStackParamList[typeof ROUTES.PRACTICE_SETUP]> {
  return Object.freeze({
    expectedArtifactSha256: plan.identity.artifactSha256,
    expectedContentVersion: plan.identity.contentVersion,
    mode: plan.session.modeId as never,
    sessionLength: plan.session.sessionLength,
    source: "home" as const,
    topicId: plan.session.topicId,
    trackId,
  });
}

export function completionCopy(outcome: Pick<ProposalOutcome, "completionState">, t: Translate): string {
  const completion = outcome.completionState;
  if (completion.kind === "unknown") return t("The package does not define a completion rule.");
  if (completion.kind === "completed") return t("The package completion rule is currently met.");
  if (completion.remainingAttemptCount === 0) return t("All chapter attempt minimums are met, but recent accuracy in at least one chapter is below the required level. Keep practising; completion timing is not predictable yet.");
  const remaining = completion.remainingAttemptCount;
  return t("attemptsRemaining", { count: remaining, remaining });
}

export function targetCopy(target: TargetAssessment, t: Translate): string {
  if (target.kind === "open_ended") return t("No target date. The plan stays open-ended.");
  if (target.kind === "quality_requirement_unmet") return t("All chapter attempt minimums are met, but recent accuracy in at least one chapter is below the required level. Keep practising; completion timing is not predictable yet.");
  if (target.kind === "unknown_completion_rule") return t("The target outlook is unknown because the package has no completion rule.");
  if (target.kind === "unavailable_due_to_shortfall") return t("Target outlook is unavailable until the material shortfall is resolved.");
  if (target.kind === "achievable") return t("The target is achievable with {{occurrences}} planned sessions.", { occurrences: target.occurrences });
  return t("The target is not achievable with the current rhythm. {{remaining}} attempts remain and {{occurrences}} sessions fit before the target.", { occurrences: target.occurrences, remaining: target.remainingAttempts });
}
