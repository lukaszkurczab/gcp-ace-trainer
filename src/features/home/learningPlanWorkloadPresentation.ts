import type { FullGoalTimeCapacity } from "../../application/learningPlan/fullGoalTimeCapacity";
import type { FullGoalWorkloadProjection } from "../../application/learningPlan/fullGoalWorkloadProjection";

export type LearningPlanWorkloadPresentation = Readonly<{
  kind: "complete" | "reviews_due" | "estimated" | "incomplete" | "unknown";
  allRequiredChaptersComplete: boolean;
  requiredChapterCount: number;
  completedChapterCount: number;
  knownMinMinutes: number | null;
  knownTypicalMinutes: number | null;
  knownMaxMinutes: number | null;
  knownChapterCount: number;
  uncertainChapterCount: number;
  dueReviewCount: number;
  uncostedDueReviewCount: number;
  estimateSource: FullGoalWorkloadProjection["provenance"];
  observationCount: number;
  nextPractice: FullGoalWorkloadProjection["nextPractice"];
  capacity: FullGoalTimeCapacity["kind"];
  chapters: readonly Readonly<{
    nodeId: string;
    title: string | null;
    premiumRequired: boolean | null;
    status: "complete" | "minimum_incomplete" | "quality_unmet";
    requiredResponses: number;
    dueReviewResponses: number;
    newResponses: number;
    minMinutes: number | null;
    typicalMinutes: number | null;
    maxMinutes: number | null;
    reason: NonNullable<FullGoalWorkloadProjection["chapters"][number]["unavailableReason"]> | null;
    qualityRepair: FullGoalWorkloadProjection["chapters"][number]["qualityRepair"];
  }>[];
  dueReviews: readonly FullGoalWorkloadProjection["dueReviews"][number][];
}>;

/** Adapts canonical workload records into user-facing rows without inventing names or access state. */
export function buildLearningPlanWorkloadPresentation(input: Readonly<{
  workload: FullGoalWorkloadProjection;
  capacity: FullGoalTimeCapacity;
  chapterTitles: ReadonlyMap<string, string>;
  freeNodeId: string | null;
}>): LearningPlanWorkloadPresentation {
  const { workload } = input;
  const completedChapterCount = workload.chapters.filter((chapter) => chapter.completion === "complete").length;
  const knownChapterCount = workload.chapters.filter((chapter) => chapter.minMinutes !== null && chapter.typicalMinutes !== null).length;
  const uncertainChapterCount = new Set([
    ...workload.unknownChapterIds,
    ...workload.qualityUncertainChapterIds,
    ...workload.chapters.filter((chapter) => chapter.unavailableReason !== null || chapter.qualityRepair?.futureMaxMinutes === null).map((chapter) => chapter.nodeId),
  ]).size;
  const allRequiredChaptersComplete = workload.chapters.length > 0 && completedChapterCount === workload.chapters.length;
  const kind = workload.kind === "completion_unknown" ? "unknown"
    : allRequiredChaptersComplete ? workload.dueReviews.length === 0 ? "complete" : "reviews_due"
      : workload.kind;
  return Object.freeze({
    kind,
    allRequiredChaptersComplete,
    requiredChapterCount: workload.chapters.length,
    completedChapterCount,
    knownMinMinutes: workload.kind === "completion_unknown" || (allRequiredChaptersComplete && workload.dueReviews.length === 0) ? null : workload.knownMinMinutes,
    knownTypicalMinutes: workload.kind === "completion_unknown" || (allRequiredChaptersComplete && workload.dueReviews.length === 0) ? null : workload.knownTypicalMinutes,
    knownMaxMinutes: workload.kind === "completion_unknown" || (allRequiredChaptersComplete && workload.dueReviews.length === 0) ? null : workload.knownMaxMinutes,
    knownChapterCount,
    uncertainChapterCount,
    dueReviewCount: workload.dueReviews.length,
    uncostedDueReviewCount: workload.uncostedDueReviewIds.length,
    estimateSource: workload.provenance,
    observationCount: workload.observationCount,
    nextPractice: workload.nextPractice,
    capacity: input.capacity.kind,
    chapters: Object.freeze(workload.chapters.map((chapter) => Object.freeze({
      nodeId: chapter.nodeId,
      title: input.chapterTitles.get(chapter.nodeId) ?? null,
      premiumRequired: input.freeNodeId === null ? null : chapter.nodeId !== input.freeNodeId,
      status: chapter.completion,
      requiredResponses: chapter.requiredResponses,
      dueReviewResponses: chapter.dueReviewResponses,
      newResponses: chapter.newResponses,
      minMinutes: chapter.minMinutes,
      typicalMinutes: chapter.typicalMinutes,
      maxMinutes: chapter.maxMinutes,
      reason: chapter.unavailableReason,
      qualityRepair: chapter.qualityRepair,
    }))),
    dueReviews: Object.freeze([...workload.dueReviews]),
  });
}
