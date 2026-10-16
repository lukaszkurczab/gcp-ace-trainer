import { isActiveReviewQueueEntry, type TrackId, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../domain";
import type { HomeRecommendationAction } from "./coding-interview/codingInterviewContracts";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { selectSingleCase } from "./certification/singleCaseRecommendation";
import { projectLearningEvidence } from "./learningPlan/learningEvidenceProjection";
import { LearningProjectionUnavailableError } from "./learningProjectionFailure";
import type { HomePlanSnapshot } from "./homePlanSnapshotReader";
export type HomeRecommendationProjection = Readonly<{
  action: HomeRecommendationAction; detail: string; enabled: boolean; icon: "cpu" | "play" | "alert-triangle"; label: string; primaryLabel: string; title: string; tone: "info" | "primary" | "warning"; unavailableReason?: string;
}>;
export type HomePracticeProjection =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{ kind: "due"; trackId: TrackId }>
  | Readonly<{ kind: "case"; caseId: string; nodeId: string; title: string; decisionCount: number; initialMinutes: number }>;

export function projectHomePractice(input: Readonly<{ trackId: TrackId; attempts: readonly TrainingAttempt[]; reviews: readonly ReviewQueueEntry[]; now: string; activeSession: TrainingSession | null; homePlan: HomePlanSnapshot | null }>): HomePracticeProjection {
  const catalog = contentPackageRuntimeOwner.getPreparedDiscovery(input.trackId).track;
  const evidence = projectLearningEvidence({ profile: catalog, attempts: input.attempts, reviews: input.reviews, now: input.now });
  if (input.activeSession) return { kind: "none" };
  const claude = input.trackId === "claude-certified-architect-professional-certification";
  const reviews = claude ? evidence.recordedReviews : evidence.reviews;
  const due = claude ? hasClaudeDueReview(reviews, input.now) : evidence.dueReviews.length > 0;
  if (claude && due) return { kind: "due", trackId: input.trackId };
  try {
    const selected = selectSingleCase(catalog, evidence.activityAttempts, reviews, input.now);
    if (!selected || due) return { kind: claude && !due ? "unavailable" : "none" };
    if (input.homePlan?.kind === "ready" && input.homePlan.dueReviewCount > 0 && !selected.due) return { kind: "none" };
    return { kind: "case", caseId: selected.recipe.caseId, nodeId: selected.nodeId, title: selected.recipe.title, decisionCount: selected.recipe.steps.length, initialMinutes: Math.ceil(selected.recipe.initialEstimatedSeconds / 60) };
  } catch (cause) {
    // Selection is pure; package/evidence validation occurs before this boundary.
    throw new LearningProjectionUnavailableError("home_practice", cause);
  }
}

/** Historical Claude obligations remain actionable regardless of discovery version. */
export function hasClaudeDueReview(reviews: readonly ReviewQueueEntry[], now: string): boolean {
  const trackId = "claude-certified-architect-professional-certification";
  return reviews.some(entry => entry.trackId === trackId && entry.sourceItem.trackId === trackId && isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && Date.parse(entry.dueAt) <= Date.parse(now));
}
