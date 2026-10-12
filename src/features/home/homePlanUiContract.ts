import type { TrackId, ProposalOutcome, TargetAssessment } from "../../domain";
import { getTrackRoadmapCatalog } from "../practice/trackRoadmapCatalog";
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
  const topicId = plan.session.topicId;
  if (topicId !== undefined && !topicId.trim()) throw new Error("Home plan node scope is empty.");
  return Object.freeze({
    expectedArtifactSha256: plan.identity.artifactSha256,
    expectedContentVersion: plan.identity.contentVersion,
    mode: plan.session.modeId as never,
    ...(plan.session.reviewSource ? { reviewSource: plan.session.reviewSource } : {}),
    sessionLength: plan.session.sessionLength,
    source: "home" as const,
    ...(plan.session.mentalUnitId === undefined ? {} : { mentalUnitId: plan.session.mentalUnitId }),
    ...(topicId === undefined ? {} : { topicId }),
    trackId,
  });
}

export function completionCopy(outcome: Pick<ProposalOutcome, "completionState"> & Partial<Pick<ProposalOutcome, "identity">>, t: Translate, trackId?: TrackId): string {
  const completion = outcome.completionState;
  if (completion.kind === "unknown") return t("The package does not define a completion rule.");
  if (completion.kind === "completed") return t("The package completion rule is currently met.");
  const missingUnits = completion.chapters.flatMap((chapter) => chapter.coverage
    .filter((unit) => unit.deficit > 0)
    .map((unit) => ({ chapter, unit })));
  if (missingUnits.length > 0) {
    const titles = new Map<string, string>();
    if (trackId ?? outcome.identity?.trackId) {
      for (const node of getTrackRoadmapCatalog((trackId ?? outcome.identity!.trackId) as TrackId)) titles.set(node.id, node.title);
    }
    const labels = missingUnits.slice(0, 2).map(({ chapter, unit }) => {
      const objective = /(?:^|[-_])O(\d+)(?:[-_]|$)/u.exec(unit.mentalUnitId)?.[1];
      const chapterTitle = titles.get(chapter.nodeId) ?? chapter.nodeId.replaceAll("_", " ");
      return objective
        ? t("Objective {{number}} — {{current}} of {{required}} distinct questions currently have a correct answer in {{chapter}}.", { number: Number(objective), current: unit.latestCorrectQuestionCount, required: unit.requiredCorrectQuestionCount, chapter: t(chapterTitle) })
        : t("{{current}} of {{required}} distinct questions currently have a correct answer in a required topic.", { current: unit.latestCorrectQuestionCount, required: unit.requiredCorrectQuestionCount });
    });
    if (missingUnits.length > labels.length) labels.push(t("and {{count}} more", { count: missingUnits.length - labels.length }));
    return t("{{count}} required exam topics still need practice: {{topics}}", { count: missingUnits.length, topics: labels.join("; ") });
  }
  if (completion.minimumAdditionalAttemptCount === 0) {
    if (completion.chapters.some((chapter) => chapter.qualityRequirementUnmet === true)) return t("All required topics and attempt minimums are met, but recent accuracy is below the required level. Keep practising; completion timing is not predictable yet.");
    return t("Recent accuracy is not measured yet, so the remaining completion effort is unknown.");
  }
  const remaining = completion.minimumAdditionalAttemptCount;
  return t("attemptsRemaining", { count: remaining, remaining });
}

export function targetCopy(target: TargetAssessment, t: Translate): string {
  if (target.kind === "open_ended") return t("No target date. The plan stays open-ended.");
  if (target.kind === "quality_requirement_unmet") return t("All chapter attempt minimums are met, but recent accuracy in at least one chapter is below the required level. Keep practising; completion timing is not predictable yet.");
  if (target.kind === "quality_outcome_unknown") return t("Recent accuracy is not measured yet, so the remaining completion effort is unknown.");
  if (target.kind === "unknown_completion_rule") return t("The target outlook is unknown because the package has no completion rule.");
  if (target.kind === "unavailable_due_to_shortfall") return t("Target outlook is unavailable until the material shortfall is resolved.");
  if (target.kind === "minimum_volume_fits") {
    if (target.remainingAttempts === 0) return t("Required completion is already recorded; this forecast excludes optional practice.");
    return t("The minimum response volume fits in {{occurrences}} sessions; time, reviews and future quality are not included.", { occurrences: target.occurrences });
  }
  return t("The minimum response volume exceeds available sessions: {{remaining}} attempts remain and {{occurrences}} fit before the target.", { occurrences: target.occurrences, remaining: target.remainingAttempts });
}
