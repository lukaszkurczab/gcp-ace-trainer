import type { TrackDisplay, ReviewQueueEntry, TrainingAttempt } from "../../../domain";
import { projectWeeklySessionActivity, type WeeklySessionActivity, type ActivitySessionRecord } from "../../../application/activityReadModels";
import { projectProgressEvidence, type ProgressEvidenceModel, type ProgressAction as EvidenceAction } from "../../../application/learningPlan/progressReadProjection";
import { buildPracticeSessionConfig, type PracticeSessionRouteParams } from "../../practice/sessionConfig";
import { buildActivityModel, type ActivityItem } from "./activityModel";
export type * from "../../../application/learningPlan/progressProjectionContracts";
export type ProgressTabActivityItem = ActivityItem;
export type ProgressAction = { kind: "canonicalReviewQueue" } | { kind: "practiceSession"; params: PracticeSessionRouteParams };
type AlgorithmsModel = NonNullable<ProgressEvidenceModel["algorithmsProgress"]>;
export type ProgressTabModel = Omit<ProgressEvidenceModel, "reviewAction" | "algorithmsProgress"> & {
  activity: readonly ActivityItem[];
  weeklyActivity: WeeklySessionActivity;
  reviewAction?: ProgressAction;
  algorithmsProgress?: Omit<AlgorithmsModel, "priority"> & { priority: Omit<AlgorithmsModel["priority"], "primaryAction" | "secondaryAction"> & { primaryAction: ProgressAction; secondaryAction?: ProgressAction } };
};
export type BuildProgressTabModelInput = {
  activeTrackId: TrackDisplay["id"];
  now: string;
  activityRecords: readonly ActivitySessionRecord[];
  timezone?: string;
  reviewQueueItems?: readonly ReviewQueueEntry[];
  trainingAttempts?: readonly TrainingAttempt[];
};


export function buildProgressTabModel(input: BuildProgressTabModelInput): ProgressTabModel {
  const now = input.now;
  const timezone = input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!input.trainingAttempts || !input.reviewQueueItems) throw new Error("Progress evidence has not been read.");
  const evidence = projectProgressEvidence({ ...input, trainingAttempts: input.trainingAttempts, reviewQueueItems: input.reviewQueueItems, now });
  return presentProgressEvidence(evidence, input, now, timezone);
}

export function presentProgressEvidence(evidence: ProgressEvidenceModel, input: Pick<BuildProgressTabModelInput, "activeTrackId" | "activityRecords">, now: string, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone): ProgressTabModel {
  const algorithms = evidence.algorithmsProgress;
  return {
    ...evidence,
    activity: buildActivityModel(input.activityRecords, input.activeTrackId, new Date(now)).items.slice(0, 12),
    weeklyActivity: projectWeeklySessionActivity(input.activityRecords, { trackId: input.activeTrackId, now, timezone }),
    reviewAction: evidence.reviewAction ? presentAction(evidence.reviewAction) : undefined,
    algorithmsProgress: algorithms ? { ...algorithms, priority: { ...algorithms.priority, primaryAction: presentAction(algorithms.priority.primaryAction), secondaryAction: algorithms.priority.secondaryAction ? presentAction(algorithms.priority.secondaryAction) : undefined } } : undefined,
  };
}
function presentAction(action: EvidenceAction): ProgressAction {
  return action.kind === "canonicalReviewQueue" ? action : { kind: "practiceSession", params: buildPracticeSessionConfig(action.params) };
}
